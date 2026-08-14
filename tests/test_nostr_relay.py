"""
End-to-end Nostr relay tests.

These tests hit the real strfry relay running in the test stack
(STRFRY_HOST / STRFRY_PORT from .env-sample, both defaulting to localhost:7778).
No mocks of the Nostr client or the relay — if the wrong argument type is passed
to Client.add_relay (e.g. a raw str instead of RelayUrl) these tests fail
with a TypeError before any event is published.

Strategy
--------
- Build a minimal Order / Robot mock with the exact fields Nostr() reads.
- Call async_to_sync(nostr.send_*) directly (no Celery worker needed).
- Open a **second** real nostr_sdk Client, fetch events from the relay, and
  assert the expected event arrived with correct NIP-69 tags (send_order_event)
  or kind-1059 gift-wrap (send_notification_event).

Requirements: strfry relay must be reachable at STRFRY_HOST:STRFRY_PORT.
In the docker-tests.yml stack this is 127.0.0.1:7778.

nostr-sdk 0.45.0 API notes:
  - Client.fetch_events(target: ReqTarget, timeout=...) -> List[Event]
  - ReqTarget.single(url: RelayUrl, filters: List[Filter]) -> ReqTarget
  - ReqTarget.auto(filters: List[Filter]) -> ReqTarget
  - No get_events_of; no Duration type.
"""

import asyncio
import json
import time
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import MagicMock

from asgiref.sync import async_to_sync
from decouple import config
from django.test import TestCase

from nostr_sdk import (
    Client,
    Filter,
    Keys,
    Kind,
    PublicKey,
    RelayUrl,
    ReqTarget,
)

from api.models import Order
from api.nostr import Nostr

# ---------------------------------------------------------------------------
# Test credentials — same as api/tests/test_nostr.py, never a production key.
TEST_NSEC = "nsec1w72q58pyng0fa8czqeyr4qvw5v58vegxeremqclshlncqns83cpsd2nmk9"
# Recipient pubkey for notification tests
TEST_RECIPIENT_NPUB = "npub16sfzpqkjrunmweeu4tj9z83pv4cwweqcnc5kyxctzdgpelng73zqms3kqr"

RELAY_HOST = config("STRFRY_HOST", cast=str, default="localhost")
RELAY_PORT = config("STRFRY_PORT", cast=str, default="7778")
RELAY_URL = f"ws://{RELAY_HOST}:{RELAY_PORT}"

# How long (seconds) to wait for an event to appear on the relay after publishing
EVENT_FETCH_TIMEOUT = 10


def _make_order(
    order_id=999,
    order_type=Order.Types.BUY,
    status=Order.Status.PUB,
    has_range=False,
    amount=Decimal("150.00"),
    min_amount=None,
    max_amount=None,
    payment_method="Revolut SEPA",
    premium=Decimal("2.0"),
    bond_size=Decimal("3.5"),
    currency_str="EUR",
    description=None,
    password=None,
    latitude=None,
    longitude=None,
    escrow_duration=3600,
    maker_username="TestMaker",
    maker_hash_id="deadbeef",
):
    order = MagicMock()
    order.id = order_id
    order.type = order_type
    order.status = status
    order.has_range = has_range
    order.amount = amount
    order.min_amount = min_amount
    order.max_amount = max_amount
    order.payment_method = payment_method
    order.premium = premium
    order.bond_size = bond_size
    order.currency = MagicMock()
    order.currency.__str__ = lambda self: currency_str
    order.description = description
    order.password = password
    order.latitude = latitude
    order.longitude = longitude
    order.escrow_duration = escrow_duration
    order.expires_at = datetime(2099, 1, 1, tzinfo=timezone.utc)
    order.maker = MagicMock()
    order.maker.username = maker_username
    order.maker.robot = MagicMock()
    order.maker.robot.hash_id = maker_hash_id
    return order


def _make_robot(nostr_pubkey=TEST_RECIPIENT_NPUB):
    robot = MagicMock()
    robot.nostr_pubkey = nostr_pubkey
    return robot


async def _fetch_events_from_relay(relay_url, filters, timeout=EVENT_FETCH_TIMEOUT):
    """
    Connect a fresh client to relay_url, use ReqTarget.single to fetch
    events matching `filters` (list of Filter), wait up to `timeout` seconds,
    disconnect, and return events as parsed JSON dicts.

    Uses the nostr-sdk 0.45.0 API:
        client.fetch_events(ReqTarget.single(RelayUrl, [Filter, ...]))
    """
    relay = RelayUrl.parse(relay_url)
    client = Client()
    await client.add_relay(relay)
    await client.connect()

    target = ReqTarget.single(relay, filters)

    deadline = time.monotonic() + timeout
    events = []
    while time.monotonic() < deadline and not events:
        try:
            raw = await client.fetch_events(target)
            events = raw
        except Exception:
            pass
        if not events:
            await asyncio.sleep(0.5)

    await client.disconnect()
    return [json.loads(e.as_json()) for e in events]


class TestNostrOrderEventOnRealRelay(TestCase):
    """
    send_order_event() publishes a NIP-69 kind-38383 event to the live relay.
    Verified by fetching back with a second client and checking tags.
    """

    def setUp(self):
        self.nostr = Nostr()
        self.env_overrides = {
            "NOSTR_NSEC": TEST_NSEC,
            "COORDINATOR_ALIAS": "TestCoord",
            "HOST_NAME": "test.onion",
            "NETWORK": "testnet",
            "STRFRY_HOST": RELAY_HOST,
            "STRFRY_PORT": RELAY_PORT,
        }

    def _run(self, coro):
        return asyncio.get_event_loop().run_until_complete(coro)

    def test_send_order_event_reaches_relay(self):
        """kind-38383 event must arrive on the relay after send_order_event()."""
        order = _make_order(order_id=10001, status=Order.Status.PUB)

        from unittest.mock import patch

        with patch("api.nostr.config") as mock_config:
            mock_config.side_effect = lambda key, **kw: self.env_overrides.get(
                key, kw.get("default", "")
            )
            async_to_sync(self.nostr.send_order_event)(order)

        keys = Keys.parse(TEST_NSEC)
        coordinator_pubkey = keys.get_public_key()
        filters = [Filter().kind(Kind(38383)).author(coordinator_pubkey).limit(5)]
        events = self._run(_fetch_events_from_relay(RELAY_URL, filters))

        self.assertGreater(len(events), 0, "No kind-38383 event found on relay")
        self.assertEqual(events[0]["kind"], 38383)

    def test_order_event_tags(self):
        """Verify core NIP-69 tags are present and correct."""
        order = _make_order(
            order_id=10002,
            order_type=Order.Types.SELL,
            status=Order.Status.PUB,
            payment_method="SEPA Wise",
            currency_str="USD",
        )

        from unittest.mock import patch

        with patch("api.nostr.config") as mock_config:
            mock_config.side_effect = lambda key, **kw: self.env_overrides.get(
                key, kw.get("default", "")
            )
            async_to_sync(self.nostr.send_order_event)(order)

        keys = Keys.parse(TEST_NSEC)
        coordinator_pubkey = keys.get_public_key()
        filters = [Filter().kind(Kind(38383)).author(coordinator_pubkey).limit(10)]
        events = self._run(_fetch_events_from_relay(RELAY_URL, filters))

        # Find event matching order_id=10002 via source tag
        matching = [
            e
            for e in events
            if any(
                t[0] == "source" and "/10002" in t[1]
                for t in e.get("tags", [])
                if len(t) >= 2
            )
        ]
        self.assertGreater(len(matching), 0, "Event for order 10002 not found on relay")
        tags = {t[0]: t[1:] for t in matching[0]["tags"] if t}

        self.assertEqual(tags.get("k"), ["sell"])
        self.assertEqual(tags.get("f"), ["USD"])
        self.assertEqual(tags.get("s"), ["pending"])
        self.assertEqual(tags.get("network"), ["testnet"])

    def test_password_protected_order_not_published(self):
        """Password-protected orders must never reach the relay."""
        order = _make_order(order_id=10003, password="secret")

        from unittest.mock import patch

        keys = Keys.parse(TEST_NSEC)
        coordinator_pubkey = keys.get_public_key()
        filters = [Filter().kind(Kind(38383)).author(coordinator_pubkey).limit(20)]

        events_before = self._run(_fetch_events_from_relay(RELAY_URL, filters))
        count_before = len(events_before)

        with patch("api.nostr.config") as mock_config:
            mock_config.side_effect = lambda key, **kw: self.env_overrides.get(
                key, kw.get("default", "")
            )
            async_to_sync(self.nostr.send_order_event)(order)

        time.sleep(1)
        events_after = self._run(_fetch_events_from_relay(RELAY_URL, filters))
        self.assertEqual(
            len(events_after),
            count_before,
            "Password-protected order was incorrectly published to the relay",
        )

    def test_skips_when_nostr_nsec_empty(self):
        """Empty NOSTR_NSEC must not reach the relay."""
        order = _make_order(order_id=10004, status=Order.Status.PUB)

        from unittest.mock import patch

        env = {**self.env_overrides, "NOSTR_NSEC": ""}
        keys = Keys.parse(TEST_NSEC)
        coordinator_pubkey = keys.get_public_key()
        filters = [Filter().kind(Kind(38383)).author(coordinator_pubkey).limit(20)]
        events_before = self._run(_fetch_events_from_relay(RELAY_URL, filters))
        count_before = len(events_before)

        with patch("api.nostr.config") as mock_config:
            mock_config.side_effect = lambda key, **kw: env.get(
                key, kw.get("default", "")
            )
            async_to_sync(self.nostr.send_order_event)(order)

        time.sleep(1)
        events_after = self._run(_fetch_events_from_relay(RELAY_URL, filters))
        self.assertEqual(len(events_after), count_before)


class TestNostrNotificationEventOnRealRelay(TestCase):
    """
    send_notification_event() publishes a NIP-17 kind-1059 gift-wrap to the relay.
    """

    def setUp(self):
        self.nostr = Nostr()
        self.env_overrides = {
            "NOSTR_NSEC": TEST_NSEC,
            "COORDINATOR_ALIAS": "TestCoord",
            "HOST_NAME": "test.onion",
            "NETWORK": "testnet",
            "STRFRY_HOST": RELAY_HOST,
            "STRFRY_PORT": RELAY_PORT,
        }

    def _run(self, coro):
        return asyncio.get_event_loop().run_until_complete(coro)

    def test_notification_event_reaches_relay(self):
        """kind-1059 gift-wrap must arrive on the relay."""
        robot = _make_robot()
        order = _make_order(order_id=20001)

        from unittest.mock import patch

        with patch("api.nostr.config") as mock_config:
            mock_config.side_effect = lambda key, **kw: self.env_overrides.get(
                key, kw.get("default", "")
            )
            async_to_sync(self.nostr.send_notification_event)(
                robot, order, "Trade update: escrow locked"
            )

        # kind-1059 gift-wraps are addressed to the recipient's pubkey
        recipient_pubkey = PublicKey.parse(TEST_RECIPIENT_NPUB)
        filters = [Filter().kind(Kind(1059)).pubkey(recipient_pubkey).limit(5)]
        events = self._run(_fetch_events_from_relay(RELAY_URL, filters))

        self.assertGreater(len(events), 0, "No kind-1059 gift-wrap found on relay")
        self.assertEqual(events[0]["kind"], 1059)

    def test_invalid_receiver_pubkey_raises_before_relay(self):
        """A malformed robot.nostr_pubkey must raise before touching the relay."""
        robot = _make_robot(nostr_pubkey="not_a_valid_pubkey")
        order = _make_order(order_id=20002)

        from unittest.mock import patch

        with patch("api.nostr.config") as mock_config:
            mock_config.side_effect = lambda key, **kw: self.env_overrides.get(
                key, kw.get("default", "")
            )
            with self.assertRaises(Exception):
                async_to_sync(self.nostr.send_notification_event)(
                    robot, order, "should not reach relay"
                )

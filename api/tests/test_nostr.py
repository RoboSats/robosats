"""
Tests for api/nostr.py — Nostr event manager.

Strategy: no live relay, no live Lightning node required.
- All nostr_sdk network I/O (Client.add_relay, Client.connect, Client.send_event)
  is mocked with AsyncMock so the async event loop is exercised without TCP.
- Keys.parse / EventBuilder / Tag / PublicKey / nip17_make_private_msg_async are
  exercised against the real nostr-sdk 0.45.0 library so tag construction and
  signing logic is actually validated, not just stubbed.
- Order and Robot objects are plain MagicMocks to avoid needing DB / Django setup.
"""

import asyncio
import hashlib
import json
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

from django.test import TestCase

from nostr_sdk import Keys

from api.nostr import Nostr
from api.models import Order

# ---------------------------------------------------------------------------
# A deterministic nsec used only in tests — never a real key.
# Generated with Keys.generate() from nostr-sdk 0.45.0.
TEST_NSEC = "nsec1w72q58pyng0fa8czqeyr4qvw5v58vegxeremqclshlncqns83cpsd2nmk9"
# Corresponding npub (used as recipient in notification tests)
TEST_NPUB = "npub16sfzpqkjrunmweeu4tj9z83pv4cwweqcnc5kyxctzdgpelng73zqms3kqr"


def _make_order(
    *,
    order_id=42,
    order_type=Order.Types.BUY,
    status=Order.Status.PUB,
    has_range=False,
    amount=Decimal("100.00"),
    min_amount=None,
    max_amount=None,
    payment_method="Revolut SEPA",
    premium=Decimal("1.5"),
    bond_size=Decimal("3.0"),
    currency_str="EUR",
    description=None,
    password=None,
    latitude=None,
    longitude=None,
    escrow_duration=3600,
    maker_username="RoboMaker",
    maker_hash_id="abc123",
):
    """Build a fully-specified MagicMock that looks like an Order instance."""
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

    # maker relationship used by get_user_name / get_robot_hash_id
    order.maker = MagicMock()
    order.maker.username = maker_username
    order.maker.robot = MagicMock()
    order.maker.robot.hash_id = maker_hash_id

    return order


def _make_robot(nostr_pubkey=TEST_NPUB):
    robot = MagicMock()
    robot.nostr_pubkey = nostr_pubkey
    return robot


# ---------------------------------------------------------------------------
# Shared env overrides applied to every test in this module
ENV_OVERRIDES = {
    "NOSTR_NSEC": TEST_NSEC,
    "COORDINATOR_ALIAS": "TestCoord",
    "HOST_NAME": "test.onion",
    "NETWORK": "testnet",
    "STRFRY_HOST": "localhost",
    "STRFRY_PORT": "7778",
}


def _patch_client():
    """
    Return a context-manager that replaces the nostr_sdk Client with an
    AsyncMock so no real websocket connection is attempted.
    """
    mock_client = MagicMock()
    mock_client.add_relay = AsyncMock()
    mock_client.connect = AsyncMock()
    mock_client.send_event = AsyncMock()
    return patch("api.nostr.Client", return_value=mock_client), mock_client


# ---------------------------------------------------------------------------
class TestNostrGenerateTags(TestCase):
    """Unit-test the synchronous tag-generation logic."""

    def setUp(self):
        self.nostr = Nostr()

    def _tags_as_dict(self, tags):
        """Convert a list of Tag objects to {tag_name: [values...]} for easy assertions."""
        result = {}
        for tag in tags:
            data = tag.to_vec()  # nostr-sdk 0.45.0: Tag.to_vec() → List[str]
            if data:
                result[data[0]] = data[1:]
        return result

    @patch("api.nostr.config")
    def test_buy_order_tag(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(order_type=Order.Types.BUY)
        tags = self.nostr.generate_tags(order, "RoboMaker", "abc123", "EUR")
        tag_dict = self._tags_as_dict(tags)
        self.assertEqual(tag_dict["k"], ["buy"])

    @patch("api.nostr.config")
    def test_sell_order_tag(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(order_type=Order.Types.SELL)
        tags = self.nostr.generate_tags(order, "RoboMaker", "abc123", "EUR")
        tag_dict = self._tags_as_dict(tags)
        self.assertEqual(tag_dict["k"], ["sell"])

    @patch("api.nostr.config")
    def test_fixed_amount_fa_tag(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(has_range=False, amount=Decimal("250.00"))
        tags = self.nostr.generate_tags(order, "RoboMaker", "abc123", "EUR")
        tag_dict = self._tags_as_dict(tags)
        self.assertEqual(tag_dict["fa"], ["250.00"])

    @patch("api.nostr.config")
    def test_range_amount_fa_tag(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(
            has_range=True,
            amount=None,
            min_amount=Decimal("100"),
            max_amount=Decimal("500"),
        )
        tags = self.nostr.generate_tags(order, "RoboMaker", "abc123", "EUR")
        tag_dict = self._tags_as_dict(tags)
        self.assertEqual(tag_dict["fa"], ["100", "500"])

    @patch("api.nostr.config")
    def test_d_tag_is_deterministic_uuid(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(order_id=99)
        tags = self.nostr.generate_tags(order, "RoboMaker", "abc123", "EUR")
        tag_dict = self._tags_as_dict(tags)

        # Recompute expected UUID
        hashed = hashlib.md5("TestCoord99".encode("utf-8")).hexdigest()
        expected = str(uuid.UUID(hashed))
        self.assertEqual(tag_dict["d"], [expected])

    @patch("api.nostr.config")
    def test_required_tags_present(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order()
        tags = self.nostr.generate_tags(order, "RoboMaker", "abc123", "EUR")
        tag_dict = self._tags_as_dict(tags)
        for required in (
            "d",
            "name",
            "k",
            "f",
            "s",
            "amt",
            "fa",
            "pm",
            "premium",
            "source",
            "expiration",
            "y",
            "network",
            "layer",
            "bond",
            "z",
        ):
            self.assertIn(required, tag_dict, f"Missing required tag: {required}")

    @patch("api.nostr.config")
    def test_geo_tag_added_when_coordinates_present(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(
            latitude=Decimal("40.416775"), longitude=Decimal("-3.703790")
        )
        tags = self.nostr.generate_tags(order, "RoboMaker", "abc123", "EUR")
        tag_dict = self._tags_as_dict(tags)
        self.assertIn("g", tag_dict)
        self.assertTrue(len(tag_dict["g"][0]) > 0)

    @patch("api.nostr.config")
    def test_geo_tag_absent_without_coordinates(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(latitude=None, longitude=None)
        tags = self.nostr.generate_tags(order, "RoboMaker", "abc123", "EUR")
        tag_dict = self._tags_as_dict(tags)
        self.assertNotIn("g", tag_dict)

    @patch("api.nostr.config")
    def test_payment_method_split_into_pm_tag(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(payment_method="Revolut SEPA Wise")
        tags = self.nostr.generate_tags(order, "RoboMaker", "abc123", "EUR")
        tag_dict = self._tags_as_dict(tags)
        self.assertEqual(tag_dict["pm"], ["Revolut", "SEPA", "Wise"])

    @patch("api.nostr.config")
    def test_y_tag_contains_coordinator_alias(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order()
        tags = self.nostr.generate_tags(order, "RoboMaker", "abc123", "EUR")
        tag_dict = self._tags_as_dict(tags)
        self.assertEqual(tag_dict["y"], ["robosats", "testcoord"])

    @patch("api.nostr.config")
    def test_network_tag_value(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order()
        tags = self.nostr.generate_tags(order, "RoboMaker", "abc123", "EUR")
        tag_dict = self._tags_as_dict(tags)
        self.assertEqual(tag_dict["network"], ["testnet"])

    @patch("api.nostr.config")
    def test_source_tag_url_format(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(order_id=7)
        tags = self.nostr.generate_tags(order, "RoboMaker", "abc123", "EUR")
        tag_dict = self._tags_as_dict(tags)
        self.assertEqual(tag_dict["source"], ["http://test.onion/order/testcoord/7"])


# ---------------------------------------------------------------------------
class TestNostrGetStatusTag(TestCase):
    """Unit-test get_status_tag."""

    def setUp(self):
        self.nostr = Nostr()

    def test_pub_status_returns_pending(self):
        order = _make_order(status=Order.Status.PUB)
        self.assertEqual(self.nostr.get_status_tag(order), "pending")

    def test_non_pub_status_returns_success(self):
        for status in (
            Order.Status.WFB,
            Order.Status.CHA,
            Order.Status.SUC,
            Order.Status.DIS,
        ):
            with self.subTest(status=status):
                order = _make_order(status=status)
                self.assertEqual(self.nostr.get_status_tag(order), "success")


# ---------------------------------------------------------------------------
class TestNostrSignMessage(TestCase):
    """Unit-test the static sign_message helper."""

    @patch("api.nostr.config")
    def test_sign_message_returns_hex_string(self, mock_config):
        mock_config.return_value = TEST_NSEC
        result = Nostr.sign_message("test message")
        self.assertIsInstance(result, str)
        self.assertTrue(len(result) > 0)
        # Schnorr signatures are 64 bytes = 128 hex chars
        self.assertEqual(len(result), 128)

    @patch("api.nostr.config")
    def test_sign_message_is_deterministic_for_same_input(self, mock_config):
        # Note: secp256k1 Schnorr with raw=True is deterministic for same key+msg
        mock_config.return_value = TEST_NSEC
        sig1 = Nostr.sign_message("hello robosats")
        sig2 = Nostr.sign_message("hello robosats")
        self.assertEqual(sig1, sig2)

    @patch("api.nostr.config")
    def test_sign_message_differs_for_different_inputs(self, mock_config):
        mock_config.return_value = TEST_NSEC
        sig1 = Nostr.sign_message("message A")
        sig2 = Nostr.sign_message("message B")
        self.assertNotEqual(sig1, sig2)

    @patch("api.nostr.config")
    def test_sign_message_returns_empty_on_bad_key(self, mock_config):
        mock_config.return_value = "not_a_valid_nsec"
        result = Nostr.sign_message("any text")
        self.assertEqual(result, "")


# ---------------------------------------------------------------------------
class TestNostrSendOrderEvent(TestCase):
    """Integration-style tests for send_order_event — relay I/O is mocked."""

    def setUp(self):
        self.nostr = Nostr()

    @patch("api.nostr.config")
    def test_skips_password_protected_orders(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(password="secret")
        patch_cls, mock_client = _patch_client()
        with patch_cls:
            asyncio.run(self.nostr.send_order_event(order))
        mock_client.send_event.assert_not_called()

    @patch("api.nostr.config")
    def test_skips_when_nostr_nsec_empty(self, mock_config):
        env = {**ENV_OVERRIDES, "NOSTR_NSEC": ""}
        mock_config.side_effect = lambda key, **kw: env.get(key, kw.get("default", ""))
        order = _make_order()
        patch_cls, mock_client = _patch_client()
        with patch_cls:
            asyncio.run(self.nostr.send_order_event(order))
        mock_client.send_event.assert_not_called()

    @patch("api.nostr.config")
    def test_sends_event_for_public_order(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(password=None, status=Order.Status.PUB)
        patch_cls, mock_client = _patch_client()
        with patch_cls:
            asyncio.run(self.nostr.send_order_event(order))
        mock_client.send_event.assert_called_once()

    @patch("api.nostr.config")
    def test_event_has_correct_kind(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(password=None)
        captured_event = None

        async def capture_send_event(event):
            nonlocal captured_event
            captured_event = event

        patch_cls, mock_client = _patch_client()
        mock_client.send_event.side_effect = capture_send_event
        with patch_cls:
            asyncio.run(self.nostr.send_order_event(order))

        self.assertIsNotNone(captured_event)
        event_json = json.loads(captured_event.as_json())
        self.assertEqual(event_json["kind"], 38383)

    @patch("api.nostr.config")
    def test_event_content_uses_description(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(password=None, description="Pay via Wise")
        captured_event = None

        async def capture_send_event(event):
            nonlocal captured_event
            captured_event = event

        patch_cls, mock_client = _patch_client()
        mock_client.send_event.side_effect = capture_send_event
        with patch_cls:
            asyncio.run(self.nostr.send_order_event(order))

        event_json = json.loads(captured_event.as_json())
        self.assertEqual(event_json["content"], "Pay via Wise")

    @patch("api.nostr.config")
    def test_event_content_empty_when_no_description(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(password=None, description=None)
        captured_event = None

        async def capture_send_event(event):
            nonlocal captured_event
            captured_event = event

        patch_cls, mock_client = _patch_client()
        mock_client.send_event.side_effect = capture_send_event
        with patch_cls:
            asyncio.run(self.nostr.send_order_event(order))

        event_json = json.loads(captured_event.as_json())
        self.assertEqual(event_json["content"], "")

    @patch("api.nostr.config")
    def test_connect_called_before_send(self, mock_config):
        """Relay must be added and connected before sending."""
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        order = _make_order(password=None)
        call_order = []

        async def record_add_relay(url):
            call_order.append("add_relay")

        async def record_connect(**kw):
            call_order.append("connect")

        async def record_send_event(event):
            call_order.append("send_event")

        patch_cls, mock_client = _patch_client()
        mock_client.add_relay.side_effect = record_add_relay
        mock_client.connect.side_effect = record_connect
        mock_client.send_event.side_effect = record_send_event
        with patch_cls:
            asyncio.run(self.nostr.send_order_event(order))

        self.assertEqual(call_order, ["add_relay", "connect", "send_event"])

    @patch("api.nostr.config")
    def test_relay_url_uses_strfry_host_and_port(self, mock_config):
        env = {
            **ENV_OVERRIDES,
            "STRFRY_HOST": "relay.mycoord.onion",
            "STRFRY_PORT": "9000",
        }
        mock_config.side_effect = lambda key, **kw: env.get(key, kw.get("default", ""))
        order = _make_order(password=None)
        patch_cls, mock_client = _patch_client()
        with patch_cls:
            asyncio.run(self.nostr.send_order_event(order))
        mock_client.add_relay.assert_called_once_with("ws://relay.mycoord.onion:9000")

    @patch("api.nostr.config")
    def test_event_is_signed_by_coordinator_key(self, mock_config):
        """The signed event pubkey must match the coordinator's nsec."""
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        keys = Keys.parse(TEST_NSEC)
        expected_pubkey = keys.get_public_key().to_hex()

        order = _make_order(password=None)
        captured_event = None

        async def capture_send_event(event):
            nonlocal captured_event
            captured_event = event

        patch_cls, mock_client = _patch_client()
        mock_client.send_event.side_effect = capture_send_event
        with patch_cls:
            asyncio.run(self.nostr.send_order_event(order))

        event_json = json.loads(captured_event.as_json())
        self.assertEqual(event_json["pubkey"], expected_pubkey)


# ---------------------------------------------------------------------------
class TestNostrSendNotificationEvent(TestCase):
    """Integration-style tests for send_notification_event."""

    def setUp(self):
        self.nostr = Nostr()

    @patch("api.nostr.config")
    def test_skips_when_nostr_nsec_empty(self, mock_config):
        env = {**ENV_OVERRIDES, "NOSTR_NSEC": ""}
        mock_config.side_effect = lambda key, **kw: env.get(key, kw.get("default", ""))
        robot = _make_robot()
        order = _make_order()
        patch_cls, mock_client = _patch_client()
        with patch_cls:
            asyncio.run(self.nostr.send_notification_event(robot, order, "hello"))
        mock_client.send_event.assert_not_called()

    @patch("api.nostr.config")
    def test_sends_gift_wrap_event(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        robot = _make_robot()
        order = _make_order()
        patch_cls, mock_client = _patch_client()
        with patch_cls:
            asyncio.run(
                self.nostr.send_notification_event(robot, order, "Trade update")
            )
        mock_client.send_event.assert_called_once()

    @patch("api.nostr.config")
    def test_gift_wrap_has_kind_1059(self, mock_config):
        """NIP-17 gift-wrap events must use kind 1059."""
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        robot = _make_robot()
        order = _make_order()
        captured_event = None

        async def capture_send_event(event):
            nonlocal captured_event
            captured_event = event

        patch_cls, mock_client = _patch_client()
        mock_client.send_event.side_effect = capture_send_event
        with patch_cls:
            asyncio.run(self.nostr.send_notification_event(robot, order, "hello"))

        self.assertIsNotNone(captured_event)
        event_json = json.loads(captured_event.as_json())
        self.assertEqual(event_json["kind"], 1059)

    @patch("api.nostr.config")
    def test_connect_called_before_send(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        robot = _make_robot()
        order = _make_order()
        call_order = []

        async def record_add_relay(url):
            call_order.append("add_relay")

        async def record_connect(**kw):
            call_order.append("connect")

        async def record_send_event(event):
            call_order.append("send_event")

        patch_cls, mock_client = _patch_client()
        mock_client.add_relay.side_effect = record_add_relay
        mock_client.connect.side_effect = record_connect
        mock_client.send_event.side_effect = record_send_event
        with patch_cls:
            asyncio.run(self.nostr.send_notification_event(robot, order, "hello"))

        self.assertEqual(call_order, ["add_relay", "connect", "send_event"])

    @patch("api.nostr.config")
    def test_invalid_receiver_pubkey_raises(self, mock_config):
        """A robot with a malformed nostr_pubkey must raise before sending."""
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        robot = _make_robot(nostr_pubkey="not_a_valid_pubkey")
        order = _make_order()
        patch_cls, mock_client = _patch_client()
        with patch_cls:
            with self.assertRaises(Exception):
                asyncio.run(self.nostr.send_notification_event(robot, order, "hello"))
        mock_client.send_event.assert_not_called()


# ---------------------------------------------------------------------------
class TestNostrInitializeClient(TestCase):
    """Tests for initialize_client."""

    def setUp(self):
        self.nostr = Nostr()

    @patch("api.nostr.config")
    def test_returns_client_instance(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        patch_cls, mock_client = _patch_client()
        with patch_cls:
            client = asyncio.run(self.nostr.initialize_client())
        self.assertIs(client, mock_client)

    @patch("api.nostr.config")
    def test_add_relay_and_connect_both_called(self, mock_config):
        mock_config.side_effect = lambda key, **kw: ENV_OVERRIDES.get(
            key, kw.get("default", "")
        )
        patch_cls, mock_client = _patch_client()
        with patch_cls:
            asyncio.run(self.nostr.initialize_client())
        mock_client.add_relay.assert_called_once()
        mock_client.connect.assert_called_once()

    @patch("api.nostr.config")
    def test_default_strfry_url(self, mock_config):
        env = {k: v for k, v in ENV_OVERRIDES.items()}

        # Use defaults for STRFRY_HOST/PORT — config() should return the default kwarg
        def side_effect(key, **kw):
            if key == "STRFRY_HOST":
                return kw.get("default", "localhost")
            if key == "STRFRY_PORT":
                return kw.get("default", "7778")
            return env.get(key, kw.get("default", ""))

        mock_config.side_effect = side_effect
        patch_cls, mock_client = _patch_client()
        with patch_cls:
            asyncio.run(self.nostr.initialize_client())
        mock_client.add_relay.assert_called_once_with("ws://localhost:7778")

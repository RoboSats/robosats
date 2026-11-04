"""
Unit tests for the chat-participation gates in automatic dispute resolution.

Background
----------
`automatic_dispute_resolution()` resolves CHA/FSE-timeout disputes by counting
`chat.Message` rows in the coordinator DB. With the Nostr chat transport,
a robot's messages may exist only on relays (its `/api/chat/` POSTs failed
while the coordinator was offline) — the message count alone would wrongly
resolve the dispute against it. Two gates were added:

1. Downtime guard — if the order expired more than
   `DISPUTE_AUTO_RESOLUTION_MAX_LAG` seconds ago, the coordinator was likely
   offline at expiry; decision inputs are untrusted and the dispute must be
   resolved by a human.
2. Participation veto — the losing branch additionally requires that the
   silent robot has NO chat-participation event (kind 30079, signed with the
   robot's Nostr key) on the coordinator relay. An event, or an inconclusive
   relay query (None), vetoes automatic resolution.

These tests patch `Logics.has_chat_participation` (the relay-touching part is
covered by `api/tests/test_nostr.py` unit tests and `tests/test_nostr_relay.py`
integration tests).
"""

import uuid
from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from api.logics import Logics
from api.models import LNPayment, Order


NOOP_LN = "api.logics.LNNode"
NOOP_DEVFUND = "api.logics.send_devfund_donation"
NOOP_NOSTR = "api.logics.nostr_send_order_event"
NOOP_NOTIFY = "api.logics.send_notification"
NOOP_NOTIFY_MODEL = "api.models.order.send_notification"
PARTICIPATION = "api.logics.Logics.has_chat_participation"
MAX_LAG = "api.logics.DISPUTE_AUTO_RESOLUTION_MAX_LAG"


def _lnpayment(concept, sender_user, sats, payment_hash=None):
    """Create a minimal LNPayment hold invoice row in the database."""
    now = timezone.now()
    return LNPayment.objects.create(
        type=LNPayment.Types.HOLD,
        concept=concept,
        status=LNPayment.Status.LOCKED,
        payment_hash=payment_hash or uuid.uuid4().hex,
        preimage=uuid.uuid4().hex,
        num_satoshis=sats,
        created_at=now,
        expires_at=now + timedelta(hours=1),
        sender=sender_user,
    )


def _make_users_with_robots(n):
    """Return n User objects; Robot is auto-created by post_save signal."""
    users = []
    for _ in range(n):
        u = User.objects.create_user(
            username=f"robot_{uuid.uuid4().hex[:8]}", password="x"
        )
        users.append(u)
    return users


def _make_order(maker, taker, maker_bond, taker_bond, minutes_ago=5):
    """Create a minimal CHA order whose chat timer expired `minutes_ago` ago."""
    now = timezone.now()
    escrow = LNPayment.objects.create(
        type=LNPayment.Types.HOLD,
        concept=LNPayment.Concepts.TRESCROW,
        status=LNPayment.Status.LOCKED,
        payment_hash=uuid.uuid4().hex,
        preimage=uuid.uuid4().hex,
        num_satoshis=100_000,
        created_at=now,
        expires_at=now + timedelta(hours=1),
        sender=maker,
    )
    return Order.objects.create(
        type=Order.Types.BUY,
        status=Order.Status.CHA,
        created_at=now - timedelta(hours=3),
        expires_at=now - timedelta(minutes=minutes_ago),
        has_range=False,
        amount=100,
        satoshis=100_000,
        t0_satoshis=100_000,
        last_satoshis=100_000,
        maker=maker,
        taker=taker,
        maker_bond=maker_bond,
        taker_bond=taker_bond,
        trade_escrow=escrow,
        bond_size=3,
    )


def _make_message(order, sender, index):
    from chat.models import Message

    return Message.objects.create(
        order=order, chatroom=None, index=index, sender=sender
    )


def _start_patches(test_case, participation_side_effect=None):
    """Patch every external call automatic_dispute_resolution can reach."""
    patches = [
        patch(f"{NOOP_LN}.settle_hold_invoice", return_value=True),
        patch(f"{NOOP_LN}.cancel_return_hold_invoice", return_value=True),
        patch(f"{NOOP_LN}.double_check_htlc_is_settled", return_value=True),
        patch(f"{NOOP_DEVFUND}.delay", return_value=None),
        patch(f"{NOOP_NOSTR}.delay", return_value=None),
        patch(f"{NOOP_NOTIFY}.delay", return_value=None),
        patch(f"{NOOP_NOTIFY_MODEL}.delay", return_value=None),
        patch(MAX_LAG, 600),
    ]
    if participation_side_effect is not None:
        patches.append(
            patch(
                PARTICIPATION,
                side_effect=participation_side_effect,
            )
        )
    for p in patches:
        p.start()
    test_case.addCleanup(lambda ps=patches: [p.stop() for p in ps])


def _assert_bond_status(test_case, order, maker_status, taker_status):
    order.maker_bond.refresh_from_db()
    order.taker_bond.refresh_from_db()
    test_case.assertEqual(order.maker_bond.status, maker_status)
    test_case.assertEqual(order.taker_bond.status, taker_status)


class AutomaticDisputeResolutionDowntimeGuardTest(TestCase):
    """The expiry-lag guard: stale decisions are left to a human."""

    def test_long_lag_skips_automatic_resolution(self):
        maker, taker = _make_users_with_robots(2)
        order = _make_order(
            maker,
            taker,
            _lnpayment(LNPayment.Concepts.MAKEBOND, maker, 21_000),
            _lnpayment(LNPayment.Concepts.TAKEBOND, taker, 6_000),
            minutes_ago=60 * 10,
        )

        with patch(PARTICIPATION) as mock_participation:
            result = Logics.automatic_dispute_resolution(order)

        self.assertFalse(result)
        mock_participation.assert_not_called()
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CHA)
        self.assertFalse(order.is_disputed)

    def test_lag_within_limit_allows_automatic_resolution(self):
        maker, taker = _make_users_with_robots(2)
        order = _make_order(
            maker,
            taker,
            _lnpayment(LNPayment.Concepts.MAKEBOND, maker, 21_000),
            _lnpayment(LNPayment.Concepts.TAKEBOND, taker, 6_000),
            minutes_ago=5,
        )

        _start_patches(self, participation_side_effect=lambda order, user: False)

        result = Logics.automatic_dispute_resolution(order)

        self.assertTrue(result)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.DIS)


class AutomaticDisputeResolutionParticipationVetoTest(TestCase):
    """The participation veto: relay evidence blocks one-sided auto-losses."""

    def setUp(self):
        self.maker, self.taker = _make_users_with_robots(2)

    def test_both_silent_and_no_participation_holds_bonds_in_dispute(self):
        order = _make_order(
            self.maker,
            self.taker,
            _lnpayment(LNPayment.Concepts.MAKEBOND, self.maker, 21_000),
            _lnpayment(LNPayment.Concepts.TAKEBOND, self.taker, 6_000),
        )
        _start_patches(self, participation_side_effect=lambda order, user: False)

        result = Logics.automatic_dispute_resolution(order)

        self.assertTrue(result)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.DIS)
        self.assertTrue(order.is_disputed)
        _assert_bond_status(
            self, order, LNPayment.Status.SETLED, LNPayment.Status.SETLED
        )

    def test_both_silent_maker_participation_vetoes(self):
        order = _make_order(
            self.maker,
            self.taker,
            _lnpayment(LNPayment.Concepts.MAKEBOND, self.maker, 21_000),
            _lnpayment(LNPayment.Concepts.TAKEBOND, self.taker, 6_000),
        )
        _start_patches(
            self,
            participation_side_effect=lambda order, user: (
                True if user == self.maker else False
            ),
        )

        result = Logics.automatic_dispute_resolution(order)

        self.assertFalse(result)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CHA)

    def test_both_silent_inconclusive_relay_vetoes(self):
        order = _make_order(
            self.maker,
            self.taker,
            _lnpayment(LNPayment.Concepts.MAKEBOND, self.maker, 21_000),
            _lnpayment(LNPayment.Concepts.TAKEBOND, self.taker, 6_000),
        )
        _start_patches(self, participation_side_effect=lambda order, user: None)

        result = Logics.automatic_dispute_resolution(order)

        self.assertFalse(result)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CHA)

    def test_maker_silent_without_participation_maker_loses(self):
        order = _make_order(
            self.maker,
            self.taker,
            _lnpayment(LNPayment.Concepts.MAKEBOND, self.maker, 21_000),
            _lnpayment(LNPayment.Concepts.TAKEBOND, self.taker, 6_000),
        )
        _make_message(order, self.taker, 1)
        _start_patches(self, participation_side_effect=lambda order, user: False)

        result = Logics.automatic_dispute_resolution(order)

        self.assertTrue(result)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.MLD)
        _assert_bond_status(
            self, order, LNPayment.Status.SETLED, LNPayment.Status.RETNED
        )
        self.taker.robot.refresh_from_db()
        self.assertGreater(self.taker.robot.earned_rewards, 0)

    def test_maker_silent_with_participation_vetoes(self):
        order = _make_order(
            self.maker,
            self.taker,
            _lnpayment(LNPayment.Concepts.MAKEBOND, self.maker, 21_000),
            _lnpayment(LNPayment.Concepts.TAKEBOND, self.taker, 6_000),
        )
        _make_message(order, self.taker, 1)
        _start_patches(
            self,
            participation_side_effect=lambda order, user: (
                True if user == self.maker else False
            ),
        )

        result = Logics.automatic_dispute_resolution(order)

        self.assertFalse(result)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CHA)
        self.assertFalse(order.is_disputed)

    def test_maker_silent_inconclusive_relay_vetoes(self):
        order = _make_order(
            self.maker,
            self.taker,
            _lnpayment(LNPayment.Concepts.MAKEBOND, self.maker, 21_000),
            _lnpayment(LNPayment.Concepts.TAKEBOND, self.taker, 6_000),
        )
        _make_message(order, self.taker, 1)
        _start_patches(self, participation_side_effect=lambda order, user: None)

        result = Logics.automatic_dispute_resolution(order)

        self.assertFalse(result)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CHA)

    def test_taker_silent_without_participation_taker_loses(self):
        order = _make_order(
            self.maker,
            self.taker,
            _lnpayment(LNPayment.Concepts.MAKEBOND, self.maker, 21_000),
            _lnpayment(LNPayment.Concepts.TAKEBOND, self.taker, 6_000),
        )
        _make_message(order, self.maker, 1)
        _start_patches(self, participation_side_effect=lambda order, user: False)

        result = Logics.automatic_dispute_resolution(order)

        self.assertTrue(result)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.TLD)
        _assert_bond_status(
            self, order, LNPayment.Status.RETNED, LNPayment.Status.SETLED
        )
        self.maker.robot.refresh_from_db()
        self.assertGreater(self.maker.robot.earned_rewards, 0)

    def test_taker_silent_with_participation_vetoes(self):
        order = _make_order(
            self.maker,
            self.taker,
            _lnpayment(LNPayment.Concepts.MAKEBOND, self.maker, 21_000),
            _lnpayment(LNPayment.Concepts.TAKEBOND, self.taker, 6_000),
        )
        _make_message(order, self.maker, 1)
        _start_patches(
            self,
            participation_side_effect=lambda order, user: (
                True if user == self.taker else False
            ),
        )

        result = Logics.automatic_dispute_resolution(order)

        self.assertFalse(result)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CHA)


class AutomaticDisputeResolutionEarlyExitsTest(TestCase):
    """Pre-existing early exits must not consult the relay."""

    def setUp(self):
        self.maker, self.taker = _make_users_with_robots(2)

    def _order(self, **overrides):
        order = _make_order(
            self.maker,
            self.taker,
            _lnpayment(LNPayment.Concepts.MAKEBOND, self.maker, 21_000),
            _lnpayment(LNPayment.Concepts.TAKEBOND, self.taker, 6_000),
        )
        for field, value in overrides.items():
            setattr(order, field, value)
            order.save(update_fields=[field])
        return order

    def test_fiat_sent_blocks_resolution_without_relay_query(self):
        order = self._order(is_fiat_sent=True)
        _start_patches(self, participation_side_effect=lambda order, user: False)

        with patch(PARTICIPATION) as mock_participation:
            result = Logics.automatic_dispute_resolution(order)

        self.assertFalse(result)
        mock_participation.assert_not_called()

    def test_unexpired_order_blocks_resolution_without_relay_query(self):
        order = self._order(expires_at=timezone.now() + timedelta(hours=1))
        _start_patches(self, participation_side_effect=lambda order, user: False)

        with patch(PARTICIPATION) as mock_participation:
            result = Logics.automatic_dispute_resolution(order)

        self.assertFalse(result)
        mock_participation.assert_not_called()

    def test_both_wrote_goes_to_manual_without_relay_query(self):
        order = self._order()
        _make_message(order, self.maker, 1)
        _make_message(order, self.taker, 2)
        _start_patches(self, participation_side_effect=lambda order, user: False)

        with patch(PARTICIPATION) as mock_participation:
            result = Logics.automatic_dispute_resolution(order)

        self.assertFalse(result)
        mock_participation.assert_not_called()
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CHA)


class LogicsHasChatParticipationBridgeTest(TestCase):
    """The sync bridge passes the robot through to Nostr.has_chat_participation."""

    def test_bridge_returns_nostr_answer(self):
        user = _make_users_with_robots(1)[0]
        order = MagicMock()
        order.id = 42

        for nostr_answer in (True, False, None):
            with patch(
                "api.nostr.Nostr.has_chat_participation",
                new=AsyncMock(return_value=nostr_answer),
            ):
                result = Logics.has_chat_participation(order, user)
            self.assertEqual(result, nostr_answer)

    def test_bridge_with_none_user_returns_false(self):
        with patch("api.nostr.Nostr.has_chat_participation") as mock_nostr:
            result = Logics.has_chat_participation(MagicMock(), None)

        self.assertFalse(result)
        mock_nostr.assert_not_called()

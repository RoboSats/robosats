"""
Unit tests for Logics.open_dispute() after the removal of automatic_dispute_resolution.

Chat now runs over Nostr; the coordinator's Message table is no longer a reliable
record of who participated in the conversation.  Deciding a dispute winner based on
coordinator-side message counts would punish a robot that did write in chat via Nostr
but whose message was not stored locally.  The automatic_dispute_resolution method has
therefore been removed.  Every dispute triggered by a CHA/FSE timeout now goes through
the full custody path: escrow and both bonds are settled to the coordinator, the order
moves to DIS, and the dispute_opened notification is sent.  The coordinator resolves
it manually via the admin.

Tests:
    1. Expired CHA order — full custody path taken (settle_escrow + both bonds settled,
       status DIS, is_disputed=True, notification fired).
    2. Logics no longer exposes automatic_dispute_resolution at all.
    3. Order in wrong status → error 1013 returned, no Lightning calls made.
    4. Order expires_at too far in the future (>18 h) → error 1054, no calls made.
"""

import uuid
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from api.logics import Logics
from api.models import LNPayment, Order

NOOP_LN = "api.logics.LNNode"
NOOP_NOTIFY = "api.logics.send_notification"
NOOP_NOTIFY_MODEL = "api.models.order.send_notification"


def _make_lnpayment(concept, sender_user, sats, status=LNPayment.Status.LOCKED):
    now = timezone.now()
    return LNPayment.objects.create(
        type=LNPayment.Types.HOLD,
        concept=concept,
        status=status,
        payment_hash=uuid.uuid4().hex,
        preimage=uuid.uuid4().hex,
        num_satoshis=sats,
        created_at=now,
        expires_at=now + timedelta(hours=1),
        sender=sender_user,
    )


def _make_users(n):
    return [
        User.objects.create_user(username=f"robot_{uuid.uuid4().hex[:8]}", password="x")
        for _ in range(n)
    ]


def _make_order(maker, taker, maker_bond, taker_bond, trade_escrow, status, expires_at):
    now = timezone.now()
    return Order.objects.create(
        type=Order.Types.BUY,
        status=status,
        created_at=now,
        expires_at=expires_at,
        has_range=False,
        amount=100,
        satoshis=100_000,
        t0_satoshis=100_000,
        last_satoshis=100_000,
        maker=maker,
        taker=taker,
        maker_bond=maker_bond,
        taker_bond=taker_bond,
        trade_escrow=trade_escrow,
        bond_size=3,
    )


class OpenDisputeFullCustodyTest(TestCase):
    """
    An expired CHA order must follow the full custody path: settle escrow,
    settle both bonds, set is_disputed=True, move to DIS, fire notification.
    No auto-resolution is attempted regardless of chat message counts.
    """

    def setUp(self):
        self.maker, self.taker = _make_users(2)
        self.maker_bond = _make_lnpayment(
            LNPayment.Concepts.MAKEBOND, self.maker, 3_000
        )
        self.taker_bond = _make_lnpayment(
            LNPayment.Concepts.TAKEBOND, self.taker, 3_000
        )
        self.trade_escrow = _make_lnpayment(
            LNPayment.Concepts.TRESCROW, self.taker, 100_000
        )
        self.order = _make_order(
            maker=self.maker,
            taker=self.taker,
            maker_bond=self.maker_bond,
            taker_bond=self.taker_bond,
            trade_escrow=self.trade_escrow,
            status=Order.Status.CHA,
            expires_at=timezone.now() - timedelta(minutes=1),
        )

    @patch(NOOP_NOTIFY_MODEL)
    @patch(NOOP_NOTIFY)
    @patch(f"{NOOP_LN}.cancel_return_hold_invoice", return_value=True)
    @patch(f"{NOOP_LN}.settle_hold_invoice", return_value=True)
    def test_expired_cha_order_opens_full_dispute(
        self, mock_settle, mock_cancel, mock_notify, mock_notify_model
    ):
        valid, ctx = Logics.open_dispute(self.order)

        self.assertTrue(valid)
        self.assertIsNone(ctx)

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.Status.DIS)
        self.assertTrue(self.order.is_disputed)

        self.maker_bond.refresh_from_db()
        self.taker_bond.refresh_from_db()
        self.trade_escrow.refresh_from_db()
        self.assertEqual(self.maker_bond.status, LNPayment.Status.SETLED)
        self.assertEqual(self.taker_bond.status, LNPayment.Status.SETLED)
        self.assertEqual(self.trade_escrow.status, LNPayment.Status.SETLED)

        mock_notify.delay.assert_called_once_with(
            order_id=self.order.id, message="dispute_opened"
        )

    @patch(NOOP_NOTIFY_MODEL)
    @patch(NOOP_NOTIFY)
    @patch(f"{NOOP_LN}.cancel_return_hold_invoice", return_value=True)
    @patch(f"{NOOP_LN}.settle_hold_invoice", return_value=True)
    def test_no_add_slashed_rewards_called(
        self, mock_settle, mock_cancel, mock_notify, mock_notify_model
    ):
        with patch("api.logics.Logics.add_slashed_rewards") as mock_slash:
            Logics.open_dispute(self.order)
            mock_slash.assert_not_called()

    @patch(NOOP_NOTIFY_MODEL)
    @patch(NOOP_NOTIFY)
    @patch(f"{NOOP_LN}.cancel_return_hold_invoice", return_value=True)
    @patch(f"{NOOP_LN}.settle_hold_invoice", return_value=True)
    def test_no_return_bond_called(
        self, mock_settle, mock_cancel, mock_notify, mock_notify_model
    ):
        with patch("api.logics.Logics.return_bond") as mock_return:
            Logics.open_dispute(self.order)
            mock_return.assert_not_called()


class AutomaticDisputeResolutionRemovedTest(TestCase):
    def test_method_does_not_exist(self):
        self.assertFalse(
            hasattr(Logics, "automatic_dispute_resolution"),
            "automatic_dispute_resolution must not exist on Logics",
        )


class OpenDisputeInvalidStatusTest(TestCase):
    def setUp(self):
        self.maker, self.taker = _make_users(2)
        self.maker_bond = _make_lnpayment(
            LNPayment.Concepts.MAKEBOND, self.maker, 3_000
        )
        self.taker_bond = _make_lnpayment(
            LNPayment.Concepts.TAKEBOND, self.taker, 3_000
        )
        self.trade_escrow = _make_lnpayment(
            LNPayment.Concepts.TRESCROW, self.taker, 100_000
        )
        self.order = _make_order(
            maker=self.maker,
            taker=self.taker,
            maker_bond=self.maker_bond,
            taker_bond=self.taker_bond,
            trade_escrow=self.trade_escrow,
            status=Order.Status.WFE,
            expires_at=timezone.now() - timedelta(minutes=1),
        )

    @patch(f"{NOOP_LN}.settle_hold_invoice", return_value=True)
    def test_wrong_status_returns_error_1013(self, mock_settle):
        valid, ctx = Logics.open_dispute(self.order)

        self.assertFalse(valid)
        self.assertIn("bad_request", ctx)
        mock_settle.assert_not_called()


class OpenDisputeTooEarlyTest(TestCase):
    def setUp(self):
        self.maker, self.taker = _make_users(2)
        self.maker_bond = _make_lnpayment(
            LNPayment.Concepts.MAKEBOND, self.maker, 3_000
        )
        self.taker_bond = _make_lnpayment(
            LNPayment.Concepts.TAKEBOND, self.taker, 3_000
        )
        self.trade_escrow = _make_lnpayment(
            LNPayment.Concepts.TRESCROW, self.taker, 100_000
        )
        self.order = _make_order(
            maker=self.maker,
            taker=self.taker,
            maker_bond=self.maker_bond,
            taker_bond=self.taker_bond,
            trade_escrow=self.trade_escrow,
            status=Order.Status.CHA,
            expires_at=timezone.now() + timedelta(hours=24),
        )

    @patch(f"{NOOP_LN}.settle_hold_invoice", return_value=True)
    def test_too_early_returns_error_1054(self, mock_settle):
        valid, ctx = Logics.open_dispute(self.order)

        self.assertFalse(valid)
        self.assertIn("bad_request", ctx)
        mock_settle.assert_not_called()

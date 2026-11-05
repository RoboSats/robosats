import json
import uuid
from datetime import timedelta
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from api.logics import Logics
from api.models import LNPayment, Order
from chat.models import Message


def _user():
    return User.objects.create_user(
        username=f"robot_{uuid.uuid4().hex[:8]}", password="x"
    )


def _hold(concept, sender, sats, status=LNPayment.Status.LOCKED):
    now = timezone.now()
    return LNPayment.objects.create(
        type=LNPayment.Types.HOLD,
        concept=concept,
        status=status,
        payment_hash=uuid.uuid4().hex,
        preimage=uuid.uuid4().hex,
        num_satoshis=sats,
        created_at=now,
        expires_at=now + timedelta(hours=48),
        sender=sender,
    )


class LateExpiryTest(TestCase):
    def setUp(self):
        self.ln = MagicMock()
        self.ln.settle_hold_invoice.return_value = True
        self.ln.cancel_return_hold_invoice.return_value = True
        self.ln.double_check_htlc_is_settled.return_value = True
        self.notify = MagicMock()
        patches = [
            patch("api.logics.LNNode", self.ln),
            patch("api.logics.send_notification", self.notify),
            patch("api.logics.send_devfund_donation"),
            patch("api.logics.nostr_send_order_event"),
        ]
        for p in patches:
            p.start()
            self.addCleanup(p.stop)

        self.maker = _user()
        self.taker = _user()

    def _order(self, status, expired_for, is_fiat_sent=False):
        maker_bond = _hold(LNPayment.Concepts.MAKEBOND, self.maker, 3_000)
        taker_bond = _hold(LNPayment.Concepts.TAKEBOND, self.taker, 3_000)
        escrow = _hold(LNPayment.Concepts.TRESCROW, self.maker, 100_000)
        now = timezone.now()
        return Order.objects.create(
            type=Order.Types.SELL,
            status=status,
            created_at=now - timedelta(days=2),
            expires_at=now - expired_for,
            has_range=False,
            amount=100,
            satoshis=100_000,
            t0_satoshis=100_000,
            last_satoshis=100_000,
            maker=self.maker,
            taker=self.taker,
            maker_bond=maker_bond,
            taker_bond=taker_bond,
            trade_escrow=escrow,
            bond_size=3,
            is_fiat_sent=is_fiat_sent,
        )

    def _write(self, order, user):
        Message.objects.create(
            order=order, index=Message.objects.count() + 1, sender=user
        )

    def _events(self, order):
        order.refresh_from_db()
        return [entry["event"] for entry in json.loads(order.logs or "[]")]

    def _notified(self, message):
        return any(
            c.kwargs.get("message") == message for c in self.notify.delay.call_args_list
        )

    def test_late_expiry_in_chat_extends_instead_of_dispute(self):
        order = self._order(Order.Status.CHA, timedelta(hours=2))
        self._write(order, self.maker)

        before = timezone.now()
        self.assertFalse(Logics.order_expires(order))
        after = timezone.now()

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CHA)
        self.assertFalse(order.is_disputed)
        self.assertGreaterEqual(order.expires_at, before + timedelta(hours=2))
        self.assertLessEqual(order.expires_at, after + timedelta(hours=2, seconds=1))
        self.ln.settle_hold_invoice.assert_not_called()
        self.ln.cancel_return_hold_invoice.assert_not_called()
        self.assertEqual(order.trade_escrow.status, LNPayment.Status.LOCKED)
        self.assertFalse(self._notified("dispute_opened"))
        self.assertTrue(
            any(
                "processed 120 minutes late" in e and "extended** by 120 minutes" in e
                for e in self._events(order)
            )
        )

    def test_late_expiry_extension_is_capped_at_chat_duration(self):
        order = self._order(Order.Status.CHA, timedelta(days=3))
        chat_time = timedelta(seconds=order.t_to_expire(Order.Status.CHA))

        before = timezone.now()
        self.assertFalse(Logics.order_expires(order))
        after = timezone.now()

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CHA)
        self.assertGreaterEqual(order.expires_at, before + chat_time)
        self.assertLessEqual(order.expires_at, after + chat_time)

    def test_short_late_expiry_gets_minimum_extension(self):
        order = self._order(Order.Status.CHA, timedelta(minutes=10))

        before = timezone.now()
        self.assertFalse(Logics.order_expires(order))
        after = timezone.now()

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CHA)
        self.assertGreaterEqual(order.expires_at, before + timedelta(hours=1))
        self.assertLessEqual(order.expires_at, after + timedelta(hours=1, seconds=1))
        self.assertTrue(
            any(
                "processed 10 minutes late" in e and "extended** by 60 minutes" in e
                for e in self._events(order)
            )
        )

    def test_late_expiry_in_fiat_sent_extends(self):
        order = self._order(Order.Status.FSE, timedelta(hours=1), is_fiat_sent=True)

        self.assertFalse(Logics.order_expires(order))

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.FSE)
        self.assertFalse(order.is_disputed)
        self.assertGreater(order.expires_at, timezone.now() + timedelta(minutes=59))
        self.ln.settle_hold_invoice.assert_not_called()

    def test_extended_order_expiring_on_time_opens_dispute(self):
        order = self._order(Order.Status.CHA, timedelta(hours=2))
        self._write(order, self.maker)
        Logics.order_expires(order)

        order.expires_at = timezone.now() - timedelta(seconds=5)
        order.save(update_fields=["expires_at"])
        self.assertTrue(Logics.order_expires(order))

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.TLD)

    def test_on_time_expiry_taker_silent_loses(self):
        order = self._order(Order.Status.CHA, timedelta(seconds=10))
        self._write(order, self.maker)

        self.assertTrue(Logics.order_expires(order))

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.TLD)
        self.assertTrue(order.is_disputed)
        self.assertEqual(order.trade_escrow.status, LNPayment.Status.RETNED)
        self.assertTrue(self._notified("dispute_opened"))
        self.assertIn(
            "**The dispute was solved automatically:** 'Taker lost dispute', "
            "the taker did not write in the chat",
            self._events(order),
        )

    def test_on_time_expiry_maker_silent_loses(self):
        order = self._order(Order.Status.CHA, timedelta(seconds=10))
        self._write(order, self.taker)

        self.assertTrue(Logics.order_expires(order))

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.MLD)
        self.assertIn(
            "**The dispute was solved automatically:** 'Maker lost dispute', "
            "the maker did not write in the chat",
            self._events(order),
        )

    def test_on_time_expiry_in_fiat_sent_opens_manual_dispute(self):
        order = self._order(Order.Status.FSE, timedelta(seconds=10), is_fiat_sent=True)

        self.assertTrue(Logics.order_expires(order))

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.DIS)
        self.assertTrue(order.is_disputed)

    def test_threshold_is_configurable(self):
        order = self._order(Order.Status.CHA, timedelta(minutes=30))
        self._write(order, self.maker)

        with patch("api.logics.MAX_EXPIRY_LATENESS", 3600):
            self.assertTrue(Logics.order_expires(order))

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.TLD)

    def test_late_expiry_is_not_auto_resolved(self):
        order = self._order(Order.Status.CHA, timedelta(hours=2))
        self._write(order, self.maker)

        self.assertFalse(Logics.automatic_dispute_resolution(order))

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CHA)
        self.assertTrue(any("processed late" in e for e in self._events(order)))

    def test_dispute_opened_by_robot_after_downtime_goes_to_manual_resolution(self):
        order = self._order(Order.Status.CHA, timedelta(hours=2))
        self._write(order, self.maker)

        valid, _ = Logics.open_dispute(order, self.maker)

        self.assertTrue(valid)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.DIS)
        self.assertTrue(order.is_disputed)

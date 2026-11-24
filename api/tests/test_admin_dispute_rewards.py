"""
Unit tests for the dispute resolution admin actions on OrderAdmin.

The maker_wins, taker_wins and successful_trade actions credit compensations
(earned_rewards) to the robots involved. The credit must be added to whatever
balance the robot already has, never replace it.
"""

import uuid
from datetime import timedelta
from unittest.mock import MagicMock, patch

from django.contrib import admin
from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from api.admin import OrderAdmin
from api.models import LNPayment, Order

NOOP_NOTIFY_ADMIN = "api.admin.send_notification"
NOOP_NOTIFY_MODEL = "api.models.order.send_notification"

PRIOR_REWARDS = 7_000
BOND_SATS = 3_000
ESCROW_SATS = 100_000
PAYOUT_SATS = 90_000


def _make_lnpayment(concept, sender_user, sats):
    now = timezone.now()
    return LNPayment.objects.create(
        type=LNPayment.Types.HOLD,
        concept=concept,
        status=LNPayment.Status.SETLED,
        payment_hash=uuid.uuid4().hex,
        preimage=uuid.uuid4().hex,
        num_satoshis=sats,
        created_at=now,
        expires_at=now + timedelta(hours=1),
        sender=sender_user,
    )


def _make_user():
    user = User.objects.create_user(
        username=f"robot_{uuid.uuid4().hex[:8]}", password="x"
    )
    user.robot.earned_rewards = PRIOR_REWARDS
    user.robot.save(update_fields=["earned_rewards"])
    return user


class DisputeAdminRewardsTest(TestCase):
    def setUp(self):
        self.maker = _make_user()
        self.taker = _make_user()
        maker_bond = _make_lnpayment(LNPayment.Concepts.MAKEBOND, self.maker, BOND_SATS)
        taker_bond = _make_lnpayment(LNPayment.Concepts.TAKEBOND, self.taker, BOND_SATS)
        trade_escrow = _make_lnpayment(
            LNPayment.Concepts.TRESCROW, self.taker, ESCROW_SATS
        )
        payout = LNPayment.objects.create(
            type=LNPayment.Types.NORM,
            concept=LNPayment.Concepts.PAYBUYER,
            status=LNPayment.Status.VALIDI,
            payment_hash=uuid.uuid4().hex,
            num_satoshis=PAYOUT_SATS,
            created_at=timezone.now(),
            expires_at=timezone.now() + timedelta(hours=1),
            sender=self.taker,
            receiver=self.maker,
        )
        now = timezone.now()
        self.order = Order.objects.create(
            type=Order.Types.BUY,
            status=Order.Status.DIS,
            is_disputed=True,
            created_at=now,
            expires_at=now + timedelta(hours=1),
            has_range=False,
            amount=100,
            satoshis=ESCROW_SATS,
            t0_satoshis=ESCROW_SATS,
            last_satoshis=ESCROW_SATS,
            maker=self.maker,
            taker=self.taker,
            maker_bond=maker_bond,
            taker_bond=taker_bond,
            trade_escrow=trade_escrow,
            payout=payout,
            bond_size=3,
        )
        self.model_admin = OrderAdmin(Order, admin.site)
        self.model_admin.message_user = MagicMock()
        self.queryset = Order.objects.filter(pk=self.order.pk)

    def _rewards(self, user):
        user.robot.refresh_from_db()
        return user.robot.earned_rewards

    @patch(NOOP_NOTIFY_MODEL)
    @patch(NOOP_NOTIFY_ADMIN)
    def test_maker_wins_adds_to_existing_rewards(self, _notify, _notify_model):
        self.model_admin.maker_wins(MagicMock(), self.queryset)

        self.assertEqual(
            self._rewards(self.maker), PRIOR_REWARDS + BOND_SATS + PAYOUT_SATS
        )
        self.assertEqual(self._rewards(self.taker), PRIOR_REWARDS)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.Status.TLD)

    @patch(NOOP_NOTIFY_MODEL)
    @patch(NOOP_NOTIFY_ADMIN)
    def test_taker_wins_adds_to_existing_rewards(self, _notify, _notify_model):
        self.model_admin.taker_wins(MagicMock(), self.queryset)

        self.assertEqual(
            self._rewards(self.taker), PRIOR_REWARDS + BOND_SATS + ESCROW_SATS
        )
        self.assertEqual(self._rewards(self.maker), PRIOR_REWARDS)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.Status.MLD)

    @patch(NOOP_NOTIFY_MODEL)
    @patch("api.admin.Logics.pay_buyer", return_value=True)
    def test_successful_trade_adds_bonds_to_existing_rewards(
        self, _pay_buyer, _notify_model
    ):
        self.model_admin.successful_trade(MagicMock(), self.queryset)

        self.assertEqual(self._rewards(self.maker), PRIOR_REWARDS + BOND_SATS)
        self.assertEqual(self._rewards(self.taker), PRIOR_REWARDS + BOND_SATS)

    @patch(NOOP_NOTIFY_MODEL)
    @patch(NOOP_NOTIFY_ADMIN)
    def test_order_not_in_dispute_changes_no_rewards(self, _notify, _notify_model):
        self.order.status = Order.Status.CHA
        self.order.is_disputed = False
        self.order.save(update_fields=["status", "is_disputed"])

        self.model_admin.maker_wins(MagicMock(), self.queryset)
        self.model_admin.taker_wins(MagicMock(), self.queryset)

        self.assertEqual(self._rewards(self.maker), PRIOR_REWARDS)
        self.assertEqual(self._rewards(self.taker), PRIOR_REWARDS)

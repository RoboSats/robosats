"""
Regression tests for repeated slashed-bond reward crediting.

Concurrent cancel/expiry requests used to settle the same hold invoice
repeatedly (node settlement is idempotent) and run add_slashed_rewards
once per request, draining coordinator funds via reward withdrawals.

cancel_order, order_expires and automatic_dispute_resolution now
re-fetch the order under a row lock, and add_slashed_rewards credits
robots/proceeds with atomic F() expressions.

These tests mock the LNNode gRPC layer and simulate a concurrent second
request by re-invoking the entry points with the stale in-memory order
object left behind by the first request. A stale object carries the
pre-cancel status exactly like a request that was dispatched
simultaneously and read the order before the first one committed.
"""

import uuid
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from decouple import config
from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from api.logics import Logics
from api.models import LNPayment, Order, Robot

MAKER_BOND_SATS = 10_000
TAKER_BOND_SATS = 3_000
SLASHED_RETURN_SATS = MAKER_BOND_SATS - TAKER_BOND_SATS


def _reward_split():
    return config("SLASHED_BOND_REWARD_SPLIT", cast=float, default=0.5)


class CancelRewardsTestBase(TestCase):
    """Fixture builder + LNNode/notification mocks."""

    def setUp(self):
        self.maker = User.objects.create_user(username="maker", password="x")
        self.taker = User.objects.create_user(username="taker", password="x")

        self.settle = patch(
            "api.logics.LNNode.settle_hold_invoice", return_value=True
        ).start()
        self.cancel_return = patch(
            "api.logics.LNNode.cancel_return_hold_invoice", return_value=True
        ).start()
        self.devfund = patch("api.logics.send_devfund_donation").start()
        self.notification = patch("api.logics.send_notification").start()
        self.nostr = patch("api.logics.nostr_send_order_event").start()
        self.addCleanup(patch.stopall)

    def _lnpayment(self, sender, concept, num_satoshis):
        return LNPayment.objects.create(
            payment_hash=uuid.uuid4().hex,
            preimage=uuid.uuid4().hex,
            invoice=f"lnbcrt1test{uuid.uuid4().hex[:32]}",
            description="test bond",
            type=LNPayment.Types.HOLD,
            concept=concept,
            status=LNPayment.Status.LOCKED,
            num_satoshis=num_satoshis,
            created_at=timezone.now(),
            expires_at=timezone.now() + timedelta(hours=8),
            sender=sender,
        )

    def _order(
        self,
        status=Order.Status.WF2,
        order_type=Order.Types.BUY,
        has_range=False,
        with_escrow=True,
    ):
        return Order.objects.create(
            type=order_type,
            status=status,
            expires_at=timezone.now() + timedelta(hours=1),
            maker=self.maker,
            taker=self.taker,
            has_range=has_range,
            amount=None if has_range else Decimal("100"),
            min_amount=Decimal("10") if has_range else None,
            max_amount=Decimal("100") if has_range else None,
            maker_bond=self._lnpayment(
                self.maker, LNPayment.Concepts.MAKEBOND, MAKER_BOND_SATS
            ),
            taker_bond=self._lnpayment(
                self.taker, LNPayment.Concepts.TAKEBOND, TAKER_BOND_SATS
            ),
            trade_escrow=self._lnpayment(
                self.taker, LNPayment.Concepts.TRESCROW, 12_000
            )
            if with_escrow
            else None,
        )

    def _maker_robot(self):
        return Robot.objects.get(user=self.maker)

    def _taker_robot(self):
        return Robot.objects.get(user=self.taker)


class MakerCancelAfterTakerBondTests(CancelRewardsTestBase):
    """Case 4.a: maker cancels in WF2/WFE after the taker bond is locked."""

    def test_first_cancel_credits_slashed_rewards_once(self):
        order = self._order(has_range=True)

        valid, context = Logics.cancel_order(order, self.maker)

        self.assertTrue(valid)
        self.assertIsNone(context)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.UCA)

        expected_reward = int(TAKER_BOND_SATS * _reward_split())
        self.assertEqual(self._taker_robot().earned_rewards, expected_reward)
        self.assertEqual(self._maker_robot().earned_rewards, SLASHED_RETURN_SATS)
        self.assertEqual(order.proceeds, expected_reward)
        self.assertEqual(self.settle.call_count, 1)
        self.assertEqual(self.devfund.delay.call_count, 1)

    def test_concurrent_cancel_request_is_rejected_and_not_credited(self):
        order = self._order(has_range=True)

        valid, _ = Logics.cancel_order(order, self.maker)
        self.assertTrue(valid)

        # Second request raced the first one: it still holds the stale
        # in-memory order with the pre-cancel status WF2.
        valid_second, context_second = Logics.cancel_order(order, self.maker)

        self.assertFalse(valid_second)
        self.assertEqual(context_second["error_code"], 1021)

        self.assertEqual(self.settle.call_count, 1)
        self.assertEqual(self.devfund.delay.call_count, 1)
        self.assertEqual(self._maker_robot().earned_rewards, SLASHED_RETURN_SATS)
        self.assertEqual(
            self._taker_robot().earned_rewards,
            int(TAKER_BOND_SATS * _reward_split()),
        )
        order.refresh_from_db()
        self.assertEqual(order.proceeds, int(TAKER_BOND_SATS * _reward_split()))

    def test_cancel_without_escrow_does_not_crash(self):
        order = self._order(has_range=True, with_escrow=False)

        valid, context = Logics.cancel_order(order, self.maker)

        self.assertTrue(valid)
        self.assertIsNone(context)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.UCA)
        self.assertEqual(self._maker_robot().earned_rewards, SLASHED_RETURN_SATS)

    def test_cas_gate_blocks_stale_cancel_bypassing_lock(self):
        order = self._order(has_range=True)

        valid, _ = Logics.cancel_order(order, self.maker)
        self.assertTrue(valid)

        # Simulates a future call site that forgot the row lock: the
        # stale object carries status WF2 while the DB row is UCA.
        valid_second, context_second = Logics._cancel_order(order, self.maker)

        self.assertFalse(valid_second)
        self.assertEqual(context_second["error_code"], 1021)
        self.assertEqual(self.devfund.delay.call_count, 1)
        self.assertEqual(self._maker_robot().earned_rewards, SLASHED_RETURN_SATS)
        self.assertEqual(
            self._taker_robot().earned_rewards,
            int(TAKER_BOND_SATS * _reward_split()),
        )


class TakerCancelAfterBondTests(CancelRewardsTestBase):
    """Case 4.b: taker cancels in WF2/WFE after its bond is locked."""

    def test_taker_cancel_credits_maker_reward_once(self):
        order = self._order(has_range=False)

        valid, _ = Logics.cancel_order(order, self.taker)
        self.assertTrue(valid)

        expected_reward = int(TAKER_BOND_SATS * _reward_split())
        self.assertEqual(self._maker_robot().earned_rewards, expected_reward)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PUB)
        self.assertEqual(self.settle.call_count, 1)

        # Raced second request: PUB is not in do_not_cancel, but the
        # taker bond is already settled and no rewards must be credited.
        valid_second, context_second = Logics.cancel_order(order, self.taker)
        self.assertFalse(valid_second)
        self.assertEqual(context_second["error_code"], 1021)
        self.assertEqual(self.settle.call_count, 1)
        self.assertEqual(self._maker_robot().earned_rewards, expected_reward)


class OrderExpiresRewardTests(CancelRewardsTestBase):
    """WFE expiry (maker is seller) settles the maker bond and credits rewards."""

    def test_expiry_credits_slashed_rewards_once(self):
        order = self._order(
            status=Order.Status.WFE, order_type=Order.Types.SELL, has_range=True
        )

        self.assertTrue(Logics.order_expires(order))

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.EXP)
        expected_reward = int(TAKER_BOND_SATS * _reward_split())
        self.assertEqual(self._taker_robot().earned_rewards, expected_reward)
        self.assertEqual(self._maker_robot().earned_rewards, SLASHED_RETURN_SATS)
        self.assertEqual(self.settle.call_count, 1)

        # Raced second expiry handling must be a no-op.
        self.assertFalse(Logics.order_expires(order))
        self.assertEqual(self.settle.call_count, 1)
        self.assertEqual(self._taker_robot().earned_rewards, expected_reward)
        self.assertEqual(self._maker_robot().earned_rewards, SLASHED_RETURN_SATS)

    def test_cas_gate_blocks_stale_expiry_bypassing_lock(self):
        order = self._order(
            status=Order.Status.WFE, order_type=Order.Types.SELL, has_range=True
        )

        self.assertTrue(Logics.order_expires(order))
        expected_reward = int(TAKER_BOND_SATS * _reward_split())

        # Simulates a future call site that forgot the row lock.
        self.assertFalse(Logics._order_expires(order))
        self.assertEqual(self._taker_robot().earned_rewards, expected_reward)
        self.assertEqual(self._maker_robot().earned_rewards, SLASHED_RETURN_SATS)


class SettleBondGuardTests(CancelRewardsTestBase):
    """settle_bond must be a no-op on an already settled bond."""

    def test_settled_bond_skips_node_call(self):
        order = self._order()
        bond = order.maker_bond
        bond.status = LNPayment.Status.SETLED
        bond.save(update_fields=["status"])

        self.assertTrue(Logics.settle_bond(bond))
        self.assertEqual(self.settle.call_count, 0)

    def test_locked_bond_is_settled(self):
        order = self._order()

        self.assertTrue(Logics.settle_bond(order.maker_bond))
        self.assertEqual(self.settle.call_count, 1)
        order.maker_bond.refresh_from_db()
        self.assertEqual(order.maker_bond.status, LNPayment.Status.SETLED)


class AddSlashedRewardsTests(CancelRewardsTestBase):
    """add_slashed_rewards must atomically increment existing balances."""

    def test_range_overhang_returns_change_to_slashed_robot(self):
        order = self._order(has_range=True)

        Logics.add_slashed_rewards(order, order.maker_bond, order.taker_bond)

        self.assertEqual(
            self._taker_robot().earned_rewards, int(TAKER_BOND_SATS * _reward_split())
        )
        self.assertEqual(self._maker_robot().earned_rewards, SLASHED_RETURN_SATS)
        order.refresh_from_db()
        self.assertEqual(order.proceeds, int(TAKER_BOND_SATS * _reward_split()))
        self.assertEqual(self.devfund.delay.call_count, 1)

    def test_increment_preserves_preexisting_rewards(self):
        order = self._order(has_range=True)
        Robot.objects.filter(user=self.maker).update(earned_rewards=500)
        Robot.objects.filter(user=self.taker).update(earned_rewards=250)

        Logics.add_slashed_rewards(order, order.maker_bond, order.taker_bond)

        self.assertEqual(self._maker_robot().earned_rewards, 500 + SLASHED_RETURN_SATS)
        self.assertEqual(
            self._taker_robot().earned_rewards,
            250 + int(TAKER_BOND_SATS * _reward_split()),
        )

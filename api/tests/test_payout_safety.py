"""
Unit tests for the payout-safety additions in the payout-safety branch.

Covers:
 - payout_problem(): every gate that holds a buyer payout
 - follow_send_payment task: held payouts are not attempted; last_routing_time
   is pushed forward by one hour; the order WARN log is written once.
 - withdraw_rewards rate limits: REWARD_WITHDRAW_COOLDOWN and
   REWARD_WITHDRAW_GLOBAL_DAILY_MAX.

All external calls (LNNode, config lookups, Celery tasks) are mocked.
No live Lightning node or network is required.
"""

import uuid
from datetime import timedelta
from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.utils import timezone

from api.logics import payout_problem
from api.models import LNPayment, Order, Robot
from django.contrib.auth.models import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_user(earned_rewards=500):
    user = MagicMock(spec=User)
    robot = MagicMock(spec=Robot)
    robot.pk = 1
    robot.earned_rewards = earned_rewards
    robot.claimed_rewards = 0
    user.robot = robot
    return user


def _make_lnpayment(
    concept=LNPayment.Concepts.PAYBUYER,
    num_satoshis=90_000,
    payment_hash=None,
):
    lnp = MagicMock(spec=LNPayment)
    lnp.concept = concept
    lnp.status = LNPayment.Status.FLIGHT
    lnp.num_satoshis = num_satoshis
    lnp.payment_hash = payment_hash or uuid.uuid4().hex
    return lnp


def _make_escrow(
    status=LNPayment.Status.SETLED, num_satoshis=100_000, payment_hash=None
):
    escrow = MagicMock(spec=LNPayment)
    escrow.status = status
    escrow.num_satoshis = num_satoshis
    escrow.payment_hash = payment_hash or uuid.uuid4().hex
    return escrow


def _make_order_for_payout(payout, escrow, order_status=Order.Status.PAY):
    order = MagicMock(spec=Order)
    order.status = order_status
    order.payout = payout
    order.trade_escrow = escrow
    return order


# ---------------------------------------------------------------------------
# payout_problem() gate tests
# ---------------------------------------------------------------------------


class PayoutProblemTest(TestCase):
    """
    payout_problem() must return a non-None reason string in every case
    where the payout must be held, and None on the happy path.
    """

    def _run(
        self,
        lnp,
        order,
        double_check_settled=True,
        double_check_raises=False,
        payout_max=0,
    ):
        def _double_check(_hash):
            if double_check_raises:
                raise RuntimeError("node error")
            return double_check_settled

        def _config(key, **kw):
            if key == "PAYOUT_MAX_SATS":
                return payout_max
            return kw.get("default", None)

        with (
            patch("api.logics.Order.objects") as mock_order_qs,
            patch(
                "api.logics.LNNode.double_check_htlc_is_settled",
                side_effect=_double_check,
            ),
            patch("api.logics.config", side_effect=_config),
        ):
            mock_order_qs.filter.return_value.first.return_value = order
            return payout_problem(lnp)

    def test_not_a_buyer_payout_returns_reason(self):
        lnp = _make_lnpayment(concept=LNPayment.Concepts.MAKEBOND)
        result = payout_problem(lnp)
        self.assertIsNotNone(result)
        self.assertIn("not a buyer payout", result)

    def test_no_order_for_payout_returns_reason(self):
        lnp = _make_lnpayment()
        with patch("api.logics.Order.objects") as mock_qs:
            mock_qs.filter.return_value.first.return_value = None
            result = payout_problem(lnp)
        self.assertIsNotNone(result)
        self.assertIn("no order", result)

    def test_order_wrong_status_returns_reason(self):
        lnp = _make_lnpayment()
        escrow = _make_escrow()
        order = _make_order_for_payout(lnp, escrow, order_status=Order.Status.WF2)
        result = self._run(lnp, order)
        self.assertIsNotNone(result)
        self.assertIn("order status", result)

    def test_escrow_not_settled_returns_reason(self):
        lnp = _make_lnpayment()
        escrow = _make_escrow(status=LNPayment.Status.LOCKED)
        order = _make_order_for_payout(lnp, escrow)
        result = self._run(lnp, order)
        self.assertIsNotNone(result)
        self.assertIn("escrow", result)

    def test_payout_larger_than_escrow_returns_reason(self):
        lnp = _make_lnpayment(num_satoshis=110_000)
        escrow = _make_escrow(num_satoshis=100_000)
        order = _make_order_for_payout(lnp, escrow)
        result = self._run(lnp, order)
        self.assertIsNotNone(result)
        self.assertIn("payout", result)

    def test_payout_over_cap_returns_reason(self):
        lnp = _make_lnpayment(num_satoshis=90_000)
        escrow = _make_escrow(num_satoshis=100_000)
        order = _make_order_for_payout(lnp, escrow)
        result = self._run(lnp, order, payout_max=50_000)
        self.assertIsNotNone(result)
        self.assertIn("PAYOUT_MAX_SATS", result)

    def test_node_says_not_settled_returns_reason(self):
        lnp = _make_lnpayment(num_satoshis=90_000)
        escrow = _make_escrow(num_satoshis=100_000)
        order = _make_order_for_payout(lnp, escrow)
        result = self._run(lnp, order, double_check_settled=False)
        self.assertIsNotNone(result)
        self.assertIn("lightning node", result)

    def test_node_lookup_raises_returns_reason(self):
        lnp = _make_lnpayment(num_satoshis=90_000)
        escrow = _make_escrow(num_satoshis=100_000)
        order = _make_order_for_payout(lnp, escrow)
        result = self._run(lnp, order, double_check_raises=True)
        self.assertIsNotNone(result)
        self.assertIn("could not check", result)

    def test_happy_path_returns_none(self):
        lnp = _make_lnpayment(num_satoshis=90_000)
        escrow = _make_escrow(num_satoshis=100_000)
        order = _make_order_for_payout(lnp, escrow)
        result = self._run(lnp, order)
        self.assertIsNone(result, f"Expected None but got: {result!r}")


# ---------------------------------------------------------------------------
# follow_send_payment task: held-payout behaviour
# ---------------------------------------------------------------------------


class FollowSendPaymentHoldTest(TestCase):
    """
    When payout_problem() returns a non-None reason, follow_send_payment must:
      1. NOT call LNNode.follow_send_payment (no payment attempt).
      2. Push last_routing_time ~one hour into the future.
      3. Write a WARN log to the order exactly once (and skip if already logged).
    """

    def _run_task(self, problem_value, already_logged=False):
        from api.tasks import follow_send_payment

        payment_hash = uuid.uuid4().hex
        lnp = MagicMock(spec=LNPayment)
        lnp.payment_hash = payment_hash
        lnp.num_satoshis = 90_000
        lnp.routing_budget_ppm = 1_000
        lnp.concept = LNPayment.Concepts.PAYBUYER

        order = MagicMock(spec=Order)
        order.logs = "PAYOUT HELD: earlier reason" if already_logged else ""

        saved_routing_times = []

        def _save(update_fields=None):
            if update_fields and "last_routing_time" in update_fields:
                saved_routing_times.append(lnp.last_routing_time)

        lnp.save = _save

        with (
            patch("api.tasks.LNPayment") as mock_lnp_model,
            patch("api.tasks.Order") as mock_order_model,
            patch("api.tasks.payout_problem", return_value=problem_value),
            patch("api.lightning.node.LNNode.follow_send_payment") as mock_ln_pay,
            patch(
                "api.tasks.config", side_effect=lambda k, **kw: kw.get("default", False)
            ),
        ):
            mock_lnp_model.objects.get.return_value = lnp
            mock_order_model.objects.filter.return_value.first.return_value = order

            follow_send_payment(payment_hash)

        return lnp, order, saved_routing_times, mock_ln_pay

    def test_held_payout_does_not_attempt_payment(self):
        _, _, _, mock_ln_pay = self._run_task("the trade escrow is not settled")
        mock_ln_pay.assert_not_called()

    def test_held_payout_pushes_last_routing_time_forward(self):
        before = timezone.now()
        lnp, _, saved_times, _ = self._run_task("payout > escrow")
        self.assertTrue(
            len(saved_times) >= 1, "last_routing_time must be saved at least once"
        )
        last_saved = saved_times[-1]
        self.assertGreater(
            last_saved,
            before + timedelta(minutes=55),
            "last_routing_time must be pushed ~1 hour into the future",
        )

    def test_held_payout_logs_warn_once(self):
        _, order, _, _ = self._run_task("payout over cap")
        order.log.assert_called_once()
        args, kwargs = order.log.call_args
        self.assertIn("PAYOUT HELD", args[0])
        self.assertEqual(kwargs.get("level"), "WARN")

    def test_held_payout_already_logged_does_not_duplicate(self):
        _, order, _, _ = self._run_task("payout over cap", already_logged=True)
        order.log.assert_not_called()


# ---------------------------------------------------------------------------
# withdraw_rewards rate limits
# ---------------------------------------------------------------------------


class WithdrawRewardsRateLimitTest(TestCase):
    """
    REWARD_WITHDRAW_COOLDOWN and REWARD_WITHDRAW_GLOBAL_DAILY_MAX must block
    withdrawals and return a descriptive bad_invoice error when triggered.
    All DB and LN calls are mocked.
    """

    def _make_past_withdrawal(self, sats, seconds_ago):
        w = MagicMock()
        w.num_satoshis = sats
        w.created_at = timezone.now() - timedelta(seconds=seconds_ago)
        return w

    def _run_withdraw(self, user, config_overrides, existing_withdrawals=None):
        from api.logics import Logics

        existing_withdrawals = existing_withdrawals or []

        def _config(key, **kw):
            return config_overrides.get(key, kw.get("default", None))

        lnp = MagicMock(spec=LNPayment)
        lnp.status = LNPayment.Status.VALIDI
        lnp.num_satoshis = user.robot.earned_rewards

        def _refresh(fields=None):
            lnp.status = LNPayment.Status.FAILRO

        lnp.refresh_from_db = _refresh

        validate_result = {
            "valid": True,
            "description": "test",
            "payment_hash": uuid.uuid4().hex,
            "created_at": "2026-01-01T00:00:00Z",
            "expires_at": "2026-01-02T00:00:00Z",
        }

        withdrawals_qs = MagicMock()
        withdrawals_qs.filter.return_value = withdrawals_qs
        withdrawals_qs.order_by.return_value = withdrawals_qs
        withdrawals_qs.first.return_value = (
            existing_withdrawals[0] if existing_withdrawals else None
        )
        withdrawals_qs.aggregate.return_value = {
            "sats": sum(w.num_satoshis for w in existing_withdrawals)
        }
        withdrawals_qs.values_list.return_value = [
            (w.created_at, w.num_satoshis) for w in existing_withdrawals
        ]

        with (
            patch("api.logics.transaction") as mock_tx,
            patch("api.logics.Robot.objects") as mock_robot_qs,
            patch("api.logics.LNPayment.objects") as mock_lnp_qs,
            patch("api.logics.User.objects") as mock_user_qs,
            patch(
                "api.logics.LNNode.validate_ln_invoice", return_value=validate_result
            ),
            patch("api.logics.LNNode.pay_invoice", return_value=(False, "no route")),
            patch("api.logics.config", side_effect=_config),
        ):
            mock_tx.atomic.return_value.__enter__ = MagicMock(return_value=None)
            mock_tx.atomic.return_value.__exit__ = MagicMock(return_value=False)
            mock_robot_qs.select_for_update.return_value.get.return_value = user.robot
            mock_lnp_qs.filter.return_value = withdrawals_qs
            mock_lnp_qs.create.return_value = lnp
            mock_user_qs.get.return_value = MagicMock()

            return Logics.withdraw_rewards(user, "lnbc1test", 0)

    def test_cooldown_blocks_if_last_withdrawal_too_recent(self):
        user = _make_user(earned_rewards=500)
        recent_w = self._make_past_withdrawal(sats=400, seconds_ago=60)

        valid, ctx = self._run_withdraw(
            user,
            config_overrides={
                "REWARD_WITHDRAW_COOLDOWN": 3600,
                "REWARD_WITHDRAW_GLOBAL_DAILY_MAX": 0,
                "PROPORTIONAL_ROUTING_FEE_LIMIT": 0.001,
                "MIN_FLAT_ROUTING_FEE_LIMIT_REWARD": 2,
            },
            existing_withdrawals=[recent_w],
        )

        self.assertFalse(valid)
        self.assertIn("bad_invoice", ctx)
        self.assertIn("withdrew your rewards recently", ctx["bad_invoice"])

    def test_cooldown_allows_if_enough_time_has_passed(self):
        user = _make_user(earned_rewards=500)
        old_w = self._make_past_withdrawal(sats=400, seconds_ago=7200)

        _, ctx = self._run_withdraw(
            user,
            config_overrides={
                "REWARD_WITHDRAW_COOLDOWN": 3600,
                "REWARD_WITHDRAW_GLOBAL_DAILY_MAX": 0,
                "PROPORTIONAL_ROUTING_FEE_LIMIT": 0.001,
                "MIN_FLAT_ROUTING_FEE_LIMIT_REWARD": 2,
            },
            existing_withdrawals=[old_w],
        )
        self.assertNotIn("withdrew your rewards recently", ctx.get("bad_invoice", ""))

    def test_global_daily_max_blocks_when_limit_exceeded(self):
        user = _make_user(earned_rewards=500)
        recent_w = self._make_past_withdrawal(sats=9_800, seconds_ago=3600)

        valid, ctx = self._run_withdraw(
            user,
            config_overrides={
                "REWARD_WITHDRAW_COOLDOWN": 0,
                "REWARD_WITHDRAW_GLOBAL_DAILY_MAX": 10_000,
                "PROPORTIONAL_ROUTING_FEE_LIMIT": 0.001,
                "MIN_FLAT_ROUTING_FEE_LIMIT_REWARD": 2,
            },
            existing_withdrawals=[recent_w],
        )

        self.assertFalse(valid)
        self.assertIn("bad_invoice", ctx)
        self.assertIn("paused", ctx["bad_invoice"])

    def test_global_daily_max_allows_when_room_available(self):
        user = _make_user(earned_rewards=500)
        recent_w = self._make_past_withdrawal(sats=100, seconds_ago=3600)

        _, ctx = self._run_withdraw(
            user,
            config_overrides={
                "REWARD_WITHDRAW_COOLDOWN": 0,
                "REWARD_WITHDRAW_GLOBAL_DAILY_MAX": 10_000,
                "PROPORTIONAL_ROUTING_FEE_LIMIT": 0.001,
                "MIN_FLAT_ROUTING_FEE_LIMIT_REWARD": 2,
            },
            existing_withdrawals=[recent_w],
        )
        self.assertNotIn("paused", ctx.get("bad_invoice", ""))

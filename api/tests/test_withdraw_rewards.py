"""
Unit tests for Logics.withdraw_rewards (M-02 fix).

Verifies that earned_rewards is only restored when the node has confirmed
the payment definitively failed (LNPayment.Status.FAILRO).  Any ambiguous
outcome — stream ended without a final status (status stays VALIDI) or
still in-flight (status FLIGHT, e.g. CLN PENDING) — must NOT restore
rewards, to prevent a double-spend via a second invoice submission.

These tests mock LNNode.pay_invoice and the LNPayment model to avoid
requiring a real Lightning node.
"""

from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase

from api.errors import ERRORS
from api.models import LNPayment, Robot


def _make_user(earned_rewards: int = 500):
    """Create a minimal in-memory user/robot double for testing."""
    user = MagicMock(spec=User)
    robot = MagicMock(spec=Robot)
    robot.pk = 1
    robot.earned_rewards = earned_rewards
    robot.claimed_rewards = 0
    user.robot = robot
    return user


def _make_lnpayment(status=LNPayment.Status.VALIDI, num_satoshis=490):
    """Return a minimal LNPayment-like object."""
    lnp = MagicMock(spec=LNPayment)
    lnp.status = status
    lnp.num_satoshis = num_satoshis
    return lnp


class WithdrawRewardsTest(TestCase):
    """
    Tests for Logics.withdraw_rewards covering the three pay_invoice outcomes.

    The atomic block and DB interactions are mocked so these run without a
    full database / Lightning node.
    """

    def setUp(self):
        self.invoice = "lnbc1..."
        self.routing_budget_ppm = 1000
        self.num_satoshis = 490  # earned_rewards(500) minus routing budget

    def _run_withdraw(self, user, pay_invoice_return, lnpayment_status_after):
        """
        Helper: patches all external calls and runs withdraw_rewards.

        pay_invoice_return     – (paid: bool, failure_reason: str|None)
        lnpayment_status_after – the LNPayment.status value after pay_invoice runs
                                  (simulates what pay_invoice writes to the DB row)
        """
        lnp = _make_lnpayment(
            status=LNPayment.Status.VALIDI,  # initial status
            num_satoshis=self.num_satoshis,
        )

        def fake_refresh_from_db(fields=None):
            # Simulate pay_invoice having updated the status in the DB.
            lnp.status = lnpayment_status_after

        lnp.refresh_from_db = fake_refresh_from_db

        validate_result = {
            "valid": True,
            "description": "test",
            "payment_hash": "abc123",
            "created_at": "2026-01-01T00:00:00Z",
            "expires_at": "2026-01-02T00:00:00Z",
        }

        with (
            patch("api.logics.transaction") as mock_tx,
            patch("api.logics.Robot.objects") as mock_robot_qs,
            patch("api.logics.LNPayment.objects") as mock_lnp_qs,
            patch("api.logics.User.objects") as mock_user_qs,
            patch(
                "api.logics.LNNode.validate_ln_invoice", return_value=validate_result
            ),
            patch("api.logics.LNNode.pay_invoice", return_value=pay_invoice_return),
        ):
            # transaction.atomic() as context manager
            mock_tx.atomic.return_value.__enter__ = MagicMock(return_value=None)
            mock_tx.atomic.return_value.__exit__ = MagicMock(return_value=False)

            # select_for_update().get() returns the robot
            mock_robot_qs.select_for_update.return_value.get.return_value = user.robot

            # LNPayment.objects.create() returns our fake lnpayment
            mock_lnp_qs.create.return_value = lnp

            # User.objects.get() for ESCROW_USERNAME
            mock_user_qs.get.return_value = MagicMock()

            from api.logics import Logics

            return Logics.withdraw_rewards(user, self.invoice, self.routing_budget_ppm)

    # ------------------------------------------------------------------
    # Case 1: payment SUCCEEDED — rewards stay zeroed, claimed_rewards bumped
    # ------------------------------------------------------------------
    def test_succeeded_zeros_rewards_and_credits_claimed(self):
        user = _make_user(earned_rewards=500)
        paid, error = self._run_withdraw(
            user,
            pay_invoice_return=(True, None),
            lnpayment_status_after=LNPayment.Status.SUCCED,
        )

        self.assertTrue(paid)
        self.assertIsNone(error)
        self.assertEqual(user.robot.earned_rewards, 0)
        self.assertEqual(user.robot.claimed_rewards, self.num_satoshis)

    # ------------------------------------------------------------------
    # Case 2: payment definitively FAILED (FAILRO) — rewards restored
    # ------------------------------------------------------------------
    def test_failro_restores_rewards(self):
        user = _make_user(earned_rewards=500)
        paid, error = self._run_withdraw(
            user,
            pay_invoice_return=(False, "no route"),
            lnpayment_status_after=LNPayment.Status.FAILRO,
        )

        self.assertFalse(paid)
        self.assertIn("bad_invoice", error)
        self.assertEqual(error["error_code"], 3005)
        # Rewards must be restored to the routing-budget-trimmed invoice amount.
        self.assertEqual(user.robot.earned_rewards, self.num_satoshis)

    # ------------------------------------------------------------------
    # Case 3: ambiguous — stream ended without final status (status stays
    # VALIDI).  Rewards must NOT be restored (double-spend prevention).
    # ------------------------------------------------------------------
    def test_ambiguous_stream_end_does_not_restore_rewards(self):
        user = _make_user(earned_rewards=500)
        paid, error = self._run_withdraw(
            user,
            pay_invoice_return=(False, "Payment stream ended without a final status"),
            lnpayment_status_after=LNPayment.Status.VALIDI,  # unchanged
        )

        self.assertFalse(paid)
        self.assertIn("bad_invoice", error)
        self.assertEqual(error["error_code"], 3006)
        # The critical assertion: rewards must remain 0.
        self.assertEqual(user.robot.earned_rewards, 0)
        self.assertIn(
            ERRORS[3006],
            error["bad_invoice"],
        )

    # ------------------------------------------------------------------
    # Case 4: CLN PENDING — status is FLIGHT.
    # Rewards must NOT be restored.
    # ------------------------------------------------------------------
    def test_cln_pending_flight_does_not_restore_rewards(self):
        user = _make_user(earned_rewards=500)
        paid, error = self._run_withdraw(
            user,
            pay_invoice_return=(False, "Payment isn't failed (yet)"),
            lnpayment_status_after=LNPayment.Status.FLIGHT,
        )

        self.assertFalse(paid)
        self.assertIn("bad_invoice", error)
        self.assertEqual(error["error_code"], 3006)
        # Rewards must remain at 0 — HTLC is still in-flight.
        self.assertEqual(user.robot.earned_rewards, 0)

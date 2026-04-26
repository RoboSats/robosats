from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from api.logics import ESCROW_USERNAME, Logics
from api.models import LNPayment


class TestRewardWithdrawals(TestCase):
    def setUp(self):
        User.objects.create_user(username=ESCROW_USERNAME)
        self.user = User.objects.create_user(username="rewarded-robot")
        self.user.robot.earned_rewards = 10_000
        self.user.robot.save(update_fields=["earned_rewards"])

    def reward_payout(self):
        return {
            "valid": True,
            "context": None,
            "description": "reward payout",
            "payment_hash": "ab" * 32,
            "created_at": timezone.now(),
            "expires_at": timezone.now() + timedelta(minutes=10),
        }

    @patch("api.logics.LNNode.pay_invoice")
    @patch("api.logics.LNNode.validate_ln_invoice")
    def test_withdraw_rewards_stores_custom_routing_budget(
        self, mock_validate_ln_invoice, mock_pay_invoice
    ):
        mock_validate_ln_invoice.return_value = self.reward_payout()
        mock_pay_invoice.return_value = (True, None)

        valid, context = Logics.withdraw_rewards(self.user, "signed-invoice", 10_000)

        self.assertTrue(valid)
        self.assertIsNone(context)
        mock_validate_ln_invoice.assert_called_once_with(
            "signed-invoice", 9_900, 10_000
        )

        lnpayment = mock_pay_invoice.call_args.args[0]
        self.assertEqual(lnpayment.num_satoshis, 9_900)
        self.assertEqual(lnpayment.routing_budget_ppm, 10_000)
        self.assertEqual(float(lnpayment.routing_budget_sats), 100.0)

        saved_lnpayment = LNPayment.objects.get(payment_hash="ab" * 32)
        self.assertEqual(saved_lnpayment.routing_budget_ppm, 10_000)
        self.assertEqual(float(saved_lnpayment.routing_budget_sats), 100.0)

    @patch("api.logics.LNNode.pay_invoice")
    @patch("api.logics.LNNode.validate_ln_invoice")
    def test_withdraw_rewards_restores_original_balance_when_payment_fails(
        self, mock_validate_ln_invoice, mock_pay_invoice
    ):
        mock_validate_ln_invoice.return_value = self.reward_payout()
        mock_pay_invoice.return_value = (False, "no route")

        valid, context = Logics.withdraw_rewards(self.user, "signed-invoice", 10_000)

        self.assertFalse(valid)
        self.assertEqual(context["error_code"], 3005)
        self.assertEqual(
            context["bad_invoice"],
            "Invoice payment failure: no route",
        )

        self.user.robot.refresh_from_db()
        self.assertEqual(self.user.robot.earned_rewards, 10_000)

        lnpayment = mock_pay_invoice.call_args.args[0]
        self.assertEqual(lnpayment.num_satoshis, 9_900)
        self.assertEqual(lnpayment.routing_budget_ppm, 10_000)
        self.assertEqual(float(lnpayment.routing_budget_sats), 100.0)

    @patch("api.logics.LNNode.pay_invoice")
    @patch("api.logics.LNNode.validate_ln_invoice")
    def test_withdraw_rewards_restores_balance_when_payment_returns_false(
        self, mock_validate_ln_invoice, mock_pay_invoice
    ):
        mock_validate_ln_invoice.return_value = self.reward_payout()
        mock_pay_invoice.return_value = False

        valid, context = Logics.withdraw_rewards(self.user, "signed-invoice", 10_000)

        self.assertFalse(valid)
        self.assertEqual(context["error_code"], 3005)

        self.user.robot.refresh_from_db()
        self.assertEqual(self.user.robot.earned_rewards, 10_000)

    @patch("api.logics.config")
    @patch("api.logics.LNNode.pay_invoice")
    @patch("api.logics.LNNode.validate_ln_invoice")
    def test_withdraw_rewards_keeps_zero_budget_for_zero_ppm(
        self, mock_validate_ln_invoice, mock_pay_invoice, mock_config
    ):
        def config_side_effect(key):
            return {
                "PROPORTIONAL_ROUTING_FEE_LIMIT": 0.001,
                "MIN_FLAT_ROUTING_FEE_LIMIT_REWARD": 2,
            }[key]

        mock_config.side_effect = config_side_effect
        mock_validate_ln_invoice.return_value = self.reward_payout()
        mock_pay_invoice.return_value = (True, None)

        valid, context = Logics.withdraw_rewards(self.user, "signed-invoice", 0)

        self.assertTrue(valid)
        self.assertIsNone(context)
        mock_validate_ln_invoice.assert_called_once_with("signed-invoice", 10_000, 0)

        lnpayment = mock_pay_invoice.call_args.args[0]
        self.assertEqual(lnpayment.num_satoshis, 10_000)
        self.assertEqual(lnpayment.routing_budget_ppm, 0)
        self.assertEqual(float(lnpayment.routing_budget_sats), 0.0)

        saved_lnpayment = LNPayment.objects.get(payment_hash="ab" * 32)
        self.assertEqual(saved_lnpayment.routing_budget_ppm, 0)
        self.assertEqual(float(saved_lnpayment.routing_budget_sats), 0.0)
        mock_config.assert_not_called()

    @patch("api.logics.config")
    @patch("api.logics.LNNode.pay_invoice")
    @patch("api.logics.LNNode.validate_ln_invoice")
    def test_withdraw_rewards_keeps_default_budget_for_legacy_none(
        self, mock_validate_ln_invoice, mock_pay_invoice, mock_config
    ):
        def config_side_effect(key):
            return {
                "PROPORTIONAL_ROUTING_FEE_LIMIT": 0.001,
                "MIN_FLAT_ROUTING_FEE_LIMIT_REWARD": 2,
            }[key]

        mock_config.side_effect = config_side_effect
        mock_validate_ln_invoice.return_value = self.reward_payout()
        mock_pay_invoice.return_value = (True, None)

        valid, context = Logics.withdraw_rewards(self.user, "signed-invoice", None)

        self.assertTrue(valid)
        self.assertIsNone(context)
        mock_validate_ln_invoice.assert_called_once_with("signed-invoice", 10_000, 0)

        lnpayment = mock_pay_invoice.call_args.args[0]
        self.assertEqual(lnpayment.num_satoshis, 10_000)
        self.assertEqual(lnpayment.routing_budget_ppm, 0)
        self.assertEqual(float(lnpayment.routing_budget_sats), 10.0)

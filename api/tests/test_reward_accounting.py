import hashlib
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.contrib import admin
from django.contrib.auth.models import User, update_last_login
from django.test import RequestFactory, TestCase
from django.utils import timezone

from api.admin import OrderAdmin
from api.logics import ESCROW_USERNAME, Logics
from api.models import LNPayment, Order, Robot
from api.serializers import UpdateRobotSerializer
from api.utils import hex_to_base91
from robosats.middleware import RobotTokenSHA256AuthenticationMiddleWare


class RewardAccountingTest(TestCase):
    def setUp(self):
        User.objects.get_or_create(username=ESCROW_USERNAME)
        self.user = User.objects.create(username="reward-robot")
        Robot.objects.filter(pk=self.user.robot.pk).update(earned_rewards=500)
        self.user.robot.refresh_from_db()

    def _withdraw(self, pay_invoice, invoice="first", user=None, budget=20000):
        def validate(invoice, *args, **kwargs):
            now = timezone.now()
            return {
                "valid": True,
                "description": "Reward",
                "payment_hash": hashlib.sha256(invoice.encode()).hexdigest(),
                "created_at": now,
                "expires_at": now + timedelta(hours=1),
            }

        with (
            patch("api.logics.LNNode.validate_ln_invoice", side_effect=validate),
            patch("api.logics.LNNode.pay_invoice", side_effect=pay_invoice),
        ):
            return Logics.withdraw_rewards(user or self.user, invoice, budget)

    @staticmethod
    def _settle(payment, status):
        payment.status = status
        payment.save(update_fields=["status"])
        paid = status == LNPayment.Status.SUCCED
        return paid, None if paid else "no route"

    def _assert_balance(self, user, earned, claimed):
        robot = Robot.objects.get(user=user)
        self.assertEqual(
            (robot.earned_rewards, robot.claimed_rewards), (earned, claimed)
        )

    def test_success_preserves_rewards_earned_during_payment(self):
        def pay(payment):
            Robot.objects.filter(user=self.user).update(earned_rewards=100)
            return self._settle(payment, LNPayment.Status.SUCCED)

        self.assertEqual(self._withdraw(pay), (True, None))
        self._assert_balance(self.user, 100, 490)
        self.assertEqual(self.user.robot.earned_rewards, 100)

    def test_confirmed_failure_adds_refund_to_new_rewards(self):
        def pay(payment):
            Robot.objects.filter(user=self.user).update(earned_rewards=100)
            return self._settle(payment, LNPayment.Status.FAILRO)

        paid, error = self._withdraw(pay)

        self.assertFalse(paid)
        self.assertEqual(error["error_code"], 3005)
        self._assert_balance(self.user, 600, 0)
        self.assertEqual(self.user.robot.earned_rewards, 600)

    def test_ambiguous_outcomes_preserve_new_rewards_without_refunding(self):
        for status in (LNPayment.Status.VALIDI, LNPayment.Status.FLIGHT):
            with self.subTest(status=status):
                Robot.objects.filter(user=self.user).update(earned_rewards=500)

                def pay(payment):
                    Robot.objects.filter(user=self.user).update(earned_rewards=100)
                    return self._settle(payment, status)

                paid, error = self._withdraw(pay, invoice=f"pending-{status}")

                self.assertFalse(paid)
                self.assertEqual(error["error_code"], 3006)
                self._assert_balance(self.user, 100, 0)

    def test_payment_exception_keeps_rewards_reserved(self):
        def pay(payment):
            raise RuntimeError("node unavailable")

        with self.assertRaisesRegex(RuntimeError, "node unavailable"):
            self._withdraw(pay)

        self._assert_balance(self.user, 0, 0)
        self.assertEqual(
            LNPayment.objects.get(invoice="first").status, LNPayment.Status.VALIDI
        )

    def test_pending_withdrawal_cannot_fund_a_second_invoice(self):
        for status in (LNPayment.Status.VALIDI, LNPayment.Status.FLIGHT):
            with self.subTest(status=status):
                Robot.objects.filter(user=self.user).update(earned_rewards=500)

                def pay(payment):
                    return self._settle(payment, status)

                self.assertFalse(self._withdraw(pay, invoice=f"first-{status}")[0])

                paid, error = self._withdraw(pay, invoice=f"second-{status}")

                self.assertFalse(paid)
                self.assertEqual(error["error_code"], 3003)
                self.assertFalse(
                    LNPayment.objects.filter(invoice=f"second-{status}").exists()
                )
                self._assert_balance(self.user, 0, 0)

    def test_login_refresh_does_not_restore_reserved_rewards(self):
        login_user = User.objects.get(pk=self.user.pk)
        self.assertEqual(login_user.robot.earned_rewards, 500)
        self._withdraw(lambda payment: self._settle(payment, LNPayment.Status.FLIGHT))

        update_last_login(None, login_user)

        self._assert_balance(self.user, 0, 0)
        paid, error = self._withdraw(
            lambda payment: self._settle(payment, LNPayment.Status.SUCCED),
            invoice="second",
        )
        self.assertFalse(paid)
        self.assertEqual(error["error_code"], 3003)

    def test_user_save_does_not_overwrite_new_reward_balances(self):
        stale = User.objects.get(pk=self.user.pk)
        self.assertEqual(stale.robot.earned_rewards, 500)
        Robot.objects.filter(user=self.user).update(
            earned_rewards=100, claimed_rewards=490
        )

        stale.save()

        self._assert_balance(self.user, 100, 490)

    def test_new_robot_request_persists_identity_and_keys(self):
        token_hash = "01" * 32
        request = RequestFactory().get(
            "/api/robot/",
            HTTP_AUTHORIZATION=f"Token {hex_to_base91(token_hash)}",
            PUBLIC_KEY="Public public-key",
            ENCRYPTED_PRIVATE_KEY="Private encrypted-key",
            NOSTR_PUBKEY="Nostr " + "ab" * 32,
        )
        response = object()
        middleware = RobotTokenSHA256AuthenticationMiddleWare(lambda request: response)
        with patch(
            "robosats.middleware.validate_pgp_keys",
            return_value=(True, None, "public-key", "encrypted-key"),
        ):
            self.assertIs(middleware(request), response)

        robot = Robot.objects.get(
            hash_id=hashlib.sha256(token_hash.encode()).hexdigest()
        )
        self.assertEqual(robot.public_key, "public-key")
        self.assertEqual(robot.encrypted_private_key, "encrypted-key")
        self.assertEqual(robot.nostr_pubkey, "ab" * 32)
        self.assertIsNotNone(robot.user.last_login)

    def test_later_withdrawal_finishing_first_keeps_both_claimed_totals(self):
        def pay(payment):
            if payment.invoice == "first":
                Robot.objects.filter(user=self.user).update(earned_rewards=100)
                other_user = User.objects.get(pk=self.user.pk)
                self.assertEqual(
                    self._withdraw(pay, invoice="second", user=other_user, budget=0),
                    (True, None),
                )
            return self._settle(payment, LNPayment.Status.SUCCED)

        self.assertEqual(self._withdraw(pay), (True, None))
        self._assert_balance(self.user, 0, 590)

    def test_slashed_credits_ignore_balances_cached_before_reservation(self):
        rewarded = User.objects.get(pk=self.user.pk)
        self.assertEqual(rewarded.robot.earned_rewards, 500)
        slashed = User.objects.create(username="slashed-robot")
        Robot.objects.filter(user=slashed).update(earned_rewards=700)
        cached_slashed = User.objects.get(pk=slashed.pk)
        self.assertEqual(cached_slashed.robot.earned_rewards, 700)
        self._withdraw(
            lambda payment: self._settle(payment, LNPayment.Status.VALIDI),
            invoice="slashed-pending",
            user=slashed,
        )
        slashed_bond = SimpleNamespace(sender=cached_slashed, num_satoshis=500)
        staked_bond = SimpleNamespace(sender=rewarded, num_satoshis=200)
        order = SimpleNamespace(id=1, proceeds=0, save=MagicMock(), log=MagicMock())

        def pay(payment):
            with (
                patch("api.logics.config", return_value=0.5),
                patch("api.logics.send_devfund_donation.delay"),
            ):
                Logics.add_slashed_rewards(order, slashed_bond, staked_bond)
            return self._settle(payment, LNPayment.Status.SUCCED)

        self.assertEqual(self._withdraw(pay), (True, None))
        self._assert_balance(self.user, 100, 490)
        self._assert_balance(slashed, 300, 0)

    def test_admin_return_credits_each_amount_with_stale_repeated_recipient(self):
        maker = User.objects.get(pk=self.user.pk)
        self.assertEqual(maker.robot.earned_rewards, 500)
        taker = User.objects.create(username="taker-robot")
        Robot.objects.filter(user=taker).update(earned_rewards=800)
        cached_taker = User.objects.get(pk=taker.pk)
        self.assertEqual(cached_taker.robot.earned_rewards, 800)
        self._withdraw(
            lambda payment: self._settle(payment, LNPayment.Status.VALIDI),
            invoice="taker-pending",
            user=taker,
        )
        order = SimpleNamespace(
            id=1,
            status=Order.Status.DIS,
            is_disputed=True,
            maker_bond=SimpleNamespace(sender=maker, num_satoshis=100),
            taker_bond=SimpleNamespace(sender=cached_taker, num_satoshis=200),
            trade_escrow=SimpleNamespace(sender=maker, num_satoshis=300),
            update_status=MagicMock(),
        )
        order_admin = OrderAdmin(Order, admin.site)

        def pay(payment):
            with patch.object(order_admin, "message_user"):
                order_admin.return_everything(None, [order])
            return self._settle(payment, LNPayment.Status.SUCCED)

        self.assertEqual(self._withdraw(pay), (True, None))
        self._assert_balance(self.user, 400, 490)
        self._assert_balance(taker, 200, 0)
        order.update_status.assert_called_once_with(Order.Status.CCA)

    def test_partial_and_empty_settings_save_preserve_latest_reward_balances(self):
        for data in ({"webhook_enabled": True}, {}):
            with self.subTest(data=data):
                Robot.objects.filter(user=self.user).update(
                    earned_rewards=500, claimed_rewards=0
                )
                stale = Robot.objects.get(user=self.user)
                Robot.objects.filter(user=self.user).update(
                    earned_rewards=100, claimed_rewards=490
                )
                serializer = UpdateRobotSerializer(stale, data=data, partial=True)

                self.assertTrue(serializer.is_valid(), serializer.errors)
                serializer.save()

                self._assert_balance(self.user, 100, 490)
                self.assertEqual(
                    (stale.earned_rewards, stale.claimed_rewards), (100, 490)
                )

    def test_disjoint_settings_save_preserves_other_concurrent_change(self):
        stale = Robot.objects.get(user=self.user)
        Robot.objects.filter(user=self.user).update(webhook_api_key="new-key")
        serializer = UpdateRobotSerializer(
            stale, data={"webhook_enabled": True}, partial=True
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        robot = Robot.objects.get(user=self.user)
        self.assertTrue(robot.webhook_enabled)
        self.assertEqual(robot.webhook_api_key, "new-key")
        self.assertEqual(serializer.data["webhook_api_key"], "new-key")

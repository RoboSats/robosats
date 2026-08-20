from datetime import timedelta
from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from api.models import LNPayment, Order
from api.management.commands.follow_invoices import Command


class TestFollowInvoices(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="maker", password="password")
        self.escrow_user = User.objects.create_user(username="escrow", password="password")
        
        now = timezone.now()
        # Create escrow payment with SETLED status
        self.escrow_payment = LNPayment.objects.create(
            payment_hash="abc123escrow",
            type=LNPayment.Types.HOLD,
            concept=LNPayment.Concepts.TRESCROW,
            status=LNPayment.Status.SETLED,
            num_satoshis=100000,
            sender=self.user,
            receiver=self.escrow_user,
            created_at=now,
            expires_at=now + timedelta(hours=1),
        )

        # Create payout payment (norm type, FLIGHT status)
        self.payout_payment = LNPayment.objects.create(
            payment_hash="abc123payout",
            type=LNPayment.Types.NORM,
            concept=LNPayment.Concepts.PAYBUYER,
            status=LNPayment.Status.FLIGHT,
            num_satoshis=99000,
            sender=self.escrow_user,
            receiver=self.user,
            created_at=now,
            expires_at=now + timedelta(hours=1),
        )

        # Create order linking escrow and payout
        self.order = Order.objects.create(
            maker=self.user,
            trade_escrow=self.escrow_payment,
            payout=self.payout_payment,
            is_swap=False,
            type=Order.Types.BUY,
            expires_at=now + timedelta(hours=1),
        )

    @patch("api.management.commands.follow_invoices.follow_send_payment")
    def test_send_ln_payments_queues_once(self, mock_follow_send_payment):
        """
        Validates that send_ln_payments enqueues the payment once and updates
        its status to QUEUED, preventing duplicate enqueuing on subsequent polls
        (which would happen in main where status remained FLIGHT).
        """
        command = Command()

        # First run of send_ln_payments
        command.send_ln_payments()

        # Verify task was called once
        mock_follow_send_payment.delay.assert_called_once_with(self.payout_payment.payment_hash)

        # Verify payment status changed to QUEUED
        self.payout_payment.refresh_from_db()
        self.assertEqual(self.payout_payment.status, LNPayment.Status.QUEUED)

        # Second run of send_ln_payments (simulating subsequent poll when workers are stuck)
        mock_follow_send_payment.reset_mock()
        command.send_ln_payments()

        # Verify task was NOT called again (only enqueued once)
        mock_follow_send_payment.delay.assert_not_called()


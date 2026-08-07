"""
Unit tests for the LND pay_invoice return-shape fix.

These tests use mocks — no regtest LN stack is required.
"""
from unittest.mock import MagicMock, patch

from django.test import TestCase

from api.models import LNPayment


class TestPayInvoiceReturnShape(TestCase):
    """Verify LNDNode.pay_invoice always returns a 2-tuple (bool, str|None).

    The sole caller, Logics.withdraw_rewards(), unpacks as:
        paid, failure_reason = LNNode.pay_invoice(lnpayment)
    A bare 'return False' (1-tuple) raises TypeError and bypasses the
    earned_rewards re-credit path, permanently losing the user's sats.
    """

    def _make_mock_lnpayment(self):
        lnp = MagicMock(spec=LNPayment)
        lnp.invoice = "lnbc..."
        lnp.num_satoshis = 1000
        lnp.status = LNPayment.Status.VALIDI
        return lnp

    @patch("api.lightning.lnd.config")
    @patch("api.lightning.lnd.router_pb2_grpc.RouterStub")
    @patch("api.lightning.lnd.lightning_pb2.Payment.PaymentStatus")
    def test_empty_stream_returns_two_tuple(self, mock_status, mock_stub_cls, mock_cfg):
        """When SendPaymentV2 stream ends without a terminal status, return (False, str)."""
        from api.lightning.lnd import LNDNode

        mock_cfg.side_effect = lambda key, **kw: {
            "PROPORTIONAL_ROUTING_FEE_LIMIT": "0.001",
            "MIN_FLAT_ROUTING_FEE_LIMIT_REWARD": "2",
            "REWARDS_TIMEOUT_SECONDS": "30",
        }[key]

        # Stub yields nothing — empty stream
        mock_stub_cls.return_value.SendPaymentV2.return_value = iter([])

        result = LNDNode.pay_invoice(self._make_mock_lnpayment())

        self.assertIsInstance(result, tuple, "pay_invoice must return a tuple")
        self.assertEqual(len(result), 2, "pay_invoice must return a 2-tuple")
        paid, reason = result
        self.assertFalse(paid)
        self.assertIsInstance(reason, str)
        self.assertIn("stream", reason.lower())

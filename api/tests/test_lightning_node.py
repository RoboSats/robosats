"""
Unit tests for Lightning node settle/cancel hold invoice operations.

Covers both LNDNode and CLNNode with mocked gRPC stubs — no real Lightning
node is required.  The tests specifically guard against the CLN race condition
where HoldInvoiceSettle / HoldInvoiceCancel return ACCEPTED state briefly
before the HTLC transition fully propagates, and also document the expected
LND behaviour (empty-string response = success).
"""

import hashlib
from unittest.mock import MagicMock, patch

from django.test import TestCase


# ---------------------------------------------------------------------------
# Helper constants mirroring the proto enums (integer values)
# ---------------------------------------------------------------------------

# CLN hold.proto  Holdstate enum
CLN_STATE_OPEN = 0
CLN_STATE_SETTLED = 1
CLN_STATE_CANCELED = 2
CLN_STATE_ACCEPTED = 3

# LND lightning.proto  Invoice.InvoiceState enum  (same numeric mapping)
LND_STATE_OPEN = 0
LND_STATE_SETTLED = 1
LND_STATE_CANCELED = 2
LND_STATE_ACCEPTED = 3


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

PREIMAGE_HEX = "aa" * 32  # 32 bytes, valid hex preimage
PAYMENT_HASH_HEX = hashlib.sha256(bytes.fromhex(PREIMAGE_HEX)).hexdigest()


# ---------------------------------------------------------------------------
# CLN tests
# ---------------------------------------------------------------------------


class _CLNHoldStubPatcher:
    """
    Mixin that patches hold_pb2_grpc.HoldStub inside api.lightning.cln.
    Subclasses call self._make_stub(lookup_states) to get a (patcher, stub) pair.
    """

    def _make_stub(self, lookup_states):
        """
        Build a mock HoldStub whose HoldInvoiceLookup returns the given
        sequence of states (int), one per call.
        """
        stub_instance = MagicMock()
        stub_instance.HoldInvoiceLookup.side_effect = [
            self._lookup_resp(s) for s in lookup_states
        ]
        stub_cls = MagicMock(return_value=stub_instance)
        patcher = patch("api.lightning.cln.hold_pb2_grpc.HoldStub", stub_cls)
        return patcher, stub_instance

    @staticmethod
    def _lookup_resp(state):
        r = MagicMock()
        r.state = state
        return r


class TestCLNSettleHoldInvoice(TestCase, _CLNHoldStubPatcher):
    """
    CLNNode.settle_hold_invoice polls HoldInvoiceLookup after issuing
    HoldInvoiceSettle to confirm the HTLC reached SETTLED state.
    """

    def _run_settle(self, lookup_states, *, sleep_patch=True):
        patcher, stub = self._make_stub(lookup_states)
        sleep_ctx = (
            patch("api.lightning.cln.time.sleep") if sleep_patch else MagicMock()
        )
        with patcher, sleep_ctx as mock_sleep:
            from api.lightning.cln import CLNNode

            result = CLNNode.settle_hold_invoice(PREIMAGE_HEX)
        return result, stub, mock_sleep

    def test_returns_true_when_settled_immediately(self):
        """No race: first lookup already returns SETTLED."""
        result, stub, mock_sleep = self._run_settle([CLN_STATE_SETTLED])
        self.assertTrue(result)
        self.assertEqual(stub.HoldInvoiceLookup.call_count, 1)
        mock_sleep.assert_not_called()

    def test_returns_true_after_race_condition(self):
        """
        Race condition: two ACCEPTED lookups before SETTLED.
        settle_hold_invoice must still return True.
        """
        result, stub, mock_sleep = self._run_settle(
            [CLN_STATE_ACCEPTED, CLN_STATE_ACCEPTED, CLN_STATE_SETTLED]
        )
        self.assertTrue(result)
        self.assertEqual(stub.HoldInvoiceLookup.call_count, 3)
        self.assertEqual(mock_sleep.call_count, 2)

    def test_returns_false_when_timeout_exhausted(self):
        """All retries return ACCEPTED — settle_hold_invoice must return False."""
        result, stub, _ = self._run_settle([CLN_STATE_ACCEPTED] * 10)
        self.assertFalse(result)
        self.assertEqual(stub.HoldInvoiceLookup.call_count, 10)

    def test_calls_hold_invoice_settle_exactly_once(self):
        """The gRPC settle call must be issued exactly once regardless of retries."""
        _, stub, _ = self._run_settle([CLN_STATE_SETTLED])
        stub.HoldInvoiceSettle.assert_called_once()


class TestCLNCancelReturnHoldInvoice(TestCase, _CLNHoldStubPatcher):
    """
    CLNNode.cancel_return_hold_invoice polls HoldInvoiceLookup after issuing
    HoldInvoiceCancel to confirm the invoice is CANCELED (or was never locked).
    """

    def _run_cancel(self, lookup_states, *, sleep_patch=True):
        patcher, stub = self._make_stub(lookup_states)
        sleep_ctx = (
            patch("api.lightning.cln.time.sleep") if sleep_patch else MagicMock()
        )
        with patcher, sleep_ctx as mock_sleep:
            from api.lightning.cln import CLNNode

            result = CLNNode.cancel_return_hold_invoice(PAYMENT_HASH_HEX)
        return result, stub, mock_sleep

    def test_returns_true_when_canceled_immediately(self):
        """No race: first lookup already returns CANCELED."""
        result, stub, mock_sleep = self._run_cancel([CLN_STATE_CANCELED])
        self.assertTrue(result)
        self.assertEqual(stub.HoldInvoiceLookup.call_count, 1)
        mock_sleep.assert_not_called()

    def test_returns_true_when_invoice_was_never_locked(self):
        """
        OPEN state (invoice never accepted by payer) is treated as a successful
        cancel — no funds were ever at risk.
        """
        result, stub, mock_sleep = self._run_cancel([CLN_STATE_OPEN])
        self.assertTrue(result)
        self.assertEqual(stub.HoldInvoiceLookup.call_count, 1)
        mock_sleep.assert_not_called()

    def test_returns_true_after_race_condition(self):
        """
        Race condition: three ACCEPTED lookups before CANCELED.
        cancel_return_hold_invoice must still return True.
        """
        result, stub, mock_sleep = self._run_cancel(
            [
                CLN_STATE_ACCEPTED,
                CLN_STATE_ACCEPTED,
                CLN_STATE_ACCEPTED,
                CLN_STATE_CANCELED,
            ]
        )
        self.assertTrue(result)
        self.assertEqual(stub.HoldInvoiceLookup.call_count, 4)
        self.assertEqual(mock_sleep.call_count, 3)

    def test_returns_false_when_timeout_exhausted(self):
        """All retries return ACCEPTED — cancel_return_hold_invoice must return False."""
        result, stub, _ = self._run_cancel([CLN_STATE_ACCEPTED] * 10)
        self.assertFalse(result)
        self.assertEqual(stub.HoldInvoiceLookup.call_count, 10)

    def test_returns_false_for_already_settled_invoice(self):
        """
        A SETTLED invoice cannot be cancelled.  The method must return False
        (all retries exhausted without seeing CANCELED or OPEN).
        """
        result, _, _ = self._run_cancel([CLN_STATE_SETTLED] * 10)
        self.assertFalse(result)

    def test_calls_hold_invoice_cancel_exactly_once(self):
        """The gRPC cancel call must be issued exactly once regardless of retries."""
        _, stub, _ = self._run_cancel([CLN_STATE_CANCELED])
        stub.HoldInvoiceCancel.assert_called_once()


# ---------------------------------------------------------------------------
# LND tests
# ---------------------------------------------------------------------------


class _LNDInvoicesStubPatcher:
    """
    Mixin that patches invoices_pb2_grpc.InvoicesStub inside api.lightning.lnd.
    """

    @staticmethod
    def _empty_response():
        """LND signals success with an empty proto response (str == '')."""
        r = MagicMock()
        r.__str__ = lambda self: ""
        return r

    @staticmethod
    def _non_empty_response():
        """LND signals failure / unexpected state with a non-empty response."""
        r = MagicMock()
        r.__str__ = lambda self: "some error"
        return r

    def _make_stub(self, settle_response=None, cancel_response=None):
        stub_instance = MagicMock()
        if settle_response is not None:
            stub_instance.SettleInvoice.return_value = settle_response
        if cancel_response is not None:
            stub_instance.CancelInvoice.return_value = cancel_response
        stub_cls = MagicMock(return_value=stub_instance)
        patcher = patch("api.lightning.lnd.invoices_pb2_grpc.InvoicesStub", stub_cls)
        return patcher, stub_instance


class TestLNDSettleHoldInvoice(TestCase, _LNDInvoicesStubPatcher):
    """
    LNDNode.settle_hold_invoice returns True when SettleInvoice produces an
    empty response (LND's convention for success) and False otherwise.
    """

    def test_returns_true_on_empty_response(self):
        """Empty gRPC response means LND settled the invoice successfully."""
        patcher, stub = self._make_stub(settle_response=self._empty_response())
        with patcher:
            from api.lightning.lnd import LNDNode

            result = LNDNode.settle_hold_invoice(PREIMAGE_HEX)
        self.assertTrue(result)
        stub.SettleInvoice.assert_called_once()

    def test_returns_false_on_non_empty_response(self):
        """Non-empty gRPC response means the settle did not succeed."""
        patcher, stub = self._make_stub(settle_response=self._non_empty_response())
        with patcher:
            from api.lightning.lnd import LNDNode

            result = LNDNode.settle_hold_invoice(PREIMAGE_HEX)
        self.assertFalse(result)

    def test_calls_settle_invoice_exactly_once(self):
        """SettleInvoice must be called exactly once — LND does not need polling."""
        patcher, stub = self._make_stub(settle_response=self._empty_response())
        with patcher:
            from api.lightning.lnd import LNDNode

            LNDNode.settle_hold_invoice(PREIMAGE_HEX)
        stub.SettleInvoice.assert_called_once()


class TestLNDCancelReturnHoldInvoice(TestCase, _LNDInvoicesStubPatcher):
    """
    LNDNode.cancel_return_hold_invoice returns True when CancelInvoice produces
    an empty response (LND's convention for success) and False otherwise.
    """

    def test_returns_true_on_empty_response(self):
        """Empty gRPC response means LND cancelled the invoice successfully."""
        patcher, stub = self._make_stub(cancel_response=self._empty_response())
        with patcher:
            from api.lightning.lnd import LNDNode

            result = LNDNode.cancel_return_hold_invoice(PAYMENT_HASH_HEX)
        self.assertTrue(result)
        stub.CancelInvoice.assert_called_once()

    def test_returns_false_on_non_empty_response(self):
        """Non-empty gRPC response means the cancel did not succeed."""
        patcher, stub = self._make_stub(cancel_response=self._non_empty_response())
        with patcher:
            from api.lightning.lnd import LNDNode

            result = LNDNode.cancel_return_hold_invoice(PAYMENT_HASH_HEX)
        self.assertFalse(result)

    def test_calls_cancel_invoice_exactly_once(self):
        """CancelInvoice must be called exactly once — LND does not need polling."""
        patcher, stub = self._make_stub(cancel_response=self._empty_response())
        with patcher:
            from api.lightning.lnd import LNDNode

            LNDNode.cancel_return_hold_invoice(PAYMENT_HASH_HEX)
        stub.CancelInvoice.assert_called_once()

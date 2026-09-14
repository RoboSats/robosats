"""
Unit tests for Lightning node settle/cancel hold invoice operations.

Covers both LNDNode and CLNNode with mocked gRPC stubs — no real Lightning
node is required.  The tests specifically guard against the CLN race condition
where HoldInvoiceSettle / HoldInvoiceCancel return ACCEPTED state briefly
before the HTLC transition fully propagates, and also document the expected
LND behaviour (empty-string response = success).

CLN imports are isolated via a module-level patch of ``builtins.open`` and
``grpc.ssl_channel_credentials`` so that the cert-file reads that happen at
cln.py module scope never touch the filesystem.
"""

import hashlib
import sys
from io import BytesIO
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
# CLN module-level import helpers
# ---------------------------------------------------------------------------


def _make_cln_import_patches():
    """
    Return a list of patchers that suppress all side-effects triggered when
    ``api.lightning.cln`` is imported for the first time (cert file reads,
    gRPC channel construction).  Apply them with ``contextlib.ExitStack`` or
    ``with`` nesting before importing CLNNode.
    """
    dummy_pem = b"-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----\n"
    mock_open = MagicMock(
        return_value=MagicMock(
            __enter__=lambda s, *a: BytesIO(dummy_pem),
            __exit__=lambda s, *a: False,
            read=lambda: dummy_pem,
        )
    )
    return [
        patch("builtins.open", mock_open),
        patch("grpc.ssl_channel_credentials", return_value=MagicMock()),
        patch("grpc.secure_channel", return_value=MagicMock()),
    ]


# ---------------------------------------------------------------------------
# CLN tests
# ---------------------------------------------------------------------------


class _CLNHoldStubPatcher:
    """
    Mixin — patches hold_pb2_grpc.HoldStub inside api.lightning.cln and
    provides helpers to build mock responses.
    """

    def _make_stub(
        self, cancel_response_state=None, settle_response_state=None, lookup_states=None
    ):
        """
        Build a mock HoldStub.

        cancel_response_state:  Holdstate int returned by HoldInvoiceCancel.
        settle_response_state:  Holdstate int returned by HoldInvoiceSettle.
        lookup_states:          Sequence of Holdstate ints returned by
                                successive HoldInvoiceLookup calls.
        """
        stub_instance = MagicMock()

        if cancel_response_state is not None:
            cancel_resp = MagicMock()
            cancel_resp.state = cancel_response_state
            stub_instance.HoldInvoiceCancel.return_value = cancel_resp

        if settle_response_state is not None:
            settle_resp = MagicMock()
            settle_resp.state = settle_response_state
            stub_instance.HoldInvoiceSettle.return_value = settle_resp

        if lookup_states is not None:
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
    CLNNode.settle_hold_invoice:
    - Fast path: returns True when HoldInvoiceSettle response is SETTLED.
    - Polling path: returns True after polling confirms SETTLED when the
      initial response was still ACCEPTED (race condition).
    - Timeout: returns False when polling never sees SETTLED.
    """

    def _run(self, settle_resp_state, lookup_states=None):
        """Run settle_hold_invoice with mocked stubs; return (result, stub, sleep_mock)."""
        patcher, stub = self._make_stub(
            settle_response_state=settle_resp_state,
            lookup_states=lookup_states or [],
        )
        import_patches = _make_cln_import_patches()
        # Save and restore the original api.lightning.cln module so that
        # subsequent integration tests still get the real CLNNode (not the
        # mocked one we import here).
        original_cln = sys.modules.get("api.lightning.cln")
        sys.modules.pop("api.lightning.cln", None)
        try:
            with patch("time.sleep") as mock_sleep:
                with import_patches[0], import_patches[1], import_patches[2]:
                    with patcher:
                        from api.lightning.cln import CLNNode

                        result = CLNNode.settle_hold_invoice(PREIMAGE_HEX)
        finally:
            # Restore original module (or remove the mocked one if none existed)
            if original_cln is not None:
                sys.modules["api.lightning.cln"] = original_cln
            else:
                sys.modules.pop("api.lightning.cln", None)
        return result, stub, mock_sleep

    def test_fast_path_returns_true_when_settled_in_response(self):
        """Fast path: HoldInvoiceSettle response already says SETTLED."""
        result, stub, mock_sleep = self._run(CLN_STATE_SETTLED)
        self.assertTrue(result)
        stub.HoldInvoiceSettle.assert_called_once()
        stub.HoldInvoiceLookup.assert_not_called()
        mock_sleep.assert_not_called()

    def test_polling_returns_true_after_race_condition(self):
        """
        Race: HoldInvoiceSettle response is ACCEPTED, two polls still ACCEPTED,
        third poll returns SETTLED.
        """
        result, stub, mock_sleep = self._run(
            CLN_STATE_ACCEPTED,
            lookup_states=[CLN_STATE_ACCEPTED, CLN_STATE_ACCEPTED, CLN_STATE_SETTLED],
        )
        self.assertTrue(result)
        self.assertEqual(stub.HoldInvoiceLookup.call_count, 3)
        self.assertEqual(mock_sleep.call_count, 2)

    def test_polling_returns_false_when_timeout_exhausted(self):
        """All 30 polling retries return ACCEPTED — must return False."""
        result, stub, _ = self._run(
            CLN_STATE_ACCEPTED,
            lookup_states=[CLN_STATE_ACCEPTED] * 30,
        )
        self.assertFalse(result)
        self.assertEqual(stub.HoldInvoiceLookup.call_count, 30)

    def test_calls_hold_invoice_settle_exactly_once(self):
        """The gRPC settle call must be issued exactly once."""
        _, stub, _ = self._run(CLN_STATE_SETTLED)
        stub.HoldInvoiceSettle.assert_called_once()


class TestCLNCancelReturnHoldInvoice(TestCase, _CLNHoldStubPatcher):
    """
    CLNNode.cancel_return_hold_invoice:
    - Fast path: returns True when HoldInvoiceCancel response is CANCELED.
    - Fast path: returns True when response is OPEN (invoice never locked).
    - Polling path: returns True after polling confirms CANCELED (race).
    - Exception: if HoldInvoiceCancel throws, falls through to polling.
    - Timeout: returns False when polling never sees CANCELED/OPEN.
    - Already-settled: returns False (cannot cancel a settled invoice).
    """

    def _run(self, cancel_resp_state=None, lookup_states=None, cancel_raises=False):
        patcher, stub = self._make_stub(
            cancel_response_state=cancel_resp_state,
            lookup_states=lookup_states or [],
        )
        if cancel_raises:
            stub.HoldInvoiceCancel.side_effect = Exception("cannot cancel")

        import_patches = _make_cln_import_patches()
        # Save and restore the original api.lightning.cln module so that
        # subsequent integration tests still get the real CLNNode (not the
        # mocked one we import here).
        original_cln = sys.modules.get("api.lightning.cln")
        sys.modules.pop("api.lightning.cln", None)
        try:
            with patch("time.sleep") as mock_sleep:
                with import_patches[0], import_patches[1], import_patches[2]:
                    with patcher:
                        from api.lightning.cln import CLNNode

                        result = CLNNode.cancel_return_hold_invoice(PAYMENT_HASH_HEX)
        finally:
            if original_cln is not None:
                sys.modules["api.lightning.cln"] = original_cln
            else:
                sys.modules.pop("api.lightning.cln", None)
        return result, stub, mock_sleep

    def test_fast_path_returns_true_when_canceled_in_response(self):
        """Fast path: HoldInvoiceCancel response already says CANCELED."""
        result, stub, mock_sleep = self._run(cancel_resp_state=CLN_STATE_CANCELED)
        self.assertTrue(result)
        stub.HoldInvoiceCancel.assert_called_once()
        stub.HoldInvoiceLookup.assert_not_called()
        mock_sleep.assert_not_called()

    def test_fast_path_returns_true_when_invoice_was_never_locked(self):
        """OPEN response (invoice never accepted) is a successful cancel."""
        result, stub, mock_sleep = self._run(cancel_resp_state=CLN_STATE_OPEN)
        self.assertTrue(result)
        stub.HoldInvoiceCancel.assert_called_once()
        stub.HoldInvoiceLookup.assert_not_called()
        mock_sleep.assert_not_called()

    def test_polling_returns_true_after_race_condition(self):
        """
        Race: HoldInvoiceCancel response is ACCEPTED, three polling lookups
        return ACCEPTED, fourth returns CANCELED.
        """
        result, stub, mock_sleep = self._run(
            cancel_resp_state=CLN_STATE_ACCEPTED,
            lookup_states=[
                CLN_STATE_ACCEPTED,
                CLN_STATE_ACCEPTED,
                CLN_STATE_ACCEPTED,
                CLN_STATE_CANCELED,
            ],
        )
        self.assertTrue(result)
        self.assertEqual(stub.HoldInvoiceLookup.call_count, 4)
        self.assertEqual(mock_sleep.call_count, 3)

    def test_falls_through_to_polling_when_cancel_raises(self):
        """
        If HoldInvoiceCancel throws (e.g. CLN rejects cancelling an OPEN
        invoice), the method falls through to lookup polling.
        """
        result, stub, _ = self._run(
            cancel_raises=True,
            lookup_states=[CLN_STATE_ACCEPTED, CLN_STATE_CANCELED],
        )
        self.assertTrue(result)
        self.assertEqual(stub.HoldInvoiceLookup.call_count, 2)

    def test_polling_returns_false_when_timeout_exhausted(self):
        """All 30 polling retries return ACCEPTED — must return False."""
        result, stub, _ = self._run(
            cancel_resp_state=CLN_STATE_ACCEPTED,
            lookup_states=[CLN_STATE_ACCEPTED] * 30,
        )
        self.assertFalse(result)
        self.assertEqual(stub.HoldInvoiceLookup.call_count, 30)

    def test_returns_false_for_already_settled_invoice(self):
        """A SETTLED invoice cannot be cancelled — all retries exhaust."""
        result, _, _ = self._run(
            cancel_resp_state=CLN_STATE_SETTLED,
            lookup_states=[CLN_STATE_SETTLED] * 30,
        )
        self.assertFalse(result)

    def test_calls_hold_invoice_cancel_exactly_once(self):
        """The gRPC cancel call must be issued exactly once."""
        _, stub, _ = self._run(cancel_resp_state=CLN_STATE_CANCELED)
        stub.HoldInvoiceCancel.assert_called_once()


# ---------------------------------------------------------------------------
# LND tests
# ---------------------------------------------------------------------------


class _LNDInvoicesStubPatcher:
    """Mixin — patches invoices_pb2_grpc.InvoicesStub inside api.lightning.lnd."""

    @staticmethod
    def _empty_response():
        """LND signals success with an empty proto response (str(resp) == '')."""
        r = MagicMock()
        r.__str__ = lambda self: ""
        return r

    @staticmethod
    def _non_empty_response():
        """Non-empty response signals failure/unexpected state."""
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
        """SettleInvoice must be called exactly once — LND does not poll."""
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
        """CancelInvoice must be called exactly once — LND does not poll."""
        patcher, stub = self._make_stub(cancel_response=self._empty_response())
        with patcher:
            from api.lightning.lnd import LNDNode

            LNDNode.cancel_return_hold_invoice(PAYMENT_HASH_HEX)
        stub.CancelInvoice.assert_called_once()

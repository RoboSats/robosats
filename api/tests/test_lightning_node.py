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


# ---------------------------------------------------------------------------
# LND — shared helpers for amount-check tests
# ---------------------------------------------------------------------------


def _make_lnd_lnpayment(num_satoshis=100_000, payment_hash=PAYMENT_HASH_HEX):
    """Return a minimal LNPayment-like mock for LND hold-invoice tests."""
    from api.models import LNPayment

    lnp = MagicMock(spec=LNPayment)
    lnp.num_satoshis = num_satoshis
    lnp.payment_hash = payment_hash
    lnp.status = LNPayment.Status.INVGEN
    lnp.expiry_height = 0
    return lnp


def _make_lnd_htlc(amt_msat, expiry_height=800_000):
    """Return a mock InvoiceHTLC proto object."""
    htlc = MagicMock()
    htlc.amt_msat = amt_msat
    htlc.expiry_height = expiry_height
    return htlc


def _make_lnd_lookup_response(state, htlcs):
    """Return a mock LookupInvoiceV2 response."""
    resp = MagicMock()
    resp.state = state
    resp.htlcs = htlcs
    return resp


def _make_lnd_stubs(lnd_state, htlcs):
    """
    Build and return (stub_instance, stub_cls_mock) with LookupInvoiceV2
    and CancelInvoice pre-configured.
    """
    invoices_stub = MagicMock()
    invoices_stub.LookupInvoiceV2.return_value = _make_lnd_lookup_response(
        lnd_state, htlcs
    )
    cancel_resp = MagicMock()
    cancel_resp.__str__ = lambda self: ""  # LND success = empty-string response
    invoices_stub.CancelInvoice.return_value = cancel_resp
    return invoices_stub, MagicMock(return_value=invoices_stub)


# ---------------------------------------------------------------------------
# LND — validate_hold_invoice_locked amount-check tests
# ---------------------------------------------------------------------------


class TestLNDValidateHoldInvoiceLockedAmountCheck(TestCase):
    """
    LNDNode.validate_hold_invoice_locked — defensive amount check.

    When LND reports ACCEPTED but sum(htlc.amt_msat) < invoice value, the
    method must call cancel_return_hold_invoice, set lnpayment.status=CANCEL,
    save the lnpayment, and return False.  When the sum meets or exceeds the
    invoice value it must set LOCKED and return True.
    """

    def _run(self, htlcs, num_satoshis=100_000):
        lnp = _make_lnd_lnpayment(num_satoshis=num_satoshis)
        invoices_stub, stub_cls = _make_lnd_stubs(LND_STATE_ACCEPTED, htlcs)
        with patch("api.lightning.lnd.invoices_pb2_grpc.InvoicesStub", stub_cls):
            from api.lightning.lnd import LNDNode

            result = LNDNode.validate_hold_invoice_locked(lnp)
        return result, lnp, invoices_stub

    def test_underpaid_single_htlc_cancels_and_returns_false(self):
        """Single HTLC with amount < invoice value must trigger cancellation."""
        from api.models import LNPayment

        htlcs = [_make_lnd_htlc(amt_msat=100_000 * 900)]  # 90 000 sat < 100 000 sat
        result, lnp, stub = self._run(htlcs, num_satoshis=100_000)

        self.assertFalse(result)
        stub.CancelInvoice.assert_called_once()
        self.assertEqual(lnp.status, LNPayment.Status.CANCEL)
        lnp.save.assert_called()

    def test_underpaid_single_htlc_does_not_set_locked(self):
        """lnpayment.status must never become LOCKED on underpayment."""
        from api.models import LNPayment

        htlcs = [_make_lnd_htlc(amt_msat=1)]
        _, lnp, _ = self._run(htlcs, num_satoshis=50_000)

        self.assertNotEqual(lnp.status, LNPayment.Status.LOCKED)

    def test_underpaid_mpp_partial_set_cancels(self):
        """MPP HTLC set summing below the invoice value must be cancelled."""
        from api.models import LNPayment

        # Two HTLCs covering only 80 000 sat of a 100 000 sat invoice
        htlcs = [
            _make_lnd_htlc(amt_msat=40_000_000),
            _make_lnd_htlc(amt_msat=40_000_000),
        ]
        result, lnp, stub = self._run(htlcs, num_satoshis=100_000)

        self.assertFalse(result)
        stub.CancelInvoice.assert_called_once()
        self.assertEqual(lnp.status, LNPayment.Status.CANCEL)

    def test_exact_amount_single_htlc_accepts(self):
        """HTLC carrying exactly the invoice value must be accepted."""
        from api.models import LNPayment

        htlcs = [_make_lnd_htlc(amt_msat=100_000 * 1_000)]  # exact msat
        result, lnp, stub = self._run(htlcs, num_satoshis=100_000)

        self.assertTrue(result)
        stub.CancelInvoice.assert_not_called()
        self.assertEqual(lnp.status, LNPayment.Status.LOCKED)
        lnp.save.assert_called()

    def test_overpaid_single_htlc_accepts(self):
        """HTLC carrying more than the invoice value must still be accepted."""
        from api.models import LNPayment

        htlcs = [_make_lnd_htlc(amt_msat=100_000 * 1_001)]  # 1 msat over
        result, lnp, stub = self._run(htlcs, num_satoshis=100_000)

        self.assertTrue(result)
        stub.CancelInvoice.assert_not_called()
        self.assertEqual(lnp.status, LNPayment.Status.LOCKED)

    def test_exact_amount_mpp_set_accepts(self):
        """MPP HTLC set summing exactly to the invoice value must be accepted."""
        from api.models import LNPayment

        htlcs = [
            _make_lnd_htlc(amt_msat=50_000_000),  # 50 000 sat
            _make_lnd_htlc(amt_msat=50_000_000),  # 50 000 sat
        ]
        result, lnp, stub = self._run(htlcs, num_satoshis=100_000)

        self.assertTrue(result)
        stub.CancelInvoice.assert_not_called()
        self.assertEqual(lnp.status, LNPayment.Status.LOCKED)


# ---------------------------------------------------------------------------
# LND — lookup_invoice_status amount-check tests
# ---------------------------------------------------------------------------


class TestLNDLookupInvoiceStatusAmountCheck(TestCase):
    """
    LNDNode.lookup_invoice_status — defensive amount check on ACCEPTED state.

    When LookupInvoiceV2 returns ACCEPTED but sum(htlc.amt_msat) < invoice
    value, the method must call cancel_return_hold_invoice and return
    status=CANCEL.  When the sum is sufficient, status must be LOCKED.
    Non-ACCEPTED states (OPEN, SETTLED, CANCELED) must pass through unchanged
    without any cancellation.
    """

    def _run(self, htlcs, num_satoshis=100_000, lnd_state=LND_STATE_ACCEPTED):
        lnp = _make_lnd_lnpayment(num_satoshis=num_satoshis)
        invoices_stub, stub_cls = _make_lnd_stubs(lnd_state, htlcs)
        with patch("api.lightning.lnd.invoices_pb2_grpc.InvoicesStub", stub_cls):
            from api.lightning.lnd import LNDNode

            status, expiry_height = LNDNode.lookup_invoice_status(lnp)
        return status, expiry_height, invoices_stub

    def test_underpaid_single_htlc_returns_cancel(self):
        """Underpaid ACCEPTED invoice must be cancelled; returned status is CANCEL."""
        from api.models import LNPayment

        # 50 000 sat locked against a 100 000 sat invoice
        htlcs = [_make_lnd_htlc(amt_msat=50_000_000)]
        status, _, stub = self._run(htlcs, num_satoshis=100_000)

        self.assertEqual(status, LNPayment.Status.CANCEL)
        stub.CancelInvoice.assert_called_once()

    def test_underpaid_mpp_partial_set_returns_cancel(self):
        """MPP set summing below invoice value must be cancelled."""
        from api.models import LNPayment

        htlcs = [
            _make_lnd_htlc(amt_msat=30_000_000),
            _make_lnd_htlc(amt_msat=30_000_000),
        ]
        status, _, stub = self._run(htlcs, num_satoshis=100_000)

        self.assertEqual(status, LNPayment.Status.CANCEL)
        stub.CancelInvoice.assert_called_once()

    def test_exact_amount_htlc_returns_locked(self):
        """Exact-amount HTLC must yield LOCKED status without cancellation."""
        from api.models import LNPayment

        htlcs = [_make_lnd_htlc(amt_msat=100_000 * 1_000)]
        status, _, stub = self._run(htlcs, num_satoshis=100_000)

        self.assertEqual(status, LNPayment.Status.LOCKED)
        stub.CancelInvoice.assert_not_called()

    def test_overpaid_htlc_returns_locked(self):
        """Over-payment must yield LOCKED status without cancellation."""
        from api.models import LNPayment

        htlcs = [_make_lnd_htlc(amt_msat=100_000 * 1_001)]
        status, _, stub = self._run(htlcs, num_satoshis=100_000)

        self.assertEqual(status, LNPayment.Status.LOCKED)
        stub.CancelInvoice.assert_not_called()

    def test_exact_mpp_set_returns_locked(self):
        """MPP HTLC set summing exactly to invoice value must yield LOCKED."""
        from api.models import LNPayment

        htlcs = [
            _make_lnd_htlc(amt_msat=50_000_000),
            _make_lnd_htlc(amt_msat=50_000_000),
        ]
        status, _, stub = self._run(htlcs, num_satoshis=100_000)

        self.assertEqual(status, LNPayment.Status.LOCKED)
        stub.CancelInvoice.assert_not_called()

    def test_open_state_not_affected(self):
        """OPEN state must be returned as INVGEN; amount check must not run."""
        from api.models import LNPayment

        status, _, stub = self._run(htlcs=[], lnd_state=LND_STATE_OPEN)

        self.assertEqual(status, LNPayment.Status.INVGEN)
        stub.CancelInvoice.assert_not_called()

    def test_settled_state_not_affected(self):
        """SETTLED state must be returned as SETLED; amount check must not run."""
        from api.models import LNPayment

        status, _, stub = self._run(htlcs=[], lnd_state=LND_STATE_SETTLED)

        self.assertEqual(status, LNPayment.Status.SETLED)
        stub.CancelInvoice.assert_not_called()

    def test_canceled_state_not_affected(self):
        """CANCELED state must be returned as CANCEL; no second cancellation."""
        from api.models import LNPayment

        status, _, stub = self._run(htlcs=[], lnd_state=LND_STATE_CANCELED)

        self.assertEqual(status, LNPayment.Status.CANCEL)
        stub.CancelInvoice.assert_not_called()

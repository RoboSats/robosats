"""
Unit tests for ROBO-006 fixes — atomic onchain payout and serialized liquidity check.

Bug 1 (pay_onchain double-broadcast):
    LNDNode.pay_onchain / CLNNode.pay_onchain previously checked the status on
    a stale in-memory object after a sleep, making it possible for two concurrent
    processes to both broadcast the same payment.  The fix uses an atomic DB
    UPDATE (filter(pk=..., status=QUEUE).update(status=MEMPO)) and only
    broadcasts when that UPDATE returns claimed == 1.

Bug 2 (create_onchain_payment liquidity overcommit):
    Logics.create_onchain_payment previously read pending_txs without holding
    any lock, letting two concurrent takers both pass the availability check and
    both commit against the same UTXOs.  The fix wraps the check in
    transaction.atomic() + select_for_update().

Tests run without a real Lightning node — all external calls are mocked.
"""

import contextlib
from io import BytesIO
from unittest.mock import MagicMock, patch

from django.test import TestCase


QUEUE_CODE = 5  # OnchainPayment.Status.QUEUE
MEMPO_CODE = 2  # OnchainPayment.Status.MEMPO


def _make_onchain_payment(status=QUEUE_CODE, pk=42, sent_satoshis=100_000):
    """Return a lightweight mock that looks like an OnchainPayment instance."""
    op = MagicMock()
    op.pk = pk
    op.status = status
    op.sent_satoshis = sent_satoshis
    op.mining_fee_rate = 5
    op.address = "bc1qfixedaddress"
    op.txid = None
    op.broadcasted = False
    op.order_paid_TX.id = 7
    return op


def _make_qs_update(claimed):
    """Return (filter_mock, qs) where qs.update() returns `claimed`."""
    qs = MagicMock()
    qs.update.return_value = claimed
    filter_mock = MagicMock(return_value=qs)
    return filter_mock, qs


def _cln_import_patches():
    """Suppress cert-file reads that happen at cln.py module scope."""
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
# LND pay_onchain tests
# ---------------------------------------------------------------------------


class TestLNDPayOnchainAtomicClaim(TestCase):
    """LNDNode.pay_onchain must atomically claim via DB UPDATE before broadcasting."""

    def _run(self, onchainpayment, claimed, send_coins_response=None):
        filter_mock, qs = _make_qs_update(claimed)
        stub_instance = MagicMock()
        if send_coins_response is not None:
            stub_instance.SendCoins.return_value = send_coins_response

        with (
            patch("api.lightning.lnd.DISABLE_ONCHAIN", False),
            patch("api.lightning.lnd.MAX_SWAP_AMOUNT", 10_000_000),
            patch("api.lightning.lnd.time.sleep"),
            patch("api.lightning.lnd.config", return_value=True),
            patch("api.models.OnchainPayment.objects.filter", filter_mock),
            patch(
                "api.lightning.lnd.lightning_pb2_grpc.LightningStub",
                return_value=stub_instance,
            ),
            patch("api.lightning.lnd.log"),
        ):
            from api.lightning.lnd import LNDNode

            result = LNDNode.pay_onchain(
                onchainpayment, queue_code=QUEUE_CODE, on_mempool_code=MEMPO_CODE
            )
        return result, stub_instance.SendCoins.call_count

    def test_winner_broadcasts_and_returns_true(self):
        """UPDATE returns 1 → SendCoins called, True returned."""
        op = _make_onchain_payment()
        response = MagicMock()
        response.txid = "abc123"
        result, count = self._run(op, claimed=1, send_coins_response=response)
        self.assertTrue(result)
        self.assertEqual(count, 1)

    def test_loser_does_not_broadcast_and_returns_false(self):
        """UPDATE returns 0 → SendCoins NOT called, False returned."""
        op = _make_onchain_payment()
        result, count = self._run(op, claimed=0)
        self.assertFalse(result)
        self.assertEqual(count, 0)

    def test_update_targets_correct_pk_and_statuses(self):
        """filter must use pk and QUEUE status; update must target MEMPO."""
        op = _make_onchain_payment(pk=99)
        filter_mock, qs = _make_qs_update(0)

        with (
            patch("api.lightning.lnd.DISABLE_ONCHAIN", False),
            patch("api.lightning.lnd.MAX_SWAP_AMOUNT", 10_000_000),
            patch("api.lightning.lnd.time.sleep"),
            patch("api.lightning.lnd.config", return_value=True),
            patch("api.models.OnchainPayment.objects.filter", filter_mock),
            patch("api.lightning.lnd.lightning_pb2_grpc.LightningStub", MagicMock()),
            patch("api.lightning.lnd.log"),
        ):
            from api.lightning.lnd import LNDNode

            LNDNode.pay_onchain(op, queue_code=QUEUE_CODE, on_mempool_code=MEMPO_CODE)

        filter_mock.assert_called_once_with(pk=99, status=QUEUE_CODE)
        qs.update.assert_called_once_with(status=MEMPO_CODE)

    def test_disabled_onchain_short_circuits_before_db(self):
        """DISABLE_ONCHAIN=True must return False without touching the DB."""
        op = _make_onchain_payment()
        filter_mock, _ = _make_qs_update(1)

        with (
            patch("api.lightning.lnd.DISABLE_ONCHAIN", True),
            patch("api.models.OnchainPayment.objects.filter", filter_mock),
        ):
            from api.lightning.lnd import LNDNode

            result = LNDNode.pay_onchain(op)

        self.assertFalse(result)
        filter_mock.assert_not_called()

    def test_sleep_skipped_in_testing_mode(self):
        """When TESTING=True, time.sleep must not be called."""
        op = _make_onchain_payment()
        filter_mock, _ = _make_qs_update(0)
        sleep_mock = MagicMock()

        def fake_config(key, **kw):
            if key == "TESTING":
                return True
            return kw.get("default", False)

        with (
            patch("api.lightning.lnd.DISABLE_ONCHAIN", False),
            patch("api.lightning.lnd.MAX_SWAP_AMOUNT", 10_000_000),
            patch("api.lightning.lnd.time.sleep", sleep_mock),
            patch("api.lightning.lnd.config", side_effect=fake_config),
            patch("api.models.OnchainPayment.objects.filter", filter_mock),
            patch("api.lightning.lnd.lightning_pb2_grpc.LightningStub", MagicMock()),
            patch("api.lightning.lnd.log"),
        ):
            from api.lightning.lnd import LNDNode

            LNDNode.pay_onchain(op)

        sleep_mock.assert_not_called()


# ---------------------------------------------------------------------------
# CLN pay_onchain tests
# ---------------------------------------------------------------------------


class TestCLNPayOnchainAtomicClaim(TestCase):
    """CLNNode.pay_onchain must use the same atomic-claim pattern as LNDNode."""

    def _run(self, onchainpayment, claimed, withdraw_response=None):
        filter_mock, qs = _make_qs_update(claimed)
        stub_instance = MagicMock()
        if withdraw_response is not None:
            stub_instance.Withdraw.return_value = withdraw_response

        patches = _cln_import_patches() + [
            patch("api.lightning.cln.DISABLE_ONCHAIN", False),
            patch("api.lightning.cln.MAX_SWAP_AMOUNT", 10_000_000),
            patch("api.lightning.cln.time.sleep"),
            patch("api.lightning.cln.config", return_value=True),
            patch("api.models.OnchainPayment.objects.filter", filter_mock),
            patch(
                "api.lightning.cln.node_pb2_grpc.NodeStub",
                return_value=stub_instance,
            ),
        ]
        with contextlib.ExitStack() as stack:
            for p in patches:
                stack.enter_context(p)
            from api.lightning.cln import CLNNode

            result = CLNNode.pay_onchain(
                onchainpayment, queue_code=QUEUE_CODE, on_mempool_code=MEMPO_CODE
            )
        return result, stub_instance.Withdraw.call_count

    def test_winner_broadcasts_and_returns_true(self):
        """UPDATE returns 1 → Withdraw called, True returned."""
        op = _make_onchain_payment()
        response = MagicMock()
        response.txid = bytes.fromhex("ab" * 32)
        result, count = self._run(op, claimed=1, withdraw_response=response)
        self.assertTrue(result)
        self.assertEqual(count, 1)

    def test_loser_does_not_broadcast_and_returns_false(self):
        """UPDATE returns 0 → Withdraw NOT called, False returned."""
        op = _make_onchain_payment()
        result, count = self._run(op, claimed=0)
        self.assertFalse(result)
        self.assertEqual(count, 0)

    def test_update_targets_correct_pk_and_statuses(self):
        """filter must use pk and QUEUE status; update must target MEMPO."""
        op = _make_onchain_payment(pk=55)
        filter_mock, qs = _make_qs_update(0)

        patches = _cln_import_patches() + [
            patch("api.lightning.cln.DISABLE_ONCHAIN", False),
            patch("api.lightning.cln.MAX_SWAP_AMOUNT", 10_000_000),
            patch("api.lightning.cln.time.sleep"),
            patch("api.lightning.cln.config", return_value=True),
            patch("api.models.OnchainPayment.objects.filter", filter_mock),
            patch("api.lightning.cln.node_pb2_grpc.NodeStub", MagicMock()),
        ]
        with contextlib.ExitStack() as stack:
            for p in patches:
                stack.enter_context(p)
            from api.lightning.cln import CLNNode

            CLNNode.pay_onchain(op, queue_code=QUEUE_CODE, on_mempool_code=MEMPO_CODE)

        filter_mock.assert_called_once_with(pk=55, status=QUEUE_CODE)
        qs.update.assert_called_once_with(status=MEMPO_CODE)

    def test_disabled_onchain_short_circuits_before_db(self):
        """DISABLE_ONCHAIN=True must return False without touching the DB."""
        op = _make_onchain_payment()
        filter_mock, _ = _make_qs_update(1)

        patches = _cln_import_patches() + [
            patch("api.lightning.cln.DISABLE_ONCHAIN", True),
            patch("api.models.OnchainPayment.objects.filter", filter_mock),
        ]
        with contextlib.ExitStack() as stack:
            for p in patches:
                stack.enter_context(p)
            from api.lightning.cln import CLNNode

            result = CLNNode.pay_onchain(op)

        self.assertFalse(result)
        filter_mock.assert_not_called()


# ---------------------------------------------------------------------------
# Logics.create_onchain_payment serialized liquidity check
# ---------------------------------------------------------------------------


class TestCreateOnchainPaymentLiquidityLock(TestCase):
    """
    Logics.create_onchain_payment must wrap the pending-txs aggregate in
    transaction.atomic() + select_for_update() so that concurrent callers
    cannot both overcommit the same confirmed UTXOs.
    """

    def _run_create(self, preliminary_amount, confirmed=5_000_000, pending_sum=0):
        """
        Patch all ORM calls and invoke Logics.create_onchain_payment.
        Returns (result, select_for_update_called, atomic_entered).
        """
        aggregate_result = {"num_satoshis__sum": pending_sum if pending_sum else None}
        qs_after_filter = MagicMock()
        qs_after_filter.aggregate.return_value = aggregate_result
        qs_after_sfu = MagicMock()
        qs_after_sfu.filter.return_value = qs_after_filter
        sfu_mock = MagicMock(return_value=qs_after_sfu)

        balance = MagicMock()
        balance.onchain_confirmed = confirmed
        onchain_payment_instance = MagicMock()
        onchain_payment_instance.balance = balance
        onchain_payment_instance.pk = 1
        onchain_payment_instance.id = 1

        atomic_entered = []

        class _FakeAtomic:
            def __enter__(self):
                atomic_entered.append(True)
                return self

            def __exit__(self, *a):
                return False

        order = MagicMock()
        order.payout_tx = onchain_payment_instance
        order.payout_tx.id = 1

        with (
            patch("api.logics.OnchainPayment.objects.select_for_update", sfu_mock),
            patch(
                "api.logics.OnchainPayment.objects.create",
                return_value=onchain_payment_instance,
            ),
            patch("api.logics.transaction.atomic", return_value=_FakeAtomic()),
            patch("api.logics.get_minning_fee", return_value=10),
        ):
            from api.logics import Logics

            result = Logics.create_onchain_payment(
                order, MagicMock(), preliminary_amount
            )

        return result, sfu_mock.called, bool(atomic_entered)

    def test_sufficient_balance_returns_true(self):
        """confirmed - reserve - pending > amount → True."""
        # available = 5_000_000 - 300_000 - 0 = 4_700_000
        result, _, _ = self._run_create(1_000_000, confirmed=5_000_000, pending_sum=0)
        self.assertTrue(result)

    def test_insufficient_balance_returns_false(self):
        """confirmed - reserve - pending < amount → False."""
        # available = 500_000 - 300_000 - 0 = 200_000 < 300_000
        result, _, _ = self._run_create(300_000, confirmed=500_000, pending_sum=0)
        self.assertFalse(result)

    def test_pending_txs_reduce_available_balance(self):
        """Large pending_txs should push available negative → False."""
        # available = 2_000_000 - 300_000 - 1_800_000 = -100_000 < 100_000
        result, _, _ = self._run_create(
            100_000, confirmed=2_000_000, pending_sum=1_800_000
        )
        self.assertFalse(result)

    def test_select_for_update_is_called(self):
        """select_for_update() must be used to serialize concurrent calls."""
        _, sfu_called, _ = self._run_create(1_000_000, confirmed=5_000_000)
        self.assertTrue(sfu_called, "select_for_update() was not called")

    def test_transaction_atomic_is_entered(self):
        """The check-and-create block must run inside transaction.atomic()."""
        _, _, atomic_used = self._run_create(1_000_000, confirmed=5_000_000)
        self.assertTrue(atomic_used, "transaction.atomic() context was not entered")

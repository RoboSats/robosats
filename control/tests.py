from unittest.mock import Mock

from django.test import TestCase

from control.tasks import outstanding_payout_sats


class TestOutstandingPayoutSats(TestCase):
    """
    Regression tests for the payout resolution used by do_accounting() when
    summing the Sats held by orders that are still in dispute.
    """

    def _make_order(self, is_swap, payout_sats=None, payout_tx_sats=None):
        order = Mock()
        order.is_swap = is_swap
        order.payout = None if payout_sats is None else Mock(num_satoshis=payout_sats)
        order.payout_tx = (
            None if payout_tx_sats is None else Mock(num_satoshis=payout_tx_sats)
        )
        return order

    def test_lightning_order_reads_payout(self):
        """
        A regular order pays out over Lightning, so payout is what counts
        """
        order = self._make_order(is_swap=False, payout_sats=90_000)

        self.assertEqual(outstanding_payout_sats(order), 90_000)

    def test_swap_order_reads_payout_tx(self):
        """
        A swap order never populates payout; the onchain payout_tx is what counts.
        Reading payout here used to raise AttributeError and abort do_accounting()
        """
        order = self._make_order(is_swap=True, payout_tx_sats=80_000)

        self.assertEqual(outstanding_payout_sats(order), 80_000)

    def test_swap_order_ignores_stale_lightning_payout(self):
        """
        is_swap decides, not the mere presence of an object
        """
        order = self._make_order(
            is_swap=True, payout_sats=90_000, payout_tx_sats=80_000
        )

        self.assertEqual(outstanding_payout_sats(order), 80_000)

    def test_lightning_order_ignores_speculative_payout_tx(self):
        """
        payout_tx is created speculatively while quoting a swap, so a non-swap
        order can carry one. It must not be preferred over the Lightning payout
        """
        order = self._make_order(
            is_swap=False, payout_sats=90_000, payout_tx_sats=80_000
        )

        self.assertEqual(outstanding_payout_sats(order), 90_000)

    def test_missing_payout_returns_none(self):
        """
        An order with no payout method submitted yet is skipped, not fatal
        """
        self.assertIsNone(outstanding_payout_sats(self._make_order(is_swap=False)))
        self.assertIsNone(outstanding_payout_sats(self._make_order(is_swap=True)))

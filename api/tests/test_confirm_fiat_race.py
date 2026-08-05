"""
Regression tests for F26 — confirm_fiat / open_dispute TOCTOU race.

The three invariants the coordinator MUST guarantee after the fix:
  1. Seller's maker bond is NEVER silently settled-and-kept after confirm_fiat.
     If a dispute ran concurrently, confirm_fiat must abort — not pay.
  2. Buyer's payout invoice is paid EXACTLY ONCE across both paths.
     A dispute followed immediately by a confirm_fiat must not double-pay.
  3. confirm_fiat and open_dispute cannot both return (True, None).
     One must abort with an error; both winning is the smoking-gun state.

Two test variants:
  A) Deterministic: simulate the mid-flight race window by running open_dispute
     to completion, then calling confirm_fiat as if it had already passed the
     initial status check (i.e., passing an order whose status is still CHA
     in memory but DIS in the DB after the dispute committed).
  B) Unit: mock the DB lock and status re-read to verify the abort path is
     exercised correctly without needing a live DB transaction.
"""

import threading
from unittest.mock import MagicMock, patch, call

from django.test import TestCase

from api.models import Order, LNPayment


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_order_mock(order_id=99, status=Order.Status.CHA, is_fiat_sent=True):
    """Return a minimal Order-like mock for use in pure-logic unit tests."""
    order = MagicMock()
    order.pk = order_id
    order.id = order_id
    order.status = status
    order.is_fiat_sent = is_fiat_sent
    order.reverted_fiat_sent = False
    order.is_swap = False

    # Bonds
    order.maker_bond = MagicMock()
    order.maker_bond.num_satoshis = 3000
    order.maker_bond.status = LNPayment.Status.LOCKED
    order.maker_bond.payment_hash = "aa" * 32

    order.taker_bond = MagicMock()
    order.taker_bond.num_satoshis = 3000
    order.taker_bond.status = LNPayment.Status.LOCKED
    order.taker_bond.payment_hash = "bb" * 32

    # Trade escrow
    order.trade_escrow = MagicMock()
    order.trade_escrow.num_satoshis = 55000  # > payout
    order.trade_escrow.status = LNPayment.Status.LOCKED
    order.trade_escrow.preimage = "cc" * 32
    order.trade_escrow.payment_hash = "dd" * 32

    # Payout
    order.payout = MagicMock()
    order.payout.num_satoshis = 50000
    order.payout.status = LNPayment.Status.VALIDI
    order.payout.routing_budget_sats = 0

    return order


def _make_user_mock(is_buyer=False, is_seller=True):
    user = MagicMock()
    user.username = "TestSeller"
    user.robot = MagicMock()
    user.robot.id = 1
    return user


# ---------------------------------------------------------------------------
# Variant B — unit tests using mocks (no DB, no LN node)
# ---------------------------------------------------------------------------
class TestConfirmFiatAbortOnConcurrentDispute(TestCase):
    """
    Unit test: confirm_fiat seller path must abort when the order has been
    moved to DIS by a concurrent open_dispute between the outer status check
    and the inner lock acquisition (simulated via mock).
    """

    @patch("api.logics.Logics.settle_escrow")
    @patch("api.logics.Logics.is_seller", return_value=True)
    @patch("api.logics.Logics.is_buyer", return_value=False)
    @patch("api.logics.LNNode")
    @patch("api.logics.Order.objects")
    def test_confirm_fiat_aborts_when_order_moved_to_DIS(
        self,
        mock_order_objects,
        mock_lnnode,
        mock_is_buyer,
        mock_is_seller,
        mock_settle_escrow,
    ):
        """
        Invariant #3: If by the time select_for_update re-reads the order it is
        already in DIS status, confirm_fiat must return (False, error) and must
        NOT call settle_escrow or pay_buyer.
        """
        from api.logics import Logics

        order = _make_order_mock(status=Order.Status.CHA, is_fiat_sent=True)
        user = _make_user_mock(is_seller=True)

        # Simulate: locked_order came back with DIS status (dispute won the race)
        locked_order_mock = MagicMock()
        locked_order_mock.status = Order.Status.DIS
        locked_order_mock.is_fiat_sent = True

        select_for_update_mock = MagicMock()
        select_for_update_mock.get.return_value = locked_order_mock
        mock_order_objects.select_for_update.return_value = select_for_update_mock

        valid, context = Logics.confirm_fiat(order, user)

        # Must abort
        self.assertFalse(valid)
        # Must NOT have settled escrow
        mock_settle_escrow.assert_not_called()
        # Must NOT have called pay_buyer (no payout status change)
        self.assertNotEqual(order.payout.status, LNPayment.Status.FLIGHT)

    @patch("api.logics.Logics.is_seller", return_value=True)
    @patch("api.logics.Logics.is_buyer", return_value=False)
    @patch("api.logics.LNNode")
    @patch("api.logics.Order.objects")
    def test_confirm_fiat_aborts_when_bonds_already_settled(
        self,
        mock_order_objects,
        mock_lnnode,
        mock_is_buyer,
        mock_is_seller,
    ):
        """
        Invariant #1: If bonds are already SETLED when confirm_fiat tries to
        return them, confirm_fiat must detect this and abort the payout.
        """
        from api.logics import Logics

        order = _make_order_mock(status=Order.Status.FSE, is_fiat_sent=True)
        user = _make_user_mock(is_seller=True)

        # The locked order re-read shows order still in FSE (dispute didn't commit yet)
        locked_order_mock = MagicMock()
        locked_order_mock.status = Order.Status.FSE
        locked_order_mock.is_fiat_sent = True

        select_for_update_mock = MagicMock()
        select_for_update_mock.get.return_value = locked_order_mock
        mock_order_objects.select_for_update.return_value = select_for_update_mock

        # settle_escrow succeeds
        with patch("api.logics.Logics.settle_escrow", return_value=True):
            # double_check confirms escrow settled
            mock_lnnode.double_check_htlc_is_settled.return_value = True

            # return_bond leaves both bonds as SETLED (dispute already settled them)
            # This simulates the race amplifier path
            def return_bond_sets_settled(bond):
                bond.status = LNPayment.Status.SETLED
                bond.save()
                return True

            with patch("api.logics.Logics.return_bond", side_effect=return_bond_sets_settled):
                valid, context = Logics.confirm_fiat(order, user)

        # Must abort — at least one bond was already settled by the dispute
        self.assertFalse(valid)

    @patch("api.logics.Logics.is_seller", return_value=True)
    @patch("api.logics.Logics.is_buyer", return_value=False)
    @patch("api.logics.LNNode")
    @patch("api.logics.Order.objects")
    def test_confirm_fiat_proceeds_normally_without_race(
        self,
        mock_order_objects,
        mock_lnnode,
        mock_is_buyer,
        mock_is_seller,
    ):
        """
        Happy path: confirm_fiat succeeds when no concurrent dispute.
        """
        from api.logics import Logics

        order = _make_order_mock(status=Order.Status.FSE, is_fiat_sent=True)
        user = _make_user_mock(is_seller=True)

        # Locked order still in FSE (no race)
        locked_order_mock = MagicMock()
        locked_order_mock.status = Order.Status.FSE
        locked_order_mock.is_fiat_sent = True

        select_for_update_mock = MagicMock()
        select_for_update_mock.get.return_value = locked_order_mock
        mock_order_objects.select_for_update.return_value = select_for_update_mock

        with patch("api.logics.Logics.settle_escrow", return_value=True):
            mock_lnnode.double_check_htlc_is_settled.return_value = True

            def return_bond_sets_retned(bond):
                bond.status = LNPayment.Status.RETNED
                bond.save()
                return True

            with patch("api.logics.Logics.return_bond", side_effect=return_bond_sets_retned):
                with patch("api.logics.Logics.pay_buyer", return_value=True) as mock_pay:
                    with patch("api.logics.Logics.compute_proceeds"):
                        valid, context = Logics.confirm_fiat(order, user)

        self.assertTrue(valid)
        mock_pay.assert_called_once_with(order)


# ---------------------------------------------------------------------------
# Variant B — open_dispute abort when order already in PAY
# ---------------------------------------------------------------------------
class TestOpenDisputeAbortOnConcurrentConfirmFiat(TestCase):
    """
    open_dispute must abort when confirm_fiat has already moved the order to PAY.
    """

    @patch("api.logics.Logics.automatic_dispute_resolution", return_value=False)
    @patch("api.logics.Order.objects")
    def test_open_dispute_aborts_when_order_in_PAY(
        self, mock_order_objects, mock_auto
    ):
        """
        Invariant #3: If the locked re-read shows order in PAY (confirm_fiat won),
        open_dispute must return (False, error) — not settle bonds.
        """
        from api.logics import Logics

        order = _make_order_mock(status=Order.Status.CHA)
        user = _make_user_mock()

        # Locked order in PAY (confirm_fiat already committed)
        locked_order_mock = MagicMock()
        locked_order_mock.status = Order.Status.PAY
        locked_order_mock.trade_escrow = MagicMock()
        locked_order_mock.trade_escrow.status = LNPayment.Status.SETLED

        select_for_update_mock = MagicMock()
        select_for_update_mock.get.return_value = locked_order_mock
        mock_order_objects.select_for_update.return_value = select_for_update_mock

        with patch("api.logics.Logics.settle_bond") as mock_settle_bond:
            valid, context = Logics.open_dispute(order, user)

        self.assertFalse(valid)
        # Must NOT have settled bonds (they belong to the paid-out trade)
        mock_settle_bond.assert_not_called()


# ---------------------------------------------------------------------------
# Variant B — collaborative_cancel abort on concurrent confirm_fiat
# ---------------------------------------------------------------------------
class TestCollaborativeCancelAbortOnConcurrentConfirmFiat(TestCase):
    """
    collaborative_cancel must abort when confirm_fiat has moved the order to PAY.
    """

    @patch("api.logics.Order.objects")
    def test_collaborative_cancel_aborts_when_order_in_PAY(
        self, mock_order_objects
    ):
        from api.logics import Logics

        order = _make_order_mock(status=Order.Status.CHA)

        # Locked order in PAY — confirm_fiat won
        locked_order_mock = MagicMock()
        locked_order_mock.status = Order.Status.PAY

        select_for_update_mock = MagicMock()
        select_for_update_mock.get.return_value = locked_order_mock
        mock_order_objects.select_for_update.return_value = select_for_update_mock

        with patch("api.logics.Logics.return_bond") as mock_return_bond:
            with patch("api.logics.Logics.return_escrow") as mock_return_escrow:
                Logics.collaborative_cancel(order)

        # Must NOT have returned bonds/escrow (already consumed by payout)
        mock_return_bond.assert_not_called()
        mock_return_escrow.assert_not_called()


# ---------------------------------------------------------------------------
# Variant A — deterministic sequence: dispute-then-confirm
# (simulates the race without threading: open_dispute finishes, THEN confirm_fiat
#  is called with the order's in-memory status still set to CHA but DB is DIS)
# ---------------------------------------------------------------------------
class TestDisputeBeforeConfirmFiatDeterministic(TestCase):
    """
    Deterministic race window: open_dispute commits to DIS, then confirm_fiat
    is called with a stale in-memory order (status==CHA).
    confirm_fiat must detect the DIS status under the lock and abort.
    """

    @patch("api.logics.Logics.settle_escrow")
    @patch("api.logics.Logics.is_seller", return_value=True)
    @patch("api.logics.Logics.is_buyer", return_value=False)
    @patch("api.logics.LNNode")
    @patch("api.logics.Order.objects")
    def test_stale_order_in_memory_gets_blocked_by_lock(
        self,
        mock_order_objects,
        mock_lnnode,
        mock_is_buyer,
        mock_is_seller,
        mock_settle_escrow,
    ):
        """
        Simulates: order in-memory has status=CHA (passed the outer check),
        but the DB re-read under the lock returns status=DIS.
        confirm_fiat must abort without settling escrow or paying.
        """
        from api.logics import Logics

        # In-memory order: status=CHA (stale — dispute has not been seen yet)
        order = _make_order_mock(status=Order.Status.CHA, is_fiat_sent=True)
        user = _make_user_mock(is_seller=True)

        # DB re-read under the lock returns DIS (dispute already committed)
        locked_order_mock = MagicMock()
        locked_order_mock.status = Order.Status.DIS
        locked_order_mock.is_fiat_sent = True

        select_for_update_mock = MagicMock()
        select_for_update_mock.get.return_value = locked_order_mock
        mock_order_objects.select_for_update.return_value = select_for_update_mock

        valid, context = Logics.confirm_fiat(order, user)

        # Invariant #3: confirm_fiat must not succeed
        self.assertFalse(valid)

        # Invariant #1: settle_escrow must NOT have been called
        mock_settle_escrow.assert_not_called()

        # Invariant #2: payout invoice must NOT be queued
        # (payout.status should remain VALIDI, not FLIGHT)
        self.assertNotEqual(order.payout.status, LNPayment.Status.FLIGHT)

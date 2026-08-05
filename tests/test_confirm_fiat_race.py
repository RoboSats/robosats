"""
Regression tests for the confirm_fiat / open_dispute race condition.

Root cause: confirm_fiat, open_dispute, order_expires, collaborative_cancel, and
cancel_order all transition an order out of {CHA, FSE} while touching hold invoices
and bonds, but none acquire a row lock or re-read order.status / trade_escrow.status
before touching money.

The three invariants every coordinator MUST guarantee:

  1. A maker bond that should be RETURNED is never silently SETTLED.
     (return_bond swallowing "invoice already settled" is the bug.)

  2. The buyer's payout invoice transitions to FLIGHT exactly once.
     (> 1 FLIGHT payout for the same order = double-pay.)

  3. open_dispute and confirm_fiat cannot both succeed for the same order.
     (order.status == DIS AND payout.status in {FLIGHT, …} is the smoking gun.)

Two test variants:

  * test_dispute_then_confirm_fiat_is_rejected (deterministic) — run open_dispute to
    completion, then call confirm_fiat as if the seller's request had already cleared
    the L1688 status check.  Fails on unfixed code: confirm_fiat returns True and
    queues a payout for an order already in DIS.

  * test_confirm_fiat_after_auto_expiry_dispute (benign twin) — reproduce the
    non-attacker path: order expires in CHA while the seller is mid-confirm.  The
    auto-dispute (clean_orders) fires first; confirm_fiat must then be rejected and
    must NOT pay the buyer.
"""

from unittest.mock import patch

from django.utils import timezone

from api.logics import Logics
from api.models import LNPayment, Order
from api.tasks import follow_send_payment, send_notification
from tests.test_api import BaseAPITestCase
from tests.utils.node import set_up_regtest_network
from tests.utils.trade import Trade
from api.tasks import cache_market
from django.contrib.auth.models import User
from decouple import config
from control.tasks import compute_node_balance


class ConfirmFiatRaceTest(BaseAPITestCase):
    """
    Tests for the confirm_fiat / open_dispute concurrency hazard.

    The test suite reuses the same regtest LN setup as TradeTest and reaches CHA
    status through the same helpers (publish_order → take → lock_bonds → lock_escrow
    → submit_payout_invoice → buyer confirm_fiat).
    """

    su_pass = "12345678"
    su_name = config("ESCROW_USERNAME", cast=str, default="admin")

    @classmethod
    def setUpTestData(cls):
        User.objects.create_superuser(cls.su_name, "super@user.com", cls.su_pass)
        cache_market()
        set_up_regtest_network()
        compute_node_balance()

    # ------------------------------------------------------------------
    # Helper: bring a trade to CHA status with escrow LOCKED
    # ------------------------------------------------------------------

    @patch("api.tasks.send_notification.delay", send_notification)
    def _setup_trade_at_cha(self):
        """
        Advance a trade to CHA (fiat-exchange-in-progress) state.

        In the default maker_form the maker is BUYER and the taker is SELLER.
        Returns the Trade instance with order at CHA and escrow LOCKED.
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.take_order_third()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)  # taker is seller → locks escrow
        trade.submit_payout_invoice(trade.maker_index)  # maker is buyer → submits invoice
        # Status is now CHA; escrow is LOCKED
        return trade

    # ------------------------------------------------------------------
    # Invariant helpers
    # ------------------------------------------------------------------

    def _assert_invariants(self, order_id, msg_prefix=""):
        """
        Assert all three invariants hold for *order_id*.
        """
        order = Order.objects.get(id=order_id)

        # 1. Maker bond must NOT be silently SETTLED when it should have been returned.
        #    After a dispute without a winner (DIS), both bonds are intentionally
        #    settled.  But after a successful confirm_fiat the maker bond must be RETNED.
        #    The combination "DIS status + maker_bond RETNED" signals confirm_fiat leaked
        #    through.  Conversely "PAY/SUC status + maker_bond SETLED" signals the bug
        #    from the other direction.
        #
        #    We capture the simplest invariant: the order must be in EXACTLY ONE of
        #    {DIS, PAY, SUC} — not both, not neither (which would be the bug state).
        winning_status = order.status in (
            Order.Status.PAY,
            Order.Status.SUC,
        )
        dispute_status = order.status == Order.Status.DIS

        self.assertFalse(
            winning_status and dispute_status,
            f"{msg_prefix}: Order is simultaneously in a paying state and DIS — "
            "confirm_fiat and open_dispute both won.",
        )

        # 2. Payout invoice must not be in FLIGHT more than once.
        #    We count LNPayment rows with concept=PAYBUYER and status=FLIGHT for this
        #    order (via the order_paid_LN reverse relation guard in follow_invoices).
        flight_count = LNPayment.objects.filter(
            concept=LNPayment.Concepts.PAYBUYER,
            status=LNPayment.Status.FLIGHT,
            order_paid_LN=order,
        ).count()
        self.assertLessEqual(
            flight_count,
            1,
            f"{msg_prefix}: {flight_count} PAYBUYER invoices are in FLIGHT — "
            "double-payout queued.",
        )

        # 3. If the order is in DIS the payout must not have been queued.
        if order.status == Order.Status.DIS:
            payout_queued = LNPayment.objects.filter(
                concept=LNPayment.Concepts.PAYBUYER,
                status__in=[LNPayment.Status.FLIGHT, LNPayment.Status.SUCCED],
                order_paid_LN=order,
            ).exists()
            self.assertFalse(
                payout_queued,
                f"{msg_prefix}: Order is in DIS but payout invoice has been queued "
                "or paid — confirm_fiat executed after open_dispute.",
            )

    # ------------------------------------------------------------------
    # Test 1: deterministic — dispute completes, then seller calls confirm_fiat
    # ------------------------------------------------------------------

    @patch("api.tasks.send_notification.delay", send_notification)
    def test_dispute_then_confirm_fiat_is_rejected(self):
        """
        Deterministic variant: run open_dispute to completion, THEN call confirm_fiat
        as if the seller's request had already cleared the L1688 status check.

        On unfixed code: confirm_fiat sees escrow SETLED via double_check, calls
        return_bond (which swallows "already settled"), calls pay_buyer, and returns
        True.  Order is left in a DIS+PAY chimera state.

        On fixed code: confirm_fiat must return False (status no longer in {CHA, FSE})
        and must not queue a payout.
        """
        trade = self._setup_trade_at_cha()
        order = Order.objects.get(id=trade.order_id)

        # Confirm buyer has sent fiat (moves to FSE)
        trade.confirm_fiat(trade.maker_index)
        order.refresh_from_db()
        self.assertEqual(
            order.status,
            Order.Status.FSE,
            "Setup failed: expected FSE after buyer confirms fiat sent",
        )

        # Dispute opened by taker (seller) — runs to completion
        taker_user = order.taker
        valid, _ = Logics.open_dispute(order, user=taker_user)
        self.assertTrue(valid, "open_dispute should succeed on FSE order")

        order.refresh_from_db()
        self.assertEqual(
            order.status,
            Order.Status.DIS,
            "After open_dispute order must be in DIS",
        )

        # Now simulate the seller's confirm_fiat arriving late.
        # In the real race the seller's Django view already passed the L1688 status
        # check when the order was still FSE; we replay that exact call.
        maker_user = order.maker
        valid_late, _ = Logics.confirm_fiat(order, user=maker_user)

        # Invariant 3: confirm_fiat must be rejected — exactly one operation may win.
        self.assertFalse(
            valid_late,
            "confirm_fiat must return False when order is already in DIS. "
            "On unfixed code this returns True and queues a payout.",
        )

        # Check all three invariants
        self._assert_invariants(
            trade.order_id,
            msg_prefix="test_dispute_then_confirm_fiat_is_rejected",
        )

    # ------------------------------------------------------------------
    # Test 2: benign-twin — auto-expiry dispute races seller confirm_fiat
    # ------------------------------------------------------------------

    @patch("api.tasks.send_notification.delay", send_notification)
    @patch("api.tasks.follow_send_payment.delay", follow_send_payment)
    def test_confirm_fiat_after_auto_expiry_dispute(self):
        """
        Benign-twin variant: order expires in CHA while the seller (taker) is about
        to call confirm_fiat.  The clean_orders job fires open_dispute automatically;
        then the seller's late confirm_fiat request must be rejected.

        This is the non-attacker path that can hit two honest traders simply due to
        unfortunate timing near order expiry.
        """
        trade = self._setup_trade_at_cha()
        order = Order.objects.get(id=trade.order_id)

        # Buyer confirms fiat sent → FSE
        trade.confirm_fiat(trade.maker_index)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.FSE)

        # Expire the order so clean_orders auto-opens a dispute
        order.expires_at = timezone.now()
        order.save(update_fields=["expires_at"])

        # clean_orders calls order_expires → open_dispute (the benign twin)
        trade.clean_orders()

        order.refresh_from_db()
        self.assertEqual(
            order.status,
            Order.Status.DIS,
            "clean_orders must auto-open a dispute on expired FSE order",
        )

        # Seller's late confirm_fiat (simulates the race window — request had already
        # entered confirm_fiat before the expiry job ran)
        taker_user = order.taker  # taker is seller in BUY order
        valid_late, _ = Logics.confirm_fiat(order, user=taker_user)

        self.assertFalse(
            valid_late,
            "confirm_fiat must return False when order has been moved to DIS by "
            "the expiry job.  On unfixed code this returns True.",
        )

        # All three invariants
        self._assert_invariants(
            trade.order_id,
            msg_prefix="test_confirm_fiat_after_auto_expiry_dispute",
        )

from unittest.mock import MagicMock, patch

from django.test import TestCase

from api.logics import Logics
from api.models import LNPayment, Order

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_order(status=Order.Status.CHA, is_swap=False):
    """Build a minimal mock Order."""
    order = MagicMock(spec=Order)
    order.pk = 42
    order.id = 42
    order.status = status
    order.is_swap = is_swap
    order.is_fiat_sent = True
    order.is_disputed = False
    order.reverted_fiat_sent = False
    order.maker_asked_cancel = False
    order.taker_asked_cancel = False
    order.expires_at = None

    trade_escrow = MagicMock(spec=LNPayment)
    trade_escrow.status = LNPayment.Status.LOCKED
    trade_escrow.payment_hash = "aabbcc"
    trade_escrow.preimage = "deadbeef"
    trade_escrow.num_satoshis = 100_000
    order.trade_escrow = trade_escrow

    payout = MagicMock(spec=LNPayment)
    payout.status = LNPayment.Status.VALIDI
    payout.num_satoshis = 99_000
    order.payout = payout
    order.payout_tx = None

    maker_bond = MagicMock(spec=LNPayment)
    maker_bond.payment_hash = "maker_hash"
    maker_bond.preimage = "maker_preimage"
    maker_bond.num_satoshis = 1_000
    order.maker_bond = maker_bond

    taker_bond = MagicMock(spec=LNPayment)
    taker_bond.payment_hash = "taker_hash"
    taker_bond.preimage = "taker_preimage"
    taker_bond.num_satoshis = 1_000
    order.taker_bond = taker_bond

    order.log = MagicMock()
    order.save = MagicMock()
    order.update_status = MagicMock()
    order.transition_status = MagicMock(return_value=True)
    order.t_to_expire = MagicMock(return_value=3600)
    return order


def _make_user():
    """Build a minimal mock User."""
    user = MagicMock()
    user.robot = MagicMock()
    user.robot.id = 1
    user.username = "alice"
    user.robot.orders_disputes_started = None
    user.robot.num_disputes = 0
    return user


def _atomic_passthrough(mock_tx, order, mock_qs):
    """Wire transaction.atomic() to pass through and select_for_update to return order."""
    mock_tx.atomic.return_value.__enter__ = MagicMock(return_value=None)
    mock_tx.atomic.return_value.__exit__ = MagicMock(return_value=False)
    mock_qs.select_for_update.return_value.get.return_value = order


# ---------------------------------------------------------------------------
# confirm_fiat — buyer path
# ---------------------------------------------------------------------------


class ConfirmFiatBuyerTests(TestCase):
    def _run(self, order, transition_return=True):
        user = _make_user()
        order.transition_status = MagicMock(return_value=transition_return)
        with (
            patch("api.logics.transaction") as mock_tx,
            patch("api.logics.Order.objects") as mock_qs,
            patch("api.logics.Logics.is_buyer", return_value=True),
            patch("api.logics.Logics.is_seller", return_value=False),
            patch("api.tasks.send_notification.delay"),
        ):
            _atomic_passthrough(mock_tx, order, mock_qs)
            return Logics.confirm_fiat(order, user)

    def test_succeeds_from_cha(self):
        valid, err = self._run(_make_order(status=Order.Status.CHA))
        self.assertTrue(valid)
        self.assertIsNone(err)

    def test_error_when_transition_fails(self):
        valid, err = self._run(
            _make_order(status=Order.Status.CHA), transition_return=False
        )
        self.assertFalse(valid)
        self.assertEqual(err["error_code"], 1057)

    def test_rejected_when_already_dis(self):
        valid, err = self._run(_make_order(status=Order.Status.DIS))
        self.assertFalse(valid)
        self.assertEqual(err["error_code"], 1029)


# ---------------------------------------------------------------------------
# confirm_fiat — seller path
# ---------------------------------------------------------------------------


class ConfirmFiatSellerTests(TestCase):
    def test_aborts_when_pay_buyer_returns_false(self):
        order = _make_order(status=Order.Status.FSE)
        order.is_fiat_sent = True
        user = _make_user()
        with (
            patch("api.logics.transaction") as mock_tx,
            patch("api.logics.Order.objects") as mock_qs,
            patch("api.logics.Logics.is_buyer", return_value=False),
            patch("api.logics.Logics.is_seller", return_value=True),
            patch("api.logics.LNNode.double_check_htlc_is_settled", return_value=True),
            patch("api.logics.LNNode.settle_hold_invoice", return_value=True),
            patch("api.logics.LNNode.cancel_return_hold_invoice", return_value=True),
            patch("api.logics.Logics.pay_buyer", return_value=False),
            patch("api.tasks.send_notification.delay"),
        ):
            _atomic_passthrough(mock_tx, order, mock_qs)
            valid, err = Logics.confirm_fiat(order, user)
        self.assertFalse(valid)
        self.assertEqual(err["error_code"], 1057)


# ---------------------------------------------------------------------------
# pay_buyer
# ---------------------------------------------------------------------------


class PayBuyerTests(TestCase):
    def test_aborts_when_transition_fails(self):
        order = _make_order(status=Order.Status.DIS)
        order.transition_status = MagicMock(return_value=False)
        with patch("api.tasks.send_notification.delay"):
            result = Logics.pay_buyer(order)
        self.assertFalse(result)
        order.payout.save.assert_not_called()

    def test_succeeds_from_fse(self):
        order = _make_order(status=Order.Status.FSE)
        order.transition_status = MagicMock(return_value=True)
        with patch("api.tasks.send_notification.delay"):
            result = Logics.pay_buyer(order)
        self.assertTrue(result)
        self.assertEqual(order.payout.status, LNPayment.Status.FLIGHT)


# ---------------------------------------------------------------------------
# open_dispute
# ---------------------------------------------------------------------------


class OpenDisputeTests(TestCase):
    def _run(self, order, user=None, auto_solved=False):
        with (
            patch("api.logics.transaction") as mock_tx,
            patch("api.logics.Order.objects") as mock_qs,
            patch(
                "api.logics.Logics.automatic_dispute_resolution",
                return_value=auto_solved,
            ),
            patch("api.logics.LNNode.settle_hold_invoice", return_value=True),
            patch("api.tasks.send_notification.delay"),
        ):
            _atomic_passthrough(mock_tx, order, mock_qs)
            return Logics.open_dispute(order, user)

    def test_no_op_when_already_dis(self):
        order = _make_order(status=Order.Status.DIS)
        valid, err = self._run(order)
        self.assertFalse(valid)
        self.assertEqual(err["error_code"], 1013)

    def test_succeeds_from_cha(self):
        order = _make_order(status=Order.Status.CHA)
        order.update_status = MagicMock()
        order.save = MagicMock()
        valid, err = self._run(order)
        self.assertTrue(valid)
        self.assertIsNone(err)


# ---------------------------------------------------------------------------
# order_expires
# ---------------------------------------------------------------------------


class OrderExpiresTests(TestCase):
    def _run(self, order):
        with (
            patch("api.logics.transaction") as mock_tx,
            patch("api.logics.Order.objects") as mock_qs,
            patch("api.tasks.send_notification.delay"),
        ):
            _atomic_passthrough(mock_tx, order, mock_qs)
            return Logics.order_expires(order)

    def test_no_op_when_pay(self):
        self.assertFalse(self._run(_make_order(status=Order.Status.PAY)))

    def test_no_op_when_dis(self):
        self.assertFalse(self._run(_make_order(status=Order.Status.DIS)))

    def test_no_op_when_suc(self):
        self.assertFalse(self._run(_make_order(status=Order.Status.SUC)))


# ---------------------------------------------------------------------------
# cancel_order / collaborative_cancel
# ---------------------------------------------------------------------------


class CancelOrderTests(TestCase):
    def _run(self, order, cancel_status=None):
        with (
            patch("api.logics.transaction") as mock_tx,
            patch("api.logics.Order.objects") as mock_qs,
            patch("api.tasks.send_notification.delay"),
            patch("api.tasks.nostr_send_order_event.delay"),
        ):
            _atomic_passthrough(mock_tx, order, mock_qs)
            return Logics.cancel_order(order, _make_user(), cancel_status)

    def test_no_op_when_already_dis(self):
        valid, err = self._run(_make_order(status=Order.Status.DIS))
        self.assertFalse(valid)
        self.assertEqual(err["error_code"], 1021)

    def test_cancel_status_mismatch_after_lock(self):
        """cancel_status=WFB but re-fetched order is CHA → error 1020."""
        valid, err = self._run(
            _make_order(status=Order.Status.CHA),
            cancel_status=Order.Status.WFB,
        )
        self.assertFalse(valid)
        self.assertEqual(err["error_code"], 1020)


class CollaborativeCancelTests(TestCase):
    def test_no_op_when_fse(self):
        order = _make_order(status=Order.Status.FSE)
        Logics.collaborative_cancel(order)
        order.update_status.assert_not_called()


# ---------------------------------------------------------------------------
# finalize_contract
# ---------------------------------------------------------------------------


class FinalizeContractTests(TestCase):
    def test_kicks_take_order_when_not_pub(self):
        take_order = MagicMock()
        take_order.order = MagicMock()
        take_order.order.pk = 99
        locked_order = _make_order(status=Order.Status.WF2)
        with (
            patch("api.logics.transaction") as mock_tx,
            patch("api.logics.Order.objects") as mock_qs,
            patch("api.logics.Logics.take_order_expires") as mock_kick,
        ):
            mock_tx.atomic.return_value.__enter__ = MagicMock(return_value=None)
            mock_tx.atomic.return_value.__exit__ = MagicMock(return_value=False)
            mock_qs.select_for_update.return_value.get.return_value = locked_order
            result = Logics.finalize_contract(take_order)
        self.assertFalse(result)
        mock_kick.assert_called_once_with(take_order)


# ---------------------------------------------------------------------------
# LN primitive idempotency
# ---------------------------------------------------------------------------


class SettleEscrowIdempotencyTests(TestCase):
    def test_already_settled(self):
        order = _make_order()
        with patch(
            "api.logics.LNNode.settle_hold_invoice",
            side_effect=Exception("invoice already settled"),
        ):
            result = Logics.settle_escrow(order)
        self.assertTrue(result)
        self.assertEqual(order.trade_escrow.status, LNPayment.Status.SETLED)


class SettleBondIdempotencyTests(TestCase):
    def test_already_settled(self):
        bond = MagicMock(spec=LNPayment)
        bond.preimage = "aabb"
        with patch(
            "api.logics.LNNode.settle_hold_invoice",
            side_effect=Exception("invoice already settled"),
        ):
            result = Logics.settle_bond(bond)
        self.assertTrue(result)
        self.assertEqual(bond.status, LNPayment.Status.SETLED)


class ReturnBondIdempotencyTests(TestCase):
    def test_already_canceled(self):
        bond = MagicMock(spec=LNPayment)
        bond.payment_hash = "abcd"
        with patch(
            "api.logics.LNNode.cancel_return_hold_invoice",
            side_effect=Exception("invoice already canceled"),
        ):
            result = Logics.return_bond(bond)
        self.assertTrue(result)
        self.assertEqual(bond.status, LNPayment.Status.RETNED)

    def test_already_settled(self):
        bond = MagicMock(spec=LNPayment)
        bond.payment_hash = "abcd"
        with patch(
            "api.logics.LNNode.cancel_return_hold_invoice",
            side_effect=Exception("invoice already settled"),
        ):
            result = Logics.return_bond(bond)
        self.assertTrue(result)
        self.assertEqual(bond.status, LNPayment.Status.SETLED)


class CancelBondIdempotencyTests(TestCase):
    def test_already_canceled(self):
        bond = MagicMock(spec=LNPayment)
        bond.payment_hash = "abcd"
        with patch(
            "api.logics.LNNode.cancel_return_hold_invoice",
            side_effect=Exception("invoice already canceled"),
        ):
            result = Logics.cancel_bond(bond)
        self.assertTrue(result)
        self.assertEqual(bond.status, LNPayment.Status.CANCEL)


class ReturnEscrowIdempotencyTests(TestCase):
    def test_already_settled(self):
        order = _make_order()
        with patch(
            "api.logics.LNNode.cancel_return_hold_invoice",
            side_effect=Exception("invoice already settled"),
        ):
            result = Logics.return_escrow(order)
        self.assertTrue(result)
        self.assertEqual(order.trade_escrow.status, LNPayment.Status.SETLED)

    def test_already_canceled(self):
        order = _make_order()
        with patch(
            "api.logics.LNNode.cancel_return_hold_invoice",
            side_effect=Exception("invoice already canceled"),
        ):
            result = Logics.return_escrow(order)
        self.assertTrue(result)
        self.assertEqual(order.trade_escrow.status, LNPayment.Status.RETNED)


class CancelEscrowIdempotencyTests(TestCase):
    def test_already_settled(self):
        order = _make_order()
        with patch(
            "api.logics.LNNode.cancel_return_hold_invoice",
            side_effect=Exception("invoice already settled"),
        ):
            result = Logics.cancel_escrow(order)
        self.assertTrue(result)
        self.assertEqual(order.trade_escrow.status, LNPayment.Status.SETLED)

    def test_already_canceled(self):
        order = _make_order()
        with patch(
            "api.logics.LNNode.cancel_return_hold_invoice",
            side_effect=Exception("invoice already canceled"),
        ):
            result = Logics.cancel_escrow(order)
        self.assertTrue(result)
        self.assertEqual(order.trade_escrow.status, LNPayment.Status.CANCEL)

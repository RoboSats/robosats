from unittest.mock import Mock, patch

from django.test import TestCase

from api.logics import Logics
from api.models import Order


class TestPayoutAmount(TestCase):
    def _make_order(self, maker, last_satoshis=100_000):
        order = Mock()
        order.maker = maker
        order.taker = Mock(id=2)
        order.type = Order.Types.BUY
        order.last_satoshis = last_satoshis
        order.payout_tx = None
        order.payout = None
        order.log = Mock()
        return order

    def _mock_config(self, **overrides):
        values = {
            "MIN_SWAP_AMOUNT": 20000,
            "MAX_SWAP_AMOUNT": 500000,
            "DISABLE_ONCHAIN": False,
        }
        values.update(overrides)
        return lambda key, **kwargs: values.get(key, kwargs.get("default"))

    @patch("api.logics.Logics.is_buyer", return_value=True)
    @patch("api.logics.config")
    def test_swap_below_min_amount(self, mock_config, _is_buyer):
        """
        swap_allowed=False when amount is below MIN_SWAP_AMOUNT
        """
        mock_config.side_effect = self._mock_config()
        user = Mock(id=1)
        order = self._make_order(maker=user, last_satoshis=5_000)

        result, context = Logics.payout_amount(order, user)

        self.assertTrue(result)
        self.assertFalse(context["swap_allowed"])
        self.assertIn("smaller than the minimum swap", context["swap_failure_reason"])

    @patch("api.logics.Logics.is_buyer", return_value=True)
    @patch("api.logics.config")
    def test_swap_above_max_amount(self, mock_config, _is_buyer):
        """
        swap_allowed=False when amount is above MAX_SWAP_AMOUNT
        """
        mock_config.side_effect = self._mock_config()
        user = Mock(id=1)
        order = self._make_order(maker=user, last_satoshis=600_000)

        result, context = Logics.payout_amount(order, user)

        self.assertTrue(result)
        self.assertFalse(context["swap_allowed"])
        self.assertIn("bigger than the maximum swap", context["swap_failure_reason"])

    @patch("api.logics.Logics.is_buyer", return_value=True)
    @patch("api.logics.config")
    def test_swap_disabled(self, mock_config, _is_buyer):
        """
        swap_allowed=False when DISABLE_ONCHAIN is True
        """
        mock_config.side_effect = self._mock_config(DISABLE_ONCHAIN=True)
        user = Mock(id=1)
        order = self._make_order(maker=user)

        result, context = Logics.payout_amount(order, user)

        self.assertTrue(result)
        self.assertFalse(context["swap_allowed"])
        self.assertIn("submarine swaps are disabled", context["swap_failure_reason"])

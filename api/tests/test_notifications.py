"""
Unit tests for api/notifications.py — order URL formation for Telegram descriptions.

Coverage:
- order_url: /order/{shortAlias}/{orderId} shape with the federation-resolved alias
- order_taken_confirmed, fiat_exchange_starts, order_expired_untaken: descriptions
  embed the full order URL (regression: URLs used to omit the alias and 404 on the
  Django route /order/<shortAlias>/<int:orderId>/)

Message fan-out (Telegram HTTP, Nostr, webhook) is not exercised here.
"""

from unittest.mock import MagicMock, patch

from django.test import TestCase

from api.notifications import Notifications


def _make_order(order_id=42):
    order = MagicMock()
    order.id = order_id
    order.maker = MagicMock()
    order.taker = MagicMock()
    return order


@patch.object(Notifications, "site", "test.onion")
class TestOrderUrl(TestCase):
    """Unit-test Notifications.order_url and its embedding in descriptions."""

    def setUp(self):
        self.notifications = Notifications()

    @patch("api.notifications.get_federation_short_alias")
    def test_order_url_contains_short_alias_and_order_id(self, mock_alias):
        mock_alias.return_value = "temple"
        url = self.notifications.order_url(_make_order(order_id=42))
        self.assertEqual(url, "http://test.onion/order/temple/42")

    @patch("api.notifications.get_federation_short_alias")
    def test_order_url_never_omits_the_alias_segment(self, mock_alias):
        mock_alias.return_value = "lake"
        url = self.notifications.order_url(_make_order(order_id=7))
        self.assertRegex(url, r"^http://test\.onion/order/lake/7$")

    @patch("api.notifications.Notifications.send_message")
    @patch("api.notifications.get_federation_short_alias")
    def test_order_taken_confirmed_maker_description_embeds_url(
        self, mock_alias, mock_send
    ):
        mock_alias.return_value = "temple"
        order = _make_order(order_id=99)
        self.notifications.order_taken_confirmed(order)
        maker_description = mock_send.call_args_list[0].args[3]
        self.assertIn("http://test.onion/order/temple/99", maker_description)

    @patch("api.notifications.Notifications.send_message")
    @patch("api.notifications.get_federation_short_alias")
    def test_fiat_exchange_starts_descriptions_embed_url(self, mock_alias, mock_send):
        mock_alias.return_value = "lake"
        order = _make_order(order_id=5)
        self.notifications.fiat_exchange_starts(order)
        for call in mock_send.call_args_list:
            self.assertIn("http://test.onion/order/lake/5", call.args[3])

    @patch("api.notifications.Notifications.send_message")
    @patch("api.notifications.get_federation_short_alias")
    def test_order_expired_untaken_description_embeds_url(self, mock_alias, mock_send):
        mock_alias.return_value = "bazaar"
        order = _make_order(order_id=123)
        self.notifications.order_expired_untaken(order)
        description = mock_send.call_args_list[0].args[3]
        self.assertIn("http://test.onion/order/bazaar/123", description)

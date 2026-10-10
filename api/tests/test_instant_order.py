"""
Unit tests for instant orders (issue #2473).

Pure logic: no lightning node, no relay, no rows written.

Coverage:
- Order.chat_duration default reproduces the historical coordinator-wide chat window, so
  existing orders behave exactly as before
- Order.t_to_expire returns the per-order chat window for both chatroom statuses
- Logics.validate_instant_order enforces the payment rail allow-list and both timer ceilings
"""

from django.test import TestCase, override_settings

from api.logics import Logics
from api.models import Order

# Mirrors settings.INSTANT_* deliberately spelled out in seconds, so that loosening a default
# in settings has to be a conscious change here too.
MAX_INSTANT_ESCROW_SECS = 2 * 60 * 60  # 2 hours
MAX_INSTANT_CHAT_SECS = 4 * 60 * 60  # 4 hours
DEFAULT_CHAT_SECS = 24 * 60 * 60  # FIAT_EXCHANGE_DURATION

ALLOWED_RAIL = "Strike"
ANOTHER_ALLOWED_RAIL = "Instant SEPA"
SLOW_RAIL = "SEPA"

INSTANT_SETTINGS = {
    "INSTANT_ESCROW_MAX_DURATION": 2.0,
    "INSTANT_CHAT_MAX_DURATION": 4.0,
    "INSTANT_PAYMENT_METHODS": [
        ALLOWED_RAIL,
        ANOTHER_ALLOWED_RAIL,
        "Zelle",
        "Wise",
        "N26",
    ],
}


def _order(
    *,
    is_instant=False,
    payment_method="not specified",
    escrow_duration=60 * 180,
    chat_duration=DEFAULT_CHAT_SECS,
):
    """An unsaved Order with only the fields these tests touch."""
    order = Order()
    order.is_instant = is_instant
    order.payment_method = payment_method
    order.escrow_duration = escrow_duration
    order.chat_duration = chat_duration
    return order


class TestChatDurationField(TestCase):
    def test_default_keeps_the_coordinator_wide_window(self):
        self.assertEqual(
            Order._meta.get_field("chat_duration").get_default(), DEFAULT_CHAT_SECS
        )

    def test_regular_order_chat_window_is_unchanged(self):
        order = _order()
        self.assertEqual(order.t_to_expire(Order.Status.CHA), DEFAULT_CHAT_SECS)
        self.assertEqual(order.t_to_expire(Order.Status.FSE), DEFAULT_CHAT_SECS)

    def test_escrow_statuses_still_use_escrow_duration(self):
        order = _order(escrow_duration=3600, chat_duration=MAX_INSTANT_CHAT_SECS)
        for status in (Order.Status.WF2, Order.Status.WFE, Order.Status.WFI):
            self.assertEqual(order.t_to_expire(status), 3600)


class TestInstantChatWindow(TestCase):
    def test_both_chatroom_statuses_use_the_order_value(self):
        order = _order(is_instant=True, chat_duration=MAX_INSTANT_CHAT_SECS)

        self.assertEqual(order.t_to_expire(Order.Status.CHA), MAX_INSTANT_CHAT_SECS)
        self.assertEqual(order.t_to_expire(Order.Status.FSE), MAX_INSTANT_CHAT_SECS)

    def test_taker_cannot_outlast_a_short_window_by_confirming_late(self):
        """Status FSE shares the same window: confirming fiat near the end leaves the maker the
        remainder rather than a fresh 24 hours. Same semantics as a regular order, just shorter.
        """
        order = _order(is_instant=True, chat_duration=3600)
        self.assertEqual(
            order.t_to_expire(Order.Status.FSE), order.t_to_expire(Order.Status.CHA)
        )


@override_settings(**INSTANT_SETTINGS)
class TestValidateInstantOrder(TestCase):
    def test_regular_orders_are_unconstrained(self):
        order = _order(
            is_instant=False,
            payment_method="Cash in person",
            escrow_duration=10 * 60 * 60,
            chat_duration=DEFAULT_CHAT_SECS,
        )

        is_valid, error = Logics.validate_instant_order(order)

        self.assertTrue(is_valid)
        self.assertIsNone(error)

    def test_instant_order_at_the_limits_is_accepted(self):
        order = _order(
            is_instant=True,
            payment_method=ALLOWED_RAIL,
            escrow_duration=MAX_INSTANT_ESCROW_SECS,
            chat_duration=MAX_INSTANT_CHAT_SECS,
        )

        self.assertEqual(Logics.validate_instant_order(order), (True, None))

    def test_multi_word_rail_is_matched_exactly(self):
        order = _order(
            is_instant=True,
            payment_method=ANOTHER_ALLOWED_RAIL,
            escrow_duration=MAX_INSTANT_ESCROW_SECS,
            chat_duration=MAX_INSTANT_CHAT_SECS,
        )

        self.assertEqual(Logics.validate_instant_order(order), (True, None))

    def test_instant_order_rejects_a_rail_that_is_not_advertised(self):
        order = _order(
            is_instant=True,
            payment_method=SLOW_RAIL,
            escrow_duration=MAX_INSTANT_ESCROW_SECS,
            chat_duration=MAX_INSTANT_CHAT_SECS,
        )

        is_valid, error = Logics.validate_instant_order(order)

        self.assertFalse(is_valid)
        self.assertEqual(error["error_code"], 1057)
        # The message lists the accepted rails so the maker knows what to pick
        self.assertIn(ALLOWED_RAIL, error["bad_request"])

    def test_several_rails_in_one_string_are_rejected(self):
        """The maker form joins several selected methods with a space. That combined string is
        not a single advertised rail, so an instant order cannot claim two rails at once.
        """
        order = _order(
            is_instant=True,
            payment_method=f"{ALLOWED_RAIL} Zelle",
            escrow_duration=MAX_INSTANT_ESCROW_SECS,
            chat_duration=MAX_INSTANT_CHAT_SECS,
        )

        is_valid, error = Logics.validate_instant_order(order)

        self.assertFalse(is_valid)
        self.assertEqual(error["error_code"], 1057)

    def test_instant_order_rejects_escrow_over_the_ceiling(self):
        order = _order(
            is_instant=True,
            payment_method=ALLOWED_RAIL,
            escrow_duration=MAX_INSTANT_ESCROW_SECS + 1,
            chat_duration=MAX_INSTANT_CHAT_SECS,
        )

        is_valid, error = Logics.validate_instant_order(order)

        self.assertFalse(is_valid)
        self.assertEqual(error["error_code"], 1058)

    def test_instant_order_rejects_chat_over_the_ceiling(self):
        order = _order(
            is_instant=True,
            payment_method=ALLOWED_RAIL,
            escrow_duration=MAX_INSTANT_ESCROW_SECS,
            chat_duration=MAX_INSTANT_CHAT_SECS + 1,
        )

        is_valid, error = Logics.validate_instant_order(order)

        self.assertFalse(is_valid)
        self.assertEqual(error["error_code"], 1058)

    def test_coordinator_can_narrow_the_allow_list(self):
        """A coordinator that only trusts one rail must reject the others."""
        order = _order(
            is_instant=True,
            payment_method="Wise",
            escrow_duration=MAX_INSTANT_ESCROW_SECS,
            chat_duration=MAX_INSTANT_CHAT_SECS,
        )

        with override_settings(INSTANT_PAYMENT_METHODS=[ALLOWED_RAIL]):
            is_valid, error = Logics.validate_instant_order(order)

        self.assertFalse(is_valid)
        self.assertEqual(error["error_code"], 1057)

    def test_coordinator_can_loosen_the_timer_ceilings(self):
        order = _order(
            is_instant=True,
            payment_method=ALLOWED_RAIL,
            escrow_duration=6 * 60 * 60,
            chat_duration=8 * 60 * 60,
        )

        is_valid, error = Logics.validate_instant_order(order)
        self.assertFalse(is_valid)
        self.assertEqual(error["error_code"], 1058)

        with override_settings(
            INSTANT_ESCROW_MAX_DURATION=6.0,
            INSTANT_CHAT_MAX_DURATION=8.0,
        ):
            self.assertEqual(Logics.validate_instant_order(order), (True, None))

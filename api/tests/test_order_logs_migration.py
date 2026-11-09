import importlib
import json
from unittest.mock import patch

from django.apps import apps
from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from api.models import Order
from api.utils import render_order_logs

migration = importlib.import_module("api.migrations.0061_convert_order_logs_to_json")

V087_HEAD = (
    "<thead><tr><b><th>Timestamp</th><th>Level</th><th>Event</th></b></tr></thead>"
)
V087_LOGS = V087_HEAD + (
    "<tr><td>2026-09-01T12:00:24+00:00</td><td>INFO</td>"
    "<td>Order(1,Order 1: SELL BTC for 10.0 EUR) created by Robot(7,ExampleRobot123)</td></tr>"
    "<tr><td>2026-09-01T12:05:25+00:00</td><td>INFO</td>"
    "<td>Order state went from 0: <i>Waiting for maker bond</i> to 5: <i>Expired</i></td></tr>"
    "<tr><td>2026-09-01T12:05:26+00:00</td><td><b>WARN</b></td>"
    "<td>Maker bond was <b>settled</b></td></tr>"
    "<tr><td>2026-09-01T12:05:27+00:00</td><td>INFO</td>"
    '<td>See <a href="/coordinator/api/order/1">the order</a> &amp; its\npayout</td></tr>'
)
EXPECTED = [
    {
        "timestamp": "2026-09-01T12:00:24+00:00",
        "level": "INFO",
        "event": "Order(1,Order 1: SELL BTC for 10.0 EUR) created by Robot(7,ExampleRobot123)",
    },
    {
        "timestamp": "2026-09-01T12:05:25+00:00",
        "level": "INFO",
        "event": "Order state went from 0: *Waiting for maker bond* to 5: *Expired*",
    },
    {
        "timestamp": "2026-09-01T12:05:26+00:00",
        "level": "WARN",
        "event": "Maker bond was **settled**",
    },
    {
        "timestamp": "2026-09-01T12:05:27+00:00",
        "level": "INFO",
        "event": "See the order & its\npayout",
    },
]


def _make_order(logs):
    now = timezone.now()
    maker = User.objects.create_user(username=f"maker{Order.objects.count()}")
    return Order.objects.create(
        type=Order.Types.BUY,
        status=Order.Status.EXP,
        created_at=now,
        expires_at=now,
        has_range=False,
        amount=10,
        maker=maker,
        bond_size=3,
        logs=logs,
    )


class HtmlLogToEntriesTest(TestCase):
    def test_v087_table_becomes_v088_entries(self):
        self.assertEqual(migration.html_log_to_entries(V087_LOGS), EXPECTED)

    def test_header_only_becomes_empty_list(self):
        self.assertEqual(migration.html_log_to_entries(V087_HEAD), [])


class ConvertHtmlLogsTest(TestCase):
    def test_converts_v087_rows(self):
        order = _make_order(V087_LOGS)
        migration.convert_html_logs(apps, None)
        order.refresh_from_db()
        self.assertEqual(json.loads(order.logs), EXPECTED)

    def test_converted_rows_render_like_new_logs(self):
        order = _make_order(V087_LOGS)
        migration.convert_html_logs(apps, None)
        order.refresh_from_db()
        rendered = render_order_logs(order.logs)
        self.assertNotIn("No logs were recorded", rendered)
        self.assertIn("<i>Expired</i>", rendered)
        self.assertIn("<b>settled</b>", rendered)
        self.assertIn('href="/coordinator/api/order/1"', rendered)

    def test_json_rows_are_left_untouched(self):
        logs = json.dumps(EXPECTED[:1])
        order = _make_order(logs)
        migration.convert_html_logs(apps, None)
        migration.convert_html_logs(apps, None)
        order.refresh_from_db()
        self.assertEqual(order.logs, logs)

    def test_running_twice_gives_the_same_result(self):
        order = _make_order(V087_LOGS)
        migration.convert_html_logs(apps, None)
        order.refresh_from_db()
        first = order.logs
        migration.convert_html_logs(apps, None)
        order.refresh_from_db()
        self.assertEqual(order.logs, first)

    def test_empty_and_null_logs_are_left_untouched(self):
        empty = _make_order("")
        null = _make_order(None)
        migration.convert_html_logs(apps, None)
        empty.refresh_from_db()
        null.refresh_from_db()
        self.assertEqual(empty.logs, "")
        self.assertIsNone(null.logs)

    @patch("api.models.order.config", return_value=False)
    def test_log_after_conversion_appends(self, _config):
        order = _make_order(V087_LOGS)
        migration.convert_html_logs(apps, None)
        order.refresh_from_db()
        order.log("Taker bond was **unlocked**")
        order.refresh_from_db()
        entries = json.loads(order.logs)
        self.assertEqual(entries[:4], EXPECTED)
        self.assertEqual(entries[4]["event"], "Taker bond was **unlocked**")
        self.assertEqual(entries[4]["level"], "INFO")

"""
Tests for malformed and hostile query-parameter validation.

Regression tests for the /api/book/?currency=<SQLi payload> class of bug:
raw string parameters reached int()/ORM lookups and raised unhandled
ValueError (HTTP 500). Every case here must return HTTP 400 (or 404 for
well-formed but nonexistent ids) with a stable `error_code` before any
database access happens.

Covered endpoints:
- GET  /api/book/   (currency, type)            -> 400 / error_code 1057
- GET  /api/order/  (order_id)                  -> 400 / error_code 1042
- POST /api/order/  (order_id missing/invalid)  -> 400 / 1041, 400 / 1042
- POST /api/order/  (nonexistent order)         -> 404 / error_code 1042
- POST /api/order/  (take on range order without
     amount / amount outside range)             -> 400 / 1039, 400 / 1011
- POST /api/order/  (take on non-public order)  -> 400 / error_code 1046
- GET  /api/chat/   (order_id, offset)          -> 400 / error_code 6004
- GET  /api/chat/   (nonexistent order)         -> 400 / error_code 6000
- POST /api/chat/   (nonexistent order)         -> 400 / error_code 6000
- POST /api/make/   (nonexistent currency)      -> 400 / error_code 1058
"""

from datetime import timedelta
from decimal import Decimal
from urllib.parse import urlencode

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test.utils import override_settings
from django.urls import reverse
from django.utils import timezone

from api.models import Currency, Order
from tests.test_api import BaseAPITestCase
from tests.utils.trade import maker_form_buy_with_range

SQLI_PAYLOADS = [
    "'",
    "0x31",
    "1' AND '1'='1",
    "1 AND SLEEP(2)",
]

LOCMEM_CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "input-validation-cache-tests",
    }
}


def read_file(file_path):
    """Read a file and return its content."""
    with open(file_path, "r") as file:
        return file.read()


class RobotAuthMixin:
    robot_index = 1

    def get_robot_auth(self):
        b91_token = read_file(f"tests/robots/{self.robot_index}/b91_token")
        pub_key = read_file(f"tests/robots/{self.robot_index}/pub_key")
        enc_priv_key = read_file(f"tests/robots/{self.robot_index}/enc_priv_key")
        nostr_pubkey = read_file(f"tests/robots/{self.robot_index}/nostr_pubkey")

        return {
            "HTTP_AUTHORIZATION": f"Token {b91_token} | Public {pub_key} | Private {enc_priv_key} | Nostr {nostr_pubkey}"
        }

    def create_robot(self):
        return self.client.get(reverse("robot"), **self.get_robot_auth())


class BookInputValidationTest(BaseAPITestCase):
    """GET /api/book/ rejects non-integer currency/type with 400 and error 1057."""

    def test_book_currency_sqli_payloads(self):
        path = reverse("book")

        for payload in SQLI_PAYLOADS:
            with self.subTest(payload=payload):
                response = self.client.get(path, {"currency": payload})
                self.assertEqual(response.status_code, 400)
                data = response.json()
                self.assertEqual(data["error_code"], 1057)
                self.assertIn("bad_request", data)

    def test_book_type_sqli_payloads(self):
        path = reverse("book")

        for payload in SQLI_PAYLOADS:
            with self.subTest(payload=payload):
                response = self.client.get(path, {"type": payload})
                self.assertEqual(response.status_code, 400)
                data = response.json()
                self.assertEqual(data["error_code"], 1057)
                self.assertIn("bad_request", data)

    def test_book_valid_integer_params_still_work(self):
        path = reverse("book")

        response = self.client.get(path, {"currency": "1", "type": "0"})
        self.assertIn(response.status_code, [200, 404])

    @override_settings(CACHES=LOCMEM_CACHES)
    def test_book_invalid_param_does_not_pollute_cache(self):
        path = reverse("book")

        response = self.client.get(path, {"currency": "1' AND '1'='1"})
        self.assertEqual(response.status_code, 400)
        self.assertIsNone(cache.get("book:1' AND '1'='1:2"))
        self.assertIsNone(cache.get("book:0:2"))


class OrderInputValidationTest(RobotAuthMixin, BaseAPITestCase):
    """GET/POST /api/order/ validates order_id before touching the database."""

    def setUp(self):
        self.create_robot()

    def test_order_get_missing_order_id(self):
        path = reverse("order")
        response = self.client.get(path, **self.get_robot_auth())
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data["error_code"], 1041)

    def test_order_get_sqli_order_id(self):
        path = reverse("order")
        headers = self.get_robot_auth()

        for payload in SQLI_PAYLOADS:
            with self.subTest(payload=payload):
                response = self.client.get(path, {"order_id": payload}, **headers)
                self.assertEqual(response.status_code, 400)
                data = response.json()
                self.assertEqual(data["error_code"], 1042)
                self.assertIn("bad_request", data)

    def test_order_get_nonexistent_order_id(self):
        path = reverse("order")
        response = self.client.get(
            path, {"order_id": "999999"}, **self.get_robot_auth()
        )
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertEqual(data["error_code"], 1042)

    def test_order_post_missing_order_id(self):
        path = reverse("order")
        response = self.client.post(
            path,
            data={"action": "pause"},
            content_type="application/json",
            **self.get_robot_auth(),
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data["error_code"], 1041)

    def test_order_post_sqli_order_id(self):
        path = reverse("order")
        headers = self.get_robot_auth()

        for payload in SQLI_PAYLOADS:
            with self.subTest(payload=payload):
                url = f"{path}?{urlencode({'order_id': payload})}"
                response = self.client.post(
                    url,
                    data={"action": "pause"},
                    content_type="application/json",
                    **headers,
                )
                self.assertEqual(response.status_code, 400)
                data = response.json()
                self.assertEqual(data["error_code"], 1042)
                self.assertIn("bad_request", data)

    def test_order_post_nonexistent_order_id(self):
        url = f"{reverse('order')}?order_id=999999"
        response = self.client.post(
            url,
            data={"action": "pause"},
            content_type="application/json",
            **self.get_robot_auth(),
        )
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertEqual(data["error_code"], 1042)


class ChatInputValidationTest(RobotAuthMixin, BaseAPITestCase):
    """GET /api/chat/ validates order_id/offset and handles unknown orders."""

    def setUp(self):
        self.create_robot()

    def test_chat_get_missing_order_id(self):
        path = reverse("chat")
        response = self.client.get(path, **self.get_robot_auth())
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data["error_code"], 6000)

    def test_chat_get_sqli_order_id(self):
        path = reverse("chat")
        headers = self.get_robot_auth()

        for payload in SQLI_PAYLOADS:
            with self.subTest(payload=payload):
                response = self.client.get(path, {"order_id": payload}, **headers)
                self.assertEqual(response.status_code, 400)
                data = response.json()
                self.assertEqual(data["error_code"], 6004)
                self.assertIn("bad_request", data)

    def test_chat_get_sqli_offset(self):
        path = reverse("chat")
        headers = self.get_robot_auth()

        for payload in SQLI_PAYLOADS:
            with self.subTest(payload=payload):
                response = self.client.get(
                    path, {"order_id": "1", "offset": payload}, **headers
                )
                self.assertEqual(response.status_code, 400)
                data = response.json()
                self.assertEqual(data["error_code"], 6004)
                self.assertIn("bad_request", data)

    def test_chat_get_nonexistent_order(self):
        path = reverse("chat")
        response = self.client.get(
            path, {"order_id": "999999"}, **self.get_robot_auth()
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data["error_code"], 6000)


class MakerInputValidationTest(RobotAuthMixin, BaseAPITestCase):
    """POST /api/make/ rejects an unknown currency id with 400 and error 1058."""

    def setUp(self):
        Currency.objects.create(
            currency=1, exchange_rate=Decimal("1.0"), timestamp=timezone.now()
        )
        self.create_robot()

    def test_make_nonexistent_currency(self):
        path = reverse("make")
        form = dict(maker_form_buy_with_range, currency=999999)

        response = self.client.post(
            path, data=form, content_type="application/json", **self.get_robot_auth()
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data["error_code"], 1058)
        self.assertIn("bad_request", data)


class ChatPostValidationTest(RobotAuthMixin, BaseAPITestCase):
    """POST /api/chat/ returns 400/6000 for a nonexistent order id."""

    def setUp(self):
        self.create_robot()

    def test_chat_post_nonexistent_order(self):
        path = reverse("chat")
        response = self.client.post(
            path,
            data={"PGP_message": "-----BEGIN PGP MESSAGE-----", "order_id": 999999},
            content_type="application/json",
            **self.get_robot_auth(),
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data["error_code"], 6000)


class TakeRangeValidationTest(RobotAuthMixin, BaseAPITestCase):
    """TAKE on a range order validates the amount before any bond/Lightning step."""

    robot_index = 2

    def setUp(self):
        currency = Currency.objects.create(
            currency=1, exchange_rate=Decimal("1.0"), timestamp=timezone.now()
        )
        maker_user = User.objects.create_user(username="range-maker")
        self.order = Order.objects.create(
            maker=maker_user,
            type=Order.Types.BUY,
            currency=currency,
            status=Order.Status.PUB,
            has_range=True,
            min_amount=Decimal("84"),
            max_amount=Decimal("201.7"),
            payment_method="Advcash Cash F2F",
            is_explicit=False,
            premium=Decimal("3.34"),
            expires_at=timezone.now() + timedelta(hours=1),
            public_duration=60 * 60 * 2,
            escrow_duration=60 * 30,
        )
        self.create_robot()

    def _take(self, payload):
        return self.client.post(
            f"{reverse('order')}?order_id={self.order.id}",
            data=payload,
            content_type="application/json",
            **self.get_robot_auth(),
        )

    def test_take_range_order_without_amount(self):
        response = self._take({"action": "take"})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data["error_code"], 1039)
        self.assertIn("bad_request", data)

    def test_take_range_order_amount_outside_range(self):
        response = self._take({"action": "take", "amount": 999999})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data["error_code"], 1011)
        self.assertIn("bad_request", data)


class TakeNonPublicValidationTest(RobotAuthMixin, BaseAPITestCase):
    """TAKE on an order that is not public returns 400/1046 instead of order data."""

    robot_index = 2

    def setUp(self):
        currency = Currency.objects.create(
            currency=1, exchange_rate=Decimal("1.0"), timestamp=timezone.now()
        )
        maker_user = User.objects.create_user(username="wfb-maker")
        self.order = Order.objects.create(
            maker=maker_user,
            type=Order.Types.BUY,
            currency=currency,
            status=Order.Status.WFB,
            amount=Decimal("100"),
            has_range=False,
            payment_method="Advcash Cash F2F",
            is_explicit=False,
            premium=Decimal("3.34"),
            expires_at=timezone.now() + timedelta(hours=1),
            public_duration=60 * 60 * 2,
            escrow_duration=60 * 30,
        )
        self.create_robot()

    def test_take_nonpublic_order(self):
        response = self.client.post(
            f"{reverse('order')}?order_id={self.order.id}",
            data={"action": "take"},
            content_type="application/json",
            **self.get_robot_auth(),
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data["error_code"], 1046)
        self.assertIn("bad_request", data)

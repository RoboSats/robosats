from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test.utils import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from api.models import Currency, Order
from tests.test_api import BaseAPITestCase

LOCMEM_CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "cache-tests",
    }
}


@override_settings(CACHES=LOCMEM_CACHES)
class APICacheTest(BaseAPITestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_info_cached(self):
        path = reverse("info")

        first = self.client.get(path)
        self.assertEqual(first.status_code, 200)
        self.assertResponse(first)

        second = self.client.get(path)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.json(), first.json())
        self.assertIsNotNone(cache.get("info"))

    def test_price_cached(self):
        path = reverse("price")

        first = self.client.get(path)
        self.assertEqual(first.status_code, 200)
        # /api/price/ returns an object keyed by currency code; its OpenAPI schema
        # declares an array, so assertResponse() cannot be used here.
        second = self.client.get(path)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.json(), first.json())
        self.assertIsNotNone(cache.get("price"))

    def test_book_empty_not_cached(self):
        path = reverse("book")

        response = self.client.get(path)
        self.assertEqual(response.status_code, 404)
        self.assertIsNone(cache.get("book:0:2"))

    def test_book_cached(self):
        currency = Currency.objects.create(
            currency=1, exchange_rate=Decimal("1.0"), timestamp=timezone.now()
        )
        user = User.objects.create(
            username="book-maker-test", last_login=timezone.now()
        )
        Order.objects.create(
            maker=user,
            type=Order.Types.BUY,
            currency=currency,
            status=Order.Status.PUB,
            amount=Decimal("100000"),
            has_range=False,
            expires_at=timezone.now() + timedelta(hours=1),
            public_duration=60 * 60 * 2,
            escrow_duration=60 * 30,
        )

        path = reverse("book")
        first = self.client.get(path)
        self.assertEqual(first.status_code, 200)

        # A new public order must not be visible until the cached copy expires
        Order.objects.create(
            maker=user,
            type=Order.Types.SELL,
            currency=currency,
            status=Order.Status.PUB,
            amount=Decimal("200000"),
            has_range=False,
            expires_at=timezone.now() + timedelta(hours=1),
            public_duration=60 * 60,
            escrow_duration=60 * 30,
        )

        second = self.client.get(path)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.json(), first.json())
        self.assertIsNotNone(cache.get("book:0:2"))

from decouple import config
from django.contrib.auth.models import User
from django.test import Client
from django.urls import reverse

from api.tasks import cache_market
from tests.test_api import BaseAPITestCase


class APILimitsTest(BaseAPITestCase):
    su_pass = "12345678"
    su_name = config("ESCROW_USERNAME", cast=str, default="admin")

    def setUp(self):
        """
        Create a superuser. The superuser is the escrow party.
        """
        self.client = Client()
        User.objects.create_superuser(self.su_name, "super@user.com", self.su_pass)

        # Fetch currency prices from external APIs
        cache_market()

    def test_limits(self):
        path = reverse("limits")

        response = self.client.get(path)
        data = response.json()

        self.assertEqual(response.status_code, 200)
        # self.assertResponse(response) # Expects an array

        self.assertEqual(data["1"]["code"], "USD")
        self.assertIsInstance(data["1"]["price"], float)
        self.assertIsInstance(data["4"]["min_amount"], float)
        self.assertIsInstance(data["10"]["max_amount"], float)
        self.assertEqual(data["1000"]["price"], 1)

import json
from datetime import datetime
from decimal import Decimal

from decouple import config
from django.contrib.auth.models import User
from django.test import Client, TestCase

from api.models import Currency, Order
from api.tasks import cache_market


class TradeTest(TestCase):
    su_pass = "12345678"
    su_name = config("ESCROW_USERNAME", cast=str, default="admin")

    def setUp(self):
        """
        Create a superuser. The superuser is the escrow party.
        """
        self.client = Client()
        User.objects.create_superuser(self.su_name, "super@user.com", self.su_pass)

    def test_login_superuser(self):
        path = "/coordinator/login/"
        data = {"username": self.su_name, "password": self.su_pass}
        response = self.client.post(path, data)
        self.assertEqual(response.status_code, 302)

    def get_robot_auth(self, robot_index):
        """
        Crates an AUTH header that embeds token, pub_key and enc_priv_key into a single string
        just as requested by the robosats token middleware.
        """
        with open(f"tests/robots/{robot_index}/b91_token", "r") as file:
            b91_token = file.read()
        with open(f"tests/robots/{robot_index}/pub_key", "r") as file:
            pub_key = file.read()
        with open(f"tests/robots/{robot_index}/enc_priv_key", "r") as file:
            enc_priv_key = file.read()

        headers = {
            "HTTP_AUTHORIZATION": f"Token {b91_token} | Public {pub_key} | Private {enc_priv_key}"
        }
        return headers, pub_key, enc_priv_key

    def create_robot(self, robot_index):
        """
        Creates the robots in /tests/robots/{robot_index}
        """
        path = "/api/robot/"
        headers, pub_key, enc_priv_key = self.get_robot_auth(robot_index)

        response = self.client.get(path, **headers)
        data = json.loads(response.content.decode())

        with open(f"tests/robots/{robot_index}/nickname", "r") as file:
            expected_nickname = file.read()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            data["nickname"],
            expected_nickname,
            f"Robot {robot_index} created nickname is not MyopicRacket333",
        )
        self.assertEqual(
            data["public_key"], pub_key, "Returned public Kky does not match"
        )
        self.assertEqual(
            data["encrypted_private_key"],
            enc_priv_key,
            "Returned encrypted private key does not match",
        )
        self.assertEqual(
            len(data["tg_token"]), 15, "String is not exactly 15 characters long"
        )
        self.assertEqual(
            data["tg_bot_name"],
            config(
                "TELEGRAM_BOT_NAME", cast=str, default="RoboCoordinatorNotificationBot"
            ),
            "Telegram bot name is not correct",
        )
        self.assertFalse(
            data["tg_enabled"], "The new robot's telegram seems to be enabled"
        )
        self.assertEqual(data["earned_rewards"], 0, "The new robot's rewards are not 0")

    def test_create_robots(self):
        """
        Creates two robots to be used in the trade tests
        """
        self.create_robot(robot_index=1)
        self.create_robot(robot_index=2)

    def test_cache_market(self):
        cache_market()

        usd = Currency.objects.get(id=1)
        self.assertTrue(
            isinstance(usd.exchange_rate, Decimal), "Exchange rate is not decimal"
        )
        self.assertLess(0, usd.exchange_rate, "Exchange rate is not higher than zero")
        self.assertTrue(
            isinstance(usd.timestamp, datetime),
            "Externa price timestamp is not datetime",
        )

    def test_create_order(
        self,
        robot_index=1,
        payment_method="Advcash Cash F2F",
        min_amount=21,
        max_amount=101.7,
        premium=3.34,
        public_duration=69360,
        escrow_duration=8700,
        bond_size=3.5,
        latitude=34.7455,
        longitude=135.503,
    ):
        # Requisites
        # Cache market prices
        self.test_cache_market()
        path = "/api/make/"
        # Get valid robot auth headers
        headers, _, _ = self.get_robot_auth(robot_index)

        # Prepare request body
        maker_form = {
            "type": Order.Types.BUY,
            "currency": 1,
            "has_range": True,
            "min_amount": min_amount,
            "max_amount": max_amount,
            "payment_method": payment_method,
            "is_explicit": False,
            "premium": premium,
            "public_duration": public_duration,
            "escrow_duration": escrow_duration,
            "bond_size": bond_size,
            "latitude": latitude,
            "longitude": longitude,
        }

        response = self.client.post(path, maker_form, **headers)
        data = json.loads(response.content.decode())

        # Checks
        self.assertTrue(isinstance(data["id"], int), "Order ID is not an integer")
        self.assertEqual(
            data["status"],
            Order.Status.WFB,
            "Newly created order status is not 'Waiting for maker bond'",
        )
        self.assertTrue(
            isinstance(datetime.fromisoformat(data["created_at"]), datetime),
            "Order creation timestamp is not datetime",
        )
        self.assertTrue(
            isinstance(datetime.fromisoformat(data["expires_at"]), datetime),
            "Order expiry time is not datetime",
        )
        self.assertEqual(
            data["type"], Order.Types.BUY, "Buy order is not of type value BUY"
        )
        self.assertEqual(data["currency"], 1, "Order for USD is not of currency USD")
        self.assertIsNone(
            data["amount"], "Order with range has a non null simple amount"
        )
        self.assertTrue(data["has_range"], "Order with range has a False has_range")
        self.assertEqual(
            float(data["min_amount"]), min_amount, "Order min amount does not match"
        )
        self.assertEqual(
            float(data["max_amount"]), max_amount, "Order max amount does not match"
        )
        self.assertEqual(
            data["payment_method"],
            payment_method,
            "Order payment method does not match",
        )
        self.assertEqual(
            data["escrow_duration"],
            escrow_duration,
            "Order escrow duration does not match",
        )
        self.assertEqual(
            float(data["bond_size"]), bond_size, "Order bond size does not match"
        )
        self.assertEqual(
            float(data["latitude"]), latitude, "Order latitude does not match"
        )
        self.assertEqual(
            float(data["longitude"]), longitude, "Order longitude does not match"
        )
        self.assertEqual(
            float(data["premium"]), premium, "Order premium does not match"
        )
        self.assertFalse(
            data["is_explicit"], "Relative pricing order has True is_explicit"
        )
        self.assertIsNone(
            data["satoshis"], "Relative pricing order has non null Satoshis"
        )
        self.assertIsNone(data["taker"], "New order's taker is not null")

        with open(f"tests/robots/{robot_index}/nickname", "r") as file:
            maker_nickname = file.read()
            maker_id = User.objects.get(username=maker_nickname).id
        self.assertEqual(
            data["maker"],
            maker_id,
            "Maker user ID is not that of robot index {robot_index}",
        )

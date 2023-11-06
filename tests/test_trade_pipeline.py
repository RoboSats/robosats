import json

from decouple import config
from django.contrib.auth.models import User
from django.test import Client, TestCase


class TradeTest(TestCase):
    su_pass = "12345678"
    su_name = config("ESCROW_USERNAME", cast=str, default="admin")

    def setUp(self):
        self.client = Client()
        User.objects.create_superuser(self.su_name, "super@user.com", self.su_pass)
        print("Super user created")

    def test_login_superuser(self):
        path = "/coordinator/login/"
        data = {"username": self.su_name, "password": self.su_pass}
        response = self.client.post(path, data)
        self.assertEqual(response.status_code, 302)

    def get_robot_auth(self, index):
        with open(f"tests/robots/{index}/b91_token", "r") as file:
            b91_token = file.read()
        with open(f"tests/robots/{index}/pub_key", "r") as file:
            pub_key = file.read()
        with open(f"tests/robots/{index}/enc_priv_key", "r") as file:
            enc_priv_key = file.read()

        headers = {
            "HTTP_AUTHORIZATION": f"Token {b91_token} | Public {pub_key} | Private {enc_priv_key}"
        }
        return headers, pub_key, enc_priv_key

    def create_robot(self, index):
        """
        Creates the robots in /tests/robots/{index}/
        """
        path = "/api/robot/"
        headers, pub_key, enc_priv_key = self.get_robot_auth(index)

        response = self.client.get(path, **headers)
        data = json.loads(response.content.decode())

        with open(f"tests/robots/{index}/nickname", "r") as file:
            expected_nickname = file.read()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            data["nickname"],
            expected_nickname,
            f"Robot {index} created nickname is not MyopicRacket333",
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
        Creates two robots to test trades
        """
        self.create_robot(index=1)

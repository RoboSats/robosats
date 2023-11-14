import json
import time
from datetime import datetime
from decimal import Decimal

from decouple import config
from django.contrib.auth.models import User
from django.urls import reverse

from api.management.commands.follow_invoices import Command as FollowInvoices
from api.models import Currency, Order
from api.tasks import cache_market
from control.tasks import compute_node_balance
from tests.node_utils import (
    CLN_has_active_channels,
    LND_has_active_channels,
    connect_to_node,
    create_address,
    generate_blocks,
    get_cln_node_id,
    get_lnd_node_id,
    open_channel,
    pay_invoice,
    wait_for_active_channels,
    wait_for_cln_node_sync,
    wait_for_lnd_node_sync,
)
from tests.test_api import BaseAPITestCase

LNVENDOR = config("LNVENDOR", cast=str, default="LND")


def read_file(file_path):
    """
    Read a file and return its content.
    """
    with open(file_path, "r") as file:
        return file.read()


class TradeTest(BaseAPITestCase):
    su_pass = "12345678"
    su_name = config("ESCROW_USERNAME", cast=str, default="admin")

    maker_form_buy_with_range = {
        "type": Order.Types.BUY,
        "currency": 1,
        "has_range": True,
        "min_amount": 21,
        "max_amount": 101.7,
        "payment_method": "Advcash Cash F2F",
        "is_explicit": False,
        "premium": 3.34,
        "public_duration": 69360,
        "escrow_duration": 8700,
        "bond_size": 3.5,
        "latitude": 34.7455,
        "longitude": 135.503,
    }

    def wait_nodes_sync():
        wait_for_lnd_node_sync("robot")
        if LNVENDOR == "LND":
            wait_for_lnd_node_sync("coordinator")
        elif LNVENDOR == "CLN":
            wait_for_cln_node_sync()

    def wait_channels():
        wait_for_active_channels("LND", "robot")
        wait_for_active_channels(LNVENDOR, "coordinator")

    def channel_is_active():
        robot_channel_active = LND_has_active_channels("robot")
        if LNVENDOR == "LND":
            coordinator_channel_active = LND_has_active_channels("coordinator")
        elif LNVENDOR == "CLN":
            coordinator_channel_active = CLN_has_active_channels()
        return robot_channel_active and coordinator_channel_active

    @classmethod
    def setUpTestData(cls):
        """
        Set up initial data for the test case.
        """
        # Create super user
        User.objects.create_superuser(cls.su_name, "super@user.com", cls.su_pass)

        # Fetch currency prices from external APIs
        cache_market()

        # Skip node setup and channel creation if both nodes have an active channel already
        if cls.channel_is_active():
            print("Regtest network was already ready. Skipping initalization.")
            # Take the first node balances snapshot
            compute_node_balance()
            return

        # Fund two LN nodes in regtest and open channels
        # Coordinator is either LND or CLN. Robot user is always LND.
        if LNVENDOR == "LND":
            coordinator_node_id = get_lnd_node_id("coordinator")
            coordinator_port = 9735
        elif LNVENDOR == "CLN":
            coordinator_node_id = get_cln_node_id()
            coordinator_port = 9737

        print("Coordinator Node ID: ", coordinator_node_id)

        funding_address = create_address("robot")
        generate_blocks(funding_address, 101)
        cls.wait_nodes_sync()

        # Open channel between Robot user and coordinator
        print(f"\nOpening channel from Robot user node to coordinator {LNVENDOR} node")
        connect_to_node("robot", coordinator_node_id, f"localhost:{coordinator_port}")
        open_channel("robot", coordinator_node_id, 100_000_000, 50_000_000)

        # Generate 10 blocks so the channel becomes active and wait for sync
        generate_blocks(funding_address, 10)

        # Wait a tiny bit so payments can be done in the new channel
        cls.wait_nodes_sync()
        cls.wait_channels()
        time.sleep(1)

        # Take the first node balances snapshot
        compute_node_balance()

    def test_login_superuser(self):
        """
        Test the login functionality for the superuser.
        """
        path = reverse("admin:login")
        data = {"username": self.su_name, "password": self.su_pass}
        response = self.client.post(path, data)
        self.assertEqual(response.status_code, 302)
        self.assertResponse(
            response
        )  # should skip given that /coordinator/login is not documented

    def test_cache_market(self):
        """
        Test if the cache_market() call during test setup worked
        """
        usd = Currency.objects.get(id=1)
        self.assertIsInstance(
            usd.exchange_rate,
            Decimal,
            f"Exchange rate is not a Decimal. Got {type(usd.exchange_rate)}",
        )
        self.assertGreater(
            usd.exchange_rate, 0, "Exchange rate is not higher than zero"
        )
        self.assertIsInstance(
            usd.timestamp, datetime, "External price timestamp is not a datetime"
        )

    def get_robot_auth(self, robot_index, first_encounter=False):
        """
        Create an AUTH header that embeds token, pub_key, and enc_priv_key into a single string
        as requested by the robosats token middleware.
        """

        b91_token = read_file(f"tests/robots/{robot_index}/b91_token")
        pub_key = read_file(f"tests/robots/{robot_index}/pub_key")
        enc_priv_key = read_file(f"tests/robots/{robot_index}/enc_priv_key")

        # First time a robot authenticated, it is registered by the backend, so pub_key and enc_priv_key is needed
        if first_encounter:
            headers = {
                "HTTP_AUTHORIZATION": f"Token {b91_token} | Public {pub_key} | Private {enc_priv_key}"
            }
        else:
            headers = {"HTTP_AUTHORIZATION": f"Token {b91_token}"}

        return headers

    def assert_robot(self, response, robot_index):
        """
        Assert that the robot is created correctly.
        """
        nickname = read_file(f"tests/robots/{robot_index}/nickname")
        pub_key = read_file(f"tests/robots/{robot_index}/pub_key")
        enc_priv_key = read_file(f"tests/robots/{robot_index}/enc_priv_key")

        data = json.loads(response.content.decode())

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

        self.assertEqual(
            data["nickname"],
            nickname,
            f"Robot created nickname is not {nickname}",
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

    def create_robot(self, robot_index):
        """
        Creates the robots in /tests/robots/{robot_index}
        """
        path = reverse("robot")
        headers = self.get_robot_auth(robot_index, True)

        return self.client.get(path, **headers)

    def test_create_robots(self):
        """
        Test the creation of two robots to be used in the trade tests
        """
        for robot_index in [1, 2]:
            response = self.create_robot(robot_index)
            self.assert_robot(response, robot_index)

    def make_order(self, maker_form, robot_index=1):
        """
        Create an order for the test.
        """
        path = reverse("make")
        # Get valid robot auth headers
        headers = self.get_robot_auth(robot_index, True)

        response = self.client.post(path, maker_form, **headers)
        return response

    def test_make_order(self):
        """
        Test the creation of an order.
        """
        maker_form = self.maker_form_buy_with_range
        response = self.make_order(maker_form, robot_index=1)
        data = json.loads(response.content.decode())

        # Checks
        self.assertResponse(response)

        self.assertIsInstance(data["id"], int, "Order ID is not an integer")
        self.assertEqual(
            data["status"],
            Order.Status.WFB,
            "Newly created order status is not 'Waiting for maker bond'",
        )
        self.assertIsInstance(
            datetime.fromisoformat(data["created_at"]),
            datetime,
            "Order creation timestamp is not datetime",
        )
        self.assertIsInstance(
            datetime.fromisoformat(data["expires_at"]),
            datetime,
            "Order expiry time is not datetime",
        )
        self.assertEqual(
            data["type"], Order.Types.BUY, "Buy order is not of type value BUY"
        )
        self.assertEqual(data["currency"], 1, "Order for USD is not of currency USD")
        self.assertIsNone(
            data["amount"], "Order with range has a non-null simple amount"
        )
        self.assertTrue(data["has_range"], "Order with range has a False has_range")
        self.assertAlmostEqual(
            float(data["min_amount"]),
            maker_form["min_amount"],
            "Order min amount does not match",
        )
        self.assertAlmostEqual(
            float(data["max_amount"]),
            maker_form["max_amount"],
            "Order max amount does not match",
        )
        self.assertEqual(
            data["payment_method"],
            maker_form["payment_method"],
            "Order payment method does not match",
        )
        self.assertEqual(
            data["escrow_duration"],
            maker_form["escrow_duration"],
            "Order escrow duration does not match",
        )
        self.assertAlmostEqual(
            float(data["bond_size"]),
            maker_form["bond_size"],
            "Order bond size does not match",
        )
        self.assertAlmostEqual(
            float(data["latitude"]),
            maker_form["latitude"],
            "Order latitude does not match",
        )
        self.assertAlmostEqual(
            float(data["longitude"]),
            maker_form["longitude"],
            "Order longitude does not match",
        )
        self.assertAlmostEqual(
            float(data["premium"]),
            maker_form["premium"],
            "Order premium does not match",
        )
        self.assertFalse(
            data["is_explicit"], "Relative pricing order has True is_explicit"
        )
        self.assertIsNone(
            data["satoshis"], "Relative pricing order has non-null Satoshis"
        )
        self.assertIsNone(data["taker"], "New order's taker is not null")

        return data

    def get_order(self, order_id, robot_index=1, first_encounter=False):
        path = reverse("order")
        params = f"?order_id={order_id}"
        headers = self.get_robot_auth(robot_index, first_encounter)
        response = self.client.get(path + params, **headers)

        return response

    def cancel_order(self, order_id, robot_index=1):
        path = reverse("order")
        params = f"?order_id={order_id}"
        headers = self.get_robot_auth(robot_index)
        body = {"action": "cancel"}
        response = self.client.post(path + params, body, **headers)

        return response

    def test_get_order_created(self):
        """
        Tests the creation of an order and the first request to see details,
        including, the creation of the maker bond invoice.
        """
        maker_form = self.maker_form_buy_with_range
        robot_index = 1

        order_made_response = self.make_order(maker_form, robot_index)
        order_made_data = json.loads(order_made_response.content.decode())

        # Maker's first order fetch. Should trigger maker bond hold invoice generation.
        response = self.get_order(order_made_data["id"])
        data = json.loads(response.content.decode())

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

        self.assertEqual(data["id"], order_made_data["id"])
        self.assertTrue(
            isinstance(datetime.fromisoformat(data["created_at"]), datetime)
        )
        self.assertTrue(
            isinstance(datetime.fromisoformat(data["expires_at"]), datetime)
        )
        self.assertTrue(data["is_maker"])
        self.assertTrue(data["is_participant"])
        self.assertTrue(data["is_buyer"])
        self.assertFalse(data["is_seller"])
        self.assertEqual(data["maker_status"], "Active")
        self.assertEqual(data["status_message"], Order.Status(Order.Status.WFB).label)
        self.assertFalse(data["is_fiat_sent"])
        self.assertFalse(data["is_disputed"])
        self.assertEqual(
            data["ur_nick"], read_file(f"tests/robots/{robot_index}/nickname")
        )
        self.assertTrue(isinstance(data["satoshis_now"], int))
        self.assertFalse(data["maker_locked"])
        self.assertFalse(data["taker_locked"])
        self.assertFalse(data["escrow_locked"])
        self.assertTrue(isinstance(data["bond_satoshis"], int))

        # Cancel order to avoid leaving pending HTLCs after a successful test
        self.cancel_order(data["id"])

    def check_for_locked_bonds(self):
        # A background thread checks every 5 second the status of invoices. We invoke directly during test.
        # It will ask LND via gRPC. In our test, the request/response from LND is mocked, and it will return fake invoice status "ACCEPTED"
        follow_invoices = FollowInvoices()
        follow_invoices.follow_hold_invoices()

    def make_and_publish_order(self, maker_form, robot_index=1):
        # Make an order
        order_made_response = self.make_order(maker_form, robot_index)
        order_made_data = json.loads(order_made_response.content.decode())

        # Maker's first order fetch. Should trigger maker bond hold invoice generation.
        response = self.get_order(order_made_data["id"])
        invoice = response.json()["bond_invoice"]

        # Lock the invoice from the robot's node
        pay_invoice("robot", invoice)

        # Check for invoice locked (the mocked LND will return ACCEPTED)
        self.check_for_locked_bonds()

        # Get order
        response = self.get_order(order_made_data["id"])
        return response

    def test_publish_order(self):
        """
        Tests a trade from order creation to published (maker bond locked).
        """
        maker_form = self.maker_form_buy_with_range
        # Get order
        response = self.make_and_publish_order(maker_form)
        data = json.loads(response.content.decode())

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

        self.assertEqual(data["id"], data["id"])
        self.assertEqual(data["status_message"], Order.Status(Order.Status.PUB).label)
        self.assertTrue(data["maker_locked"])
        self.assertFalse(data["taker_locked"])
        self.assertFalse(data["escrow_locked"])

        # Test what we can see with newly created robot 2 (only for public status)
        public_response = self.get_order(
            data["id"], robot_index=2, first_encounter=True
        )
        public_data = json.loads(public_response.content.decode())

        self.assertFalse(public_data["is_participant"])
        self.assertTrue(isinstance(public_data["price_now"], float))
        self.assertTrue(isinstance(data["satoshis_now"], int))

        # Cancel order to avoid leaving pending HTLCs after a successful test
        self.cancel_order(data["id"])

    def take_order(self, order_id, amount, robot_index=2):
        path = reverse("order")
        params = f"?order_id={order_id}"
        headers = self.get_robot_auth(robot_index, first_encounter=True)
        body = {"action": "take", "amount": amount}
        response = self.client.post(path + params, body, **headers)

        return response

    def make_and_take_order(
        self, maker_form, take_amount=80, maker_index=1, taker_index=2
    ):
        response_published = self.make_and_publish_order(maker_form, maker_index)
        data_publised = json.loads(response_published.content.decode())
        response = self.take_order(data_publised["id"], take_amount, taker_index)
        return response

    def test_make_and_take_order(self):
        """
        Tests a trade from order creation to taken.
        """
        maker_index = 1
        taker_index = 2
        maker_form = self.maker_form_buy_with_range

        response = self.make_and_take_order(maker_form, 80, maker_index, taker_index)
        data = json.loads(response.content.decode())

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

        self.assertEqual(data["status_message"], Order.Status(Order.Status.TAK).label)
        self.assertEqual(
            data["ur_nick"], read_file(f"tests/robots/{taker_index}/nickname")
        )
        self.assertEqual(
            data["taker_nick"], read_file(f"tests/robots/{taker_index}/nickname")
        )
        self.assertEqual(
            data["maker_nick"], read_file(f"tests/robots/{maker_index}/nickname")
        )
        self.assertEqual(data["maker_status"], "Active")
        self.assertEqual(data["taker_status"], "Active")
        self.assertFalse(data["is_maker"])
        self.assertFalse(data["is_buyer"])
        self.assertTrue(data["is_seller"])
        self.assertTrue(data["is_taker"])
        self.assertTrue(data["is_participant"])
        self.assertTrue(data["maker_locked"])
        self.assertFalse(data["taker_locked"])
        self.assertFalse(data["escrow_locked"])

        # Cancel order to avoid leaving pending HTLCs after a successful test
        self.cancel_order(data["id"])

    def make_and_lock_contract(
        self, maker_form, take_amount=80, maker_index=1, taker_index=2
    ):
        # Make an order
        order_taken_response = self.make_and_take_order(
            maker_form, take_amount, maker_index, taker_index
        )
        order_taken_data = json.loads(order_taken_response.content.decode())

        # Maker's first order fetch. Should trigger maker bond hold invoice generation.
        response = self.get_order(order_taken_data["id"], taker_index)
        invoice = response.json()["bond_invoice"]

        # Lock the invoice from the robot's node
        pay_invoice("robot", invoice)

        # Check for invoice locked (the mocked LND will return ACCEPTED)
        self.check_for_locked_bonds()

        # Get order
        response = self.get_order(order_taken_data["id"], taker_index)
        return response

    def test_make_and_lock_contract(self):
        """
        Tests a trade from order creation to taker bond locked.
        """
        maker_index = 1
        taker_index = 2
        maker_form = self.maker_form_buy_with_range

        response = self.make_and_lock_contract(maker_form, 80, maker_index, taker_index)
        data = json.loads(response.content.decode())

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

        self.assertEqual(data["status_message"], Order.Status(Order.Status.WF2).label)
        self.assertEqual(data["maker_status"], "Active")
        self.assertEqual(data["taker_status"], "Active")
        self.assertTrue(data["is_participant"])
        self.assertTrue(data["maker_locked"])
        self.assertTrue(data["taker_locked"])
        self.assertFalse(data["escrow_locked"])

        # Cancel order to avoid leaving pending HTLCs after a successful test
        self.cancel_order(data["id"])

    def trade_to_locked_escrow(
        self, maker_form, take_amount=80, maker_index=1, taker_index=2
    ):
        # Make an order
        locked_taker_response = self.make_and_lock_contract(
            maker_form, take_amount, maker_index, taker_index
        )
        locked_taker_response_data = json.loads(locked_taker_response.content.decode())

        # Maker's first order fetch. Should trigger maker bond hold invoice generation.
        response = self.get_order(locked_taker_response_data["id"], taker_index)
        print("HEREEEEEEEEEEEEEEEEEEEEEEREEEEEEEEEEEEEEEE")
        print(response.json())
        invoice = response.json()["escrow_invoice"]

        # Lock the invoice from the robot's node
        pay_invoice("robot", invoice)

        # Check for invoice locked (the mocked LND will return ACCEPTED)
        self.check_for_locked_bonds()

        # Get order
        response = self.get_order(locked_taker_response_data["id"], taker_index)
        return response

    def test_trade_to_locked_escrow(self):
        """
        Tests a trade from order creation until escrow locked, before
        invoice/address is submitted by buyer.
        """
        maker_index = 1
        taker_index = 2
        maker_form = self.maker_form_buy_with_range

        response = self.trade_to_locked_escrow(maker_form, 80, maker_index, taker_index)
        data = json.loads(response.content.decode())

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

        self.assertEqual(data["status_message"], Order.Status(Order.Status.WFI).label)
        self.assertTrue(data["maker_locked"])
        self.assertTrue(data["taker_locked"])
        self.assertTrue(data["escrow_locked"])

        # Cancel order to avoid leaving pending HTLCs after a successful test
        self.cancel_order(data["id"], 2)

from unittest.mock import patch
from datetime import datetime
from django.urls import reverse

from api.management.commands.clean_orders import Command as CleanOrders
from api.management.commands.follow_invoices import Command as FollowInvoices
from api.models import Order, TakeOrder
from api.tasks import follow_send_payment, send_notification
from tests.utils.node import (
    add_invoice,
    create_address,
    generate_blocks,
    pay_invoice,
    wait_nodes_sync,
)
from tests.utils.pgp import sign_message

maker_form_buy_with_range = {
    "type": Order.Types.BUY,
    "currency": 1,
    "has_range": True,
    "min_amount": 84,
    "max_amount": 201.7,
    "payment_method": "Advcash Cash F2F",
    "is_explicit": False,
    "premium": 3.34,
    "public_duration": 69360,
    "escrow_duration": 8700,
    "bond_size": 3.5,
    "latitude": 34.7455,
    "longitude": 135.503,
}


def read_file(file_path):
    """
    Read a file and return its content.
    """
    with open(file_path, "r") as file:
        return file.read()


class Trade:
    response = None  # Stores the latest response of Order endpoint

    def __init__(
        self,
        client,
        maker_form=maker_form_buy_with_range,
        take_amount=100,
        maker_index=1,
        taker_index=2,
        third_index=3,
    ):
        self.client = client
        self.maker_form = maker_form
        self.take_amount = take_amount
        self.maker_index = maker_index
        self.taker_index = taker_index
        self.third_index = third_index

        self.make_order(self.maker_form, maker_index)

    def get_robot_auth(self, robot_index):
        """
        Create an AUTH header that embeds token, pub_key, and enc_priv_key into a single string
        as requested by the robosats token middleware.
        """

        b91_token = read_file(f"tests/robots/{robot_index}/b91_token")
        pub_key = read_file(f"tests/robots/{robot_index}/pub_key")
        enc_priv_key = read_file(f"tests/robots/{robot_index}/enc_priv_key")
        nostr_pubkey = read_file(f"tests/robots/{robot_index}/nostr_pubkey")

        # First time a robot authenticated, it is registered by the backend, so pub_key and enc_priv_key is needed
        headers = {
            "HTTP_AUTHORIZATION": f"Token {b91_token} | Public {pub_key} | Private {enc_priv_key} | Nostr {nostr_pubkey}"
        }

        return headers

    def create_robot(self, robot_index):
        """
        Creates the robots in /tests/robots/{robot_index}
        """
        path = reverse("robot")
        headers = self.get_robot_auth(robot_index)

        return self.client.get(path, **headers)

    def make_order(self, maker_form, robot_index=1):
        """
        Create an order for the test.
        """
        path = reverse("make")
        # Get valid robot auth headers
        headers = self.get_robot_auth(robot_index)

        response = self.client.post(path, maker_form, **headers)

        self.response = response
        if response.status_code == 201:
            self.order_id = response.json()["id"]

    def get_order(self, robot_index=1):
        """
        Fetch the latest state of the order
        """
        path = reverse("order")
        params = f"?order_id={self.order_id}"
        headers = self.get_robot_auth(robot_index)
        self.response = self.client.get(path + params, **headers)

    def get_review(self, robot_index=1):
        """
        Generates coordinator's review signature
        """
        path = reverse("review")
        headers = self.get_robot_auth(robot_index)
        nostr_pubkey = read_file(f"tests/robots/{robot_index}/nostr_pubkey")
        body = {"pubkey": nostr_pubkey}
        self.response = self.client.post(path, body, **headers)

    @patch("api.tasks.send_notification.delay", send_notification)
    def cancel_order(self, robot_index=1, cancel_status=None):
        path = reverse("order")
        params = f"?order_id={self.order_id}"
        headers = self.get_robot_auth(robot_index)
        body = {"action": "cancel"}
        if cancel_status is not None:
            body.update({"cancel_status": cancel_status})
        self.response = self.client.post(path + params, body, **headers)

    @patch("api.tasks.send_notification.delay", send_notification)
    def send_chat_message(self, message, robot_index=1):
        path = reverse("chat")
        headers = self.get_robot_auth(robot_index)
        body = {"PGP_message": message, "order_id": self.order_id, "offset": 0}
        self.response = self.client.post(path, data=body, **headers)

    @patch("api.tasks.send_notification.delay", send_notification)
    def pause_order(self, robot_index=1):
        path = reverse("order")
        params = f"?order_id={self.order_id}"
        headers = self.get_robot_auth(robot_index)
        body = {"action": "pause"}
        self.response = self.client.post(path + params, body, **headers)

    @patch("api.tasks.send_notification.delay", send_notification)
    def follow_hold_invoices(self):
        # A background thread checks every 5 second the status of invoices. We invoke directly during test.
        follower = FollowInvoices()
        follower.follow_hold_invoices()

    @patch("api.tasks.send_notification.delay", send_notification)
    def clean_orders(self):
        # A background thread checks every 5 second order expirations. We invoke directly during test.
        cleaner = CleanOrders()
        cleaner.clean_orders()

    @patch("api.tasks.follow_send_payment.delay", follow_send_payment)
    def process_payouts(self, mine_a_block=False):
        # A background thread checks every 5 second whether there are outgoing payments. We invoke directly during test.
        follow_invoices = FollowInvoices()
        follow_invoices.send_payments()
        if mine_a_block:
            generate_blocks(create_address("robot"), 1)
            wait_nodes_sync()

    @patch("api.tasks.send_notification.delay", send_notification)
    def publish_order(self):
        # Maker's first order fetch. Should trigger maker bond hold invoice generation.
        self.get_order()
        invoice = self.response.json()["bond_invoice"]

        # Lock the invoice from the robot's node
        pay_invoice("robot", invoice)

        # Check for invoice locked (the mocked LND will return ACCEPTED)
        self.follow_hold_invoices()

        # Get order
        self.get_order()

    @patch("api.tasks.send_notification.delay", send_notification)
    def publish_password_order(self):
        # Maker's first order fetch. Should trigger maker bond hold invoice generation.
        self.get_order()
        invoice = self.response.json()["bond_invoice"]

        # Lock the invoice from the robot's node
        pay_invoice("robot", invoice)

        # Check for invoice locked (the mocked LND will return ACCEPTED)
        self.follow_hold_invoices()

        # Get order
        self.get_order()

    @patch("api.tasks.send_notification.delay", send_notification)
    def take_order(self):
        path = reverse("order")
        params = f"?order_id={self.order_id}"
        headers = self.get_robot_auth(self.taker_index)
        body = {"action": "take", "amount": self.take_amount}
        self.response = self.client.post(path + params, body, **headers)

    @patch("api.tasks.send_notification.delay", send_notification)
    def take_password_order(self, password):
        path = reverse("order")
        params = f"?order_id={self.order_id}"
        headers = self.get_robot_auth(self.taker_index)
        body = {"action": "take", "amount": self.take_amount, "password": password}
        self.response = self.client.post(path + params, body, **headers)

    @patch("api.tasks.send_notification.delay", send_notification)
    def take_order_third(self):
        path = reverse("order")
        params = f"?order_id={self.order_id}"
        headers = self.get_robot_auth(self.third_index)
        body = {"action": "take", "amount": self.take_amount}
        self.response = self.client.post(path + params, body, **headers)

    @patch("api.tasks.send_notification.delay", send_notification)
    def lock_taker_bond(self):
        # Takers's first order fetch. Should trigger maker bond hold invoice generation.
        self.get_order(self.taker_index)
        invoice = self.response.json()["bond_invoice"]

        # Lock the invoice from the robot's node
        pay_invoice("robot", invoice)

        # Check for invoice locked (the mocked LND will return ACCEPTED)
        self.follow_hold_invoices()

        # Get order
        self.get_order(self.taker_index)

    @patch("api.tasks.send_notification.delay", send_notification)
    def lock_escrow(self, robot_index):
        # Takers's order fetch. Should trigger trade escrow bond hold invoice generation.
        self.get_order(robot_index)
        invoice = self.response.json()["escrow_invoice"]

        # Lock the invoice from the robot's node
        pay_invoice("robot", invoice)

        # Check for invoice locked (the mocked LND will return ACCEPTED)
        self.follow_hold_invoices()

        # Get order
        self.get_order()

    @patch("api.tasks.send_notification.delay", send_notification)
    def pay_invoice(self, invoice):
        # Lock the invoice from the robot's node
        pay_invoice("robot", invoice)

    @patch("api.tasks.send_notification.delay", send_notification)
    def submit_payout_address(self, robot_index=1):
        path = reverse("order")
        params = f"?order_id={self.order_id}"
        headers = self.get_robot_auth(robot_index)

        payout_address = create_address("robot")
        signed_payout_address = sign_message(
            payout_address,
            passphrase_path=f"tests/robots/{robot_index}/token",
            private_key_path=f"tests/robots/{robot_index}/enc_priv_key",
        )
        body = {
            "action": "update_address",
            "address": signed_payout_address,
            "mining_fee_rate": 50,
        }
        self.response = self.client.post(path + params, body, **headers)

    @patch("api.tasks.send_notification.delay", send_notification)
    def submit_payout_invoice(self, robot_index=1, routing_budget=0):
        path = reverse("order")
        params = f"?order_id={self.order_id}"
        headers = self.get_robot_auth(robot_index)

        self.get_order(robot_index)

        payout_invoice = add_invoice("robot", self.response.json()["trade_satoshis"])
        signed_payout_invoice = sign_message(
            payout_invoice,
            passphrase_path=f"tests/robots/{robot_index}/token",
            private_key_path=f"tests/robots/{robot_index}/enc_priv_key",
        )
        body = {
            "action": "update_invoice",
            "invoice": signed_payout_invoice,
            "routing_budget_ppm": routing_budget,
        }

        self.response = self.client.post(path + params, body, **headers)

    @patch("api.tasks.send_notification.delay", send_notification)
    def confirm_fiat(self, robot_index=1):
        path = reverse("order")
        params = f"?order_id={self.order_id}"
        headers = self.get_robot_auth(robot_index)
        body = {"action": "confirm"}
        self.response = self.client.post(path + params, body, **headers)

    @patch("api.tasks.send_notification.delay", send_notification)
    def undo_confirm_sent(self, robot_index=1):
        path = reverse("order")
        params = f"?order_id={self.order_id}"
        headers = self.get_robot_auth(robot_index)
        body = {"action": "undo_confirm"}
        self.response = self.client.post(path + params, body, **headers)

    @patch("api.tasks.send_notification.delay", send_notification)
    def expire_order(self):
        # Change order expiry to now
        order = Order.objects.get(id=self.order_id)
        order.expires_at = datetime.now()
        order.save()

        take_order_queryset = TakeOrder.objects.filter(order=order)
        for idx, take_order in enumerate(take_order_queryset):
            take_order.expires_at = datetime.now()
            take_order.save()

    @patch("api.tasks.send_notification.delay", send_notification)
    def change_order_status(self, status):
        # Change order expiry to now
        order = Order.objects.get(id=self.order_id)
        order.update_status(status)

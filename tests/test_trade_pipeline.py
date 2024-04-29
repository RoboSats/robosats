from datetime import datetime
from decimal import Decimal

from decouple import config
from django.contrib.auth.models import User
from django.urls import reverse

from api.models import Currency, Order
from api.tasks import cache_market
from django.contrib.admin.sites import AdminSite
from control.models import BalanceLog
from control.tasks import compute_node_balance, do_accounting
from tests.test_api import BaseAPITestCase
from tests.utils.node import add_invoice, set_up_regtest_network
from tests.utils.pgp import sign_message
from tests.utils.trade import Trade

from api.admin import OrderAdmin


def read_file(file_path):
    """
    Read a file and return its content.
    """
    with open(file_path, "r") as file:
        return file.read()


class TradeTest(BaseAPITestCase):
    su_pass = "12345678"
    su_name = config("ESCROW_USERNAME", cast=str, default="admin")

    @classmethod
    def setUpTestData(cls):
        """
        Set up initial data for the test case.
        """
        # Create super user
        User.objects.create_superuser(cls.su_name, "super@user.com", cls.su_pass)

        # Fetch currency prices from external APIs
        cache_market()

        # Initialize bitcoin core, mine some blocks, connect nodes, open channel
        set_up_regtest_network()

        # Take the first node balances snapshot
        compute_node_balance()

    def assert_order_logs(self, order_id):
        order = Order.objects.get(id=order_id)
        order_admin = OrderAdmin(model=Order, admin_site=AdminSite())
        try:
            result = order_admin._logs(order)
            self.assertIsInstance(result, str)
        except Exception as e:
            self.fail(f"Exception occurred: {e}")

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

    def test_initial_balance_log(self):
        """
        Test if the initial node BalanceLog is correct.
        One channel should exist with 0.5BTC in local.
        No onchain balance should exist.
        """
        balance_log = BalanceLog.objects.latest()

        self.assertIsInstance(balance_log.time, datetime)
        self.assertTrue(balance_log.total > 0)
        self.assertTrue(balance_log.ln_local > 0)
        self.assertTrue(balance_log.ln_local_unsettled >= 0)
        self.assertTrue(balance_log.ln_remote > 0)
        self.assertEqual(balance_log.ln_remote_unsettled, 0)
        self.assertTrue(balance_log.onchain_total > 0)
        self.assertTrue(balance_log.onchain_confirmed > 0)
        self.assertEqual(balance_log.onchain_unconfirmed, 0)
        self.assertTrue(balance_log.onchain_fraction > 0)

    def assert_robot(self, response, robot_index):
        """
        Assert that the robot is created correctly.
        """
        nickname = read_file(f"tests/robots/{robot_index}/nickname")
        pub_key = read_file(f"tests/robots/{robot_index}/pub_key")
        enc_priv_key = read_file(f"tests/robots/{robot_index}/enc_priv_key")

        data = response.json()

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

    def test_create_robots(self):
        """
        Test the creation of two robots to be used in the trade tests
        """
        trade = Trade(self.client)
        for robot_index in [1, 2]:
            response = trade.create_robot(robot_index)
            self.assert_robot(response, robot_index)

    def test_make_order(self):
        """
        Test the creation of an order.
        """
        trade = Trade(
            self.client
        )  # init of Trade calls make_order() with the default maker form.
        data = trade.response.json()

        # Checks
        self.assertResponse(trade.response)

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
            trade.maker_form["min_amount"],
            "Order min amount does not match",
        )
        self.assertAlmostEqual(
            float(data["max_amount"]),
            trade.maker_form["max_amount"],
            "Order max amount does not match",
        )
        self.assertEqual(
            data["payment_method"],
            trade.maker_form["payment_method"],
            "Order payment method does not match",
        )
        self.assertEqual(
            data["escrow_duration"],
            trade.maker_form["escrow_duration"],
            "Order escrow duration does not match",
        )
        self.assertAlmostEqual(
            float(data["bond_size"]),
            trade.maker_form["bond_size"],
            "Order bond size does not match",
        )
        self.assertAlmostEqual(
            float(data["latitude"]),
            trade.maker_form["latitude"],
            "Order latitude does not match",
        )
        self.assertAlmostEqual(
            float(data["longitude"]),
            trade.maker_form["longitude"],
            "Order longitude does not match",
        )
        self.assertAlmostEqual(
            float(data["premium"]),
            trade.maker_form["premium"],
            "Order premium does not match",
        )
        self.assertFalse(
            data["is_explicit"], "Relative pricing order has True is_explicit"
        )
        self.assertIsNone(
            data["satoshis"], "Relative pricing order has non-null Satoshis"
        )
        self.assertIsNone(data["taker"], "New order's taker is not null")
        self.assert_order_logs(data["id"])

    def test_make_order_on_blocked_country(self):
        """
        Test the creation of an F2F order on a geoblocked location
        """
        trade = Trade(
            self.client,
            # latitude and longitud in Aruba. One of the countries blocked in the example conf.
            maker_form={
                "type": 0,
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
                "latitude": -11.8014,  # Angola AGO
                "longitude": 17.3575,
            },
        )  # init of Trade calls make_order() with the default maker form.
        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 400)
        self.assertResponse(trade.response)

        self.assertEqual(
            data["bad_request"], "The coordinator does not support orders in AGO"
        )

    def test_get_order_created(self):
        """
        Tests the creation of an order and the first request to see details,
        including, the creation of the maker bond invoice.
        """
        robot_index = 1
        trade = Trade(
            self.client, maker_index=robot_index
        )  # init of Trade calls make_order() with the default maker form.

        # Maker's first order fetch. Should trigger maker bond hold invoice generation.
        trade.get_order()
        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(data["id"], trade.order_id)
        self.assertIsInstance(datetime.fromisoformat(data["created_at"]), datetime)
        self.assertIsInstance(datetime.fromisoformat(data["expires_at"]), datetime)
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
        self.assertEqual(
            data["maker_nick"], read_file(f"tests/robots/{robot_index}/nickname")
        )
        self.assertIsHash(data["maker_hash_id"])
        self.assertIsInstance(data["satoshis_now"], int)
        self.assertFalse(data["maker_locked"])
        self.assertFalse(data["taker_locked"])
        self.assertFalse(data["escrow_locked"])
        self.assertIsInstance(data["bond_satoshis"], int)

        # Cancel order to avoid leaving pending HTLCs after a successful test
        trade.cancel_order()

        self.assert_order_logs(data["id"])

    def test_publish_order(self):
        """
        Tests a trade from order creation to published (maker bond locked).
        """
        trade = Trade(self.client)
        trade.publish_order()
        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(data["id"], data["id"])
        self.assertEqual(data["status_message"], Order.Status(Order.Status.PUB).label)
        self.assertTrue(data["maker_locked"])
        self.assertFalse(data["taker_locked"])
        self.assertFalse(data["escrow_locked"])

        # Test what we can see with newly created robot 2 (only for public status)
        trade.get_order(robot_index=2, first_encounter=True)
        public_data = trade.response.json()

        self.assertFalse(public_data["is_participant"])
        self.assertIsInstance(public_data["price_now"], float)
        self.assertIsInstance(data["satoshis_now"], int)

        # Cancel order to avoid leaving pending HTLCs after a successful test
        trade.cancel_order()

        self.assert_order_logs(data["id"])

    def test_pause_unpause_order(self):
        """
        Tests pausing and unpausing a public order
        """
        trade = Trade(self.client)
        trade.publish_order()
        data = trade.response.json()

        # PAUSE
        trade.pause_order()
        data = trade.response.json()

        self.assertResponse(trade.response)
        self.assertEqual(data["status_message"], Order.Status(Order.Status.PAU).label)

        # UNPAUSE
        trade.pause_order()
        data = trade.response.json()

        self.assertResponse(trade.response)
        self.assertEqual(data["status_message"], Order.Status(Order.Status.PUB).label)

        # Cancel order to avoid leaving pending HTLCs after a successful test
        trade.cancel_order()

        self.assert_order_logs(data["id"])

    def test_make_and_take_order(self):
        """
        Tests a trade from order creation to taken.
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()

        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(data["status_message"], Order.Status(Order.Status.TAK).label)
        self.assertEqual(
            data["ur_nick"], read_file(f"tests/robots/{trade.taker_index}/nickname")
        )
        self.assertEqual(
            data["taker_nick"], read_file(f"tests/robots/{trade.taker_index}/nickname")
        )
        self.assertEqual(
            data["maker_nick"], read_file(f"tests/robots/{trade.maker_index}/nickname")
        )
        self.assertIsHash(data["maker_hash_id"])
        self.assertIsHash(data["taker_hash_id"])
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
        trade.cancel_order()

        self.assert_order_logs(data["id"])

    def test_make_and_lock_contract(self):
        """
        Tests a trade from order creation to taker bond locked.
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()

        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(data["status_message"], Order.Status(Order.Status.WF2).label)
        self.assertEqual(data["maker_status"], "Active")
        self.assertEqual(data["taker_status"], "Active")
        self.assertTrue(data["is_participant"])
        self.assertTrue(data["maker_locked"])
        self.assertTrue(data["taker_locked"])
        self.assertFalse(data["escrow_locked"])

        # Maker GET
        trade.get_order(trade.maker_index)
        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(data["status_message"], Order.Status(Order.Status.WF2).label)
        self.assertTrue(data["swap_allowed"])
        self.assertIsInstance(data["suggested_mining_fee_rate"], float)
        self.assertIsInstance(data["swap_fee_rate"], float)
        self.assertTrue(data["suggested_mining_fee_rate"] > 0)
        self.assertTrue(data["swap_fee_rate"] > 0)
        self.assertEqual(data["maker_status"], "Active")
        self.assertEqual(data["taker_status"], "Active")
        self.assertTrue(data["is_participant"])
        self.assertTrue(data["maker_locked"])
        self.assertTrue(data["taker_locked"])
        self.assertFalse(data["escrow_locked"])

        # Maker cancels order to avoid leaving pending HTLCs after a successful test
        trade.cancel_order()

        self.assert_order_logs(data["id"])

    def test_trade_to_locked_escrow(self):
        """
        Tests a trade from order creation until escrow locked, before
        invoice/address is submitted by buyer.
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)

        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(data["status_message"], Order.Status(Order.Status.WFI).label)
        self.assertTrue(data["maker_locked"])
        self.assertTrue(data["taker_locked"])
        self.assertTrue(data["escrow_locked"])

        # Cancel order to avoid leaving pending HTLCs after a successful test
        trade.cancel_order(trade.taker_index)

    def test_trade_to_submitted_address(self):
        """
        Tests a trade from order creation until escrow locked, before
        invoice/address is submitted by buyer.
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)
        trade.submit_payout_address(trade.maker_index)

        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(data["status_message"], Order.Status(Order.Status.CHA).label)
        self.assertFalse(data["is_fiat_sent"])

        # Cancel order to avoid leaving pending HTLCs after a successful test
        trade.cancel_order(trade.maker_index)
        trade.cancel_order(trade.taker_index)

        self.assert_order_logs(data["id"])

    def test_trade_to_submitted_invoice(self):
        """
        Tests a trade from order creation until escrow locked and
        invoice is submitted by buyer.
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)
        trade.submit_payout_invoice(trade.maker_index)

        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(data["status_message"], Order.Status(Order.Status.CHA).label)
        self.assertFalse(data["is_fiat_sent"])

        # Cancel order to avoid leaving pending HTLCs after a successful test
        trade.cancel_order(trade.maker_index)
        trade.cancel_order(trade.taker_index)

    def test_trade_to_confirm_fiat_sent_LN(self):
        """
        Tests a trade from order creation until fiat sent confirmed
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)
        trade.submit_payout_invoice(trade.maker_index)
        trade.confirm_fiat(trade.maker_index)

        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(data["status_message"], Order.Status(Order.Status.FSE).label)
        self.assertTrue(data["is_fiat_sent"])

        # Cancel order to avoid leaving pending HTLCs after a successful test
        trade.undo_confirm_sent(trade.maker_index)
        data = trade.response.json()
        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)
        self.assertEqual(data["status_message"], Order.Status(Order.Status.CHA).label)

        trade.cancel_order(trade.maker_index)
        trade.cancel_order(trade.taker_index)

        self.assert_order_logs(data["id"])

    def test_trade_to_confirm_fiat_received_LN(self):
        """
        Tests a trade from order creation until fiat received is confirmed by seller/taker
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)
        trade.submit_payout_invoice(trade.maker_index)
        trade.confirm_fiat(trade.maker_index)
        trade.confirm_fiat(trade.taker_index)

        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(data["status_message"], Order.Status(Order.Status.PAY).label)
        self.assertTrue(data["is_fiat_sent"])
        self.assertFalse(data["is_disputed"])
        self.assertFalse(data["maker_locked"])
        self.assertFalse(data["taker_locked"])
        self.assertFalse(data["escrow_locked"])

        self.assert_order_logs(data["id"])

    def test_successful_LN(self):
        """
        Tests a trade from order creation until Sats sent to buyer
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)
        trade.submit_payout_invoice(trade.maker_index)
        trade.confirm_fiat(trade.maker_index)
        trade.confirm_fiat(trade.taker_index)

        trade.process_payouts()
        trade.get_order(trade.maker_index)

        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(data["status_message"], Order.Status(Order.Status.SUC).label)
        self.assertTrue(data["is_fiat_sent"])
        self.assertFalse(data["is_disputed"])
        self.assertIsHash(data["maker_summary"]["preimage"])
        self.assertIsHash(data["maker_summary"]["payment_hash"])

        self.assert_order_logs(data["id"])

    def test_successful_onchain(self):
        """
        Tests a trade from order creation until Sats sent to buyer
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)
        trade.submit_payout_address(trade.maker_index)
        trade.confirm_fiat(trade.maker_index)
        trade.confirm_fiat(trade.taker_index)

        trade.process_payouts(mine_a_block=True)
        trade.get_order(trade.maker_index)

        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(data["status_message"], Order.Status(Order.Status.SUC).label)
        self.assertTrue(data["is_fiat_sent"])
        self.assertFalse(data["is_disputed"])
        self.assertIsInstance(data["maker_summary"]["address"], str)
        self.assertIsHash(data["maker_summary"]["txid"])

        self.assert_order_logs(data["id"])

    def test_cancel_public_order(self):
        """
        Tests the cancellation of a public order
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.cancel_order()

        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 400)
        self.assertResponse(trade.response)

        self.assertEqual(
            data["bad_request"], "This order has been cancelled by the maker"
        )

    def test_collaborative_cancel_order_in_chat(self):
        """
        Tests the collaborative cancellation of an order in the chat state
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)
        trade.submit_payout_invoice(trade.maker_index)

        # Maker asks for cancel
        trade.cancel_order(trade.maker_index)
        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)
        self.assertTrue(trade.response.json()["asked_for_cancel"])

        # Taker checks order
        trade.get_order(trade.taker_index)
        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)
        self.assertTrue(trade.response.json()["pending_cancel"])

        # Taker accepts (ask) the cancellation
        trade.cancel_order(trade.taker_index)
        self.assertEqual(trade.response.status_code, 400)
        self.assertResponse(trade.response)
        self.assertEqual(
            trade.response.json()["bad_request"],
            "This order has been cancelled collaborativelly",
        )

    def test_created_order_expires(self):
        """
        Tests the expiration of a public order
        """
        trade = Trade(self.client)

        # Change order expiry to now
        order = Order.objects.get(id=trade.response.json()["id"])
        order.expires_at = datetime.now()
        order.save()

        # Make orders expire
        trade.clean_orders()

        trade.get_order()
        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(
            data["status"],
            Order.Status.EXP,
        )
        self.assertEqual(
            data["expiry_message"],
            Order.ExpiryReasons(Order.ExpiryReasons.NMBOND).label,
        )
        self.assertEqual(data["expiry_reason"], Order.ExpiryReasons.NMBOND)

        self.assert_order_logs(data["id"])

    def test_public_order_expires(self):
        """
        Tests the expiration of a public order
        """
        trade = Trade(self.client)
        trade.publish_order()

        # Change order expiry to now
        order = Order.objects.get(id=trade.response.json()["id"])
        order.expires_at = datetime.now()
        order.save()

        # Make orders expire
        trade.clean_orders()

        trade.get_order()
        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(
            data["status"],
            Order.Status.EXP,
        )
        self.assertEqual(
            data["expiry_message"],
            Order.ExpiryReasons(Order.ExpiryReasons.NTAKEN).label,
        )
        self.assertEqual(data["expiry_reason"], Order.ExpiryReasons.NTAKEN)

        self.assert_order_logs(data["id"])

    def test_taken_order_expires(self):
        """
        Tests the expiration of a public order
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()

        # Change order expiry to now
        order = Order.objects.get(id=trade.response.json()["id"])
        order.expires_at = datetime.now()
        order.save()

        # Make orders expire
        trade.clean_orders()

        trade.get_order()
        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(
            data["status"],
            Order.Status.EXP,
        )
        self.assertEqual(
            data["expiry_message"],
            Order.ExpiryReasons(Order.ExpiryReasons.NESINV).label,
        )
        self.assertEqual(data["expiry_reason"], Order.ExpiryReasons.NESINV)

        self.assert_order_logs(data["id"])

    def test_escrow_locked_expires(self):
        """
        Tests the expiration of a public order
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)

        # Change order expiry to now
        order = Order.objects.get(id=trade.response.json()["id"])
        order.expires_at = datetime.now()
        order.save()

        # Make orders expire
        trade.clean_orders()

        trade.get_order()
        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(
            data["status"],
            Order.Status.EXP,
        )
        self.assertEqual(
            data["expiry_message"],
            Order.ExpiryReasons(Order.ExpiryReasons.NINVOI).label,
        )
        self.assertEqual(data["expiry_reason"], Order.ExpiryReasons.NINVOI)

        self.assert_order_logs(data["id"])

    def test_chat(self):
        """
        Tests the chatting REST functionality
        """
        path = reverse("chat")
        message = (
            "Example message string. Note clients will verify expect only PGP messages."
        )

        # Run a successful trade
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)
        trade.submit_payout_invoice(trade.maker_index)

        params = f"?order_id={trade.order_id}"
        maker_headers = trade.get_robot_auth(trade.maker_index)
        taker_headers = trade.get_robot_auth(trade.taker_index)
        maker_nick = read_file(f"tests/robots/{trade.maker_index}/nickname")
        taker_nick = read_file(f"tests/robots/{trade.taker_index}/nickname")

        # Get empty chatroom as maker
        response = self.client.get(path + params, **maker_headers)
        self.assertResponse(response)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["messages"], [])
        self.assertTrue(response.json()["peer_connected"])

        # Get empty chatroom as taker
        response = self.client.get(path + params, **taker_headers)
        self.assertResponse(response)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["messages"], [])
        self.assertTrue(response.json()["peer_connected"])

        # Post new message as maker
        body = {"PGP_message": message, "order_id": trade.order_id, "offset": 0}
        response = self.client.post(path, data=body, **maker_headers)
        self.assertResponse(response)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["messages"][0]["message"], message)
        self.assertTrue(response.json()["peer_connected"])

        # Post new message as taker without offset, so response should not have messages.
        body = {"PGP_message": message + " 2", "order_id": trade.order_id}
        response = self.client.post(path, data=body, **taker_headers)
        self.assertResponse(response)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {})  # Nothing in the response

        # Get the two chatroom messages as maker
        response = self.client.get(path + params, **maker_headers)
        self.assertResponse(response)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["peer_connected"])
        self.assertEqual(response.json()["messages"][0]["message"], message)
        self.assertEqual(response.json()["messages"][1]["message"], message + " 2")
        self.assertEqual(response.json()["messages"][0]["nick"], maker_nick)
        self.assertEqual(response.json()["messages"][1]["nick"], taker_nick)

        # Cancel order to avoid leaving pending HTLCs after a successful test
        trade.cancel_order(trade.maker_index)
        trade.cancel_order(trade.taker_index)

    def test_order_expires_after_only_taker_messaged(self):
        """
        Tests the expiration of an order in chat where maker never messaged
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)
        trade.submit_payout_invoice(trade.maker_index)

        path = reverse("chat")
        message = "Unencrypted message from taker"
        params = f"?order_id={trade.order_id}"
        taker_headers = trade.get_robot_auth(trade.taker_index)

        # Post new message as taker
        body = {"PGP_message": message, "order_id": trade.order_id}
        self.client.post(path + params, data=body, **taker_headers)

        # Change order expiry to now
        order = Order.objects.get(id=trade.response.json()["id"])
        order.expires_at = datetime.now()
        order.save()

        # Make orders expire
        trade.clean_orders()

        trade.get_order()
        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        # Verify taker lost dispute automatically
        self.assertEqual(
            data["status"],
            Order.Status.MLD,
        )

        self.assert_order_logs(data["id"])

    def test_order_expires_after_only_maker_messaged(self):
        """
        Tests the expiration of an order in chat where taker never messaged
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)
        trade.submit_payout_invoice(trade.maker_index)

        path = reverse("chat")
        message = "Unencrypted message from taker"
        params = f"?order_id={trade.order_id}"
        maker_headers = trade.get_robot_auth(trade.maker_index)

        # Post new message as taker
        body = {"PGP_message": message, "order_id": trade.order_id}
        self.client.post(path + params, data=body, **maker_headers)

        # Change order expiry to now
        order = Order.objects.get(id=trade.response.json()["id"])
        order.expires_at = datetime.now()
        order.save()

        # Make orders expire
        trade.clean_orders()

        trade.get_order()
        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        # Verify taker lost dispute automatically
        self.assertEqual(
            data["status"],
            Order.Status.TLD,
        )

        self.assert_order_logs(data["id"])

    def test_withdraw_reward_after_unilateral_cancel(self):
        """
        Tests withdraw rewards as taker after maker cancels order unilaterally
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.cancel_order(trade.maker_index)

        # Fetch amount of rewards for taker
        path = reverse("robot")
        taker_headers = trade.get_robot_auth(trade.maker_index)
        response = self.client.get(path, **taker_headers)

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)
        self.assertIsInstance(response.json()["earned_rewards"], int)

        # Submit reward invoice
        path = reverse("reward")
        invoice = add_invoice("robot", response.json()["earned_rewards"])
        signed_payout_invoice = sign_message(
            invoice,
            passphrase_path=f"tests/robots/{trade.taker_index}/token",
            private_key_path=f"tests/robots/{trade.taker_index}/enc_priv_key",
        )
        body = {
            "invoice": signed_payout_invoice,
        }

        response = self.client.post(path, body, **taker_headers)

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)
        self.assertTrue(response.json()["successful_withdrawal"])

    def test_order_expires_after_fiat_sent(self):
        """
        Tests the expiration of an order after fiat sent is confirmed
        """
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)
        trade.submit_payout_address(trade.maker_index)
        trade.confirm_fiat(trade.maker_index)

        # Change order expiry to now
        order = Order.objects.get(id=trade.response.json()["id"])
        order.expires_at = datetime.now()
        order.save()

        # Make orders expire
        trade.clean_orders()

        trade.get_order()
        data = trade.response.json()

        self.assertEqual(trade.response.status_code, 200)
        self.assertResponse(trade.response)

        self.assertEqual(
            data["status"],
            Order.Status.DIS,
        )

        self.assert_order_logs(data["id"])

    def test_ticks(self):
        """
        Tests the historical ticks serving endpoint after creating a contract
        """
        path = reverse("ticks")
        params = "?start=01-01-1970&end=01-01-2070"

        # Make a contract and cancel
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.cancel_order()

        response = self.client.get(path + params)
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

        self.assertIsInstance(datetime.fromisoformat(data[0]["timestamp"]), datetime)
        self.assertIsInstance(data[0]["volume"], str)
        self.assertIsInstance(data[0]["price"], str)
        self.assertIsInstance(data[0]["premium"], str)
        self.assertIsInstance(data[0]["fee"], str)

    def test_daily_historical(self):
        """
        Tests the daily history serving endpoint after creating a contract
        """
        path = reverse("historical")

        # Run a successful trade
        trade = Trade(self.client)
        trade.publish_order()
        trade.take_order()
        trade.lock_taker_bond()
        trade.lock_escrow(trade.taker_index)
        trade.submit_payout_invoice(trade.maker_index)
        trade.confirm_fiat(trade.maker_index)
        trade.confirm_fiat(trade.taker_index)
        trade.process_payouts()

        # Do daily accounting to create the daily summary
        do_accounting()

        response = self.client.get(path)
        data = response.json()

        self.assertEqual(response.status_code, 200)
        # self.assertResponse(response) # Expects an array, but response is an object
        first_date = list(data.keys())[0]
        self.assertIsInstance(datetime.fromisoformat(first_date), datetime)
        self.assertIsInstance(data[first_date]["volume"], float)
        self.assertIsInstance(data[first_date]["num_contracts"], int)

    def test_book(self):
        """
        Tests public book view
        """
        path = reverse("book")

        trade = Trade(self.client)
        trade.publish_order()

        response = self.client.get(path)
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

        self.assertIsInstance(datetime.fromisoformat(data[0]["created_at"]), datetime)
        self.assertIsInstance(datetime.fromisoformat(data[0]["expires_at"]), datetime)
        self.assertIsHash(data[0]["maker_hash_id"])
        self.assertIsNone(data[0]["amount"])
        self.assertAlmostEqual(
            float(data[0]["min_amount"]), trade.maker_form["min_amount"]
        )
        self.assertAlmostEqual(
            float(data[0]["max_amount"]), trade.maker_form["max_amount"]
        )
        self.assertAlmostEqual(float(data[0]["latitude"]), trade.maker_form["latitude"])
        self.assertAlmostEqual(
            float(data[0]["longitude"]), trade.maker_form["longitude"]
        )
        self.assertEqual(
            data[0]["escrow_duration"], trade.maker_form["escrow_duration"]
        )
        self.assertFalse(data[0]["is_explicit"])

        # Cancel order to avoid leaving pending HTLCs after a successful test
        trade.cancel_order()

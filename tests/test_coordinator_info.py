import json
from unittest.mock import patch

from decouple import config
from django.conf import settings
from django.contrib.auth.models import User
from django.test import Client, TestCase

from tests.mocks.cln import MockNodeStub
from tests.mocks.lnd import MockVersionerStub

FEE = config("FEE", cast=float, default=0.2)
NODE_ID = config("NODE_ID", cast=str, default="033b58d7......")
MAKER_FEE = FEE * config("FEE_SPLIT", cast=float, default=0.125)
TAKER_FEE = FEE * (1 - config("FEE_SPLIT", cast=float, default=0.125))
BOND_SIZE = config("BOND_SIZE", cast=float, default=3)
NOTICE_SEVERITY = config("NOTICE_SEVERITY", cast=str, default="none")
NOTICE_MESSAGE = config("NOTICE_MESSAGE", cast=str, default="")


class CoordinatorInfoTest(TestCase):
    su_pass = "12345678"
    su_name = config("ESCROW_USERNAME", cast=str, default="admin")

    def setUp(self):
        """
        Create a superuser. The superuser is the escrow party.
        """
        self.client = Client()
        User.objects.create_superuser(self.su_name, "super@user.com", self.su_pass)

    @patch("api.lightning.cln.node_pb2_grpc.NodeStub", MockNodeStub)
    @patch("api.lightning.lnd.verrpc_pb2_grpc.VersionerStub", MockVersionerStub)
    def test_info(self):
        path = "/api/info/"

        response = self.client.get(path)
        data = json.loads(response.content.decode())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["num_public_buy_orders"], 0)
        self.assertEqual(data["num_public_sell_orders"], 0)
        self.assertEqual(data["book_liquidity"], 0)
        self.assertEqual(data["active_robots_today"], 0)
        self.assertEqual(data["last_day_nonkyc_btc_premium"], 0)
        self.assertEqual(data["last_day_volume"], 0)
        self.assertEqual(data["lifetime_volume"], 0)
        self.assertEqual(data["lnd_version"], "v0.17.0-beta")
        self.assertEqual(data["cln_version"], "v23.08")
        self.assertEqual(
            data["robosats_running_commit_hash"], "00000000000000000000 dev"
        )
        self.assertEqual(data["version"], settings.VERSION)
        self.assertEqual(data["node_id"], NODE_ID)
        self.assertEqual(data["network"], "testnet")
        self.assertAlmostEqual(data["maker_fee"], MAKER_FEE)
        self.assertAlmostEqual(data["taker_fee"], TAKER_FEE)
        self.assertAlmostEqual(data["bond_size"], BOND_SIZE)
        self.assertEqual(data["notice_severity"], NOTICE_SEVERITY)
        self.assertEqual(data["notice_message"], NOTICE_MESSAGE)
        self.assertEqual(data["current_swap_fee_rate"], 0)

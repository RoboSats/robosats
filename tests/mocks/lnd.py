from unittest.mock import MagicMock

# Mock up of LND gRPC responses


class MockLightningStub:
    def GetInfo(self, request):
        response = MagicMock()
        response.testnet = True
        return response

    def EstimateFee(self, request):
        response = MagicMock()
        response.fee_sat = 1500
        response.sat_per_vbyte = 13
        return response

    def DecodePayReq(self, request):
        response = MagicMock()
        if request.pay_req == "lntb17314....x":
            response.destination = "00000000"
            response.payment_hash = "00000000"
            response.num_satoshis = 1731
            response.timestamp = 1699359597
            response.expiry = 450
            response.description = "Payment reference: xxxxxxxxxxxxxxxxxxxxxxx. This payment WILL FREEZE IN YOUR WALLET, check on RoboSats if the lock was successful. It will be unlocked (fail) unless you cheat or cancel unilaterally."
            response.cltv_expiry = 650
            response.payment_addr = "\275\205\224\002\036h\322"
            response.num_msat = 1731000

    def CancelInvoice(self, request):
        response = MagicMock()
        if request == b"xU\305\212\306":
            response = {}
            return response

    def WalletBalance(self, request):
        response = MagicMock()
        response.total_balance = 10_000_000
        response.confirmed_balance = 9_000_000
        response.unconfirmed_balance = 1_000_000
        response.reserved_balance_anchor_chan = 30_000
        response.account_balance = {}
        return response

    def ChannelBalance(self, request):
        response = MagicMock()
        response.balance: 10_000_000
        response.local_balance.sat = 10_000_000
        response.local_balance.msat = 10_000_000_000
        response.remote_balance.sat = 30_000_000
        response.remote_balance.msat = 30_000_000_000
        response.unsettled_local_balance.sat = 500_000
        response.unsettled_local_balance.msat = 500_000_000
        response.unsettled_remote_balance.sat = 100_000
        response.unsettled_remote_balance.msat = 100_000_000
        response.pending_open_local_balance = 2_000_000
        response.pending_open_local_balance = 2_000_000_000
        response.pending_open_remote_balance = 5_000_000
        response.pending_open_remote_balance = 5_000_000_000
        return response

    def SendCoins(self, request):
        response = MagicMock()
        return response


class MockInvoicesStub:
    def AddHoldInvoice(self, request):
        response = MagicMock()
        if request.value == 1731:
            response.payment_request = "lntb17314....x"
            response.add_index = 1
            response.payment_addr = b"\275\205\322"

    def CancelInvoice(self, request):
        response = MagicMock()
        return response

    def SettleInvoice(self, request):
        response = MagicMock()
        return response

    def LookupInvoiceV2(self, request):
        response = MagicMock()
        return response


class MockRouterStub:
    def ResetMissionControl(self, request):
        response = MagicMock()
        return response

    def SendPaymentV2(self, request):
        response = MagicMock()
        return response

    def TrackPaymentV2(self, request):
        response = MagicMock()
        return response


class MockSignerStub:
    def SignMessage(self, request):
        response = MagicMock()
        return response


class MockVersionerStub:
    def GetVersion(self, request):
        response = MagicMock()
        response.commit = "v0.17.0-beta"
        response.commit_hash = "2fb150c8fe827df9df0520ef9916b3afb7b03a8d"
        response.version = "0.17.0-beta"
        response.app_minor = 17
        response.app_patch = 0
        response.app_pre_release = "beta"
        response.build_tags = [
            "autopilotrpc",
            "signrpc",
            "walletrpc",
            "chainrpc",
            "invoicesrpc",
            "watchtowerrpc",
            "neutrinorpc",
            "monitoring",
            "peersrpc",
            "kvdb_postgres",
            "kvdb_etcd",
            "kvdb_sqlite",
            "go1.20.3",
        ]
        response.go_version = "go1.21.0"
        return response

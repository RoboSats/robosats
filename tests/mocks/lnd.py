from unittest.mock import MagicMock

# Mock up of LND gRPC responses


class MockLightningStub:
    def __init__(self, channel):
        pass

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
        if (
            request.pay_req
            == "lntb17310n1pj552mdpp50p2utzh7mpsf3uq7u7cws4a96tj3kyq54hchdkpw8zecamx9klrqd2j2pshjmt9de6zqun9vejhyetwvdjn5gphxs6nsvfe893z6wphvfsj6dryvymj6wp5xvuz6wp5xcukvdec8yukgcf49cs9g6rfwvs8qcted4jkuapq2ay5cnpqgefy2326g5syjn3qt984253q2aq5cnz92skzqcmgv43kkgr0dcs9ymmzdafkzarnyp5kvgr5dpjjqmr0vd4jqampwvs8xatrvdjhxumxw4kzugzfwss8w6tvdssxyefqw4hxcmmrddjkggpgveskjmpfyp6kumr9wdejq7t0w5sxx6r9v96zqmmjyp3kzmnrv4kzqatwd9kxzar9wfskcmre9ccqz52xqzwzsp5hkzegrhn6kegr33z8qfxtcudaklugygdrakgyy7va0wt2qs7drfq9qyyssqc6rztchzl4m7mlulrhlcajszcl9fan8908k9n5x7gmz8g8d6ht5pj4l8r0dushq6j5s8x7yv9a5klz0kfxwy8v6ze6adyrrp4wu0q0sq3t604x"
        ):
            response.destination = (
                "033b58d7681fe5dd2fb21fd741996cda5449616f77317dd1156b80128d6a71b807"
            )
            response.payment_hash = (
                "7855c58afed86098f01ee7b0e857a5d2e51b1014adf176d82e38b38eecc5b7c6"
            )
            response.num_satoshis = 1731
            response.timestamp = 1699359597
            response.expiry = 450
            response.description = "Payment reference: 7458199b-87ba-4da7-8438-8469f7899da5. This payment WILL FREEZE IN YOUR WALLET, check on RoboSats if the lock was successful. It will be unlocked (fail) unless you cheat or cancel unilaterally."
            response.cltv_expiry = 650
            response.payment_addr = '\275\205\224\016\363\325\262\201\306"8\022e\343\215\355\277\304\021\r\037l\202\023\314\353\334\265\002\036h\322'
            response.num_msat = 1731000

            return response

    def CancelInvoice(self, request):
        response = MagicMock()
        if (
            request
            == b"xU\305\212\376\330`\230\360\036\347\260\350W\245\322\345\033\020\024\255\361v\330.8\263\216\354\305\267\306"
        ):
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
    def __init__(self, channel):
        pass

    def AddHoldInvoice(self, request):
        response = MagicMock()
        # if request.value == 1731:
        response.payment_request = "lntb17310n1pj552mdpp50p2utzh7mpsf3uq7u7cws4a96tj3kyq54hchdkpw8zecamx9klrqd2j2pshjmt9de6zqun9vejhyetwvdjn5gphxs6nsvfe893z6wphvfsj6dryvymj6wp5xvuz6wp5xcukvdec8yukgcf49cs9g6rfwvs8qcted4jkuapq2ay5cnpqgefy2326g5syjn3qt984253q2aq5cnz92skzqcmgv43kkgr0dcs9ymmzdafkzarnyp5kvgr5dpjjqmr0vd4jqampwvs8xatrvdjhxumxw4kzugzfwss8w6tvdssxyefqw4hxcmmrddjkggpgveskjmpfyp6kumr9wdejq7t0w5sxx6r9v96zqmmjyp3kzmnrv4kzqatwd9kxzar9wfskcmre9ccqz52xqzwzsp5hkzegrhn6kegr33z8qfxtcudaklugygdrakgyy7va0wt2qs7drfq9qyyssqc6rztchzl4m7mlulrhlcajszcl9fan8908k9n5x7gmz8g8d6ht5pj4l8r0dushq6j5s8x7yv9a5klz0kfxwy8v6ze6adyrrp4wu0q0sq3t604x"
        response.add_index = 1
        response.payment_addr = b'\275\205\224\016\363\325\262\201\306"8\022e\343\215\355\277\304\021\r\037l\202\023\314\353\334\265\002\036h\322'
        return response

    def CancelInvoice(self, request):
        response = MagicMock()
        return response

    def SettleInvoice(self, request):
        response = MagicMock()
        return response

    def LookupInvoiceV2(self, request):
        response = MagicMock()
        if request.payment_hash == bytes.fromhex(
            "7855c58afed86098f01ee7b0e857a5d2e51b1014adf176d82e38b38eecc5b7c6"
        ):
            response.memo = "Payment reference: ..."
            response.state = 3  # "ACCEPTED"
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
    def __init__(self, channel):
        pass

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

from unittest.mock import MagicMock

# Mock up of CLN gRPC responses


class MockNodeStub:
    def __init__(self, channel):
        pass

    def Getinfo(self, request):
        response = MagicMock()
        response.id = b"\002\202Y\300\330\2564\005\357\263\221;\300\266\326F\010}\370/\252&!v\221iM\251\241V\241\034\034"
        response.alias = "ROBOSATS-TEST-CLN-v23.08"
        response.color = "\002\202Y"
        response.num_peers = 1
        response.num_active_channels = 1
        response.version = "v23.08"
        response.lightning_dir = "/root/.lightning/testnet"
        response.our_features.init = b"\010\240\000\n\002i\242"
        response.our_features.node = b"\210\240\000\n\002i\242"
        response.our_features.invoice = b"\002\000\000\002\002A\000"
        response.blockheight = 2100000
        response.network = "testnet"
        response.fees_collected_msat.msat: 21000
        response.address.item_type = "TORV3"
        response.address.port = 19735
        response.address.address = (
            "21000000gwfmvmig5xlzc2yzm6uzisode5vhs7kyegwstu5hflhx5fid.onion"
        )
        response.binding.item_type = "IPV6"
        response.binding.address = "127.0.0.1"
        response.binding.port = 9736
        return response


class MockHoldStub:
    def __init__(self, channel):
        pass

    def HoldInvoiceLookup(self, request):
        response = MagicMock()
        return response

    def HoldInvoice(self, request):
        response = MagicMock()
        return response

    def HoldInvoiceSettle(self, request):
        response = MagicMock()
        return response

    def HoldInvoiceCancel(self, request):
        response = MagicMock()
        return response

    def DecodeBolt11(self, request):
        response = MagicMock()
        return response

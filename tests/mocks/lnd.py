from unittest.mock import MagicMock


# Mock up of LND gRPC responses
class MockLightningStub:
    def GetInfo(self, request):
        response = MagicMock()
        # Set the testnet attribute to True for testing purposes
        response.testnet = True
        return response

    def EstimateFee(self, request):
        response = MagicMock()
        response.fee_sat = 1500
        response.sat_per_vbyte = 13
        return response


class MockInvoicesStub:
    pass


class MockRouterStub:
    pass


class MockSignerStub:
    pass


class MockVersionerStub:
    pass

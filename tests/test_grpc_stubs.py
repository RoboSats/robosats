"""
Regression test: gRPC stub integrity.

Verifies that every protobuf message/enum symbol and every RPC method on every
stub class that is directly referenced in api/lightning/lnd.py and
api/lightning/cln.py is resolvable in the currently-installed stub modules.

This test requires NO running Lightning node — it only exercises import-time
symbol resolution.  Its primary purpose is to catch the case where
`scripts/generate_grpc.sh` was not re-run after upgrading `grpcio`/
`grpcio-tools`, which would leave stubs stamped with the old GRPC_GENERATED_VERSION
and fail the version guard at application startup.

Run with:
    python manage.py test tests.test_grpc_stubs
"""

import importlib
import unittest

import grpc


class TestGrpcStubVersions(unittest.TestCase):
    """Verify stubs were regenerated for the installed grpcio version."""

    def test_grpc_generated_version_matches_installed(self):
        """
        GRPC_GENERATED_VERSION inside every *_grpc.py stub must equal the
        installed grpcio version.  A mismatch means stubs need regenerating.
        """
        grpc_version = grpc.__version__
        stub_modules = [
            "api.lightning.lightning_pb2_grpc",
            "api.lightning.invoices_pb2_grpc",
            "api.lightning.router_pb2_grpc",
            "api.lightning.signer_pb2_grpc",
            "api.lightning.verrpc_pb2_grpc",
            "api.lightning.node_pb2_grpc",
            "api.lightning.hold_pb2_grpc",
            "api.lightning.primitives_pb2_grpc",
        ]
        for mod_name in stub_modules:
            mod = importlib.import_module(mod_name)
            generated = getattr(mod, "GRPC_GENERATED_VERSION", None)
            self.assertIsNotNone(
                generated,
                f"{mod_name} has no GRPC_GENERATED_VERSION attribute",
            )
            self.assertEqual(
                generated,
                grpc_version,
                f"{mod_name}: GRPC_GENERATED_VERSION={generated!r} "
                f"does not match installed grpcio {grpc_version!r}. "
                f"Run 'sh scripts/generate_grpc.sh' to regenerate stubs.",
            )


class TestGrpcProtoSymbols(unittest.TestCase):
    """
    Verify every protobuf message/enum/field symbol used by lnd.py and cln.py
    resolves in the generated stub modules.
    """

    # All symbols extracted from api/lightning/lnd.py and api/lightning/cln.py
    # via: grep -oE '(lightning|invoices|router|signer|verrpc|node|hold)_pb2\.[A-Za-z0-9_.]+' ...
    PROTO_SYMBOLS = [
        # hold_pb2
        "hold_pb2.Amount",
        "hold_pb2.HoldInvoiceCancelRequest",
        "hold_pb2.HoldInvoiceLookupRequest",
        "hold_pb2.HoldInvoiceRequest",
        "hold_pb2.HoldInvoiceSettleRequest",
        "hold_pb2.Holdstate.ACCEPTED",
        "hold_pb2.Holdstate.CANCELED",
        "hold_pb2.Holdstate.OPEN",
        "hold_pb2.Holdstate.SETTLED",
        # invoices_pb2
        "invoices_pb2.AddHoldInvoiceRequest",
        "invoices_pb2.CancelInvoiceMsg",
        "invoices_pb2.LookupInvoiceMsg",
        "invoices_pb2.SettleInvoiceMsg",
        # lightning_pb2
        "lightning_pb2.ChannelBalanceRequest",
        "lightning_pb2.EstimateFeeRequest",
        "lightning_pb2.GetInfoRequest",
        "lightning_pb2.Invoice.InvoiceState.ACCEPTED",
        "lightning_pb2.Invoice.InvoiceState.CANCELED",
        "lightning_pb2.Invoice.InvoiceState.OPEN",
        "lightning_pb2.Invoice.InvoiceState.SETTLED",
        "lightning_pb2.Payment.PaymentStatus.FAILED",
        "lightning_pb2.Payment.PaymentStatus.IN_FLIGHT",
        "lightning_pb2.Payment.PaymentStatus.SUCCEEDED",
        "lightning_pb2.Payment.PaymentStatus.UNKNOWN",
        "lightning_pb2.PayReqString",
        "lightning_pb2.SendCoinsRequest",
        "lightning_pb2.WalletBalanceRequest",
        # node_pb2
        "node_pb2.DecodeRequest",
        "node_pb2.FeeratesRequest",
        "node_pb2.GetinfoRequest",
        "node_pb2.KeysendRequest",
        "node_pb2.ListfundsOutputs.ListfundsOutputsStatus.CONFIRMED",
        "node_pb2.ListfundsOutputs.ListfundsOutputsStatus.UNCONFIRMED",
        "node_pb2.ListfundsRequest",
        "node_pb2.ListinvoicesInvoices.ListinvoicesInvoicesStatus.EXPIRED",
        "node_pb2.ListinvoicesInvoices.ListinvoicesInvoicesStatus.PAID",
        "node_pb2.ListinvoicesRequest",
        "node_pb2.ListpaysPays.ListpaysPaysStatus.COMPLETE",
        "node_pb2.ListpaysPays.ListpaysPaysStatus.PENDING",
        "node_pb2.ListpaysRequest",
        "node_pb2.ListpeerchannelsChannelsHtlcs.ListpeerchannelsChannelsHtlcsDirection.IN",
        "node_pb2.ListpeerchannelsChannelsHtlcs.ListpeerchannelsChannelsHtlcsDirection.OUT",
        "primitives_pb2.ChannelState.ChanneldNormal",
        "node_pb2.ListpeerchannelsRequest",
        "node_pb2.NewaddrRequest",
        "node_pb2.PayRequest",
        "node_pb2.PayResponse.PayStatus.COMPLETE",
        "node_pb2.PayResponse.PayStatus.FAILED",
        "node_pb2.PayResponse.PayStatus.PENDING",
        "node_pb2.SignmessageRequest",
        "node_pb2.WaitsendpayRequest",
        "node_pb2.WithdrawRequest",
        # router_pb2
        "router_pb2.ResetMissionControlRequest",
        "router_pb2.SendPaymentRequest",
        "router_pb2.TrackPaymentRequest",
        # signer_pb2
        "signer_pb2.KeyLocator",
        "signer_pb2.SignMessageReq",
        # verrpc_pb2
        "verrpc_pb2.VersionRequest",
    ]

    _MODULE_PREFIX = "api.lightning."

    def _resolve(self, dotted):
        """Walk a dot-separated symbol path starting from the first component's module."""
        parts = dotted.split(".")
        mod = importlib.import_module(self._MODULE_PREFIX + parts[0])
        obj = mod
        for attr in parts[1:]:
            obj = getattr(obj, attr)
        return obj

    def test_all_proto_symbols_resolve(self):
        missing = []
        for symbol in self.PROTO_SYMBOLS:
            try:
                self._resolve(symbol)
            except AttributeError as exc:
                missing.append(f"{symbol}: {exc}")
        self.assertEqual(
            missing,
            [],
            "The following proto symbols are missing from the generated stubs:\n"
            + "\n".join(missing)
            + "\n\nRun 'sh scripts/generate_grpc.sh' to regenerate.",
        )


class TestGrpcStubRpcMethods(unittest.TestCase):
    """
    Verify every RPC method called in lnd.py / cln.py exists on the
    instantiated stub object.  Uses an insecure channel to a dummy address
    (no connection is made during construction).
    """

    # Mapping: stub_variable_name → (grpc_module, stub_class_name)
    STUB_MAP = {
        "lightningstub": ("api.lightning.lightning_pb2_grpc", "LightningStub"),
        "invoicesstub": ("api.lightning.invoices_pb2_grpc", "InvoicesStub"),
        "routerstub": ("api.lightning.router_pb2_grpc", "RouterStub"),
        "signerstub": ("api.lightning.signer_pb2_grpc", "SignerStub"),
        "verstub": ("api.lightning.verrpc_pb2_grpc", "VersionerStub"),
        "nodestub": ("api.lightning.node_pb2_grpc", "NodeStub"),
        "holdstub": ("api.lightning.hold_pb2_grpc", "HoldStub"),
    }

    # All RPC call-sites extracted from lnd.py and cln.py
    # Pattern: {stub_var}.{method}(...)
    RPC_CALLS = [
        "holdstub.HoldInvoice",
        "holdstub.HoldInvoiceCancel",
        "holdstub.HoldInvoiceLookup",
        "holdstub.HoldInvoiceSettle",
        "invoicesstub.AddHoldInvoice",
        "invoicesstub.CancelInvoice",
        "invoicesstub.LookupInvoiceV2",
        "invoicesstub.SettleInvoice",
        "lightningstub.ChannelBalance",
        "lightningstub.DecodePayReq",
        "lightningstub.EstimateFee",
        "lightningstub.GetInfo",
        "lightningstub.SendCoins",
        "lightningstub.WalletBalance",
        "nodestub.Decode",
        "nodestub.Feerates",
        "nodestub.Getinfo",
        "nodestub.KeySend",
        "nodestub.ListFunds",
        "nodestub.ListInvoices",
        "nodestub.ListPays",
        "nodestub.ListPeerChannels",
        "nodestub.NewAddr",
        "nodestub.Pay",
        "nodestub.SignMessage",
        "nodestub.WaitSendPay",
        "nodestub.Withdraw",
        "routerstub.ResetMissionControl",
        "routerstub.SendPaymentV2",
        "routerstub.TrackPaymentV2",
        "signerstub.SignMessage",
        "verstub.GetVersion",
    ]

    @classmethod
    def setUpClass(cls):
        # Insecure channel to a dummy address; no network I/O at construction
        dummy_channel = grpc.insecure_channel("localhost:1")
        cls.stubs = {}
        for var_name, (mod_name, class_name) in cls.STUB_MAP.items():
            mod = importlib.import_module(mod_name)
            stub_cls = getattr(mod, class_name)
            cls.stubs[var_name] = stub_cls(dummy_channel)

    def test_all_rpc_methods_present(self):
        missing = []
        for call in self.RPC_CALLS:
            stub_var, method = call.split(".")
            stub_obj = self.stubs[stub_var]
            if not hasattr(stub_obj, method):
                missing.append(
                    f"{call}: method '{method}' not found on {type(stub_obj).__name__}"
                )
        self.assertEqual(
            missing,
            [],
            "The following RPC methods are missing from the generated stubs:\n"
            + "\n".join(missing)
            + "\n\nRun 'sh scripts/generate_grpc.sh' to regenerate.",
        )


if __name__ == "__main__":
    unittest.main()

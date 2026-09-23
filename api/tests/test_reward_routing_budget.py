import hashlib
import sys
from contextlib import ExitStack
from decimal import Decimal
from importlib import import_module
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import SimpleTestCase, TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

import api.lightning
from api.models import LNPayment, Robot
from api.logics import ESCROW_USERNAME
from api.serializers import ClaimRewardSerializer
from api.tests.test_lightning_node import _make_cln_import_patches
from api.views import RewardView


def _decoded_invoice(module, route_fee_msat):
    timestamp = int(timezone.now().timestamp())
    decoded = SimpleNamespace(
        num_satoshis=9990,
        amount_msat=SimpleNamespace(msat=9990000),
        timestamp=timestamp,
        created_at=timestamp,
        expiry=3600,
        description="Reward",
        payment_hash=b"\xab" * 32,
    )
    hop = SimpleNamespace(fee_proportional_millionths=0)
    if module.__name__.endswith("lnd"):
        hop.fee_base_msat = route_fee_msat
        decoded.route_hints = [SimpleNamespace(hop_hints=[hop])]
        decoded.payment_hash = "ab" * 32
    else:
        hop.fee_base_msat = SimpleNamespace(msat=route_fee_msat)
        decoded.routes = SimpleNamespace(hints=[SimpleNamespace(hops=[hop])])
    return decoded


class RewardRoutingBudgetTest(SimpleTestCase):
    def setUp(self):
        original_cln = sys.modules.get("api.lightning.cln")
        if original_cln is None:
            self.addCleanup(sys.modules.pop, "api.lightning.cln", None)
        with ExitStack() as stack:
            stack.enter_context(
                patch.object(
                    api.lightning,
                    "cln",
                    getattr(api.lightning, "cln", None),
                    create=True,
                )
            )
            for patcher in _make_cln_import_patches():
                stack.enter_context(patcher)
            lnd = import_module("api.lightning.lnd")
            cln = import_module("api.lightning.cln")

        self.nodes = ((lnd, lnd.LNDNode), (cln, cln.CLNNode))

    def test_payment_uses_stored_absolute_budget(self):
        for module, node in self.nodes:
            for budget, fee_limit in (
                (Decimal(100), 100),
                (Decimal("2.999"), 2),
                (0, 0),
            ):
                with self.subTest(vendor=module.__name__, budget=budget):
                    payment = MagicMock(spec=LNPayment)
                    payment.invoice = "lnbc1test"
                    payment.num_satoshis = 9900
                    payment.routing_budget_sats = budget
                    if module.__name__.endswith("lnd"):
                        with patch.object(module.router_pb2_grpc, "RouterStub") as stub:
                            stub.return_value.SendPaymentV2.return_value = []
                            node.pay_invoice(payment)
                        request = stub.return_value.SendPaymentV2.call_args.args[0]
                        self.assertEqual(request.fee_limit_sat, fee_limit)
                    else:
                        with patch.object(module.node_pb2_grpc, "NodeStub") as stub:
                            stub.return_value.Pay.return_value.status = (
                                module.node_pb2.PayResponse.PayStatus.FAILED
                            )
                            node.pay_invoice(payment)
                        request = stub.return_value.Pay.call_args.args[0]
                        self.assertEqual(request.maxfee.msat, fee_limit * 1000)

    def test_private_route_validation_uses_the_actual_cap(self):
        for module, node in self.nodes:
            for cap, route_fee_msat, valid in (
                (10, 9500, True),
                (10, 10000, True),
                (10, 10001, False),
                (Decimal("2.999"), 2000, True),
                (Decimal("2.999"), 2001, False),
                (0, 0, True),
                (0, 1, False),
            ):
                with self.subTest(vendor=module.__name__, cap=cap, fee=route_fee_msat):
                    decoded = _decoded_invoice(module, route_fee_msat)
                    with patch.object(node, "decode_payreq", return_value=decoded):
                        result = node.validate_ln_invoice(
                            "lnbc1test",
                            9990,
                            1000,
                            routing_budget_sats=cap,
                        )
                    self.assertEqual(result["valid"], valid)

    def test_legacy_three_argument_validator_keeps_default_fee_cap(self):
        for module, node in self.nodes:
            with self.subTest(vendor=module.__name__):
                decoded = _decoded_invoice(module, 9500)
                with (
                    patch.object(node, "decode_payreq", return_value=decoded),
                    patch.object(
                        module,
                        "config",
                        side_effect=lambda key: {
                            "PROPORTIONAL_ROUTING_FEE_LIMIT": 0.001,
                            "MIN_FLAT_ROUTING_FEE_LIMIT_REWARD": 2,
                        }[key],
                    ),
                ):
                    result = node.validate_ln_invoice("lnbc1test", 9990, 0)
                self.assertTrue(result["valid"])


class RewardBudgetSerializerTest(SimpleTestCase):
    def test_omitted_budget_stays_unspecified(self):
        serializer = ClaimRewardSerializer(data={"invoice": "lnbc1test"})
        self.assertTrue(serializer.is_valid())
        self.assertIsNone(serializer.validated_data["routing_budget_ppm"])

    def test_explicit_zero_and_null_stay_distinct(self):
        for value in (0, None):
            with self.subTest(value=value):
                serializer = ClaimRewardSerializer(
                    data={
                        "invoice": "lnbc1test",
                        "routing_budget_ppm": value,
                    }
                )
                self.assertTrue(serializer.is_valid())
                self.assertEqual(serializer.validated_data["routing_budget_ppm"], value)

    def test_invalid_budget_is_rejected(self):
        for value in (-1, 1.5, 100002, "invalid"):
            with self.subTest(value=value):
                serializer = ClaimRewardSerializer(
                    data={
                        "invoice": "lnbc1test",
                        "routing_budget_ppm": value,
                    }
                )
                self.assertFalse(serializer.is_valid())
                self.assertIn("routing_budget_ppm", serializer.errors)


class RewardPayoutCycleTest(TestCase):
    def test_api_to_node_and_balance_finalization(self):
        User.objects.get_or_create(username=ESCROW_USERNAME)
        with ExitStack() as stack:
            for patcher in _make_cln_import_patches():
                stack.enter_context(patcher)
            modules = (
                import_module("api.lightning.lnd"),
                import_module("api.lightning.cln"),
            )

        for module in modules:
            lnd = module.__name__.endswith("lnd")
            node = module.LNDNode if lnd else module.CLNNode
            for earned, budget, amount, cap, outcome, credit in (
                (10000, 1000, 9990, 10, "success", 0),
                (10000, 300, 9997, 3, "success", 0),
                (10001, 300, 9997, 3, "success", 0),
                (10000, 1000, 9990, 10, "success", 100),
                (10000, 0, 10000, 0, "success", 0),
                (10000, None, 10000, 10, "success", 0),
                (10000, "omitted", 10000, 10, "success", 0),
                (10000, 1000, 9990, 10, "failure", 0),
                (10000, 1000, 9990, 10, "pending", 0),
            ):
                with self.subTest(
                    vendor=module.__name__,
                    earned=earned,
                    budget=budget,
                    outcome=outcome,
                    credit=credit,
                ):
                    invoice = f"{module.__name__}-{earned}-{budget}-{outcome}-{credit}"
                    user = User.objects.create(username=invoice)
                    user.robot.earned_rewards = earned
                    user.robot.save(update_fields=["earned_rewards"])
                    decoded = _decoded_invoice(module, cap * 1000)
                    decoded.num_satoshis = amount
                    decoded.amount_msat.msat = amount * 1000
                    digest = hashlib.sha256(invoice.encode()).digest()
                    decoded.payment_hash = digest.hex() if lnd else digest
                    payload = {"invoice": invoice}
                    if budget != "omitted":
                        payload["routing_budget_ppm"] = budget
                    request = APIRequestFactory().post(
                        "/api/reward/", payload, format="json"
                    )
                    force_authenticate(request, user=user)

                    if lnd:
                        status = {"success": "SUCCEEDED", "failure": "FAILED"}.get(
                            outcome
                        )
                        responses = (
                            []
                            if status is None
                            else [
                                module.lightning_pb2.Payment(
                                    status=getattr(
                                        module.lightning_pb2.Payment.PaymentStatus,
                                        status,
                                    ),
                                    fee_msat=0,
                                    payment_preimage=digest.hex(),
                                    failure_reason=2,
                                )
                            ]
                        )
                        stub = MagicMock()
                        stub.SendPaymentV2.return_value = responses
                        rpc = patch.object(
                            module.router_pb2_grpc, "RouterStub", return_value=stub
                        )
                    else:
                        response = module.node_pb2.PayResponse(
                            status=getattr(
                                module.node_pb2.PayResponse.PayStatus,
                                {
                                    "success": "COMPLETE",
                                    "failure": "FAILED",
                                    "pending": "PENDING",
                                }[outcome],
                            ),
                            amount_msat=module.primitives__pb2.Amount(
                                msat=amount * 1000
                            ),
                            amount_sent_msat=module.primitives__pb2.Amount(
                                msat=amount * 1000
                            ),
                            payment_preimage=digest,
                        )
                        stub = MagicMock()
                        stub.Pay.return_value = response
                        rpc = patch.object(
                            module.node_pb2_grpc, "NodeStub", return_value=stub
                        )

                    if credit:
                        call = stub.SendPaymentV2 if lnd else stub.Pay
                        result = call.return_value

                        def credit_during_payment(_request):
                            self.assertEqual(
                                Robot.objects.get(user=user).earned_rewards, 0
                            )
                            Robot.objects.filter(user=user).update(
                                earned_rewards=credit
                            )
                            return result

                        call.side_effect = credit_during_payment

                    with (
                        patch("api.logics.LNNode", node),
                        patch.object(node, "decode_payreq", return_value=decoded),
                        patch(
                            "api.views.verify_signed_message",
                            return_value=(True, invoice),
                        ),
                        rpc,
                    ):
                        response = RewardView.as_view()(request)

                    self.assertEqual(
                        response.status_code, 200 if outcome == "success" else 400
                    )
                    self.assertEqual(
                        response.data["successful_withdrawal"], outcome == "success"
                    )
                    if outcome == "success":
                        self.assertEqual(response.data["earned_rewards"], credit)
                    payment = LNPayment.objects.get(invoice=invoice)
                    self.assertEqual(payment.num_satoshis, amount)
                    self.assertEqual(payment.routing_budget_sats, Decimal(cap))
                    self.assertEqual(
                        payment.routing_budget_ppm,
                        budget if isinstance(budget, int) else 0,
                    )
                    sent = (stub.SendPaymentV2 if lnd else stub.Pay).call_args.args[0]
                    self.assertEqual(
                        sent.fee_limit_sat if lnd else sent.maxfee.msat // 1000, cap
                    )
                    user.robot.refresh_from_db()
                    self.assertEqual(
                        user.robot.earned_rewards,
                        earned if outcome == "failure" else credit,
                    )
                    self.assertEqual(
                        user.robot.claimed_rewards,
                        amount if outcome == "success" else 0,
                    )
                    if outcome != "success":
                        self.assertEqual(
                            response.data["error_code"],
                            3005 if outcome == "failure" else 3006,
                        )

    def test_invalid_or_unauthenticated_requests_do_not_pay(self):
        user = User.objects.create(username="invalid-reward")
        user.robot.earned_rewards = 500
        user.robot.save(update_fields=["earned_rewards"])
        with (
            patch(
                "api.views.verify_signed_message", return_value=(False, None)
            ) as verify,
            patch("api.logics.LNNode.validate_ln_invoice") as validate,
            patch("api.logics.LNNode.pay_invoice") as pay,
        ):
            for budget in (-1, 1.5, 100002):
                request = APIRequestFactory().post(
                    "/api/reward/",
                    {
                        "invoice": "invalid",
                        "routing_budget_ppm": budget,
                    },
                    format="json",
                )
                force_authenticate(request, user=user)
                self.assertEqual(RewardView.as_view()(request).status_code, 400)
            verify.assert_not_called()
            request = APIRequestFactory().post(
                "/api/reward/", {"invoice": "unsigned"}, format="json"
            )
            force_authenticate(request, user=user)
            response = RewardView.as_view()(request)
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.data["error_code"], 1048)
            request = APIRequestFactory().post(
                "/api/reward/", {"invoice": "unauthenticated"}, format="json"
            )
            self.assertEqual(RewardView.as_view()(request).status_code, 401)
            validate.assert_not_called()
            pay.assert_not_called()
        user.robot.refresh_from_db()
        self.assertEqual(user.robot.earned_rewards, 500)
        self.assertFalse(LNPayment.objects.exists())

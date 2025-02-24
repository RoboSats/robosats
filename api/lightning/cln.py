import hashlib
import os
import random
import secrets
import struct
import time
from datetime import datetime, timedelta

import grpc
import ring
from decouple import config
from django.utils import timezone

from . import hold_pb2, hold_pb2_grpc, node_pb2, node_pb2_grpc
from . import primitives_pb2 as primitives__pb2

#######
# Works with CLN
#######

# Load the client's certificate and key
CLN_DIR = config("CLN_DIR", cast=str, default="/cln/testnet/")
with open(os.path.join(CLN_DIR, "client.pem"), "rb") as f:
    client_cert = f.read()
with open(os.path.join(CLN_DIR, "client-key.pem"), "rb") as f:
    client_key = f.read()

# Load the server's certificate
with open(os.path.join(CLN_DIR, "server.pem"), "rb") as f:
    server_cert = f.read()


CLN_GRPC_HOST = config("CLN_GRPC_HOST", cast=str, default="localhost:9999")
CLN_GRPC_HOLD_HOST = config("CLN_GRPC_HOLD_HOST", cast=str, default="localhost:9998")
DISABLE_ONCHAIN = config("DISABLE_ONCHAIN", cast=bool, default=True)
MAX_SWAP_AMOUNT = config("MAX_SWAP_AMOUNT", cast=int, default=500000)


class CLNNode:
    os.environ["GRPC_SSL_CIPHER_SUITES"] = "HIGH+ECDSA"

    # Create the SSL credentials object
    creds = grpc.ssl_channel_credentials(
        root_certificates=server_cert,
        private_key=client_key,
        certificate_chain=client_cert,
    )
    # Create the gRPC channel using the SSL credentials
    hold_channel = grpc.secure_channel(CLN_GRPC_HOLD_HOST, creds)
    node_channel = grpc.secure_channel(CLN_GRPC_HOST, creds)

    payment_failure_context = {
        -1: "Catchall nonspecific error.",
        201: "Already paid with this hash using different amount or destination.",
        203: "Permanent failure at destination.",
        205: "Unable to find a route.",
        206: "Route too expensive.",
        207: "Invoice expired.",
        210: "Payment timed out without a payment in progress.",
    }

    @classmethod
    def get_version(cls):
        try:
            nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
            request = node_pb2.GetinfoRequest()
            response = nodestub.Getinfo(request)
            return response.version
        except Exception as e:
            print(f"Cannot get CLN version: {e}")
            return "Not installed"

    @classmethod
    def get_info(cls):
        try:
            nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
            request = node_pb2.GetinfoRequest()
            response = nodestub.Getinfo(request)
            return response
        except Exception as e:
            print(f"Cannot get CLN node id: {e}")

    @classmethod
    def newaddress(cls):
        """Only used on tests to fund the regtest node"""
        nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
        request = node_pb2.NewaddrRequest()
        response = nodestub.NewAddr(request)
        return response.bech32

    @classmethod
    def decode_payreq(cls, invoice):
        """Decodes a lightning payment request (invoice)"""
        nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
        request = node_pb2.DecodeRequest(string=invoice)
        response = nodestub.Decode(request)
        return response

    @classmethod
    def estimate_fee(cls, amount_sats, target_conf=2, min_confs=1):
        """Returns estimated fee for onchain payouts"""
        # feerate estimaes work a bit differently in cln see https://lightning.readthedocs.io/lightning-feerates.7.html
        request = node_pb2.FeeratesRequest(style="PERKB")
        nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
        response = nodestub.Feerates(request)

        # "opening" -> ~12 block target
        return {
            "mining_fee_sats": response.onchain_fee_estimates.opening_channel_satoshis,
            "mining_fee_rate": response.perkb.opening / 1000,
        }

    wallet_balance_cache = {}

    @ring.dict(wallet_balance_cache, expire=10)  # keeps in cache for 10 seconds
    @classmethod
    def wallet_balance(cls):
        """Returns onchain balance"""
        request = node_pb2.ListfundsRequest()
        nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
        response = nodestub.ListFunds(request)

        unconfirmed_balance = 0
        confirmed_balance = 0
        total_balance = 0
        for utxo in response.outputs:
            if not utxo.reserved:
                if (
                    utxo.status
                    == node_pb2.ListfundsOutputs.ListfundsOutputsStatus.UNCONFIRMED
                ):
                    unconfirmed_balance += utxo.amount_msat.msat // 1_000
                    total_balance += utxo.amount_msat.msat // 1_000
                elif (
                    utxo.status
                    == node_pb2.ListfundsOutputs.ListfundsOutputsStatus.CONFIRMED
                ):
                    confirmed_balance += utxo.amount_msat.msat // 1_000
                    total_balance += utxo.amount_msat.msat // 1_000

        return {
            "total_balance": total_balance,
            "confirmed_balance": confirmed_balance,
            "unconfirmed_balance": unconfirmed_balance,
        }

    channel_balance_cache = {}

    @ring.dict(channel_balance_cache, expire=10)  # keeps in cache for 10 seconds
    @classmethod
    def channel_balance(cls):
        """Returns channels balance"""
        request = node_pb2.ListpeerchannelsRequest()
        nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
        response = nodestub.ListPeerChannels(request)

        local_balance_sat = 0
        remote_balance_sat = 0
        unsettled_local_balance = 0
        unsettled_remote_balance = 0
        for channel in response.channels:
            if (
                channel.state
                == node_pb2.ListpeerchannelsChannels.ListpeerchannelsChannelsState.CHANNELD_NORMAL
            ):
                local_balance_sat += channel.to_us_msat.msat // 1_000
                remote_balance_sat += (
                    channel.total_msat.msat - channel.to_us_msat.msat
                ) // 1_000
            for htlc in channel.htlcs:
                if (
                    htlc.direction
                    == node_pb2.ListpeerchannelsChannelsHtlcs.ListpeerchannelsChannelsHtlcsDirection.IN
                ):
                    unsettled_local_balance += htlc.amount_msat.msat // 1_000
                elif (
                    htlc.direction
                    == node_pb2.ListpeerchannelsChannelsHtlcs.ListpeerchannelsChannelsHtlcsDirection.OUT
                ):
                    unsettled_remote_balance += htlc.amount_msat.msat // 1_000

        return {
            "local_balance": local_balance_sat,
            "remote_balance": remote_balance_sat,
            "unsettled_local_balance": unsettled_local_balance,
            "unsettled_remote_balance": unsettled_remote_balance,
        }

    @classmethod
    def pay_onchain(cls, onchainpayment, queue_code=5, on_mempool_code=2):
        """Send onchain transaction for buyer payouts"""

        if DISABLE_ONCHAIN or onchainpayment.sent_satoshis > MAX_SWAP_AMOUNT:
            return False

        request = node_pb2.WithdrawRequest(
            destination=onchainpayment.address,
            satoshi=primitives__pb2.AmountOrAll(
                amount=primitives__pb2.Amount(msat=onchainpayment.sent_satoshis * 1_000)
            ),
            feerate=primitives__pb2.Feerate(
                perkb=int(onchainpayment.mining_fee_rate) * 1_000
            ),
            minconf=int(not config("SPEND_UNCONFIRMED", default=False, cast=bool)),
        )

        # Cheap security measure to ensure there has been some non-deterministic time between request and DB check
        delay = (
            secrets.randbelow(2**256) / (2**256) * 10
        )  # Random uniform 0 to 5 secs with good entropy
        if not config("TESTING", cast=bool, default=False):
            time.sleep(3 + delay)

        if onchainpayment.status == queue_code:
            # Changing the state to "MEMPO" should be atomic with SendCoins.
            onchainpayment.status = on_mempool_code
            onchainpayment.save(update_fields=["status"])
            nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
            response = nodestub.Withdraw(request)

            if response.txid:
                onchainpayment.txid = response.txid.hex()
                onchainpayment.broadcasted = True
            onchainpayment.save(update_fields=["txid", "broadcasted"])
            return True

        elif onchainpayment.status == on_mempool_code:
            # Bug, double payment attempted
            return True

    @classmethod
    def cancel_return_hold_invoice(cls, payment_hash):
        """Cancels or returns a hold invoice"""
        request = hold_pb2.HoldInvoiceCancelRequest(
            payment_hash=bytes.fromhex(payment_hash)
        )
        holdstub = hold_pb2_grpc.HoldStub(cls.hold_channel)
        response = holdstub.HoldInvoiceCancel(request)

        return response.state == hold_pb2.Holdstate.CANCELED

    @classmethod
    def settle_hold_invoice(cls, preimage):
        """settles a hold invoice"""
        request = hold_pb2.HoldInvoiceSettleRequest(
            payment_hash=hashlib.sha256(bytes.fromhex(preimage)).digest()
        )
        holdstub = hold_pb2_grpc.HoldStub(cls.hold_channel)
        response = holdstub.HoldInvoiceSettle(request)

        return response.state == hold_pb2.Holdstate.SETTLED

    @classmethod
    def gen_hold_invoice(
        cls,
        num_satoshis,
        description,
        invoice_expiry,
        cltv_expiry_blocks,
        order_id,
        lnpayment_concept,
        time,
    ):
        """Generates hold invoice"""

        # constant 100h invoice expiry because cln has to cancel htlcs if invoice expires
        # or it can't associate them anymore
        invoice_expiry = cltv_expiry_blocks * 10 * 60

        hold_payment = {}
        # The preimage is a random hash of 256 bits entropy
        preimage = hashlib.sha256(secrets.token_bytes(nbytes=32)).digest()

        request = hold_pb2.HoldInvoiceRequest(
            description=description,
            amount_msat=hold_pb2.Amount(msat=num_satoshis * 1_000),
            label=f"Order:{order_id}-{lnpayment_concept}-{time}--{random.randint(1, 100000)}",
            expiry=invoice_expiry,
            cltv=cltv_expiry_blocks,
            preimage=preimage,  # preimage is actually optional in cln, as cln would generate one by default
        )
        holdstub = hold_pb2_grpc.HoldStub(cls.hold_channel)
        response = holdstub.HoldInvoice(request)

        hold_payment["invoice"] = response.bolt11
        payreq_decoded = cls.decode_payreq(hold_payment["invoice"])
        hold_payment["preimage"] = preimage.hex()
        hold_payment["payment_hash"] = response.payment_hash.hex()
        hold_payment["created_at"] = timezone.make_aware(
            datetime.fromtimestamp(payreq_decoded.created_at)
        )
        hold_payment["expires_at"] = timezone.make_aware(
            datetime.fromtimestamp(response.expires_at)
        )
        hold_payment["cltv_expiry"] = cltv_expiry_blocks

        return hold_payment

    @classmethod
    def validate_hold_invoice_locked(cls, lnpayment):
        """Checks if hold invoice is locked"""
        from api.models import LNPayment

        request = hold_pb2.HoldInvoiceLookupRequest(
            payment_hash=bytes.fromhex(lnpayment.payment_hash)
        )
        holdstub = hold_pb2_grpc.HoldStub(cls.hold_channel)
        response = holdstub.HoldInvoiceLookup(request)

        # Will fail if 'unable to locate invoice'. Happens if invoice expiry
        # time has passed (but these are 15% padded at the moment). Should catch it
        # and report back that the invoice has expired (better robustness)
        if response.state == hold_pb2.Holdstate.OPEN:
            pass
        if response.state == hold_pb2.Holdstate.SETTLED:
            pass
        if response.state == hold_pb2.Holdstate.CANCELED:
            pass
        if response.state == hold_pb2.Holdstate.ACCEPTED:
            lnpayment.expiry_height = response.htlc_expiry
            lnpayment.status = LNPayment.Status.LOCKED
            lnpayment.save(update_fields=["expiry_height", "status"])
            return True

    @classmethod
    def lookup_invoice_status(cls, lnpayment):
        """
        Returns the status (as LNpayment.Status) of the given payment_hash
        If unchanged, returns the previous status
        """
        from api.models import LNPayment

        status = lnpayment.status
        expiry_height = 0

        cln_response_state_to_lnpayment_status = {
            0: LNPayment.Status.INVGEN,  # OPEN
            1: LNPayment.Status.SETLED,  # SETTLED
            2: LNPayment.Status.CANCEL,  # CANCELLED
            3: LNPayment.Status.LOCKED,  # ACCEPTED
        }

        try:
            # this is similar to LNNnode.validate_hold_invoice_locked
            request = hold_pb2.HoldInvoiceLookupRequest(
                payment_hash=bytes.fromhex(lnpayment.payment_hash)
            )
            holdstub = hold_pb2_grpc.HoldStub(cls.hold_channel)
            response = holdstub.HoldInvoiceLookup(request)

            status = cln_response_state_to_lnpayment_status[response.state]

            # try saving expiry height
            if hasattr(response, "htlc_expiry"):
                try:
                    expiry_height = response.htlc_expiry
                except Exception:
                    pass

        except Exception as e:
            # If it fails at finding the invoice: it has been expired for more than an hour (and could be paid or just expired).
            # In RoboSats DB we make a distinction between cancelled and returned
            #  (holdinvoice plugin has separate state for hodl-invoices, which it forgets after an invoice expired more than an hour ago)
            if "empty result for listdatastore_state" in str(e):
                print(str(e))
                request2 = node_pb2.ListinvoicesRequest(
                    payment_hash=bytes.fromhex(lnpayment.payment_hash)
                )
                try:
                    nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
                    response2 = nodestub.ListInvoices(request2).invoices
                except Exception as e:
                    print(str(e))

                if (
                    response2[0].status
                    == node_pb2.ListinvoicesInvoices.ListinvoicesInvoicesStatus.PAID
                ):
                    status = LNPayment.Status.SETLED
                elif (
                    response2[0].status
                    == node_pb2.ListinvoicesInvoices.ListinvoicesInvoicesStatus.EXPIRED
                ):
                    status = LNPayment.Status.CANCEL
                else:
                    print(str(e))

            # Other write to logs
            else:
                print(str(e))

        return status, expiry_height

    @classmethod
    def resetmc(cls):
        # don't think an equivalent exists for cln, maybe deleting gossip_store file?
        return False

    @classmethod
    def validate_ln_invoice(cls, invoice, num_satoshis, routing_budget_ppm):
        """Checks if the submited LN invoice comforms to expectations"""

        payout = {
            "valid": False,
            "context": None,
            "description": None,
            "payment_hash": None,
            "created_at": None,
            "expires_at": None,
        }

        try:
            payreq_decoded = cls.decode_payreq(invoice)
        except Exception:
            payout["context"] = {
                "bad_invoice": "Does not look like a valid lightning invoice"
            }
            return payout

        # Some wallet providers (e.g. Muun) force routing through a private channel with high fees >1500ppm
        # These payments will fail. So it is best to let the user know in advance this invoice is not valid.
        route_hints = payreq_decoded.routes.hints

        # Max amount RoboSats will pay for routing
        if routing_budget_ppm == 0:
            max_routing_fee_sats = max(
                num_satoshis * float(config("PROPORTIONAL_ROUTING_FEE_LIMIT")),
                float(config("MIN_FLAT_ROUTING_FEE_LIMIT_REWARD")),
            )
        else:
            max_routing_fee_sats = int(
                float(num_satoshis) * float(routing_budget_ppm) / 1000000
            )

        if route_hints:
            routes_cost = []
            # For every hinted route...
            for hinted_route in route_hints:
                route_cost = 0
                # ...add up the cost of every hinted hop...
                for hop_hint in hinted_route.hops:
                    route_cost += hop_hint.fee_base_msat.msat / 1_000
                    route_cost += (
                        hop_hint.fee_proportional_millionths * num_satoshis / 1_000_000
                    )

                # ...and store the cost of the route to the array
                routes_cost.append(route_cost)

            # If the cheapest possible private route is more expensive than what RoboSats is willing to pay
            if min(routes_cost) >= max_routing_fee_sats:
                payout["context"] = {
                    "bad_invoice": "The invoice hinted private routes are not payable within the submitted routing budget. This can be adjusted with Advanced Options enabled."
                }
                return payout

        if payreq_decoded.amount_msat.msat == 0:
            payout["context"] = {
                "bad_invoice": "The invoice provided has no explicit amount"
            }
            return payout

        if not payreq_decoded.amount_msat.msat // 1_000 == num_satoshis:
            payout["context"] = {
                "bad_invoice": "The invoice provided is not for "
                + "{:,}".format(num_satoshis)
                + " Sats"
            }
            return payout

        payout["created_at"] = timezone.make_aware(
            datetime.fromtimestamp(payreq_decoded.created_at)
        )
        payout["expires_at"] = payout["created_at"] + timedelta(
            seconds=payreq_decoded.expiry
        )

        if payout["expires_at"] < timezone.now():
            payout["context"] = {
                "bad_invoice": "The invoice provided has already expired"
            }
            return payout

        payout["valid"] = True
        payout["description"] = payreq_decoded.description
        payout["payment_hash"] = payreq_decoded.payment_hash.hex()

        return payout

    @classmethod
    def pay_invoice(cls, lnpayment):
        """Sends sats. Used for rewards payouts"""
        from api.models import LNPayment

        fee_limit_sat = int(
            max(
                lnpayment.num_satoshis
                * float(config("PROPORTIONAL_ROUTING_FEE_LIMIT")),
                float(config("MIN_FLAT_ROUTING_FEE_LIMIT_REWARD")),
            )
        )  # 200 ppm or 10 sats
        timeout_seconds = int(config("REWARDS_TIMEOUT_SECONDS"))
        request = node_pb2.PayRequest(
            bolt11=lnpayment.invoice,
            maxfee=primitives__pb2.Amount(msat=fee_limit_sat * 1_000),
            retry_for=timeout_seconds,
        )

        try:
            nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
            response = nodestub.Pay(request)

            if response.status == node_pb2.PayResponse.PayStatus.COMPLETE:
                lnpayment.status = LNPayment.Status.SUCCED
                lnpayment.fee = (
                    float(response.amount_sent_msat.msat - response.amount_msat.msat)
                    / 1000
                )
                lnpayment.preimage = response.payment_preimage.hex()
                lnpayment.save(update_fields=["fee", "status", "preimage"])
                return True, None
            elif response.status == node_pb2.PayResponse.PayStatus.PENDING:
                failure_reason = "Payment isn't failed (yet)"
                lnpayment.failure_reason = LNPayment.FailureReason.NOTYETF
                lnpayment.status = LNPayment.Status.FLIGHT
                lnpayment.save(update_fields=["failure_reason", "status"])
                return False, failure_reason
            else:  # response.status == node_pb2.PayResponse.PayStatus.FAILED
                failure_reason = "All possible routes were tried and failed permanently. Or were no routes to the destination at all."
                lnpayment.failure_reason = LNPayment.FailureReason.NOROUTE
                lnpayment.status = LNPayment.Status.FAILRO
                lnpayment.save(update_fields=["failure_reason", "status"])
                return False, failure_reason
        except grpc._channel._InactiveRpcError as e:
            status_code = int(e.details().split("code: Some(")[1].split(")")[0])
            failure_reason = cls.payment_failure_context[status_code]
            lnpayment.failure_reason = LNPayment.FailureReason.NOROUTE
            lnpayment.status = LNPayment.Status.FAILRO
            lnpayment.save(update_fields=["failure_reason", "status"])
            return False, failure_reason

    @classmethod
    def follow_send_payment(cls, lnpayment, fee_limit_sat, timeout_seconds):
        """Sends sats to buyer, continuous update"""

        from api.models import LNPayment, Order

        hash = lnpayment.payment_hash

        # retry_for is not quite the same as a timeout. Pay can still take SIGNIFICANTLY longer to return if htlcs are stuck!
        # allow_self_payment=True, No such thing in pay command and self_payments do not work with pay!
        request = node_pb2.PayRequest(
            bolt11=lnpayment.invoice,
            maxfee=primitives__pb2.Amount(msat=fee_limit_sat * 1_000),
            retry_for=timeout_seconds,
        )

        order = lnpayment.order_paid_LN
        if order.trade_escrow.num_satoshis < lnpayment.num_satoshis:
            print(f"Order: {order.id} Payout is larger than collateral !?")
            return

        def watchpayment():
            request_listpays = node_pb2.ListpaysRequest(
                payment_hash=bytes.fromhex(hash)
            )
            while True:
                try:
                    nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
                    response_listpays = nodestub.ListPays(request_listpays)
                except Exception as e:
                    print(str(e))
                    time.sleep(2)
                    continue

                if (
                    len(response_listpays.pays) == 0
                    or response_listpays.pays[0].status
                    != node_pb2.ListpaysPays.ListpaysPaysStatus.PENDING
                ):
                    return response_listpays
                else:
                    time.sleep(2)

        def handle_response():
            try:
                lnpayment.status = LNPayment.Status.FLIGHT
                lnpayment.in_flight = True
                lnpayment.save(update_fields=["in_flight", "status"])

                order.update_status(Order.Status.PAY)
                nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
                response = nodestub.Pay(request)

                if response.status == node_pb2.PayResponse.PayStatus.PENDING:
                    print(f"Order: {order.id} IN_FLIGHT. Hash {hash}")

                    watchpayment()

                    handle_response()

                if response.status == node_pb2.PayResponse.PayStatus.FAILED:
                    lnpayment.status = LNPayment.Status.FAILRO
                    lnpayment.last_routing_time = timezone.now()
                    lnpayment.routing_attempts += 1
                    lnpayment.failure_reason = LNPayment.FailureReason.NOROUTE
                    lnpayment.in_flight = False
                    if lnpayment.routing_attempts > 2:
                        lnpayment.status = LNPayment.Status.EXPIRE
                        lnpayment.routing_attempts = 0
                    lnpayment.save(
                        update_fields=[
                            "status",
                            "last_routing_time",
                            "routing_attempts",
                            "failure_reason",
                            "in_flight",
                        ]
                    )

                    order.update_status(Order.Status.FAI)
                    order.expires_at = timezone.now() + timedelta(
                        seconds=order.t_to_expire(Order.Status.FAI)
                    )
                    order.save(update_fields=["expires_at"])

                    print(
                        f"Order: {order.id} FAILED. Hash: {hash} Reason: {cls.payment_failure_context[-1]}"
                    )
                    order.log(
                        f"Payment LNPayment({lnpayment.payment_hash},{str(lnpayment)}) failed. Failure reason: {cls.payment_failure_context[-1]})"
                    )

                    return {
                        "succeded": False,
                        "context": f"payment failure reason: {cls.payment_failure_context[-1]}",
                    }

                if response.status == node_pb2.PayResponse.PayStatus.COMPLETE:
                    print(f"Order: {order.id} SUCCEEDED. Hash: {hash}")
                    lnpayment.status = LNPayment.Status.SUCCED
                    lnpayment.fee = (
                        float(
                            response.amount_sent_msat.msat - response.amount_msat.msat
                        )
                        / 1000
                    )
                    lnpayment.preimage = response.payment_preimage.hex()
                    lnpayment.save(update_fields=["status", "fee", "preimage"])
                    order.update_status(Order.Status.SUC)
                    order.expires_at = timezone.now() + timedelta(
                        seconds=order.t_to_expire(Order.Status.SUC)
                    )
                    order.save(update_fields=["expires_at"])

                    order.log(
                        f"Payment LNPayment({lnpayment.payment_hash},{str(lnpayment)}) <b>succeeded</b>"
                    )

                    results = {"succeded": True}
                    return results

            except grpc._channel._InactiveRpcError as e:
                if "code: Some" in str(e):
                    status_code = int(e.details().split("code: Some(")[1].split(")")[0])
                    if (
                        status_code == 201
                    ):  # Already paid with this hash using different amount or destination
                        # i don't think this can happen really, since we don't use the amount_msat in request
                        # and if you just try 'pay' 2x where the first time it succeeds you get the same
                        # non-error result the 2nd time.
                        print(
                            f"Order: {order.id} ALREADY PAID using different amount or destination THIS SHOULD NEVER HAPPEN! Hash: {hash}."
                        )

                    # Permanent failure at destination. or Unable to find a route. or Route too expensive.
                    elif (
                        status_code == 203
                        or status_code == 205
                        or status_code == 206
                        or status_code == 210
                    ):
                        lnpayment.status = LNPayment.Status.FAILRO
                        lnpayment.last_routing_time = timezone.now()
                        lnpayment.routing_attempts += 1
                        lnpayment.failure_reason = LNPayment.FailureReason.NOROUTE
                        lnpayment.in_flight = False
                        if lnpayment.routing_attempts > 2:
                            lnpayment.status = LNPayment.Status.EXPIRE
                            lnpayment.routing_attempts = 0
                        lnpayment.save(
                            update_fields=[
                                "status",
                                "last_routing_time",
                                "routing_attempts",
                                "in_flight",
                                "failure_reason",
                            ]
                        )

                        order.update_status(Order.Status.FAI)
                        order.expires_at = timezone.now() + timedelta(
                            seconds=order.t_to_expire(Order.Status.FAI)
                        )
                        order.save(update_fields=["expires_at"])

                        print(
                            f"Order: {order.id} FAILED. Hash: {hash} Reason: {cls.payment_failure_context[status_code]}"
                        )
                        order.log(
                            f"Payment LNPayment({lnpayment.payment_hash},{str(lnpayment)}) <b>failed</b>. Failure reason: {cls.payment_failure_context[status_code]}"
                        )

                        return {
                            "succeded": False,
                            "context": f"payment failure reason: {cls.payment_failure_context[status_code]}",
                        }
                    elif status_code == 207:  # invoice expired
                        print(f"Order: {order.id}. INVOICE EXPIRED. Hash: {hash}")

                        last_payresponse = watchpayment()

                        # check if succeeded while pending and expired
                        if (
                            len(last_payresponse.pays) > 0
                            and last_payresponse.pays[0].status
                            == node_pb2.ListpaysPays.ListpaysPaysStatus.COMPLETE
                        ):
                            handle_response()
                        else:
                            lnpayment.status = LNPayment.Status.EXPIRE
                            lnpayment.last_routing_time = timezone.now()
                            lnpayment.in_flight = False
                            lnpayment.save(
                                update_fields=[
                                    "status",
                                    "last_routing_time",
                                    "in_flight",
                                ]
                            )
                            order.update_status(Order.Status.FAI)
                            order.expires_at = timezone.now() + timedelta(
                                seconds=order.t_to_expire(Order.Status.FAI)
                            )
                            order.save(update_fields=["expires_at"])

                            order.log(
                                f"Payment LNPayment({lnpayment.payment_hash},{str(lnpayment)}) <b>had expired</b>"
                            )

                            results = {
                                "succeded": False,
                                "context": "The payout invoice has expired",
                            }
                            return results
                    else:  # -1 (general error)
                        print(str(e))
                else:
                    print(str(e))

        handle_response()

    @classmethod
    def send_keysend(
        cls, target_pubkey, message, num_satoshis, routing_budget_sats, timeout, sign
    ):
        # keysends for dev donations
        from api.models import LNPayment

        # Cannot perform selfpayments
        # config("ALLOW_SELF_KEYSEND", cast=bool, default=False)

        keysend_payment = {}
        keysend_payment["created_at"] = timezone.now()
        keysend_payment["expires_at"] = timezone.now()
        try:
            custom_records = []

            msg = str(message)

            if len(msg) > 0:
                custom_records.append(
                    primitives__pb2.TlvEntry(
                        type=34349334, value=bytes.fromhex(msg.encode("utf-8").hex())
                    )
                )
                if sign:
                    nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
                    self_pubkey = nodestub.Getinfo(node_pb2.GetinfoRequest()).id
                    timestamp = struct.pack(">i", int(time.time()))
                    nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
                    signature = nodestub.SignMessage(
                        node_pb2.SignmessageRequest(
                            message=(
                                bytes.fromhex(self_pubkey)
                                + bytes.fromhex(target_pubkey)
                                + timestamp
                                + bytes.fromhex(msg.encode("utf-8").hex())
                            ),
                        )
                    ).zbase
                    custom_records.append(
                        primitives__pb2.TlvEntry(type=34349337, value=signature)
                    )
                    custom_records.append(
                        primitives__pb2.TlvEntry(
                            type=34349339, value=bytes.fromhex(self_pubkey)
                        )
                    )
                    custom_records.append(
                        primitives__pb2.TlvEntry(type=34349343, value=timestamp)
                    )

            # no maxfee for Keysend
            maxfeepercent = (routing_budget_sats / num_satoshis) * 100
            request = node_pb2.KeysendRequest(
                destination=bytes.fromhex(target_pubkey),
                extratlvs=primitives__pb2.TlvStream(entries=custom_records),
                maxfeepercent=maxfeepercent,
                retry_for=timeout,
                amount_msat=primitives__pb2.Amount(msat=num_satoshis * 1000),
            )
            nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
            response = nodestub.KeySend(request)

            keysend_payment["preimage"] = response.payment_preimage.hex()
            keysend_payment["payment_hash"] = response.payment_hash.hex()

            waitreq = node_pb2.WaitsendpayRequest(
                payment_hash=response.payment_hash, timeout=timeout
            )
            try:
                nodestub = node_pb2_grpc.NodeStub(cls.node_channel)
                waitresp = nodestub.WaitSendPay(waitreq)
                keysend_payment["fee"] = (
                    float(waitresp.amount_sent_msat.msat - waitresp.amount_msat.msat)
                    / 1000
                )
                keysend_payment["status"] = LNPayment.Status.SUCCED
            except grpc._channel._InactiveRpcError as e:
                if "code: Some" in str(e):
                    status_code = int(e.details().split("code: Some(")[1].split(")")[0])
                if status_code == 200:  # Timed out before the payment could complete.
                    keysend_payment["status"] = LNPayment.Status.FLIGHT
                elif status_code == 208:
                    print(
                        f"A payment for {response.payment_hash.hex()} was never made and there is nothing to wait for"
                    )
                else:
                    keysend_payment["status"] = LNPayment.Status.FAILRO
                    keysend_payment["failure_reason"] = response.failure_reason
            except Exception as e:
                print("Error while sending keysend payment! Error: " + str(e))

        except Exception as e:
            print("Error while sending keysend payment! Error: " + str(e))

        return True, keysend_payment

    @classmethod
    def double_check_htlc_is_settled(cls, payment_hash):
        """Just as it sounds. Better safe than sorry!"""
        request = hold_pb2.HoldInvoiceLookupRequest(
            payment_hash=bytes.fromhex(payment_hash)
        )
        try:
            holdstub = hold_pb2_grpc.HoldStub(cls.hold_channel)
            response = holdstub.HoldInvoiceLookup(request)
        except Exception as e:
            if "Timed out" in str(e):
                return False
            else:
                raise e

        return response.state == hold_pb2.Holdstate.SETTLED

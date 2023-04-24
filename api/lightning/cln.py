import hashlib
import os
import secrets
import time
from datetime import datetime, timedelta

import grpc
import ring
from decouple import config
from django.utils import timezone

from . import node_pb2 as noderpc
from . import node_pb2_grpc as nodestub
from . import primitives_pb2 as primitives__pb2

#######
# Works with CLN
#######

# Load the client's certificate and key
with open(os.path.join(config("CLN_DIR"), "client.pem"), "rb") as f:
    client_cert = f.read()
with open(os.path.join(config("CLN_DIR"), "client-key.pem"), "rb") as f:
    client_key = f.read()

# Load the server's certificate
with open(os.path.join(config("CLN_DIR"), "server.pem"), "rb") as f:
    server_cert = f.read()


CLN_GRPC_HOST = config("CLN_GRPC_HOST")
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
    channel = grpc.secure_channel(CLN_GRPC_HOST, creds)

    # Create the gRPC stub
    stub = nodestub.NodeStub(channel)

    noderpc = noderpc

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
            request = noderpc.GetinfoRequest()
            print(request)
            response = cls.stub.Getinfo(request)
            print(response)
            return response.version
        except Exception as e:
            print(e)
            return None

    @classmethod
    def decode_payreq(cls, invoice):
        """Decodes a lightning payment request (invoice)"""
        request = noderpc.DecodeBolt11Request(bolt11=invoice)

        response = cls.stub.DecodeBolt11(request)
        return response

    @classmethod
    def estimate_fee(cls, amount_sats, target_conf=2, min_confs=1):
        """Returns estimated fee for onchain payouts"""
        # feerate estimaes work a bit differently in cln see https://lightning.readthedocs.io/lightning-feerates.7.html
        request = noderpc.FeeratesRequest(style="PERKB")

        response = cls.stub.Feerates(request)

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
        request = noderpc.ListfundsRequest()

        response = cls.stub.ListFunds(request)

        unconfirmed_balance = 0
        confirmed_balance = 0
        total_balance = 0
        for utxo in response.outputs:
            if not utxo.reserved:
                if utxo.status == 0:  # UNCONFIRMED
                    unconfirmed_balance += utxo.amount_msat.msat // 1_000
                    total_balance += utxo.amount_msat.msat // 1_000
                elif utxo.status == 1:  # CONFIRMED
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
        request = noderpc.ListpeersRequest()

        response = cls.stub.ListPeers(request)

        local_balance_sat = 0
        remote_balance_sat = 0
        unsettled_local_balance = 0
        unsettled_remote_balance = 0
        for peer in response.peers:
            for channel in peer.channels:
                if channel.state == 2:  # CHANNELD_NORMAL
                    local_balance_sat += channel.to_us_msat.msat // 1_000
                    remote_balance_sat += (
                        channel.total_msat.msat - channel.to_us_msat.msat
                    ) // 1_000
                for htlc in channel.htlcs:
                    if htlc.direction == 0:  # IN
                        unsettled_local_balance += htlc.amount_msat.msat // 1_000
                    elif htlc.direction == 1:  # OUT
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

        request = noderpc.WithdrawRequest(
            destination=onchainpayment.address,
            satoshi=int(onchainpayment.sent_satoshis),
            feerate=str(int(onchainpayment.mining_fee_rate) * 1_000) + "perkb",
            minconf=int(not config("SPEND_UNCONFIRMED", default=False, cast=bool)),
        )

        # Cheap security measure to ensure there has been some non-deterministic time between request and DB check
        delay = (
            secrets.randbelow(2**256) / (2**256) * 10
        )  # Random uniform 0 to 5 secs with good entropy
        time.sleep(3 + delay)

        if onchainpayment.status == queue_code:
            # Changing the state to "MEMPO" should be atomic with SendCoins.
            onchainpayment.status = on_mempool_code
            onchainpayment.save()
            response = cls.stub.Withdraw(request)

            if response.txid:
                onchainpayment.txid = response.txid
                onchainpayment.broadcasted = True
            onchainpayment.save()
            return True

        elif onchainpayment.status == on_mempool_code:
            # Bug, double payment attempted
            return True

    @classmethod
    def cancel_return_hold_invoice(cls, payment_hash):
        """Cancels or returns a hold invoice"""
        request = noderpc.HodlInvoiceCancelRequest(
            payment_hash=bytes.fromhex(payment_hash)
        )
        response = cls.stub.HodlInvoiceCancel(request)

        return response.state == 1  # True if state is CANCELED, false otherwise.

    @classmethod
    def settle_hold_invoice(cls, preimage):
        """settles a hold invoice"""
        request = noderpc.HodlInvoiceSettleRequest(
            payment_hash=hashlib.sha256(bytes.fromhex(preimage)).digest()
        )
        response = cls.stub.HodlInvoiceSettle(request)

        return response.state == 2  # True if state is SETTLED, false otherwise.

    @classmethod
    def gen_hold_invoice(cls, num_satoshis, description, invoice_expiry, cltv_expiry_blocks, order_id, lnpayment_concept, time):
        """Generates hold invoice"""

        hold_payment = {}
        # The preimage is a random hash of 256 bits entropy
        preimage = hashlib.sha256(secrets.token_bytes(nbytes=32)).digest()

        request = noderpc.InvoiceRequest(
            description=description,
            amount_msat=primitives__pb2.AmountOrAny(
                amount=primitives__pb2.Amount(msat=num_satoshis * 1_000)),
            label=f"Order:{order_id}-{lnpayment_concept}-{time}",
            expiry=int(
                invoice_expiry * 1.5
            ),  # actual expiry is padded by 50%, if tight, wrong client system clock will say invoice is expired.
            cltv=cltv_expiry_blocks,
            preimage=preimage,  # preimage is actually optional in cln, as cln would generate one by default
        )
        response = cls.stub.HodlInvoice(request)

        hold_payment["invoice"] = response.bolt11
        payreq_decoded = cls.decode_payreq(hold_payment["invoice"])
        hold_payment["preimage"] = preimage.hex()
        hold_payment["payment_hash"] = response.payment_hash.hex()
        hold_payment["created_at"] = timezone.make_aware(
            datetime.fromtimestamp(payreq_decoded.timestamp)
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

        request = noderpc.HodlInvoiceLookupRequest(
            payment_hash=bytes.fromhex(lnpayment.payment_hash)
        )
        response = cls.stub.HodlInvoiceLookup(request)

        # Will fail if 'unable to locate invoice'. Happens if invoice expiry
        # time has passed (but these are 15% padded at the moment). Should catch it
        # and report back that the invoice has expired (better robustness)
        if response.state == 0:  # OPEN
            pass
        if response.state == 1:  # SETTLED
            pass
        if response.state == 2:  # CANCELLED
            pass
        if response.state == 3:  # ACCEPTED (LOCKED)
            lnpayment.expiry_height = response.htlc_expiry
            lnpayment.status = LNPayment.Status.LOCKED
            lnpayment.save()
            return True

    @classmethod
    def lookup_invoice_status(cls, lnpayment):
        """
        Returns the status (as LNpayment.Status) of the given payment_hash
        If unchanged, returns the previous status
        """
        from api.models import LNPayment

        status = lnpayment.status

        cln_response_state_to_lnpayment_status = {
            0: LNPayment.Status.INVGEN,  # OPEN
            1: LNPayment.Status.SETLED,  # SETTLED
            2: LNPayment.Status.CANCEL,  # CANCELLED
            3: LNPayment.Status.LOCKED,  # ACCEPTED
        }

        try:
            # this is similar to LNNnode.validate_hold_invoice_locked
            request = noderpc.HodlInvoiceLookupRequest(
                payment_hash=bytes.fromhex(lnpayment.payment_hash)
            )
            response = cls.stub.HodlInvoiceLookup(request)

            # try saving expiry height
            if hasattr(response, "htlc_expiry"):
                try:
                    lnpayment.expiry_height = response.htlc_expiry
                except Exception:
                    pass

            status = cln_response_state_to_lnpayment_status[response.state]
            lnpayment.status = status
            lnpayment.save()

        except Exception as e:
            # If it fails at finding the invoice: it has been expired for more than an hour (and could be paid or just expired).
            # In RoboSats DB we make a distinction between cancelled and returned
            #  (cln-grpc-hodl has separate state for hodl-invoices, which it forgets after an invoice expired more than an hour ago)
            if "empty result for listdatastore_state" in str(e):
                print(str(e))
                request2 = noderpc.ListinvoicesRequest(
                    payment_hash=bytes.fromhex(lnpayment.payment_hash)
                )
                try:
                    response2 = cls.stub.ListInvoices(request2).invoices
                except Exception as e:
                    print(str(e))

                if response2[0].status == "paid":
                    status = LNPayment.Status.SETLED
                    lnpayment.status = status
                    lnpayment.save()
                elif response2[0].status == "expired":
                    status = LNPayment.Status.CANCEL
                    lnpayment.status = status
                    lnpayment.save()
                else:
                    print(str(e))

            # Other write to logs
            else:
                print(str(e))

        return status

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
        route_hints = payreq_decoded.route_hints.hints

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
                    route_cost += hop_hint.feebase.msat / 1_000
                    route_cost += hop_hint.feeprop * num_satoshis / 1_000_000

                # ...and store the cost of the route to the array
                routes_cost.append(route_cost)

            # If the cheapest possible private route is more expensive than what RoboSats is willing to pay
            if min(routes_cost) >= max_routing_fee_sats:
                payout["context"] = {
                    "bad_invoice": "The invoice hinted private routes are not payable within the submitted routing budget."
                }
                return payout

        if payreq_decoded.amount_msat == 0:
            payout["context"] = {
                "bad_invoice": "The invoice provided has no explicit amount"
            }
            return payout

        if not payreq_decoded.amount_msat // 1_000 == num_satoshis:
            payout["context"] = {
                "bad_invoice": "The invoice provided is not for "
                + "{:,}".format(num_satoshis)
                + " Sats"
            }
            return payout

        payout["created_at"] = timezone.make_aware(
            datetime.fromtimestamp(payreq_decoded.timestamp)
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
        payout["payment_hash"] = payreq_decoded.payment_hash

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
        request = noderpc.PayRequest(
            bolt11=lnpayment.invoice,
            maxfee=fee_limit_sat,
            retry_for=timeout_seconds,
        )

        try:
            response = cls.stub.Pay(request)

            if response.status == 0:  # COMPLETE
                lnpayment.status = LNPayment.Status.SUCCED
                lnpayment.fee = (
                    float(response.amount_sent_msat - response.amount_msat) / 1000
                )
                lnpayment.preimage = response.payment_preimage
                lnpayment.save()
                return True, None
            elif response.status == 1:  # PENDING
                failure_reason = str("PENDING")
                lnpayment.failure_reason = failure_reason
                lnpayment.status = LNPayment.Status.FLIGHT
                lnpayment.save()
                return False, failure_reason
            else:  # status == 2 FAILED
                failure_reason = str("FAILED")
                lnpayment.failure_reason = failure_reason
                lnpayment.status = LNPayment.Status.FAILRO
                lnpayment.save()
                return False, failure_reason
        except grpc._channel._InactiveRpcError as e:
            status_code = int(e.details().split("code: Some(")[1].split(")")[0])
            failure_reason = cls.payment_failure_context[status_code]
            lnpayment.failure_reason = status_code  # or failure_reason ?
            lnpayment.status = LNPayment.Status.FAILRO
            lnpayment.save()
            return False, failure_reason

    @classmethod
    def follow_send_payment(cls, hash):
        """Sends sats to buyer, continuous update"""

        from datetime import timedelta

        from decouple import config
        from django.utils import timezone

        from api.models import LNPayment, Order

        lnpayment = LNPayment.objects.get(payment_hash=hash)
        lnpayment.last_routing_time = timezone.now()
        lnpayment.save()

        # Default is 0ppm. Set by the user over API. Client's default is 1000 ppm.
        fee_limit_sat = int(
            float(lnpayment.num_satoshis)
            * float(lnpayment.routing_budget_ppm)
            / 1000000
        )
        timeout_seconds = int(config("PAYOUT_TIMEOUT_SECONDS"))

        request = noderpc.PayRequest(
            bolt11=lnpayment.invoice,
            maxfee=fee_limit_sat,
            # retry_for is not quite the same as a timeout. Pay can still take SIGNIFICANTLY longer to return if htlcs are stuck!
            retry_for=timeout_seconds,
            # allow_self_payment=True, No such thing in pay command and self_payments do not work with pay!
        )

        order = lnpayment.order_paid_LN
        if order.trade_escrow.num_satoshis < lnpayment.num_satoshis:
            print(f"Order: {order.id} Payout is larger than collateral !?")
            return

        def handle_response(response, was_in_transit=False):
            lnpayment.status = LNPayment.Status.FLIGHT
            lnpayment.in_flight = True
            lnpayment.save()
            order.status = Order.Status.PAY
            order.save()

            if response.status == 1:  # Status 1 'PENDING'
                print(f"Order: {order.id} IN_FLIGHT. Hash {hash}")

                # If payment was already "payment is in transition" we do not
                # want to spawn a new thread every 3 minutes to check on it.
                # in case this thread dies, let's move the last_routing_time
                # 20 minutes in the future so another thread spawns.
                if was_in_transit:
                    lnpayment.last_routing_time = timezone.now() + timedelta(minutes=20)
                    lnpayment.save()

            if response.status == 2:  # Status 3 'FAILED'
                lnpayment.status = LNPayment.Status.FAILRO
                lnpayment.last_routing_time = timezone.now()
                lnpayment.routing_attempts += 1
                lnpayment.failure_reason = (
                    -1
                )  # no failure_reason in non-error pay response with stauts FAILED
                lnpayment.in_flight = False
                if lnpayment.routing_attempts > 2:
                    lnpayment.status = LNPayment.Status.EXPIRE
                    lnpayment.routing_attempts = 0
                lnpayment.save()

                order.status = Order.Status.FAI
                order.expires_at = timezone.now() + timedelta(
                    seconds=order.t_to_expire(Order.Status.FAI)
                )
                order.save()
                print(
                    f"Order: {order.id} FAILED. Hash: {hash} Reason: {cls.payment_failure_context[-1]}"
                )
                return {
                    "succeded": False,
                    "context": f"payment failure reason: {cls.payment_failure_context[-1]}",
                }

            if response.status == 0:  # Status 2 'COMPLETE'
                print(f"Order: {order.id} SUCCEEDED. Hash: {hash}")
                lnpayment.status = LNPayment.Status.SUCCED
                lnpayment.fee = (
                    float(response.amount_sent_msat.msat - response.amount_msat.msat)
                    / 1000
                )
                lnpayment.preimage = response.payment_preimage
                lnpayment.save()
                order.status = Order.Status.SUC
                order.expires_at = timezone.now() + timedelta(
                    seconds=order.t_to_expire(Order.Status.SUC)
                )
                order.save()
                results = {"succeded": True}
                return results

        try:
            response = cls.stub.Pay(request)
            handle_response(response)

        except grpc._channel._InactiveRpcError as e:
            if "code: Some" in str(e):
                status_code = int(e.details().split("code: Some(")[1].split(")")[0])
                if (
                    status_code == 201
                ):  # Already paid with this hash using different amount or destination
                    # i don't think this can happen really, since we don't use the amount_msat in request and if you just try 'pay' 2x where the first time it succeeds you get the same non-error result the 2nd time.
                    # Listpays has some different fields as pay aswell, so not sure this makes sense
                    print(f"Order: {order.id} ALREADY PAID. Hash: {hash}.")

                    request = noderpc.ListpaysRequest(
                        payment_hash=bytes.fromhex(hash), status="complete"
                    )

                    for response in cls.stub.ListPays(request):
                        handle_response(response)
                # Permanent failure at destination. or Unable to find a route. or Route too expensive.
                elif status_code == 203 or status_code == 205 or status_code == 206:
                    lnpayment.status = LNPayment.Status.FAILRO
                    lnpayment.last_routing_time = timezone.now()
                    lnpayment.routing_attempts += 1
                    lnpayment.failure_reason = status_code
                    lnpayment.in_flight = False
                    if lnpayment.routing_attempts > 2:
                        lnpayment.status = LNPayment.Status.EXPIRE
                        lnpayment.routing_attempts = 0
                    lnpayment.save()

                    order.status = Order.Status.FAI
                    order.expires_at = timezone.now() + timedelta(
                        seconds=order.t_to_expire(Order.Status.FAI)
                    )
                    order.save()
                    print(
                        f"Order: {order.id} FAILED. Hash: {hash} Reason: {cls.payment_failure_context[status_code]}"
                    )
                    return {
                        "succeded": False,
                        "context": f"payment failure reason: {cls.payment_failure_context[status_code]}",
                    }
                elif status_code == 207:  # invoice expired
                    print(f"Order: {order.id}. INVOICE EXPIRED. Hash: {hash}")
                    lnpayment.status = LNPayment.Status.EXPIRE
                    lnpayment.last_routing_time = timezone.now()
                    lnpayment.in_flight = False
                    lnpayment.save()
                    order.status = Order.Status.FAI
                    order.expires_at = timezone.now() + timedelta(
                        seconds=order.t_to_expire(Order.Status.FAI)
                    )
                    order.save()
                    results = {
                        "succeded": False,
                        "context": "The payout invoice has expired",
                    }
                    return results
                else:  # -1 and 210 (don't know when 210 happens exactly)
                    print(str(e))
            else:
                print(str(e))

        except Exception as e:
            print(str(e))

    @classmethod
    def double_check_htlc_is_settled(cls, payment_hash):
        """Just as it sounds. Better safe than sorry!"""
        request = noderpc.ListinvoicesRequest(payment_hash=bytes.fromhex(payment_hash))
        response = cls.stub.ListInvoices(request)

        return (
            response.status == 1
        )  # CLN states: UNPAID = 0, PAID = 1, EXPIRED = 2, this is clns own invoice-lookup
        # so just a check for paid/unpaid/expired not hodl-invoice related states like ACCEPTED/CANCELED

import hashlib
import os
import secrets
import time
from base64 import b64decode
from datetime import datetime, timedelta

import grpc
import ring
from decouple import config
from django.utils import timezone

from . import invoices_pb2 as invoicesrpc
from . import invoices_pb2_grpc as invoicesstub
from . import lightning_pb2 as lnrpc
from . import lightning_pb2_grpc as lightningstub
from . import router_pb2 as routerrpc
from . import router_pb2_grpc as routerstub
from . import verrpc_pb2 as verrpc
from . import verrpc_pb2_grpc as verrpcstub

#######
# Works with LND (c-lightning in the future for multi-vendor resilience)
#######

# Read tls.cert from file or .env variable string encoded as base64
try:
    with open(os.path.join(config("LND_DIR"), "tls.cert"), "rb") as f:
        CERT = f.read()
except Exception:
    CERT = b64decode(config("LND_CERT_BASE64"))

# Read macaroon from file or .env variable string encoded as base64
try:
    with open(os.path.join(config("LND_DIR"), config("MACAROON_path")), "rb") as f:
        MACAROON = f.read()
except Exception:
    MACAROON = b64decode(config("LND_MACAROON_BASE64"))

LND_GRPC_HOST = config("LND_GRPC_HOST")
DISABLE_ONCHAIN = config("DISABLE_ONCHAIN", cast=bool, default=True)
MAX_SWAP_AMOUNT = config("MAX_SWAP_AMOUNT", cast=int, default=500_000)


class LNNode:

    os.environ["GRPC_SSL_CIPHER_SUITES"] = "HIGH+ECDSA"

    def metadata_callback(context, callback):
        callback([("macaroon", MACAROON.hex())], None)

    ssl_creds = grpc.ssl_channel_credentials(CERT)
    auth_creds = grpc.metadata_call_credentials(metadata_callback)
    combined_creds = grpc.composite_channel_credentials(ssl_creds, auth_creds)
    channel = grpc.secure_channel(LND_GRPC_HOST, combined_creds)

    lightningstub = lightningstub.LightningStub(channel)
    invoicesstub = invoicesstub.InvoicesStub(channel)
    routerstub = routerstub.RouterStub(channel)
    verrpcstub = verrpcstub.VersionerStub(channel)

    lnrpc = lnrpc
    invoicesrpc = invoicesrpc
    routerrpc = routerrpc
    verrpc = verrpc

    payment_failure_context = {
        0: "Payment isn't failed (yet)",
        1: "There are more routes to try, but the payment timeout was exceeded.",
        2: "All possible routes were tried and failed permanently. Or were no routes to the destination at all.",
        3: "A non-recoverable error has occured.",
        4: "Payment details incorrect (unknown hash, invalid amt or invalid final cltv delta)",
        5: "Insufficient local balance.",
    }

    @classmethod
    def get_version(cls):
        try:
            request = verrpc.VersionRequest()
            response = cls.verrpcstub.GetVersion(request)
            return "v" + response.version
        except Exception as e:
            print(e)
            return None

    @classmethod
    def decode_payreq(cls, invoice):
        """Decodes a lightning payment request (invoice)"""
        request = lnrpc.PayReqString(pay_req=invoice)
        response = cls.lightningstub.DecodePayReq(request)
        return response

    @classmethod
    def estimate_fee(cls, amount_sats, target_conf=2, min_confs=1):
        """Returns estimated fee for onchain payouts"""

        # We assume segwit. Use hardcoded address as shortcut so there is no need of user inputs yet.
        request = lnrpc.EstimateFeeRequest(
            AddrToAmount={"bc1qgxwaqe4m9mypd7ltww53yv3lyxhcfnhzzvy5j3": amount_sats},
            target_conf=target_conf,
            min_confs=min_confs,
            spend_unconfirmed=False,
        )

        response = cls.lightningstub.EstimateFee(request)

        return {
            "mining_fee_sats": response.fee_sat,
            "mining_fee_rate": response.sat_per_vbyte,
        }

    wallet_balance_cache = {}

    @ring.dict(wallet_balance_cache, expire=10)  # keeps in cache for 10 seconds
    @classmethod
    def wallet_balance(cls):
        """Returns onchain balance"""
        request = lnrpc.WalletBalanceRequest()
        response = cls.lightningstub.WalletBalance(request)

        return {
            "total_balance": response.total_balance,
            "confirmed_balance": response.confirmed_balance,
            "unconfirmed_balance": response.unconfirmed_balance,
        }

    channel_balance_cache = {}

    @ring.dict(channel_balance_cache, expire=10)  # keeps in cache for 10 seconds
    @classmethod
    def channel_balance(cls):
        """Returns channels balance"""
        request = lnrpc.ChannelBalanceRequest()
        response = cls.lightningstub.ChannelBalance(request)

        return {
            "local_balance": response.local_balance.sat,
            "remote_balance": response.remote_balance.sat,
            "unsettled_local_balance": response.unsettled_local_balance.sat,
            "unsettled_remote_balance": response.unsettled_remote_balance.sat,
        }

    @classmethod
    def pay_onchain(cls, onchainpayment, queue_code=5, on_mempool_code=2):
        """Send onchain transaction for buyer payouts"""

        if DISABLE_ONCHAIN or onchainpayment.sent_satoshis > MAX_SWAP_AMOUNT:
            return False

        request = lnrpc.SendCoinsRequest(
            addr=onchainpayment.address,
            amount=int(onchainpayment.sent_satoshis),
            sat_per_vbyte=int(onchainpayment.mining_fee_rate),
            label=str("Payout order #" + str(onchainpayment.order_paid_TX.id)),
            spend_unconfirmed=config("SPEND_UNCONFIRMED", default=False, cast=bool),
        )

        # Cheap security measure to ensure there has been some non-deterministic time between request and DB check
        delay = (
            secrets.randbelow(2**256) / (2**256) * 10
        )  # Random uniform 0 to 5 secs with good entropy
        time.sleep(3 + delay)

        if onchainpayment.status == queue_code:
            # Changing the state to "MEMPO" should be atomic with SendCoins.
            onchainpayment.status = on_mempool_code
            onchainpayment.save(update_fields=["status"])
            response = cls.lightningstub.SendCoins(request)

            if response.txid:
                onchainpayment.txid = response.txid
                onchainpayment.broadcasted = True
            onchainpayment.save(update_fields=["txid", "broadcasted"])
            return True

        elif onchainpayment.status == on_mempool_code:
            # Bug, double payment attempted
            return True

    @classmethod
    def cancel_return_hold_invoice(cls, payment_hash):
        """Cancels or returns a hold invoice"""
        request = invoicesrpc.CancelInvoiceMsg(payment_hash=bytes.fromhex(payment_hash))
        response = cls.invoicesstub.CancelInvoice(request)
        # Fix this: tricky because canceling sucessfully an invoice has no response. TODO
        return str(response) == ""  # True if no response, false otherwise.

    @classmethod
    def settle_hold_invoice(cls, preimage):
        """settles a hold invoice"""
        request = invoicesrpc.SettleInvoiceMsg(preimage=bytes.fromhex(preimage))
        response = cls.invoicesstub.SettleInvoice(request)
        # Fix this: tricky because settling sucessfully an invoice has None response. TODO
        return str(response) == ""  # True if no response, false otherwise.

    @classmethod
    def gen_hold_invoice(
        cls, num_satoshis, description, invoice_expiry, cltv_expiry_blocks
    ):
        """Generates hold invoice"""

        hold_payment = {}
        # The preimage is a random hash of 256 bits entropy
        preimage = hashlib.sha256(secrets.token_bytes(nbytes=32)).digest()

        # Its hash is used to generate the hold invoice
        r_hash = hashlib.sha256(preimage).digest()

        request = invoicesrpc.AddHoldInvoiceRequest(
            memo=description,
            value=num_satoshis,
            hash=r_hash,
            expiry=int(
                invoice_expiry * 1.5
            ),  # actual expiry is padded by 50%, if tight, wrong client system clock will say invoice is expired.
            cltv_expiry=cltv_expiry_blocks,
        )
        response = cls.invoicesstub.AddHoldInvoice(request)

        hold_payment["invoice"] = response.payment_request
        payreq_decoded = cls.decode_payreq(hold_payment["invoice"])
        hold_payment["preimage"] = preimage.hex()
        hold_payment["payment_hash"] = payreq_decoded.payment_hash
        hold_payment["created_at"] = timezone.make_aware(
            datetime.fromtimestamp(payreq_decoded.timestamp)
        )
        hold_payment["expires_at"] = hold_payment["created_at"] + timedelta(
            seconds=payreq_decoded.expiry
        )
        hold_payment["cltv_expiry"] = cltv_expiry_blocks

        return hold_payment

    @classmethod
    def validate_hold_invoice_locked(cls, lnpayment):
        """Checks if hold invoice is locked"""
        from api.models import LNPayment

        request = invoicesrpc.LookupInvoiceMsg(
            payment_hash=bytes.fromhex(lnpayment.payment_hash)
        )
        response = cls.invoicesstub.LookupInvoiceV2(request)

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
            lnpayment.expiry_height = response.htlcs[0].expiry_height
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

        lnd_response_state_to_lnpayment_status = {
            0: LNPayment.Status.INVGEN,  # OPEN
            1: LNPayment.Status.SETLED,  # SETTLED
            2: LNPayment.Status.CANCEL,  # CANCELLED
            3: LNPayment.Status.LOCKED,  # ACCEPTED
        }

        try:
            # this is similar to LNNnode.validate_hold_invoice_locked
            request = invoicesrpc.LookupInvoiceMsg(
                payment_hash=bytes.fromhex(lnpayment.payment_hash)
            )
            response = cls.invoicesstub.LookupInvoiceV2(request)

            # try saving expiry height
            if hasattr(response, "htlcs"):
                try:
                    lnpayment.expiry_height = response.htlcs[0].expiry_height
                except Exception:
                    pass

            status = lnd_response_state_to_lnpayment_status[response.state]

        except Exception as e:
            # If it fails at finding the invoice: it has been canceled.
            # In RoboSats DB we make a distinction between cancelled and returned (LND does not)
            if "unable to locate invoice" in str(e):
                print(str(e))
                status = LNPayment.Status.CANCEL

            # LND restarted.
            if "wallet locked, unlock it" in str(e):
                print(str(timezone.now()) + " :: Wallet Locked")

            # Other write to logs
            else:
                print(str(e))

        return status

    @classmethod
    def resetmc(cls):
        request = routerrpc.ResetMissionControlRequest()
        _ = cls.routerstub.ResetMissionControl(request)
        return True

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
        route_hints = payreq_decoded.route_hints

        # Max amount RoboSats will pay for routing
        if routing_budget_ppm == 0:
            max_routing_fee_sats = max(
                num_satoshis * float(config("PROPORTIONAL_ROUTING_FEE_LIMIT")),
                float(config("MIN_FLAT_ROUTING_FEE_LIMIT_REWARD")),
            )
        else:
            max_routing_fee_sats = int(
                float(num_satoshis) * float(routing_budget_ppm) / 1_000_000
            )

        if route_hints:
            routes_cost = []
            # For every hinted route...
            for hinted_route in route_hints:
                route_cost = 0
                # ...add up the cost of every hinted hop...
                for hop_hint in hinted_route.hop_hints:
                    route_cost += hop_hint.fee_base_msat / 1000
                    route_cost += (
                        hop_hint.fee_proportional_millionths * num_satoshis / 1_000_000
                    )

                # ...and store the cost of the route to the array
                routes_cost.append(route_cost)

            # If the cheapest possible private route is more expensive than what RoboSats is willing to pay
            if min(routes_cost) >= max_routing_fee_sats:
                payout["context"] = {
                    "bad_invoice": "The invoice hinted private routes are not payable within the submitted routing budget."
                }
                return payout

        if payreq_decoded.num_satoshis == 0:
            payout["context"] = {
                "bad_invoice": "The invoice provided has no explicit amount"
            }
            return payout

        if not payreq_decoded.num_satoshis == num_satoshis:
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
        request = routerrpc.SendPaymentRequest(
            payment_request=lnpayment.invoice,
            fee_limit_sat=fee_limit_sat,
            timeout_seconds=timeout_seconds,
        )

        for response in cls.routerstub.SendPaymentV2(request):

            if response.status == 0:  # Status 0 'UNKNOWN'
                # Not sure when this status happens
                pass

            if response.status == 1:  # Status 1 'IN_FLIGHT'
                pass

            if response.status == 3:  # Status 3 'FAILED'
                """0	Payment isn't failed (yet).
                1	There are more routes to try, but the payment timeout was exceeded.
                2	All possible routes were tried and failed permanently. Or were no routes to the destination at all.
                3	A non-recoverable error has occured.
                4	Payment details incorrect (unknown hash, invalid amt or invalid final cltv delta)
                5	Insufficient local balance.
                """
                failure_reason = cls.payment_failure_context[response.failure_reason]
                lnpayment.failure_reason = response.failure_reason
                lnpayment.status = LNPayment.Status.FAILRO
                lnpayment.save(update_fields=["failure_reason", "status"])
                return False, failure_reason

            if response.status == 2:  # STATUS 'SUCCEEDED'
                lnpayment.status = LNPayment.Status.SUCCED
                lnpayment.fee = float(response.fee_msat) / 1000
                lnpayment.preimage = response.payment_preimage
                lnpayment.save(update_fields=["fee", "status", "preimage"])
                return True, None

        return False

    @classmethod
    def follow_send_payment(cls, lnpayment, fee_limit_sat, timeout_seconds):
        """
        Sends sats to buyer, continuous update.
        Has a lot of boilerplate to correctly handle every possible condition and failure case.
        """
        from api.models import LNPayment, Order

        hash = lnpayment.payment_hash

        request = cls.routerrpc.SendPaymentRequest(
            payment_request=lnpayment.invoice,
            fee_limit_sat=fee_limit_sat,
            timeout_seconds=timeout_seconds,
            allow_self_payment=True,
        )

        order = lnpayment.order_paid_LN
        if order.trade_escrow.num_satoshis < lnpayment.num_satoshis:
            print(f"Order: {order.id} Payout is larger than collateral !?")
            return

        def handle_response(response, was_in_transit=False):
            lnpayment.status = LNPayment.Status.FLIGHT
            lnpayment.in_flight = True
            lnpayment.save(update_fields=["in_flight", "status"])
            order.status = Order.Status.PAY
            order.save(update_fields=["status"])

            if response.status == 0:  # Status 0 'UNKNOWN'
                # Not sure when this status happens
                print(f"Order: {order.id} UNKNOWN. Hash {hash}")
                lnpayment.in_flight = False
                lnpayment.save(update_fields=["in_flight"])

            if response.status == 1:  # Status 1 'IN_FLIGHT'
                print(f"Order: {order.id} IN_FLIGHT. Hash {hash}")

                # If payment was already "payment is in transition" we do not
                # want to spawn a new thread every 3 minutes to check on it.
                # in case this thread dies, let's move the last_routing_time
                # 20 minutes in the future so another thread spawns.
                if was_in_transit:
                    lnpayment.last_routing_time = timezone.now() + timedelta(minutes=20)
                    lnpayment.save(update_fields=["last_routing_time"])

            if response.status == 3:  # Status 3 'FAILED'
                lnpayment.status = LNPayment.Status.FAILRO
                lnpayment.last_routing_time = timezone.now()
                lnpayment.routing_attempts += 1
                lnpayment.failure_reason = response.failure_reason
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

                order.status = Order.Status.FAI
                order.expires_at = timezone.now() + timedelta(
                    seconds=order.t_to_expire(Order.Status.FAI)
                )
                order.save(update_fields=["status", "expires_at"])
                print(
                    f"Order: {order.id} FAILED. Hash: {hash} Reason: {cls.payment_failure_context[response.failure_reason]}"
                )
                return {
                    "succeded": False,
                    "context": f"payment failure reason: {cls.payment_failure_context[response.failure_reason]}",
                }

            if response.status == 2:  # Status 2 'SUCCEEDED'
                print(f"Order: {order.id} SUCCEEDED. Hash: {hash}")
                lnpayment.status = LNPayment.Status.SUCCED
                lnpayment.fee = float(response.fee_msat) / 1000
                lnpayment.preimage = response.payment_preimage
                lnpayment.save(update_fields=["status", "fee", "preimage"])

                order.status = Order.Status.SUC
                order.expires_at = timezone.now() + timedelta(
                    seconds=order.t_to_expire(Order.Status.SUC)
                )
                order.save(update_fields=["status", "expires_at"])

                results = {"succeded": True}
                return results

        try:
            for response in cls.routerstub.SendPaymentV2(request):

                handle_response(response)

        except Exception as e:

            if "invoice expired" in str(e):
                print(f"Order: {order.id}. INVOICE EXPIRED. Hash: {hash}")
                # An expired invoice can already be in-flight. Check.
                try:
                    request = routerrpc.TrackPaymentRequest(
                        payment_hash=bytes.fromhex(hash)
                    )

                    for response in cls.routerstub.TrackPaymentV2(request):
                        handle_response(response, was_in_transit=True)

                except Exception as e:
                    if "payment isn't initiated" in str(e):
                        print(
                            f"Order: {order.id}. The expired invoice had not been initiated. Hash: {hash}"
                        )

                        lnpayment.status = LNPayment.Status.EXPIRE
                        lnpayment.last_routing_time = timezone.now()
                        lnpayment.in_flight = False
                        lnpayment.save(
                            update_fields=["status", "last_routing_time", "in_flight"]
                        )

                        order.status = Order.Status.FAI
                        order.expires_at = timezone.now() + timedelta(
                            seconds=order.t_to_expire(Order.Status.FAI)
                        )
                        order.save(update_fields=["status", "expires_at"])

                        results = {
                            "succeded": False,
                            "context": "The payout invoice has expired",
                        }
                        return results

            elif "payment is in transition" in str(e):
                print(f"Order: {order.id} ALREADY IN TRANSITION. Hash: {hash}.")

                request = routerrpc.TrackPaymentRequest(
                    payment_hash=bytes.fromhex(hash)
                )

                for response in cls.routerstub.TrackPaymentV2(request):
                    handle_response(response, was_in_transit=True)

            elif "invoice is already paid" in str(e):
                print(f"Order: {order.id} ALREADY PAID. Hash: {hash}.")

                request = routerrpc.TrackPaymentRequest(
                    payment_hash=bytes.fromhex(hash)
                )

                for response in cls.routerstub.TrackPaymentV2(request):
                    handle_response(response)

            else:
                print(str(e))

    @classmethod
    def double_check_htlc_is_settled(cls, payment_hash):
        """Just as it sounds. Better safe than sorry!"""
        request = invoicesrpc.LookupInvoiceMsg(payment_hash=bytes.fromhex(payment_hash))
        response = cls.invoicesstub.LookupInvoiceV2(request)

        return (
            response.state == 1
        )  # LND states: 0 OPEN, 1 SETTLED, 3 ACCEPTED, GRPC_ERROR status 5 when cancelled/returned

import hashlib
import os
import secrets
import struct
import time
from base64 import b64decode
from datetime import datetime, timedelta

import grpc
import ring
from decouple import config
from django.utils import timezone

from . import (
    invoices_pb2,
    invoices_pb2_grpc,
    lightning_pb2,
    lightning_pb2_grpc,
    router_pb2,
    router_pb2_grpc,
    signer_pb2,
    signer_pb2_grpc,
    verrpc_pb2,
    verrpc_pb2_grpc,
)

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
    with open(os.path.join(config("LND_DIR"), config("MACAROON_PATH")), "rb") as f:
        MACAROON = f.read()
except Exception:
    MACAROON = b64decode(config("LND_MACAROON_BASE64"))

LND_GRPC_HOST = config("LND_GRPC_HOST")
DISABLE_ONCHAIN = config("DISABLE_ONCHAIN", cast=bool, default=True)
MAX_SWAP_AMOUNT = config("MAX_SWAP_AMOUNT", cast=int, default=500_000)


# Logger function used to build tests/mocks/lnd.py
def log(name, request, response):
    if not config("LOG_LND", cast=bool, default=False):
        return
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_message = f"######################################\nEvent: {name}\nTime: {current_time}\nRequest:\n{request}\nResponse:\n{response}\nType: {type(response)}\n"

    with open("lnd_log.txt", "a") as file:
        file.write(log_message)


class LNDNode:
    os.environ["GRPC_SSL_CIPHER_SUITES"] = "HIGH+ECDSA"

    def metadata_callback(context, callback):
        callback([("macaroon", MACAROON.hex())], None)

    ssl_creds = grpc.ssl_channel_credentials(CERT)
    auth_creds = grpc.metadata_call_credentials(metadata_callback)
    combined_creds = grpc.composite_channel_credentials(ssl_creds, auth_creds)
    channel = grpc.secure_channel(LND_GRPC_HOST, combined_creds)

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
            request = verrpc_pb2.VersionRequest()
            verstub = verrpc_pb2_grpc.VersionerStub(cls.channel)
            response = verstub.GetVersion(request)
            log("verstub.GetVersion", request, response)
            return "v" + response.version
        except Exception as e:
            print(f"Cannot get LND version: {e}")
            return "Not installed"

    @classmethod
    def decode_payreq(cls, invoice):
        """Decodes a lightning payment request (invoice)"""
        lightningstub = lightning_pb2_grpc.LightningStub(cls.channel)
        request = lightning_pb2.PayReqString(pay_req=invoice)
        response = lightningstub.DecodePayReq(request)
        log("lightning_pb2_grpc.DecodePayReq", request, response)
        return response

    @classmethod
    def estimate_fee(cls, amount_sats, target_conf=2, min_confs=1):
        """Returns estimated fee for onchain payouts"""
        lightningstub = lightning_pb2_grpc.LightningStub(cls.channel)
        request = lightning_pb2.GetInfoRequest()
        response = lightningstub.GetInfo(request)

        if response.testnet:
            dummy_address = "tb1qehyqhruxwl2p5pt52k6nxj4v8wwc3f3pg7377x"
        elif response.chains[0].network == "regtest":
            dummy_address = "bcrt1q3w8xja7knmycsglnxg2xzjq8uv9u7jdwau25nl"
        else:
            dummy_address = "bc1qgxwaqe4m9mypd7ltww53yv3lyxhcfnhzzvy5j3"
        # We assume segwit. Use hardcoded address as shortcut so there is no need of user inputs yet.
        request = lightning_pb2.EstimateFeeRequest(
            AddrToAmount={dummy_address: amount_sats},
            target_conf=target_conf,
            min_confs=min_confs,
            spend_unconfirmed=False,
        )

        lightningstub = lightning_pb2_grpc.LightningStub(cls.channel)
        response = lightningstub.EstimateFee(request)
        log("lightning_pb2_grpc.EstimateFee", request, response)

        return {
            "mining_fee_sats": response.fee_sat,
            "mining_fee_rate": response.sat_per_vbyte,
        }

    wallet_balance_cache = {}

    @ring.dict(wallet_balance_cache, expire=10)  # keeps in cache for 10 seconds
    @classmethod
    def wallet_balance(cls):
        """Returns onchain balance"""
        lightningstub = lightning_pb2_grpc.LightningStub(cls.channel)
        request = lightning_pb2.WalletBalanceRequest()
        response = lightningstub.WalletBalance(request)
        log("lightning_pb2_grpc.WalletBalance", request, response)

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
        lightningstub = lightning_pb2_grpc.LightningStub(cls.channel)
        request = lightning_pb2.ChannelBalanceRequest()
        response = lightningstub.ChannelBalance(request)
        log("lightning_pb2_grpc.ChannelBalance", request, response)

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

        request = lightning_pb2.SendCoinsRequest(
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
        if not config("TESTING", cast=bool, default=False):
            time.sleep(3 + delay)

        if onchainpayment.status == queue_code:
            # Changing the state to "MEMPO" should be atomic with SendCoins.
            onchainpayment.status = on_mempool_code
            onchainpayment.save(update_fields=["status"])
            lightningstub = lightning_pb2_grpc.LightningStub(cls.channel)
            response = lightningstub.SendCoins(request)
            log("lightning_pb2_grpc.SendCoins", request, response)

            if response.txid:
                onchainpayment.txid = response.txid
                onchainpayment.broadcasted = True
            onchainpayment.save(update_fields=["txid", "broadcasted"])
            onchainpayment.order_paid_TX.log(
                f"TX OnchainPayment({onchainpayment.id},{response.txid}) in <b>mempool</b>"
            )
            return True

        elif onchainpayment.status == on_mempool_code:
            # Bug, double payment attempted
            onchainpayment.order_paid_TX.log(
                f"Attempted to re-broadcast OnchainPayment({onchainpayment.id},{onchainpayment}) already in mempool",
                level="ERROR",
            )
            return True

    @classmethod
    def cancel_return_hold_invoice(cls, payment_hash):
        """Cancels or returns a hold invoice"""
        request = invoices_pb2.CancelInvoiceMsg(
            payment_hash=bytes.fromhex(payment_hash)
        )
        invoicesstub = invoices_pb2_grpc.InvoicesStub(cls.channel)
        response = invoicesstub.CancelInvoice(request)
        log("invoices_pb2_grpc.CancelInvoice", request, response)
        # Fix this: tricky because canceling sucessfully an invoice has no response. TODO
        return str(response) == ""  # True if no response, false otherwise.

    @classmethod
    def settle_hold_invoice(cls, preimage):
        """settles a hold invoice"""
        request = invoices_pb2.SettleInvoiceMsg(preimage=bytes.fromhex(preimage))
        invoicesstub = invoices_pb2_grpc.InvoicesStub(cls.channel)
        response = invoicesstub.SettleInvoice(request)
        log("invoices_pb2_grpc.SettleInvoice", request, response)
        # Fix this: tricky because settling sucessfully an invoice has None response. TODO
        return str(response) == ""  # True if no response, false otherwise.

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
        hold_payment = {}
        # The preimage is a random hash of 256 bits entropy
        preimage = hashlib.sha256(secrets.token_bytes(nbytes=32)).digest()

        # Its hash is used to generate the hold invoice
        r_hash = hashlib.sha256(preimage).digest()

        request = invoices_pb2.AddHoldInvoiceRequest(
            memo=description,
            value=num_satoshis,
            hash=r_hash,
            expiry=int(
                invoice_expiry * 1.5
            ),  # actual expiry is padded by 50%, if tight, wrong client system clock will say invoice is expired.
            cltv_expiry=cltv_expiry_blocks,
        )
        invoicesstub = invoices_pb2_grpc.InvoicesStub(cls.channel)
        response = invoicesstub.AddHoldInvoice(request)
        log("invoices_pb2_grpc.AddHoldInvoice", request, response)

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

        request = invoices_pb2.LookupInvoiceMsg(
            payment_hash=bytes.fromhex(lnpayment.payment_hash)
        )
        invoicesstub = invoices_pb2_grpc.InvoicesStub(cls.channel)
        response = invoicesstub.LookupInvoiceV2(request)
        log("invoices_pb2_grpc.LookupInvoiceV2", request, response)

        # Will fail if 'unable to locate invoice'. Happens if invoice expiry
        # time has passed (but these are 15% padded at the moment). Should catch it
        # and report back that the invoice has expired (better robustness)
        if response.state == lightning_pb2.Invoice.InvoiceState.OPEN:  # OPEN
            pass
        if response.state == lightning_pb2.Invoice.InvoiceState.SETTLED:  # SETTLED
            pass
        if response.state == lightning_pb2.Invoice.InvoiceState.CANCELED:  # CANCELED
            pass
        if (
            response.state == lightning_pb2.Invoice.InvoiceState.ACCEPTED
        ):  # ACCEPTED (LOCKED)
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
        expiry_height = 0

        lnd_response_state_to_lnpayment_status = {
            0: LNPayment.Status.INVGEN,  # OPEN
            1: LNPayment.Status.SETLED,  # SETTLED
            2: LNPayment.Status.CANCEL,  # CANCELED
            3: LNPayment.Status.LOCKED,  # ACCEPTED
        }

        try:
            # this is similar to LNNnode.validate_hold_invoice_locked
            request = invoices_pb2.LookupInvoiceMsg(
                payment_hash=bytes.fromhex(lnpayment.payment_hash)
            )
            invoicesstub = invoices_pb2_grpc.InvoicesStub(cls.channel)
            response = invoicesstub.LookupInvoiceV2(request)
            log("invoices_pb2_grpc.LookupInvoiceV2", request, response)

            status = lnd_response_state_to_lnpayment_status[response.state]

            # get expiry height
            if hasattr(response, "htlcs"):
                try:
                    for htlc in response.htlcs:
                        expiry_height = max(expiry_height, htlc.expiry_height)
                except Exception:
                    pass

        except Exception as e:
            # If it fails at finding the invoice: it has been canceled.
            # In RoboSats DB we make a distinction between CANCELED and returned (LND does not)
            if "unable to locate invoice" in str(e):
                print(str(e))
                status = LNPayment.Status.CANCEL

            # LND restarted.
            elif "wallet locked, unlock it" in str(e):
                print(str(timezone.now()) + " :: Wallet Locked")

            # Other write to logs
            else:
                print(str(e))

        return status, expiry_height

    # UNUSED
    # @classmethod
    # def resetmc(cls):
    #     routerstub = router_pb2_grpc.RouterStub(cls.channel)
    #     request = router_pb2.ResetMissionControlRequest()
    #     _ = routerstub.ResetMissionControl(request)
    #     return True

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
                    "bad_invoice": "The invoice hinted private routes are not payable within the submitted routing budget. This can be adjusted with Advanced Options enabled."
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
        request = router_pb2.SendPaymentRequest(
            payment_request=lnpayment.invoice,
            fee_limit_sat=fee_limit_sat,
            timeout_seconds=timeout_seconds,
            amp=True,
        )

        routerstub = router_pb2_grpc.RouterStub(cls.channel)
        for response in routerstub.SendPaymentV2(request):
            log("router_pb2_grpc.SendPaymentV2", request, response)
            if (
                response.status == lightning_pb2.Payment.PaymentStatus.UNKNOWN
            ):  # Status 0 'UNKNOWN'
                # Not sure when this status happens
                pass

            if (
                response.status == lightning_pb2.Payment.PaymentStatus.IN_FLIGHT
            ):  # Status 1 'IN_FLIGHT'
                pass

            if (
                response.status == lightning_pb2.Payment.PaymentStatus.FAILED
            ):  # Status 3 'FAILED'
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

            if (
                response.status == lightning_pb2.Payment.PaymentStatus.SUCCEEDED
            ):  # STATUS 'SUCCEEDED'
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

        request = router_pb2.SendPaymentRequest(
            payment_request=lnpayment.invoice,
            fee_limit_sat=fee_limit_sat,
            timeout_seconds=timeout_seconds,
            allow_self_payment=True,
            amp=True,
        )

        order = lnpayment.order_paid_LN
        if order.trade_escrow.num_satoshis < lnpayment.num_satoshis:
            print(f"Order: {order.id} Payout is larger than collateral !?")
            return

        def handle_response(response, was_in_transit=False):
            lnpayment.status = LNPayment.Status.FLIGHT
            lnpayment.in_flight = True
            lnpayment.save(update_fields=["in_flight", "status"])
            order.update_status(Order.Status.PAY)
            order.save(update_fields=["status"])

            if (
                response.status == lightning_pb2.Payment.PaymentStatus.UNKNOWN
            ):  # Status 0 'UNKNOWN'
                # Not sure when this status happens
                print(f"Order: {order.id} UNKNOWN. Hash {hash}")
                lnpayment.in_flight = False
                lnpayment.save(update_fields=["in_flight"])

            if (
                response.status == lightning_pb2.Payment.PaymentStatus.IN_FLIGHT
            ):  # Status 1 'IN_FLIGHT'
                print(f"Order: {order.id} IN_FLIGHT. Hash {hash}")

                # If payment was already "payment is in transition" we do not
                # want to spawn a new thread every 3 minutes to check on it.
                # in case this thread dies, let's move the last_routing_time
                # 20 minutes in the future so another thread spawns.
                if was_in_transit:
                    lnpayment.last_routing_time = timezone.now() + timedelta(minutes=20)
                    lnpayment.save(update_fields=["last_routing_time"])

            if (
                response.status == lightning_pb2.Payment.PaymentStatus.FAILED
            ):  # Status 3 'FAILED'
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

                order.update_status(Order.Status.FAI)

                order.expires_at = timezone.now() + timedelta(
                    seconds=order.t_to_expire(Order.Status.FAI)
                )
                order.save(update_fields=["expires_at"])

                str_failure_reason = cls.payment_failure_context[
                    response.failure_reason
                ]
                print(
                    f"Order: {order.id} FAILED. Hash: {hash} Reason: {str_failure_reason}"
                )
                order.log(
                    f"Payment LNPayment({lnpayment.payment_hash},{str(lnpayment)}) <b>failed</b>. Failure reason: {str_failure_reason})"
                )

                return {
                    "succeded": False,
                    "context": f"payment failure reason: {cls.payment_failure_context[response.failure_reason]}",
                }

            if (
                response.status == lightning_pb2.Payment.PaymentStatus.SUCCEEDED
            ):  # Status 2 'SUCCEEDED'
                print(f"Order: {order.id} SUCCEEDED. Hash: {hash}")
                lnpayment.status = LNPayment.Status.SUCCED
                lnpayment.fee = float(response.fee_msat) / 1000
                lnpayment.preimage = response.payment_preimage
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

        try:
            routerstub = router_pb2_grpc.RouterStub(cls.channel)
            for response in routerstub.SendPaymentV2(request):
                log("router_pb2_grpc.SendPaymentV2", request, response)
                handle_response(response)

        except Exception as e:
            if "invoice expired" in str(e):
                print(f"Order: {order.id}. INVOICE EXPIRED. Hash: {hash}")
                # An expired invoice can already be in-flight. Check.
                try:
                    request = router_pb2.TrackPaymentRequest(
                        payment_hash=bytes.fromhex(hash)
                    )

                    routerstub = router_pb2_grpc.RouterStub(cls.channel)
                    for response in routerstub.TrackPaymentV2(request):
                        log("router_pb2_grpc.TrackPaymentV2", request, response)
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

            elif "payment is in transition" in str(e):
                print(f"Order: {order.id} ALREADY IN TRANSITION. Hash: {hash}.")

                request = router_pb2.TrackPaymentRequest(
                    payment_hash=bytes.fromhex(hash)
                )

                routerstub = router_pb2_grpc.RouterStub(cls.channel)
                for response in routerstub.TrackPaymentV2(request):
                    log("router_pb2_grpc.TrackPaymentV2", request, response)
                    handle_response(response, was_in_transit=True)

            elif "invoice is already paid" in str(e):
                print(f"Order: {order.id} ALREADY PAID. Hash: {hash}.")

                request = router_pb2.TrackPaymentRequest(
                    payment_hash=bytes.fromhex(hash)
                )

                routerstub = router_pb2_grpc.RouterStub(cls.channel)
                for response in routerstub.TrackPaymentV2(request):
                    log("router_pb2_grpc.TrackPaymentV2", request, response)
                    handle_response(response)

            else:
                print(str(e))

    @classmethod
    def send_keysend(
        cls, target_pubkey, message, num_satoshis, routing_budget_sats, timeout, sign
    ):
        # Thank you @cryptosharks131 / lndg for the inspiration
        # Source https://github.com/cryptosharks131/lndg/blob/master/keysend.py

        from api.models import LNPayment

        ALLOW_SELF_KEYSEND = config("ALLOW_SELF_KEYSEND", cast=bool, default=False)
        keysend_payment = {}
        keysend_payment["created_at"] = timezone.now()
        keysend_payment["expires_at"] = timezone.now()
        try:
            secret = secrets.token_bytes(32)
            hashed_secret = hashlib.sha256(secret).hexdigest()
            custom_records = [
                (5482373484, secret),
            ]
            keysend_payment["preimage"] = secret.hex()
            keysend_payment["payment_hash"] = hashed_secret

            msg = str(message)

            if len(msg) > 0:
                custom_records.append(
                    (34349334, bytes.fromhex(msg.encode("utf-8").hex()))
                )
                if sign:
                    lightningstub = lightning_pb2_grpc.LightningStub(cls.channel)
                    self_pubkey = lightningstub.GetInfo(
                        lightning_pb2.GetInfoRequest()
                    ).identity_pubkey
                    timestamp = struct.pack(">i", int(time.time()))
                    signerstub = signer_pb2_grpc.SignerStub(cls.channel)
                    signature = signerstub.SignMessage(
                        signer_pb2.SignMessageReq(
                            msg=(
                                bytes.fromhex(self_pubkey)
                                + bytes.fromhex(target_pubkey)
                                + timestamp
                                + bytes.fromhex(msg.encode("utf-8").hex())
                            ),
                            key_loc=signer_pb2.KeyLocator(key_family=6, key_index=0),
                        )
                    ).signature
                    custom_records.append((34349337, signature))
                    custom_records.append((34349339, bytes.fromhex(self_pubkey)))
                    custom_records.append((34349343, timestamp))

            request = router_pb2.SendPaymentRequest(
                dest=bytes.fromhex(target_pubkey),
                dest_custom_records=custom_records,
                fee_limit_sat=routing_budget_sats,
                timeout_seconds=timeout,
                amt=num_satoshis,
                payment_hash=bytes.fromhex(hashed_secret),
                allow_self_payment=ALLOW_SELF_KEYSEND,
            )
            routerstub = router_pb2_grpc.RouterStub(cls.channel)
            for response in routerstub.SendPaymentV2(request):
                log("router_pb2_grpc.SendPaymentV2", request, response)
                if response.status == lightning_pb2.Payment.PaymentStatus.IN_FLIGHT:
                    keysend_payment["status"] = LNPayment.Status.FLIGHT
                if response.status == lightning_pb2.Payment.PaymentStatus.SUCCEEDED:
                    keysend_payment["fee"] = float(response.fee_msat) / 1000
                    keysend_payment["status"] = LNPayment.Status.SUCCED
                if response.status == lightning_pb2.Payment.PaymentStatus.FAILED:
                    keysend_payment["status"] = LNPayment.Status.FAILRO
                    keysend_payment["failure_reason"] = response.failure_reason
                if response.status == lightning_pb2.Payment.PaymentStatus.UNKNOWN:
                    print("Unknown Error")
        except Exception as e:
            if "self-payments not allowed" in str(e):
                print("Self keysend is not allowed")
            else:
                print("Error while sending keysend payment! Error: " + str(e))

        return True, keysend_payment

    @classmethod
    def double_check_htlc_is_settled(cls, payment_hash):
        """Just as it sounds. Better safe than sorry!"""
        request = invoices_pb2.LookupInvoiceMsg(
            payment_hash=bytes.fromhex(payment_hash)
        )
        invoicesstub = invoices_pb2_grpc.InvoicesStub(cls.channel)
        response = invoicesstub.LookupInvoiceV2(request)
        log("invoices_pb2_grpc.LookupInvoiceV2", request, response)

        return (
            response.state == lightning_pb2.Invoice.InvoiceState.SETTLED
        )  # LND states: 0 OPEN, 1 SETTLED, 3 ACCEPTED, GRPC_ERROR status 5 when CANCELED/returned

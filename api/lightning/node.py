import grpc, os, hashlib, secrets, ring


from . import lightning_pb2 as lnrpc, lightning_pb2_grpc as lightningstub
from . import invoices_pb2 as invoicesrpc, invoices_pb2_grpc as invoicesstub
from . import router_pb2 as routerrpc, router_pb2_grpc as routerstub

from decouple import config
from base64 import b64decode

from datetime import timedelta, datetime
from django.utils import timezone


#######
# Should work with LND (c-lightning in the future if there are features that deserve the work)
#######

# Read tls.cert from file or .env variable string encoded as base64
try:
    CERT = open(os.path.join(config("LND_DIR"), "tls.cert"), "rb").read()
except:
    CERT = b64decode(config("LND_CERT_BASE64"))

# Read macaroon from file or .env variable string encoded as base64
try:
    MACAROON = open(
        os.path.join(config("LND_DIR"), config("MACAROON_path")), "rb"
    ).read()
except:
    MACAROON = b64decode(config("LND_MACAROON_BASE64"))

LND_GRPC_HOST = config("LND_GRPC_HOST")


class LNNode:

    os.environ["GRPC_SSL_CIPHER_SUITES"] = "HIGH+ECDSA"

    creds = grpc.ssl_channel_credentials(CERT)
    channel = grpc.secure_channel(LND_GRPC_HOST, creds)

    lightningstub = lightningstub.LightningStub(channel)
    invoicesstub = invoicesstub.InvoicesStub(channel)
    routerstub = routerstub.RouterStub(channel)

    lnrpc = lnrpc
    invoicesrpc = invoicesrpc
    routerrpc = routerrpc

    payment_failure_context = {
        0: "Payment isn't failed (yet)",
        1: "There are more routes to try, but the payment timeout was exceeded.",
        2: "All possible routes were tried and failed permanently. Or were no routes to the destination at all.",
        3: "A non-recoverable error has occured.",
        4: "Payment details incorrect (unknown hash, invalid amt or invalid final cltv delta)",
        5: "Insufficient local balance.",
    }

    @classmethod
    def decode_payreq(cls, invoice):
        """Decodes a lightning payment request (invoice)"""
        request = lnrpc.PayReqString(pay_req=invoice)
        response = cls.lightningstub.DecodePayReq(
            request, metadata=[("macaroon", MACAROON.hex())]
        )
        return response

    @classmethod
    def estimate_fee(cls, amount_sats, target_conf=2, min_confs=1):
        """Returns estimated fee for onchain payouts"""

        # We assume segwit. Use robosats donation address as shortcut so there is no need of user inputs
        request = lnrpc.EstimateFeeRequest(
            AddrToAmount={"bc1q3cpp7ww92n6zp04hv40kd3eyy5avgughx6xqnx": amount_sats},
            target_conf=target_conf,
            min_confs=min_confs,
            spend_unconfirmed=False,
        )

        response = cls.lightningstub.EstimateFee(
            request, metadata=[("macaroon", MACAROON.hex())]
        )

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
        response = cls.lightningstub.WalletBalance(
            request, metadata=[("macaroon", MACAROON.hex())]
        )

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
        response = cls.lightningstub.ChannelBalance(
            request, metadata=[("macaroon", MACAROON.hex())]
        )

        return {
            "local_balance": response.local_balance.sat,
            "remote_balance": response.remote_balance.sat,
            "unsettled_local_balance": response.unsettled_local_balance.sat,
            "unsettled_remote_balance": response.unsettled_remote_balance.sat,
        }

    @classmethod
    def pay_onchain(cls, onchainpayment):
        """Send onchain transaction for buyer payouts"""

        if config("DISABLE_ONCHAIN", cast=bool):
            return False

        request = lnrpc.SendCoinsRequest(
            addr=onchainpayment.address,
            amount=int(onchainpayment.sent_satoshis),
            sat_per_vbyte=int(onchainpayment.mining_fee_rate),
            label=str("Payout order #" + str(onchainpayment.order_paid_TX.id)),
            spend_unconfirmed=True,
        )

        response = cls.lightningstub.SendCoins(
            request, metadata=[("macaroon", MACAROON.hex())]
        )

        onchainpayment.txid = response.txid
        onchainpayment.save()

        return True

    @classmethod
    def cancel_return_hold_invoice(cls, payment_hash):
        """Cancels or returns a hold invoice"""
        request = invoicesrpc.CancelInvoiceMsg(payment_hash=bytes.fromhex(payment_hash))
        response = cls.invoicesstub.CancelInvoice(
            request, metadata=[("macaroon", MACAROON.hex())]
        )
        # Fix this: tricky because canceling sucessfully an invoice has no response. TODO
        return str(response) == ""  # True if no response, false otherwise.

    @classmethod
    def settle_hold_invoice(cls, preimage):
        """settles a hold invoice"""
        request = invoicesrpc.SettleInvoiceMsg(preimage=bytes.fromhex(preimage))
        response = cls.invoicesstub.SettleInvoice(
            request, metadata=[("macaroon", MACAROON.hex())]
        )
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
        response = cls.invoicesstub.AddHoldInvoice(
            request, metadata=[("macaroon", MACAROON.hex())]
        )

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
        response = cls.invoicesstub.LookupInvoiceV2(
            request, metadata=[("macaroon", MACAROON.hex())]
        )

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
            lnpayment.save()
            return True

    @classmethod
    def resetmc(cls):
        request = routerrpc.ResetMissionControlRequest()
        response = cls.routerstub.ResetMissionControl(
            request, metadata=[("macaroon", MACAROON.hex())]
        )
        return True

    @classmethod
    def validate_ln_invoice(cls, invoice, num_satoshis):
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
        except:
            payout["context"] = {
                "bad_invoice": "Does not look like a valid lightning invoice"
            }
            return payout

        ## Some wallet providers (e.g. Muun) force routing through a private channel with high fees >1500ppm
        ## These payments will fail. So it is best to let the user know in advance this invoice is not valid.
        route_hints = payreq_decoded.route_hints

        # Max amount RoboSats will pay for routing
        max_routing_fee_sats = max(
            num_satoshis * float(config("PROPORTIONAL_ROUTING_FEE_LIMIT")),
            float(config("MIN_FLAT_ROUTING_FEE_LIMIT_REWARD")),
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
                        hop_hint.fee_proportional_millionths * num_satoshis / 1000000
                    )

                # ...and store the cost of the route to the array
                routes_cost.append(route_cost)

            # If the cheapest possible private route is more expensive than what RoboSats is willing to pay
            if min(routes_cost) >= max_routing_fee_sats:
                payout["context"] = {
                    "bad_invoice": "The invoice submitted only has a trick on the routing hints, you might be using an incompatible wallet (probably Muun? Use an onchain address instead!). Check the wallet compatibility guide at wallets.robosats.com"
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

        for response in cls.routerstub.SendPaymentV2(
            request, metadata=[("macaroon", MACAROON.hex())]
        ):

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
                lnpayment.save()
                return False, failure_reason

            if response.status == 2:  # STATUS 'SUCCEEDED'
                lnpayment.status = LNPayment.Status.SUCCED
                lnpayment.fee = float(response.fee_msat) / 1000
                lnpayment.preimage = response.payment_preimage
                lnpayment.save()
                return True, None

        return False

    @classmethod
    def double_check_htlc_is_settled(cls, payment_hash):
        """Just as it sounds. Better safe than sorry!"""
        request = invoicesrpc.LookupInvoiceMsg(payment_hash=bytes.fromhex(payment_hash))
        response = cls.invoicesstub.LookupInvoiceV2(
            request, metadata=[("macaroon", MACAROON.hex())]
        )

        return (
            response.state == 1
        )  # LND states: 0 OPEN, 1 SETTLED, 3 ACCEPTED, GRPC_ERROR status 5 when cancelled/returned

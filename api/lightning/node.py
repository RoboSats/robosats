import grpc, os, hashlib, secrets
from . import lightning_pb2 as lnrpc, lightning_pb2_grpc as lightningstub
from . import invoices_pb2 as invoicesrpc, invoices_pb2_grpc as invoicesstub
from . import router_pb2 as routerrpc, router_pb2_grpc as routerstub

from decouple import config
from base64 import b64decode

from datetime import timedelta, datetime
from django.utils import timezone

from api.models import LNPayment

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
    MACAROON = open(os.path.join(config("LND_DIR"), config("MACAROON_path")),
                    "rb").read()
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
        1:
        "There are more routes to try, but the payment timeout was exceeded.",
        2:
        "All possible routes were tried and failed permanently. Or were no routes to the destination at all.",
        3: "A non-recoverable error has occured.",
        4:
        "Payment details incorrect (unknown hash, invalid amt or invalid final cltv delta)",
        5: "Insufficient local balance.",
    }

    @classmethod
    def decode_payreq(cls, invoice):
        """Decodes a lightning payment request (invoice)"""
        request = lnrpc.PayReqString(pay_req=invoice)
        response = cls.lightningstub.DecodePayReq(request,
                                                  metadata=[("macaroon",
                                                             MACAROON.hex())])
        return response

    @classmethod
    def cancel_return_hold_invoice(cls, payment_hash):
        """Cancels or returns a hold invoice"""
        request = invoicesrpc.CancelInvoiceMsg(
            payment_hash=bytes.fromhex(payment_hash))
        response = cls.invoicesstub.CancelInvoice(request,
                                                  metadata=[("macaroon",
                                                             MACAROON.hex())])
        # Fix this: tricky because canceling sucessfully an invoice has no response. TODO
        return str(response) == ""  # True if no response, false otherwise.

    @classmethod
    def settle_hold_invoice(cls, preimage):
        """settles a hold invoice"""
        request = invoicesrpc.SettleInvoiceMsg(
            preimage=bytes.fromhex(preimage))
        response = cls.invoicesstub.SettleInvoice(request,
                                                  metadata=[("macaroon",
                                                             MACAROON.hex())])
        # Fix this: tricky because settling sucessfully an invoice has None response. TODO
        return str(response) == ""  # True if no response, false otherwise.

    @classmethod
    def gen_hold_invoice(cls, num_satoshis, description, invoice_expiry,
                         cltv_expiry_secs):
        """Generates hold invoice"""

        hold_payment = {}
        # The preimage is a random hash of 256 bits entropy
        preimage = hashlib.sha256(secrets.token_bytes(nbytes=32)).digest()

        # Its hash is used to generate the hold invoice
        r_hash = hashlib.sha256(preimage).digest()

        # timelock expiry for the last hop, computed based on a 10 minutes block with 30% padding (~7 min block)
        cltv_expiry_blocks = int(cltv_expiry_secs / (7 * 60))
        request = invoicesrpc.AddHoldInvoiceRequest(
            memo=description,
            value=num_satoshis,
            hash=r_hash,
            expiry=int(
                invoice_expiry * 1.5
            ),  # actual expiry is padded by 50%, if tight, wrong client system clock will say invoice is expired.
            cltv_expiry=cltv_expiry_blocks,
        )
        response = cls.invoicesstub.AddHoldInvoice(request,
                                                   metadata=[("macaroon",
                                                              MACAROON.hex())])

        hold_payment["invoice"] = response.payment_request
        payreq_decoded = cls.decode_payreq(hold_payment["invoice"])
        hold_payment["preimage"] = preimage.hex()
        hold_payment["payment_hash"] = payreq_decoded.payment_hash
        hold_payment["created_at"] = timezone.make_aware(
            datetime.fromtimestamp(payreq_decoded.timestamp))
        hold_payment["expires_at"] = hold_payment["created_at"] + timedelta(
            seconds=payreq_decoded.expiry)
        hold_payment["cltv_expiry"] = cltv_expiry_blocks

        return hold_payment

    @classmethod
    def validate_hold_invoice_locked(cls, lnpayment):
        """Checks if hold invoice is locked"""
        request = invoicesrpc.LookupInvoiceMsg(
            payment_hash=bytes.fromhex(lnpayment.payment_hash))
        response = cls.invoicesstub.LookupInvoiceV2(request,
                                                    metadata=[("macaroon",
                                                               MACAROON.hex())
                                                              ])
        print("status here")
        print(response.state)

        # TODO ERROR HANDLING
        # Will fail if 'unable to locate invoice'. Happens if invoice expiry
        # time has passed (but these are 15% padded at the moment). Should catch it
        # and report back that the invoice has expired (better robustness)
        if response.state == 0:  # OPEN
            print("STATUS: OPEN")
            pass
        if response.state == 1:  # SETTLED
            pass
        if response.state == 2:  # CANCELLED
            pass
        if response.state == 3:  # ACCEPTED (LOCKED)
            print("STATUS: ACCEPTED")
            lnpayment.expiry_height = response.htlcs[0].expiry_height
            lnpayment.status = LNPayment.Status.LOCKED
            lnpayment.save()
            return True

    @classmethod
    def resetmc(cls):
        request = routerrpc.ResetMissionControlRequest()
        response = cls.routerstub.ResetMissionControl(request,
                                                      metadata=[
                                                          ("macaroon",
                                                           MACAROON.hex())
                                                      ])
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
            print(payreq_decoded)
        except:
            payout["context"] = {
                "bad_invoice": "Does not look like a valid lightning invoice"
            }
            return payout

        if payreq_decoded.num_satoshis == 0:
            payout["context"] = {
                "bad_invoice": "The invoice provided has no explicit amount"
            }
            return payout

        if not payreq_decoded.num_satoshis == num_satoshis:
            payout["context"] = {
                "bad_invoice":
                "The invoice provided is not for " +
                "{:,}".format(num_satoshis) + " Sats"
            }
            return payout

        payout["created_at"] = timezone.make_aware(
            datetime.fromtimestamp(payreq_decoded.timestamp))
        payout["expires_at"] = payout["created_at"] + timedelta(
            seconds=payreq_decoded.expiry)

        if payout["expires_at"] < timezone.now():
            payout["context"] = {
                "bad_invoice": f"The invoice provided has already expired"
            }
            return payout

        payout["valid"] = True
        payout["description"] = payreq_decoded.description
        payout["payment_hash"] = payreq_decoded.payment_hash

        return payout

    @classmethod
    def pay_invoice(cls, lnpayment):
        """Sends sats. Used for rewards payouts"""

        fee_limit_sat = int(
            max(
                lnpayment.num_satoshis * float(config("PROPORTIONAL_ROUTING_FEE_LIMIT")),
                float(config("MIN_FLAT_ROUTING_FEE_LIMIT_REWARD")),
            ))  # 200 ppm or 10 sats
        request = routerrpc.SendPaymentRequest(payment_request=lnpayment.invoice,
                                               fee_limit_sat=fee_limit_sat,
                                               timeout_seconds=30)

        for response in cls.routerstub.SendPaymentV2(request,
                                                     metadata=[("macaroon",
                                                                MACAROON.hex())
                                                               ]):

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
                lnpayment.fee = float(response.fee_msat)/1000
                lnpayment.preimage = response.payment_preimage
                lnpayment.save()
                return True, None

        return False

    @classmethod
    def double_check_htlc_is_settled(cls, payment_hash):
        """Just as it sounds. Better safe than sorry!"""
        request = invoicesrpc.LookupInvoiceMsg(
            payment_hash=bytes.fromhex(payment_hash))
        response = cls.invoicesstub.LookupInvoiceV2(request,
                                                    metadata=[("macaroon",
                                                               MACAROON.hex())
                                                              ])

        return (
            response.state == 1
        )  # LND states: 0 OPEN, 1 SETTLED, 3 ACCEPTED, GRPC_ERROR status 5 when cancelled/returned

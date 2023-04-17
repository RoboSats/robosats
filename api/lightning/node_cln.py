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

from . import node_pb2 as noderpc
from . import node_pb2_grpc as nodestub
from . import primitives_pb2 as primitivesrpc
from . import primitives_pb2_grpc as primitivesstub

#######
# Works with CLN
#######

# Load the client's certificate and key
with open(os.path.join(config("CLN_DIR"),'client.pem'), 'rb') as f:
    client_cert = f.read()
with open(os.path.join(config("CLN_DIR"),'client-key.pem'), 'rb') as f:
    client_key = f.read()

# Load the server's certificate
with open(os.path.join(config("CLN_DIR"),'server.pem'), 'rb') as f:
    server_cert = f.read()


CLN_GRPC_HOST = config("CLN_GRPC_HOST")
DISABLE_ONCHAIN = config("DISABLE_ONCHAIN", cast=bool, default=True)
MAX_SWAP_AMOUNT = config("MAX_SWAP_AMOUNT", cast=int, default=500000)


class LNNode:

    os.environ["GRPC_SSL_CIPHER_SUITES"] = "HIGH+ECDSA"

    # Create the SSL credentials object
    creds = grpc.ssl_channel_credentials(root_certificates=server_cert, private_key=client_key, certificate_chain=client_cert)
    # Create the gRPC channel using the SSL credentials
    channel = grpc.secure_channel(CLN_GRPC_HOST, creds)

    # Create the gRPC stub
    stub = nodestub.NodeStub(channel)

    noderpc = noderpc
    # invoicesrpc = invoicesrpc
    # routerrpc = routerrpc

    payment_failure_context = {
        -1: "Catchall nonspecific error.",
        201: "Already paid with this hash using different amount or destination.",
        203: "Permanent failure at destination. The data field of the error will be routing failure object.",
        205: "Unable to find a route.",
        206: "Route too expensive. Either the fee or the needed total locktime for the route exceeds your maxfeepercent or maxdelay settings, respectively. The data field of the error will indicate the actual fee as well as the feepercent percentage that the fee has of the destination payment amount. It will also indicate the actual delay along the route.",
        207: "Invoice expired. Payment took too long before expiration, or already expired at the time you initiated payment. The data field of the error indicates now (the current time) and expiry (the invoice expiration) as UNIX epoch time in seconds.",
        210: "Payment timed out without a payment in progress.",
    }

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
            "mining_fee_rate": response.perkb.opening/1000,
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
                    if utxo.status == 0: # UNCONFIRMED
                        unconfirmed_balance += utxo.amount_msat.msat // 1_000
                        total_balance += utxo.amount_msat.msat // 1_000
                    elif utxo.status == 1: # CONFIRMED
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
                if channel.state == 2: # CHANNELD_NORMAL
                    local_balance_sat += channel.to_us_msat.msat // 1_000
                    remote_balance_sat += (channel.total_msat.msat-channel.to_us_msat.msat) // 1_000
                for htlc in channel.htlcs:
                    if htlc.direction == 0: #IN
                        unsettled_local_balance += htlc.amount_msat // 1_000
                    elif htlc.direction == 1: #OUT
                        unsettled_remote_balance += htlc.amount_msat // 1_000
        
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
            destination=onchainpayment.address,satoshi=int(onchainpayment.sent_satoshis),
            feerate=str(int(onchainpayment.mining_fee_rate)*1_000)+"perkb",
            minconf=int(not config("SPEND_UNCONFIRMED", default=False, cast=bool))
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
        request = noderpc.HodlInvoiceCancelRequest(payment_hash=bytes.fromhex(payment_hash))
        response = cls.stub.HodlInvoiceCancel(request)
        
        return response.state == 1  # True if state is CANCELED, false otherwise.

    @classmethod
    def settle_hold_invoice(cls, preimage):
        """settles a hold invoice"""
        request = noderpc.HodlInvoiceSettleRequest(payment_hash=hashlib.sha256(bytes.fromhex(preimage)).digest())
        response = cls.stub.HodlInvoiceSettle(request)
        
        return response.state == 2  # True if state is SETTLED, false otherwise.

    @classmethod
    def gen_hold_invoice(
        cls, num_satoshis, description, invoice_expiry, cltv_expiry_blocks, order_id , receiver_robot, time 
    ):
        """Generates hold invoice"""

        hold_payment = {}
        # The preimage is a random hash of 256 bits entropy
        preimage = hashlib.sha256(secrets.token_bytes(nbytes=32)).digest()

        # Its hash is used to generate the hold invoice
        r_hash = hashlib.sha256(preimage).digest()

        request = noderpc.InvoiceRequest(
            description=description,
            amount_msat=num_satoshis * 1_000,
            label=str(order_id) + "_" + str(receiver_robot) + "_" + str(time),
            expiry=int(
                invoice_expiry * 1.5
            ),  # actual expiry is padded by 50%, if tight, wrong client system clock will say invoice is expired.
            cltv=cltv_expiry_blocks,
            preimage=preimage, # preimage is actually optional in cln, as cln would generate one by default
        )
        response = cls.stub.HodlInvoice(request)

        hold_payment["invoice"] = response.bolt11
        payreq_decoded = cls.decode_payreq(hold_payment["invoice"])
        hold_payment["preimage"] = preimage.hex()
        hold_payment["payment_hash"] = response.payment_hash
        hold_payment["created_at"] = timezone.make_aware(
            datetime.fromtimestamp(payreq_decoded.timestamp)
        )
        hold_payment["expires_at"] = response.expires_at
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
            lnpayment.expiry_height = response.htlc_cltv
            lnpayment.status = LNPayment.Status.LOCKED
            lnpayment.save()
            return True

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
                    route_cost += (
                        hop_hint.feeprop * num_satoshis / 1_000_000
                    )

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

        #maybe use waitsendpay here?
        try: 
            response = cls.stub.Pay(request)
            
            if response.status == 0: #COMPLETE
                lnpayment.status = LNPayment.Status.SUCCED
                lnpayment.fee = float(response.amount_sent_msat - response.amount_msat) / 1000
                lnpayment.preimage = response.payment_preimage
                lnpayment.save()
                return True, None
            elif response.status == 1: #PENDING
                failure_reason = str("PENDING")
                lnpayment.failure_reason = failure_reason
                lnpayment.status = LNPayment.Status.FLIGHT
                lnpayment.save()
                return False, failure_reason
            else: # status == 2 FAILED
                failure_reason = str("FAILED")
                lnpayment.failure_reason = failure_reason
                lnpayment.status = LNPayment.Status.FAILRO
                lnpayment.save()
                return False, failure_reason
        except grpc._channel._InactiveRpcError as e:
            status_code = int(e.details().split('code: Some(')[1].split(')')[0])
            failure_reason = cls.payment_failure_context[status_code]
            lnpayment.failure_reason = status_code # or failure_reason ?
            lnpayment.status = LNPayment.Status.FAILRO
            lnpayment.save()
            return False, failure_reason


    @classmethod
    def double_check_htlc_is_settled(cls, payment_hash):
        """Just as it sounds. Better safe than sorry!"""
        request = noderpc.ListinvoicesRequest(payment_hash=bytes.fromhex(payment_hash))
        response = cls.stub.ListInvoices(request)

        return (
            response.status == 1
        )   # CLN states: UNPAID = 0, PAID = 1, EXPIRED = 2, this is clns own invoice-lookup
            # so just a check for paid/unpaid/expired not hodl-invoice related states like ACCEPTED/CANCELED

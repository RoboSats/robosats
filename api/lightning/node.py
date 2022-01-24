import grpc, os, hashlib, secrets, json
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

CERT = b64decode(config('LND_CERT_BASE64'))
MACAROON = b64decode(config('LND_MACAROON_BASE64'))
LND_GRPC_HOST = config('LND_GRPC_HOST')

class LNNode():

    os.environ["GRPC_SSL_CIPHER_SUITES"] = 'HIGH+ECDSA'

    creds = grpc.ssl_channel_credentials(CERT)
    channel = grpc.secure_channel(LND_GRPC_HOST, creds)

    lightningstub = lightningstub.LightningStub(channel)
    invoicesstub = invoicesstub.InvoicesStub(channel)
    routerstub = routerstub.RouterStub(channel)

    lnrpc = lnrpc
    invoicesrpc = invoicesrpc
    routerrpc = routerrpc

    payment_failure_context = {
        0:	"Payment isn't failed (yet)",
        1:	"There are more routes to try, but the payment timeout was exceeded.",
        2:	"All possible routes were tried and failed permanently. Or were no routes to the destination at all.",
        3:	"A non-recoverable error has occured.",
        4:	"Payment details incorrect (unknown hash, invalid amt or invalid final cltv delta)",
        5:	"Insufficient local balance."}

    @classmethod
    def decode_payreq(cls, invoice):
        '''Decodes a lightning payment request (invoice)'''
        request = lnrpc.PayReqString(pay_req=invoice)
        response = cls.lightningstub.DecodePayReq(request, metadata=[('macaroon', MACAROON.hex())])
        return response

    @classmethod
    def cancel_return_hold_invoice(cls,  payment_hash):
        '''Cancels or returns a hold invoice'''
        request = invoicesrpc.CancelInvoiceMsg(payment_hash=bytes.fromhex(payment_hash))
        response = cls.invoicesstub.CancelInvoice(request, metadata=[('macaroon', MACAROON.hex())])
        # Fix this: tricky because canceling sucessfully an invoice has no response. TODO
        return str(response) == "" # True if no response, false otherwise.

    @classmethod
    def settle_hold_invoice(cls, preimage):
        '''settles a hold invoice'''
        request = invoicesrpc.SettleInvoiceMsg(preimage=bytes.fromhex(preimage))
        response = cls.invoicesstub.SettleInvoice(request, metadata=[('macaroon', MACAROON.hex())])
        # Fix this: tricky because settling sucessfully an invoice has None response. TODO
        return str(response)=="" # True if no response, false otherwise.

    @classmethod
    def gen_hold_invoice(cls, num_satoshis, description, invoice_expiry, cltv_expiry_secs):
        '''Generates hold invoice'''

        hold_payment = {}
        # The preimage is a random hash of 256 bits entropy
        preimage =  hashlib.sha256(secrets.token_bytes(nbytes=32)).digest() 

        # Its hash is used to generate the hold invoice
        r_hash = hashlib.sha256(preimage).digest()
        
        # timelock expiry for the last hop, computed based on a 10 minutes block with 30% padding (~7 min block)
        cltv_expiry_blocks = int(cltv_expiry_secs / (7*60))
        request = invoicesrpc.AddHoldInvoiceRequest(
                memo=description,
                value=num_satoshis,
                hash=r_hash,
                expiry=int(invoice_expiry*1.15), # actual expiry is padded by 15%
                cltv_expiry=cltv_expiry_blocks,
                )
        response = cls.invoicesstub.AddHoldInvoice(request, metadata=[('macaroon', MACAROON.hex())])

        hold_payment['invoice'] = response.payment_request
        payreq_decoded = cls.decode_payreq(hold_payment['invoice'])
        hold_payment['preimage'] = preimage.hex()
        hold_payment['payment_hash'] = payreq_decoded.payment_hash
        hold_payment['created_at'] = timezone.make_aware(datetime.fromtimestamp(payreq_decoded.timestamp))
        hold_payment['expires_at'] = hold_payment['created_at'] + timedelta(seconds=payreq_decoded.expiry)
        hold_payment['cltv_expiry'] = cltv_expiry_blocks

        return hold_payment

    @classmethod
    def validate_hold_invoice_locked(cls, payment_hash):
        '''Checks if hold invoice is locked'''
        request = invoicesrpc.LookupInvoiceMsg(payment_hash=bytes.fromhex(payment_hash))
        response = cls.invoicesstub.LookupInvoiceV2(request, metadata=[('macaroon', MACAROON.hex())])
        print('status here')
        print(response.state)

        # TODO ERROR HANDLING
        # Will fail if 'unable to locate invoice'. Happens if invoice expiry 
        # time has passed (but these are 15% padded at the moment). Should catch it
        # and report back that the invoice has expired (better robustness)
        if response.state == 0: # OPEN
            print('STATUS: OPEN')
            pass
        if response.state == 1: # SETTLED
            pass
        if response.state == 2: # CANCELLED
            pass
        if response.state == 3: # ACCEPTED (LOCKED)
            print('STATUS: ACCEPTED')
            return True

    @classmethod
    def check_until_invoice_locked(cls, payment_hash, expiration):
        '''Checks until hold invoice is locked.
        When invoice is locked, returns true. 
        If time expires, return False.'''
        # Experimental, might need asyncio. Best if subscribing all invoices and running a background task
        # Maybe best to pass LNpayment object and change status live.

        request = invoicesrpc.SubscribeSingleInvoiceRequest(r_hash=payment_hash)
        for invoice in cls.invoicesstub.SubscribeSingleInvoice(request):
            print(invoice)
            if timezone.now > expiration:
                break
            if invoice.state == 3: #  True if hold invoice is accepted.
                return True
        return False


    @classmethod
    def validate_ln_invoice(cls, invoice, num_satoshis):
        '''Checks if the submited LN invoice comforms to expectations'''

        buyer_invoice = {
                'valid': False,
                'context': None,
                'description': None,
                'payment_hash': None,
                'created_at': None,
                'expires_at': None,
            }

        try:
            payreq_decoded = cls.decode_payreq(invoice)
            print(payreq_decoded)
        except:
            buyer_invoice['context'] = {'bad_invoice':'Does not look like a valid lightning invoice'}
            return buyer_invoice

        if payreq_decoded.num_satoshis == 0:
            buyer_invoice['context'] = {'bad_invoice':'The invoice provided has no explicit amount'}
            return buyer_invoice

        if not payreq_decoded.num_satoshis == num_satoshis:
            buyer_invoice['context'] = {'bad_invoice':'The invoice provided is not for '+'{:,}'.format(num_satoshis)+ ' Sats'}
            return buyer_invoice

        buyer_invoice['created_at'] = timezone.make_aware(datetime.fromtimestamp(payreq_decoded.timestamp))
        buyer_invoice['expires_at'] = buyer_invoice['created_at'] + timedelta(seconds=payreq_decoded.expiry)

        if buyer_invoice['expires_at'] < timezone.now():
            buyer_invoice['context'] = {'bad_invoice':f'The invoice provided has already expired'}
            return buyer_invoice

        buyer_invoice['valid'] = True
        buyer_invoice['description'] = payreq_decoded.description
        buyer_invoice['payment_hash'] = payreq_decoded.payment_hash

        
        return buyer_invoice

    @classmethod
    def pay_invoice(cls, invoice, num_satoshis):
        '''Sends sats to buyer'''

        fee_limit_sat = max(num_satoshis * 0.0002, 10) # 200 ppm or 10 sats 
        request = routerrpc.SendPaymentRequest(
            payment_request=invoice,
            fee_limit_sat=fee_limit_sat,
            timeout_seconds=60)

        for response in cls.routerstub.SendPaymentV2(request, metadata=[('macaroon', MACAROON.hex())]):
            print(response)
            print(response.status)

            # TODO ERROR HANDLING
            if response.status == 0 : # Status 0 'UNKNOWN'
                pass 
            if response.status == 1 : # Status 1 'IN_FLIGHT'
                return True, 'In flight'
            if response.status == 3 : # 4 'FAILED' ??
                '''0	Payment isn't failed (yet).
                   1	There are more routes to try, but the payment timeout was exceeded.
                   2	All possible routes were tried and failed permanently. Or were no routes to the destination at all.
                   3	A non-recoverable error has occured.
                   4	Payment details incorrect (unknown hash, invalid amt or invalid final cltv delta)
                   5	Insufficient local balance.
                '''
                context = cls.payment_failure_context[response.failure_reason]
                return False, context
            if response.status == 2 : # STATUS 'SUCCEEDED'
                return True, None


            # How to catch the errors like:"grpc_message":"invoice is already paid","grpc_status":6}
            # These are not in the response only printed to commandline

        return False

    @classmethod
    def double_check_htlc_is_settled(cls, payment_hash):
        ''' Just as it sounds. Better safe than sorry!'''
        request = invoicesrpc.LookupInvoiceMsg(payment_hash=bytes.fromhex(payment_hash))
        response = cls.invoicesstub.LookupInvoiceV2(request, metadata=[('macaroon', MACAROON.hex())])

        return response.state == 1 # LND states: 0 OPEN, 1 SETTLED, 3 ACCEPTED, GRPC_ERROR status 5 when cancelled/returned


    
    

    


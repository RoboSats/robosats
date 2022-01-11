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
        if response == None:
            return True
        else:
            return False

    @classmethod
    def settle_hold_invoice(cls, preimage):
        '''settles a hold invoice'''
        request = invoicesrpc.SettleInvoiceMsg(preimage=bytes.fromhex(preimage))
        response = cls.invoicesstub.SettleInvoice(request, metadata=[('macaroon', MACAROON.hex())])
        # Fix this: tricky because settling sucessfully an invoice has no response. TODO
        if response == None:
            return True
        else:
            return False

    @classmethod
    def gen_hold_invoice(cls, num_satoshis, description, expiry):
        '''Generates hold invoice'''

        hold_payment = {}
        # The preimage is a random hash of 256 bits entropy
        preimage =  hashlib.sha256(secrets.token_bytes(nbytes=32)).digest() 

        # Its hash is used to generate the hold invoice
        r_hash = hashlib.sha256(preimage).digest()

        request = invoicesrpc.AddHoldInvoiceRequest(
                memo=description,
                value=num_satoshis,
                hash=r_hash,
                expiry=expiry)
        response = cls.invoicesstub.AddHoldInvoice(request, metadata=[('macaroon', MACAROON.hex())])

        hold_payment['invoice'] = response.payment_request
        payreq_decoded = cls.decode_payreq(hold_payment['invoice'])
        hold_payment['preimage'] = preimage.hex()
        hold_payment['payment_hash'] = payreq_decoded.payment_hash
        hold_payment['created_at'] = timezone.make_aware(datetime.fromtimestamp(payreq_decoded.timestamp))
        hold_payment['expires_at'] = hold_payment['created_at'] + timedelta(seconds=payreq_decoded.expiry)

        return hold_payment

    @classmethod
    def validate_hold_invoice_locked(cls, payment_hash):
        '''Checks if hold invoice is locked'''
        request = invoicesrpc.LookupInvoiceMsg(payment_hash=bytes.fromhex(payment_hash))
        response = cls.invoicesstub.LookupInvoiceV2(request, metadata=[('macaroon', MACAROON.hex())])
        print('status here')
        print(response.state) # LND states: 0 OPEN, 1 SETTLED, 3 ACCEPTED, GRPC_ERROR status 5 when cancelled
        return response.state == 3 # True if hold invoice is accepted.

    @classmethod
    def check_until_invoice_locked(cls, payment_hash, expiration):
        '''Checks until hold invoice is locked.
        When invoice is locked, returns true. 
        If time expires, return False.'''
        # Experimental, needs asyncio
        # Maybe best to pass LNpayment object and change status live.

        request = cls.invoicesrpc.SubscribeSingleInvoiceRequest(r_hash=payment_hash)
        for invoice in cls.invoicesstub.SubscribeSingleInvoice(request):
            print(invoice)
            if timezone.now > expiration:
                break
            if invoice.state == 'ACCEPTED':
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
        # Needs router subservice
        # Maybe best to pass order and change status live.

        fee_limit_sat = max(num_satoshis * 0.0002, 10) # 200 ppm or 10 sats 

        request = routerrpc.SendPaymentRequest(
            payment_request=invoice,
            amt_msat=num_satoshis,
            fee_limit_sat=fee_limit_sat,
            timeout_seconds=60,
            )

        for response in routerstub.SendPaymentV2(request, metadata=[('macaroon', MACAROON.hex())]):
            print(response)
            print(response.status)

            if response.status == True:
                return True

        return False

    @classmethod
    def double_check_htlc_is_settled(cls, payment_hash):
        ''' Just as it sounds. Better safe than sorry!'''
        request = invoicesrpc.LookupInvoiceMsg(payment_hash=payment_hash)
        response = invoicesstub.LookupInvoiceV2(request, metadata=[('macaroon', MACAROON.hex())])

        if response.state == 'SETTLED':
            return True
        else:
            return False

    
    

    


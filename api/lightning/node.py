import grpc, os, hashlib, secrets, json
from . import lightning_pb2 as lnrpc, lightning_pb2_grpc as lightningstub
from . import invoices_pb2 as invoicesrpc, invoices_pb2_grpc as invoicesstub

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
        request = invoicesrpc.SettleInvoiceMsg(preimage=preimage)
        response = invoicesstub.SettleInvoice(request, metadata=[('macaroon', MACAROON.hex())])
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

        request = invoicesrpc.LookupInvoiceMsg(payment_hash=payment_hash)
        response = invoicesstub.LookupInvoiceV2(request, metadata=[('macaroon', MACAROON.hex())])
        
        # What is the state for locked ???
        if response.state == 'OPEN' or response.state == 'SETTLED':
            return False
        else:
            return True


    @classmethod
    def check_until_invoice_locked(cls, payment_hash, expiration):
        '''Checks until hold invoice is locked.
        When invoice is locked, returns true. 
        If time expires, return False.'''
         
        request = invoicesrpc.SubscribeSingleInvoiceRequest(r_hash=payment_hash)
        for invoice in invoicesstub.SubscribeSingleInvoice(request):
            if timezone.now > expiration:
                break
            if invoice.state == 'LOCKED':
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
        except:
            buyer_invoice['context'] = {'bad_invoice':'Does not look like a valid lightning invoice'}
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
    def pay_invoice(cls, invoice):
        '''Sends sats to buyer'''


        return True

    @classmethod
    def double_check_htlc_is_settled(cls, payment_hash):
        ''' Just as it sounds. Better safe than sorry!'''
        request = invoicesrpc.LookupInvoiceMsg(payment_hash=payment_hash)
        response = invoicesstub.LookupInvoiceV2(request, metadata=[('macaroon', MACAROON.hex())])

        if response.state == 'SETTLED':
            return True
        else:
            return False

    
    

    


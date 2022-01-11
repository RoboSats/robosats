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
        # SETTLING A HODL INVOICE
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

        # The preimage is a random hash of 256 bits entropy
        preimage =  hashlib.sha256(secrets.token_bytes(nbytes=32)).digest() 

        # Its hash is used to generate the hold invoice
        preimage_hash = hashlib.sha256(preimage).digest()

        request = invoicesrpc.AddHoldInvoiceRequest(
                memo=description,
                value=num_satoshis,
                hash=preimage_hash,
                expiry=expiry)
        response = cls.invoicesstub.AddHoldInvoice(request, metadata=[('macaroon', MACAROON.hex())])

        invoice = response.payment_request
        payreq_decoded = cls.decode_payreq(invoice)
        
        preimage = preimage.hex()
        payment_hash = payreq_decoded.payment_hash
        created_at = timezone.make_aware(datetime.fromtimestamp(payreq_decoded.timestamp))
        expires_at = created_at + timedelta(seconds=payreq_decoded.expiry)

        return invoice, preimage, payment_hash, created_at, expires_at 

    @classmethod
    def validate_hold_invoice_locked(cls, payment_hash):
        '''Checks if hodl invoice is locked'''

        return True

    @classmethod
    def check_until_invoice_locked(cls, payment_hash, expiration):
        '''Checks until hodl invoice is locked'''

        # request = ln.InvoiceSubscription()
        # When invoice is settled, return true. If time expires, return False.
        # for invoice in stub.SubscribeInvoices(request):
        #     print(invoice)

        return True

    @classmethod
    def validate_ln_invoice(cls, invoice, num_satoshis):
        '''Checks if the submited LN invoice comforms to expectations'''

        try:
            payreq_decoded = cls.decode_payreq(invoice)
        except:
            return False, {'bad_invoice':'Does not look like a valid lightning invoice'}, None, None, None, None

        if not payreq_decoded.num_satoshis == num_satoshis:
            context = {'bad_invoice':'The invoice provided is not for '+'{:,}'.format(num_satoshis)+ ' Sats'}
            return False, context, None, None, None, None

        created_at = timezone.make_aware(datetime.fromtimestamp(payreq_decoded.timestamp))
        expires_at = created_at + timedelta(seconds=payreq_decoded.expiry)

        if expires_at < timezone.now():
            context = {'bad_invoice':f'The invoice provided has already expired'}
            return False, context, None, None, None, None

        description = payreq_decoded.description
        payment_hash = payreq_decoded.payment_hash

        return True, None, description, payment_hash, created_at, expires_at

    @classmethod
    def pay_invoice(cls, invoice):
        '''Sends sats to buyer, or cancelinvoices'''
        return True

    @classmethod
    def check_if_hold_invoice_is_locked(cls, payment_hash):
        '''Every hodl invoice that is in state INVGEN
        Has to be checked for payment received until
        the window expires'''
        
        return True

    @classmethod
    def double_check_htlc_is_settled(cls, payment_hash):
        ''' Just as it sounds. Better safe than sorry!'''
        return True

    
    

    


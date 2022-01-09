# import codecs, grpc, os
# import lightning_pb2 as lnrpc, lightning_pb2_grpc as lightningstub

from datetime import timedelta
from django.utils import timezone

import random
import string

#######
# Placeholder functions
# Should work with LND (maybe c-lightning in the future)

class LNNode():
    '''
    Place holder functions to interact with Lightning Node
    '''

    # macaroon = codecs.encode(open('LND_DIR/data/chain/bitcoin/simnet/admin.macaroon', 'rb').read(), 'hex')
    # os.environ['GRPC_SSL_CIPHER_SUITES'] = 'HIGH+ECDSA'
    # cert = open('LND_DIR/tls.cert', 'rb').read()
    # ssl_creds = grpc.ssl_channel_credentials(cert)
    # channel = grpc.secure_channel('localhost:10009', ssl_creds)
    # stub = lightningstub.LightningStub(channel)
    
    def gen_hold_invoice(num_satoshis, description, expiry):
        '''Generates hold invoice to publish an order'''
        # TODO
        invoice = ''.join(random.choices(string.ascii_uppercase + string.digits, k=80)) #FIX
        payment_hash = ''.join(random.choices(string.ascii_uppercase + string.digits, k=40)) #FIX
        expires_at = timezone.now() + timedelta(hours=8)  ##FIX

        return invoice, payment_hash, expires_at 

    def validate_hold_invoice_locked(payment_hash):
        '''Checks if hodl invoice is locked'''

        # request = ln.InvoiceSubscription()
        # When invoice is settled, return true. If time expires, return False.
        # for invoice in stub.SubscribeInvoices(request):
        #     print(invoice)

        return True

    def validate_ln_invoice(invoice, num_satoshis):
        '''Checks if the submited LN invoice is as expected'''

        # request = lnrpc.PayReqString(pay_req=invoice)
        # response = stub.DecodePayReq(request, metadata=[('macaroon', macaroon)])

        #     # { 
        #     #     "destination": <string>,
        #     #     "payment_hash": <string>,
        #     #     "num_satoshis": <int64>,
        #     #     "timestamp": <int64>,
        #     #     "expiry": <int64>,
        #     #     "description": <string>,
        #     #     "description_hash": <string>,
        #     #     "fallback_addr": <string>,
        #     #     "cltv_expiry": <int64>,
        #     #     "route_hints": <array RouteHint>,
        #     #     "payment_addr": <bytes>,
        #     #     "num_msat": <int64>,
        #     #     "features": <array FeaturesEntry>,
        #     # }
        
        # if not response['num_satoshis'] == num_satoshis:
        #     return False, {'bad_invoice':f'The invoice provided is not for {num_satoshis}. '}, None, None, None
        # description = response['description']
        # payment_hash = response['payment_hash']
        # expires_at = timezone(response['expiry'])
        # if payment_hash and expires_at > timezone.now():
        #   return True, None, description, payment_hash, expires_at

        valid = True
        context = None
        description = 'Placeholder desc' # TODO decrypt from LN invoice
        payment_hash = '567&*GIHU126' # TODO decrypt
        expires_at = timezone.now() # TODO decrypt

        return valid, context, description, payment_hash, expires_at

    def pay_invoice(invoice):
        '''Sends sats to buyer, or cancelinvoices'''
        return True

    def settle_hold_htlcs(payment_hash):
        '''Charges a LN hold invoice'''
        return True

    def return_hold_htlcs(payment_hash):
        '''Returns sats'''
        return True

    def double_check_htlc_is_settled(payment_hash):
        ''' Just as it sounds. Better safe than sorry!'''
        return True

    
    

    


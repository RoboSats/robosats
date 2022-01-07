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
    
    def gen_hodl_invoice(num_satoshis, description, expiry):
        '''Generates hodl invoice to publish an order'''
        # TODO
        invoice = ''.join(random.choices(string.ascii_uppercase + string.digits, k=80)) #FIX
        payment_hash = ''.join(random.choices(string.ascii_uppercase + string.digits, k=40)) #FIX
        expires_at = timezone.now() + timedelta(hours=8)  ##FIX

        return invoice, payment_hash, expires_at 

    def validate_hodl_invoice_locked():
        '''Generates hodl invoice to publish an order'''
        return True

    def validate_ln_invoice(invoice): # num_satoshis
        '''Checks if the submited LN invoice is as expected'''
        valid = True
        num_satoshis = 50000 # TODO decrypt and confirm sats are as expected
        description = 'Placeholder desc' # TODO decrypt from LN invoice
        payment_hash = '567126' # TODO decrypt
        expires_at = timezone.now() # TODO decrypt

        return valid, num_satoshis, description, payment_hash, expires_at

    def pay_buyer_invoice(invoice):
        '''Sends sats to buyer'''
        return True

    def charge_hodl_htlcs(invoice):
        '''Charges a LN hodl invoice'''
        return True

    def free_hodl_htlcs(invoice):
        '''Returns sats'''
        return True

    
    

    


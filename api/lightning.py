import random
import string

#######
# Placeholder functions
# Should work with LND (maybe c-lightning in the future)

class LNNode():
    '''
    Place holder functions to interact with Lightning Node
    '''
    
    def gen_hodl_invoice():
        '''Generates hodl invoice to publish an order'''
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=80))

    def validate_hodl_invoice_locked():
        '''Generates hodl invoice to publish an order'''
        return True

    def validate_ln_invoice(invoice):
        '''Checks if a LN invoice is valid'''
        return True

    def pay_buyer_invoice(invoice):
        '''Sends sats to buyer'''
        return True

    def charge_hodl_htlcs(invoice):
        '''Charges a LN hodl invoice'''
        return True

    def free_hodl_htlcs(invoice):
        '''Returns sats'''
        return True

    
    

    


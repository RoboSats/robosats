from django.core.management.base import BaseCommand, CommandError

from django.utils import timezone
from api.lightning.node import LNNode
from decouple import config
from base64 import b64decode
from api.models import LNPayment
import time

MACAROON = b64decode(config('LND_MACAROON_BASE64'))

class Command(BaseCommand):
    '''
    Background: SubscribeInvoices stub iterator would be great to use here
    however it only sends updates when the invoice is OPEN (new) or SETTLED.
    We are very interested on the other two states (CANCELLED and ACCEPTED).
    Therefore, this thread (follow_invoices) will iterate over all LNpayment
    objects and do InvoiceLookupV2 to update their state 'live' '''

    help = 'Follows all active hold invoices'

    # def add_arguments(self, parser):
    #     parser.add_argument('debug', nargs='+', type=boolean)

    def handle(self, *args, **options):
        ''' Follows and updates LNpayment objects
        until settled or canceled'''

        lnd_state_to_lnpayment_status = {
                0: LNPayment.Status.INVGEN,
                1: LNPayment.Status.SETLED,
                2: LNPayment.Status.CANCEL,
                3: LNPayment.Status.LOCKED
            }

        stub = LNNode.invoicesstub

        while True:
            time.sleep(5)

            # time it for debugging
            t0 = time.time()
            queryset = LNPayment.objects.filter(type=LNPayment.Types.HOLD, status__in=[LNPayment.Status.INVGEN, LNPayment.Status.LOCKED])

            debug = {}
            debug['num_active_invoices'] = len(queryset)
            debug['invoices'] = []

            for idx, hold_lnpayment in enumerate(queryset):
                old_status = LNPayment.Status(hold_lnpayment.status).label
                
                try:
                    request = LNNode.invoicesrpc.LookupInvoiceMsg(payment_hash=bytes.fromhex(hold_lnpayment.payment_hash))
                    response = stub.LookupInvoiceV2(request, metadata=[('macaroon', MACAROON.hex())])
                    hold_lnpayment.status = lnd_state_to_lnpayment_status[response.state]

                # If it fails at finding the invoice it has been canceled.
                # On RoboSats DB we make a distinction between cancelled and returned (LND does not)
                except:
                    hold_lnpayment.status = LNPayment.Status.CANCEL
                    continue
                
                new_status = LNPayment.Status(hold_lnpayment.status).label

                # Only save the hold_payments that change (otherwise this function does not scale)
                changed = not old_status==new_status
                if changed:
                    hold_lnpayment.save()

                # Report for debugging
                new_status = LNPayment.Status(hold_lnpayment.status).label
                debug['invoices'].append({idx:{
                    'payment_hash': str(hold_lnpayment.payment_hash),
                    'status_changed': not old_status==new_status,
                    'old_status': old_status,
                    'new_status': new_status,
                }})

                debug['time']=time.time()-t0
                
            self.stdout.write(str(timezone.now())+str(debug))


            
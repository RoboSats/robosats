from datetime import timedelta
from django.utils import timezone
import requests
from .lightning import LNNode

from .models import Order, LNPayment, User
from decouple import config

FEE = float(config('FEE'))
BOND_SIZE = float(config('BOND_SIZE'))
MARKET_PRICE_API = config('MARKET_PRICE_API')
ESCROW_USERNAME = config('ESCROW_USERNAME')

EXP_MAKER_BOND_INVOICE = int(config('EXP_MAKER_BOND_INVOICE'))
EXP_TAKER_BOND_INVOICE = int(config('EXP_TAKER_BOND_INVOICE'))
EXP_TRADE_ESCR_INVOICE = int(config('EXP_TRADE_ESCR_INVOICE'))

BOND_EXPIRY = int(config('BOND_EXPIRY'))
ESCROW_EXPIRY = int(config('ESCROW_EXPIRY'))

class Logics():

    # escrow_user = User.objects.get(username=ESCROW_USERNAME)

    def validate_already_maker_or_taker(user):
        '''Checks if the user is already partipant of an order'''
        queryset = Order.objects.filter(maker=user)
        if queryset.exists():
            return False, {'Bad Request':'You are already maker of an order'}
        queryset = Order.objects.filter(taker=user)
        if queryset.exists():
            return False, {'Bad Request':'You are already taker of an order'}
        return True, None

    def take(order, user):
        order.taker = user
        order.status = Order.Status.TAK
        order.save()

    def is_buyer(order, user):
        is_maker = order.maker == user
        is_taker = order.taker == user
        return (is_maker and order.type == Order.Types.BUY) or (is_taker and order.type == Order.Types.SELL)

    def is_seller(order, user):
        is_maker = order.maker == user
        is_taker = order.taker == user
        return (is_maker and order.type == Order.Types.SELL) or (is_taker and order.type == Order.Types.BUY)
    
    def satoshis_now(order):
        ''' checks trade amount in sats '''
        if order.is_explicit:
            satoshis_now = order.satoshis
        else:
            # TODO Add fallback Public APIs and error handling
            market_prices = requests.get(MARKET_PRICE_API).json()
            exchange_rate = float(market_prices[Order.Currencies(order.currency).label]['last'])
            satoshis_now = ((float(order.amount) * 1+float(order.premium)) / exchange_rate) * 100*1000*1000

        return satoshis_now
    
    def order_expires(order):
        order.status = Order.Status.EXP
        order.maker = None
        order.taker = None
        order.save()

    @classmethod
    def update_invoice(cls, order, user, invoice):
        is_valid_invoice, num_satoshis, description, payment_hash, expires_at = LNNode.validate_ln_invoice(invoice)
        # only user is the buyer and a valid LN invoice
        if cls.is_buyer(order, user) and is_valid_invoice:
            order.buyer_invoice, _ = LNPayment.objects.update_or_create(
                concept = LNPayment.Concepts.PAYBUYER, 
                type = LNPayment.Types.NORM, 
                sender = User.objects.get(username=ESCROW_USERNAME),
                receiver= user, 
                 # if there is a LNPayment matching these above, it updates that with defaults below.
                defaults={
                    'invoice' : invoice,
                    'status' : LNPayment.Status.VALIDI,
                    'num_satoshis' : num_satoshis,
                    'description' :  description,
                    'payment_hash' : payment_hash,
                    'expires_at' : expires_at}
                )

            #If the order status was Payment Failed. Move foward to invoice Updated.
            if order.status == Order.Status.FAI:
                    order.status = Order.Status.UPI
            order.save()
            return True, None

        return False, {'bad_request':'Invalid Lightning Network Invoice. It starts by LNTB...'}

    @classmethod
    def cancel_order(cls, order, user, state):
    
    # 1) When maker cancels before bond
        '''The order never shows up on the book and status
        changes to cancelled. That's it.'''

    # 2) When maker cancels after bond
        '''The order dissapears from book and goes to cancelled. 
        Maker is charged a small amount of sats, to prevent DDOS 
        on the LN node and order book'''

    # 3) When taker cancels before bond
        ''' The order goes back to the book as public.
        LNPayment "order.taker_bond" is deleted() '''

    # 4) When taker or maker cancel after bond
        '''The order goes into cancelled status if maker cancels.
        The order goes into the public book if taker cancels.
        In both cases there is a small fee.'''

    # 5) When trade collateral has been posted
        '''Always goes to cancelled status. Collaboration  is needed.
        When a user asks for cancel, 'order.is_pending_cancel' goes True.
        When the second user asks for cancel. Order is totally cancelled.
        Has a small cost for both parties to prevent node DDOS.'''
        pass


    @classmethod
    def gen_maker_hodl_invoice(cls, order, user):

        # Do not gen and delete if order is more than 5 minutes old
        if order.expires_at < timezone.now():
            cls.order_expires(order)
            return False, {'Order expired':'cannot generate a bond invoice for an expired order. Make a new one.'}

        # Return the previous invoice if there was one
        if order.maker_bond:
            return True, {'invoice':order.maker_bond.invoice,'bond_satoshis':order.maker_bond.num_satoshis}

        order.satoshis_now = cls.satoshis_now(order)
        bond_satoshis = order.satoshis_now * BOND_SIZE
        description = f'RoboSats - Maker bond for order ID {order.id}. These sats will return to you if you do not cheat!'

        # Gen HODL Invoice
        invoice, payment_hash, expires_at = LNNode.gen_hodl_invoice(bond_satoshis, description, BOND_EXPIRY*3600)
        
        order.maker_bond = LNPayment.objects.create(
            concept = LNPayment.Concepts.MAKEBOND, 
            type = LNPayment.Types.HODL, 
            sender = user,
            receiver = User.objects.get(username=ESCROW_USERNAME),
            invoice = invoice,
            status = LNPayment.Status.INVGEN,
            num_satoshis = bond_satoshis,
            description =  description,
            payment_hash = payment_hash,
            expires_at = expires_at)

        order.save()
        return True, {'invoice':invoice,'bond_satoshis':bond_satoshis}

    @classmethod
    def gen_takerbuyer_hodl_invoice(cls, order, user):

        # Do not gen and cancel if a taker invoice is there and older than 2 minutes
        if order.taker_bond.created_at < (timezone.now()+timedelta(minutes=EXP_TAKER_BOND_INVOICE)):
            cls.cancel_order(order, user, 3) # State 3, cancel order before taker bond
            return False, {'Invoice expired':'You did not confirm taking the order in time.'}

        # Return the previous invoice if there was one
        if order.taker_bond:
            return True, {'invoice':order.taker_bond.invoice,'bond_satoshis':order.taker_bond.num_satoshis}

        order.satoshis_now = cls.satoshis_now(order)
        bond_satoshis = order.satoshis_now * BOND_SIZE
        description = f'RoboSats - Taker bond for order ID {order.id}. These sats will return to you if you do not cheat!'

        # Gen HODL Invoice
        invoice, payment_hash, expires_at = LNNode.gen_hodl_invoice(bond_satoshis, description, BOND_EXPIRY*3600)
        
        order.taker_bond = LNPayment.objects.create(
            concept = LNPayment.Concepts.TAKEBOND, 
            type = LNPayment.Types.HODL, 
            sender = user,
            receiver = User.objects.get(username=ESCROW_USERNAME),
            invoice = invoice,
            status = LNPayment.Status.INVGEN,
            num_satoshis = bond_satoshis,
            description =  description,
            payment_hash = payment_hash,
            expires_at = expires_at)

        order.save()
        return True, {'invoice':invoice,'bond_satoshis':bond_satoshis}
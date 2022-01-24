from datetime import timedelta
from django.utils import timezone
from api.lightning.node import LNNode

from api.models import Order, LNPayment, MarketTick, User, Currency
from decouple import config

from api.tasks import follow_send_payment

import math
import ast

FEE = float(config('FEE'))
BOND_SIZE = float(config('BOND_SIZE'))
ESCROW_USERNAME = config('ESCROW_USERNAME')
PENALTY_TIMEOUT = int(config('PENALTY_TIMEOUT'))

MIN_TRADE = int(config('MIN_TRADE'))
MAX_TRADE = int(config('MAX_TRADE'))

EXP_MAKER_BOND_INVOICE = int(config('EXP_MAKER_BOND_INVOICE'))
EXP_TAKER_BOND_INVOICE = int(config('EXP_TAKER_BOND_INVOICE'))

BOND_EXPIRY = int(config('BOND_EXPIRY'))
ESCROW_EXPIRY = int(config('ESCROW_EXPIRY'))

PUBLIC_ORDER_DURATION = int(config('PUBLIC_ORDER_DURATION'))
INVOICE_AND_ESCROW_DURATION = int(config('INVOICE_AND_ESCROW_DURATION'))
FIAT_EXCHANGE_DURATION = int(config('FIAT_EXCHANGE_DURATION'))

class Logics():

    def validate_already_maker_or_taker(user):
        '''Validates if a use is already not part of an active order'''

        active_order_status = [Order.Status.WFB, Order.Status.PUB, Order.Status.TAK,
                                Order.Status.WF2, Order.Status.WFE, Order.Status.WFI,
                                Order.Status.CHA, Order.Status.FSE, Order.Status.DIS,
                                Order.Status.WFR]
        '''Checks if the user is already partipant of an active order'''
        queryset = Order.objects.filter(maker=user, status__in=active_order_status)
        if queryset.exists():
            return False, {'bad_request':'You are already maker of an active order'}

        queryset = Order.objects.filter(taker=user, status__in=active_order_status)
        if queryset.exists():
            return False, {'bad_request':'You are already taker of an active order'}
        return True, None

    def validate_order_size(order):
        '''Validates if order is withing limits in satoshis at t0'''
        if order.t0_satoshis > MAX_TRADE:
            return False, {'bad_request': 'Your order is too big. It is worth '+'{:,}'.format(order.t0_satoshis)+' Sats now. But limit is '+'{:,}'.format(MAX_TRADE)+ ' Sats'}
        if order.t0_satoshis < MIN_TRADE:
            return False, {'bad_request': 'Your order is too small. It is worth '+'{:,}'.format(order.t0_satoshis)+' Sats now. But limit is '+'{:,}'.format(MIN_TRADE)+ ' Sats'}
        return True, None

    @classmethod    
    def take(cls, order, user):
        is_penalized, time_out = cls.is_penalized(user)
        if is_penalized:
            return False, {'bad_request',f'You need to wait {time_out} seconds to take an order'}
        else:
            order.taker = user
            order.status = Order.Status.TAK
            order.expires_at = timezone.now() + timedelta(seconds=Order.t_to_expire[Order.Status.TAK])
            order.save()
            return True, None

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
            exchange_rate = float(order.currency.exchange_rate)
            premium_rate = exchange_rate * (1+float(order.premium)/100)
            satoshis_now = (float(order.amount) / premium_rate) * 100*1000*1000

        return int(satoshis_now)

    def price_and_premium_now(order):
        ''' computes order premium live '''
        exchange_rate = float(order.currency.exchange_rate)
        if not order.is_explicit:
            premium = order.premium
            price = exchange_rate * (1+float(premium)/100)
        else:
            order_rate = float(order.amount) / (float(order.satoshis) / 100000000)
            premium = order_rate / exchange_rate - 1
            premium = int(premium*10000)/100  # 2 decimals left
            price = order_rate

        significant_digits = 5
        price = round(price, significant_digits - int(math.floor(math.log10(abs(price)))) - 1)
        
        return price, premium

    @classmethod
    def order_expires(cls, order):
        ''' General cases when time runs out.'''

        # Do not change order status if an order in any with
        # any of these status is sent to expire here
        does_not_expire = [Order.Status.DEL, Order.Status.UCA,
                    Order.Status.EXP, Order.Status.TLD,
                    Order.Status.DIS, Order.Status.CCA,
                    Order.Status.PAY, Order.Status.SUC,
                    Order.Status.FAI, Order.Status.MLD]

        if order.status in does_not_expire:
            return False

        elif order.status == Order.Status.WFB:
            order.status = Order.Status.EXP
            cls.cancel_bond(order.maker_bond)
            order.save()
            return True
        
        elif order.status == Order.Status.PUB:
            cls.return_bond(order.maker_bond)
            order.status = Order.Status.EXP
            order.save()
            return True

        elif order.status == Order.Status.TAK:
            cls.cancel_bond(order.taker_bond)
            cls.kick_taker(order)
            return True

        elif order.status == Order.Status.WF2:
            '''Weird case where an order expires and both participants
            did not proceed with the contract. Likely the site was
            down or there was a bug. Still bonds must be charged
            to avoid service DDOS. '''

            cls.settle_bond(order.maker_bond)
            cls.settle_bond(order.taker_bond)
            cls.cancel_escrow(order)
            order.status = Order.Status.EXP
            order.save()
            return True

        elif order.status == Order.Status.WFE:
            maker_is_seller = cls.is_seller(order, order.maker)
            # If maker is seller, settle the bond and order goes to expired
            if maker_is_seller:
                cls.settle_bond(order.maker_bond)
                cls.return_bond(order.taker_bond)
                cls.cancel_escrow(order)
                order.status = Order.Status.EXP
                order.save()
                return True

            # If maker is buyer, settle the taker's bond order goes back to public
            else:
                cls.settle_bond(order.taker_bond)
                cls.cancel_escrow(order)
                order.taker = None
                order.taker_bond = None
                order.trade_escrow = None
                cls.publish_order(order)
                return True

        elif order.status == Order.Status.WFI:
            # The trade could happen without a buyer invoice. However, this user
            # is likely AFK; will probably desert the contract as well.

            maker_is_buyer = cls.is_buyer(order, order.maker)
            # If maker is buyer, settle the bond and order goes to expired
            if maker_is_buyer:
                cls.settle_bond(order.maker_bond)
                cls.return_bond(order.taker_bond)
                cls.return_escrow(order)
                order.status = Order.Status.EXP
                order.save()
                return True

            # If maker is seller settle the taker's bond, order goes back to public
            else:
                cls.settle_bond(order.taker_bond)
                cls.return_escrow(order)
                order.taker = None
                order.taker_bond = None
                order.trade_escrow = None
                cls.publish_order(order)
                return True
        
        elif order.status in [Order.Status.CHA, Order.Status.FSE]:
            # Another weird case. The time to confirm 'fiat sent or received' expired. Yet no dispute
            # was opened. Hint: a seller-scammer could persuade a buyer to not click "fiat  
            # sent", we assume this is a dispute case by default.
            cls.open_dispute(order)
            return True

    @classmethod
    def kick_taker(cls, order):
        ''' The taker did not lock the taker_bond. Now he has to go'''
        # Add a time out to the taker
        if order.taker:
            profile = order.taker.profile
            profile.penalty_expiration = timezone.now() + timedelta(seconds=PENALTY_TIMEOUT)
            profile.save()

        # Make order public again
        order.taker = None
        order.taker_bond = None
        cls.publish_order(order)
        return True

    @classmethod
    def open_dispute(cls, order, user=None):

        # Always settle the escrow during a dispute
        # Dispute winner will have to submit a new invoice.

        if not order.trade_escrow.status == LNPayment.Status.SETLED:
            cls.settle_escrow(order)     
        
        order.is_disputed = True
        order.status = Order.Status.DIS
        order.expires_at = timezone.now() + timedelta(seconds=Order.t_to_expire[Order.Status.DIS])
        order.save()

        # User could be None if a dispute is open automatically due to weird expiration.
        if not user == None:
            profile = user.profile
            profile.num_disputes = profile.num_disputes + 1
            if profile.orders_disputes_started == None:
                profile.orders_disputes_started = [str(order.id)]
            else:
                profile.orders_disputes_started = list(profile.orders_disputes_started).append(str(order.id))
            profile.save()

        return True, None

    def dispute_statement(order, user, statement):
        ''' Updates the dispute statements in DB'''
        if not order.status == Order.Status.DIS:
            return False, {'bad_request':'Only orders in dispute accept a dispute statements'}

        if len(statement) > 5000:
            return False, {'bad_statement':'The statement is longer than 5000 characters'}

        if order.maker == user:
            order.maker_statement = statement
        else:
            order.taker_statement = statement
        
        # If both statements are in, move status to wait for dispute resolution
        if order.maker_statement != None and order.taker_statement != None:
            order.status = Order.Status.WFR
            order.expires_at = timezone.now() + timedelta(seconds=Order.t_to_expire[Order.Status.WFR])

        order.save()
        return True, None

    @classmethod
    def buyer_invoice_amount(cls, order, user):
        ''' Computes buyer invoice amount. Uses order.last_satoshis, 
        that is the final trade amount set at Taker Bond time'''

        if cls.is_buyer(order, user):
            invoice_amount = int(order.last_satoshis * (1-FEE)) # Trading FEE is charged here.

        return True, {'invoice_amount': invoice_amount}

    @classmethod
    def update_invoice(cls, order, user, invoice):
        
        # only the buyer can post a buyer invoice
        if not cls.is_buyer(order, user):
            return False, {'bad_request':'Only the buyer of this order can provide a buyer invoice.'}
        if not order.taker_bond:
            return False, {'bad_request':'Wait for your order to be taken.'}
        if not (order.taker_bond.status == order.maker_bond.status == LNPayment.Status.LOCKED):
            return False, {'bad_request':'You cannot submit a invoice while bonds are not locked.'}

        num_satoshis = cls.buyer_invoice_amount(order, user)[1]['invoice_amount']
        buyer_invoice = LNNode.validate_ln_invoice(invoice, num_satoshis)

        if not buyer_invoice['valid']:
            return False, buyer_invoice['context']

        order.buyer_invoice, _ = LNPayment.objects.update_or_create(
            concept = LNPayment.Concepts.PAYBUYER, 
            type = LNPayment.Types.NORM, 
            sender = User.objects.get(username=ESCROW_USERNAME),
            receiver= user, 
            # if there is a LNPayment matching these above, it updates that one with defaults below.
            defaults={
                'invoice' : invoice,
                'status' : LNPayment.Status.VALIDI,
                'num_satoshis' : num_satoshis,
                'description' :  buyer_invoice['description'],
                'payment_hash' : buyer_invoice['payment_hash'],
                'created_at' : buyer_invoice['created_at'],
                'expires_at' : buyer_invoice['expires_at']}
            )

        # If the order status is 'Waiting for invoice'. Move forward to 'chat'
        if order.status == Order.Status.WFI: 
            order.status = Order.Status.CHA
            order.expires_at = timezone.now() + timedelta(seconds=Order.t_to_expire[Order.Status.CHA])

        # If the order status is 'Waiting for both'. Move forward to 'waiting for escrow'
        if order.status == Order.Status.WF2:
            # If the escrow is lock move to Chat.
            if order.trade_escrow.status == LNPayment.Status.LOCKED:
                order.status = Order.Status.CHA
                order.expires_at = timezone.now() + timedelta(seconds=Order.t_to_expire[Order.Status.CHA])
            else:
                order.status = Order.Status.WFE

        order.save()
        return True, None

    def add_profile_rating(profile, rating):
        ''' adds a new rating to a user profile'''

        # TODO Unsafe, does not update ratings, it adds more ratings everytime a new rating is clicked.
        profile.total_ratings += 1
        latest_ratings = profile.latest_ratings
        if latest_ratings == None:
            profile.latest_ratings = [rating]
            profile.avg_rating = rating

        else:
            latest_ratings = ast.literal_eval(latest_ratings)
            latest_ratings.append(rating)
            profile.latest_ratings = latest_ratings
            profile.avg_rating = sum(list(map(int, latest_ratings))) / len(latest_ratings)  # Just an average, but it is a list of strings. Has to be converted to int.

        profile.save()

    def is_penalized(user):
        ''' Checks if a user that is not participant of orders
        has a limit on taking or making a order'''
        
        if user.profile.penalty_expiration:
            if user.profile.penalty_expiration > timezone.now():
                time_out = (user.profile.penalty_expiration - timezone.now()).seconds
                return True, time_out

        return False, None


    @classmethod
    def cancel_order(cls, order, user, state=None):

        # Do not change order status if an order in any with
        # any of these status is sent to expire here
        do_not_cancel = [Order.Status.DEL, Order.Status.UCA,
                    Order.Status.EXP, Order.Status.TLD,
                    Order.Status.DIS, Order.Status.CCA,
                    Order.Status.PAY, Order.Status.SUC,
                    Order.Status.FAI, Order.Status.MLD]

        if order.status in do_not_cancel:
            return False, {'bad_request':'You cannot cancel this order'}

        # 1) When maker cancels before bond
        '''The order never shows up on the book and order 
        status becomes "cancelled". That's it.'''
        if order.status == Order.Status.WFB and order.maker == user:
            order.status = Order.Status.UCA
            order.save()
            return True, None

        # 2) When maker cancels after bond
            '''The order dissapears from book and goes to cancelled. Maker is charged the bond to prevent DDOS 
            on the LN node and order book. TODO Only charge a small part of the bond (requires maker submitting an invoice)'''
        elif order.status == Order.Status.PUB and order.maker == user:
            #Settle the maker bond (Maker loses the bond for cancelling public order)
            if cls.settle_bond(order.maker_bond):
                order.status = Order.Status.UCA
                order.save()
                return True, None

        # 3) When taker cancels before bond
            ''' The order goes back to the book as public.
            LNPayment "order.taker_bond" is deleted() '''
        elif order.status == Order.Status.TAK and order.taker == user:
            # adds a timeout penalty
            cls.cancel_bond(order.taker_bond)
            cls.kick_taker(order)
            return True, None

        # 4) When taker or maker cancel after bond (before escrow)
            '''The order goes into cancelled status if maker cancels.
            The order goes into the public book if taker cancels.
            In both cases there is a small fee.'''

        # 4.a) When maker cancel after bond (before escrow)
            '''The order into cancelled status if maker cancels.'''
        elif order.status > Order.Status.PUB and order.status < Order.Status.CHA and order.maker == user:
            #Settle the maker bond (Maker loses the bond for canceling an ongoing trade)
            valid = cls.settle_bond(order.maker_bond)
            if valid:
                order.status = Order.Status.UCA
                order.save()
                return True, None

        # 4.b) When taker cancel after bond (before escrow)
            '''The order into cancelled status if maker cancels.'''
        elif order.status in [Order.Status.WF2, Order.Status.WFE] and order.taker == user:
            # Settle the maker bond (Maker loses the bond for canceling an ongoing trade)
            valid = cls.settle_bond(order.taker_bond)
            if valid:
                order.taker = None
                cls.publish_order(order)
                return True, None

        # 5) When trade collateral has been posted (after escrow)
            '''Always goes to CCA status. Collaboration is needed.
            When a user asks for cancel, 'order.m/t/aker_asked_cancel' goes True.
            When the second user asks for cancel. Order is totally cancelled.
            Must have a small cost for both parties to prevent node DDOS.'''
        elif order.status in [Order.Status.WFI, Order.Status.CHA, Order.Status.FSE]:
            
            # if the maker had asked, and now the taker does: cancel order, return everything
            if order.maker_asked_cancel and user == order.taker:
                cls.collaborative_cancel(order)
                return True, None
            
            # if the taker had asked, and now the maker does: cancel order, return everything
            elif order.taker_asked_cancel and user == order.maker:
                cls.collaborative_cancel(order)
                return True, None

            # Otherwise just make true the asked for cancel flags
            elif user == order.taker:
                order.taker_asked_cancel = True
                order.save()
                return True, None
            
            elif user == order.maker:
                order.maker_asked_cancel = True
                order.save()
                return True, None
            

        else:
            return False, {'bad_request':'You cannot cancel this order'}

    @classmethod
    def collaborative_cancel(cls, order):
        cls.return_bond(order.maker_bond)
        cls.return_bond(order.taker_bond)
        cls.return_escrow(order)
        order.status = Order.Status.CCA
        order.save()
        return

    def publish_order(order):
        order.status = Order.Status.PUB
        order.expires_at = order.created_at + timedelta(seconds=Order.t_to_expire[Order.Status.PUB])
        order.save()
        return

    @classmethod
    def is_maker_bond_locked(cls, order):
        if order.maker_bond.status == LNPayment.Status.LOCKED:
            return True
        elif LNNode.validate_hold_invoice_locked(order.maker_bond.payment_hash):
            order.maker_bond.status = LNPayment.Status.LOCKED
            order.maker_bond.save()
            cls.publish_order(order)
            return True
        return False

    @classmethod
    def gen_maker_hold_invoice(cls, order, user):

        # Do not gen and cancel if order is older than expiry time
        if order.expires_at < timezone.now():
            cls.order_expires(order)
            return False, {'bad_request':'Invoice expired. You did not confirm publishing the order in time. Make a new order.'}

        # Return the previous invoice if there was one and is still unpaid
        if order.maker_bond:
            if cls.is_maker_bond_locked(order):
                return False, None
            elif order.maker_bond.status == LNPayment.Status.INVGEN:
                return True, {'bond_invoice':order.maker_bond.invoice,'bond_satoshis':order.maker_bond.num_satoshis}

        # If there was no maker_bond object yet, generates one
        order.last_satoshis = cls.satoshis_now(order)
        bond_satoshis = int(order.last_satoshis * BOND_SIZE)

        description = f"RoboSats - Publishing '{str(order)}' - This is a maker bond, it will freeze in your wallet temporarily and automatically return. It will be charged if you cheat or cancel."

        # Gen hold Invoice
        hold_payment = LNNode.gen_hold_invoice(bond_satoshis, 
                                            description, 
                                            invoice_expiry=Order.t_to_expire[Order.Status.WFB], 
                                            cltv_expiry_secs=BOND_EXPIRY*3600)
        
        order.maker_bond = LNPayment.objects.create(
            concept = LNPayment.Concepts.MAKEBOND, 
            type = LNPayment.Types.HOLD, 
            sender = user,
            receiver = User.objects.get(username=ESCROW_USERNAME),
            invoice = hold_payment['invoice'],
            preimage = hold_payment['preimage'],
            status = LNPayment.Status.INVGEN,
            num_satoshis = bond_satoshis,
            description =  description,
            payment_hash = hold_payment['payment_hash'],
            created_at = hold_payment['created_at'],
            expires_at = hold_payment['expires_at'])

        order.save()
        return True, {'bond_invoice':hold_payment['invoice'], 'bond_satoshis':bond_satoshis}

    @classmethod
    def finalize_contract(cls, order):
            ''' When the taker locks the taker_bond
            the contract is final '''

            # THE TRADE AMOUNT IS FINAL WITH THE CONFIRMATION OF THE TAKER BOND! 
            # (This is the last update to "last_satoshis", it becomes the escrow amount next)
            order.last_satoshis = cls.satoshis_now(order)
            order.taker_bond.status = LNPayment.Status.LOCKED
            order.taker_bond.save()

            # Both users profiles are added one more contract // Unsafe can add more than once.
            order.maker.profile.total_contracts += 1
            order.taker.profile.total_contracts += 1
            order.maker.profile.save()
            order.taker.profile.save()

            # Log a market tick
            MarketTick.log_a_tick(order) 

            # With the bond confirmation the order is extended 'public_order_duration' hours
            order.expires_at = timezone.now() + timedelta(seconds=Order.t_to_expire[Order.Status.WF2])
            order.status = Order.Status.WF2
            order.save()
            return True

    @classmethod
    def is_taker_bond_locked(cls, order):
        if order.taker_bond.status == LNPayment.Status.LOCKED:
            return True
        elif LNNode.validate_hold_invoice_locked(order.taker_bond.payment_hash):
            cls.finalize_contract(order)
            return True
        return False

    @classmethod
    def gen_taker_hold_invoice(cls, order, user):

        # Do not gen and kick out the taker if order is older than expiry time
        if order.expires_at < timezone.now():
            cls.order_expires(order)
            return False, {'bad_request':'Invoice expired. You did not confirm taking the order in time.'}

        # Do not gen if a taker invoice exist. Do not return if it is already locked. Return the old one if still waiting.
        if order.taker_bond:
            if cls.is_taker_bond_locked(order):
                return False, None
            elif order.taker_bond.status == LNPayment.Status.INVGEN:
                return True, {'bond_invoice':order.taker_bond.invoice,'bond_satoshis':order.taker_bond.num_satoshis}

        # If there was no taker_bond object yet, generates one
        order.last_satoshis = cls.satoshis_now(order)
        bond_satoshis = int(order.last_satoshis * BOND_SIZE)
        pos_text = 'Buying' if cls.is_buyer(order, user) else 'Selling'
        description = (f"RoboSats - Taking 'Order {order.id}' {pos_text} BTC for {str(float(order.amount)) + Currency.currency_dict[str(order.currency.currency)]}"
            + " - This is a taker bond, it will freeze in your wallet temporarily and automatically return. It will be charged if you cheat or cancel.")

        # Gen hold Invoice
        hold_payment = LNNode.gen_hold_invoice(bond_satoshis, 
                                                description,
                                                invoice_expiry=Order.t_to_expire[Order.Status.TAK], 
                                                cltv_expiry_secs=BOND_EXPIRY*3600)
        
        order.taker_bond = LNPayment.objects.create(
            concept = LNPayment.Concepts.TAKEBOND, 
            type = LNPayment.Types.HOLD, 
            sender = user,
            receiver = User.objects.get(username=ESCROW_USERNAME),
            invoice = hold_payment['invoice'],
            preimage = hold_payment['preimage'],
            status = LNPayment.Status.INVGEN,
            num_satoshis = bond_satoshis,
            description =  description,
            payment_hash = hold_payment['payment_hash'],
            created_at = hold_payment['created_at'],
            expires_at = hold_payment['expires_at'])

        order.expires_at = timezone.now() + timedelta(seconds=Order.t_to_expire[Order.Status.TAK])
        order.save()
        return True, {'bond_invoice': hold_payment['invoice'], 'bond_satoshis': bond_satoshis}

    def trade_escrow_received(order):
        ''' Moves the order forward'''
        # If status is 'Waiting for both' move to Waiting for invoice
        if order.status == Order.Status.WF2:
            order.status = Order.Status.WFI
        # If status is 'Waiting for invoice' move to Chat
        elif order.status == Order.Status.WFE:
            order.status = Order.Status.CHA
            order.expires_at = timezone.now() + timedelta(seconds=Order.t_to_expire[Order.Status.CHA])
        order.save()

    @classmethod
    def is_trade_escrow_locked(cls, order):
        if order.trade_escrow.status == LNPayment.Status.LOCKED:
            return True
        elif LNNode.validate_hold_invoice_locked(order.trade_escrow.payment_hash):
            order.trade_escrow.status = LNPayment.Status.LOCKED
            order.trade_escrow.save()
            cls.trade_escrow_received(order)
            return True
        return False

    @classmethod
    def gen_escrow_hold_invoice(cls, order, user):

        # Do not generate if escrow deposit time has expired
        if order.expires_at < timezone.now():
            cls.order_expires(order)
            return False, {'bad_request':'Invoice expired. You did not send the escrow in time.'}

        # Do not gen if an escrow invoice exist. Do not return if it is already locked. Return the old one if still waiting.
        if order.trade_escrow:
            # Check if status is INVGEN and still not expired
            if cls.is_trade_escrow_locked(order):
                return False, None
            elif order.trade_escrow.status == LNPayment.Status.INVGEN:
                return True, {'escrow_invoice':order.trade_escrow.invoice, 'escrow_satoshis':order.trade_escrow.num_satoshis}

        # If there was no taker_bond object yet, generate one
        escrow_satoshis = order.last_satoshis # Amount was fixed when taker bond was locked
        description = f"RoboSats - Escrow amount for '{str(order)}' - The escrow will be released to the buyer once you confirm you received the fiat. It will automatically return if buyer does not confirm the payment."

        # Gen hold Invoice
        hold_payment = LNNode.gen_hold_invoice(escrow_satoshis, 
                                                description,
                                                invoice_expiry=Order.t_to_expire[Order.Status.WF2], 
                                                cltv_expiry_secs=ESCROW_EXPIRY*3600)
        
        order.trade_escrow = LNPayment.objects.create(
            concept = LNPayment.Concepts.TRESCROW, 
            type = LNPayment.Types.HOLD, 
            sender = user,
            receiver = User.objects.get(username=ESCROW_USERNAME),
            invoice = hold_payment['invoice'],
            preimage = hold_payment['preimage'],
            status = LNPayment.Status.INVGEN,
            num_satoshis = escrow_satoshis,
            description =  description,
            payment_hash = hold_payment['payment_hash'],
            created_at = hold_payment['created_at'],
            expires_at = hold_payment['expires_at'])

        order.save()
        return True, {'escrow_invoice':hold_payment['invoice'],'escrow_satoshis': escrow_satoshis}
    
    def settle_escrow(order):
        ''' Settles the trade escrow hold invoice'''
        # TODO ERROR HANDLING
        if LNNode.settle_hold_invoice(order.trade_escrow.preimage):
            order.trade_escrow.status = LNPayment.Status.SETLED
            order.trade_escrow.save()
            return True

    def settle_bond(bond):
        ''' Settles the bond hold invoice'''
        # TODO ERROR HANDLING
        if LNNode.settle_hold_invoice(bond.preimage):
            bond.status = LNPayment.Status.SETLED
            bond.save()
            return True

    def return_escrow(order):
        '''returns the trade escrow'''
        if LNNode.cancel_return_hold_invoice(order.trade_escrow.payment_hash):
            order.trade_escrow.status = LNPayment.Status.RETNED
            order.trade_escrow.save()
            return True

    def cancel_escrow(order):
        '''returns the trade escrow'''
        # Same as return escrow, but used when the invoice was never LOCKED
        if LNNode.cancel_return_hold_invoice(order.trade_escrow.payment_hash):
            order.trade_escrow.status = LNPayment.Status.CANCEL
            order.trade_escrow.save()
            return True

    def return_bond(bond):
        '''returns a bond'''
        if bond == None:
            return
        try:
            LNNode.cancel_return_hold_invoice(bond.payment_hash)
            bond.status = LNPayment.Status.RETNED
            bond.save()
            return True
        except Exception as e:
            if 'invoice already settled' in str(e):
                bond.status = LNPayment.Status.SETLED
                bond.save()
                return True
            else:
                raise e

    def cancel_bond(bond):
        '''cancel a bond'''
        # Same as return bond, but used when the invoice was never LOCKED
        if bond == None:
            return True
        try:
            LNNode.cancel_return_hold_invoice(bond.payment_hash)
            bond.status = LNPayment.Status.CANCEL
            bond.save()
            return True
        except Exception as e:
            if 'invoice already settled' in str(e):
                bond.status = LNPayment.Status.SETLED
                bond.save()
                return True
            else:
                raise e

    @classmethod
    def confirm_fiat(cls, order, user):
        ''' If Order is in the CHAT states:
        If user is buyer: fiat_sent goes to true.
        If User is tseller and fiat_sent is true: settle the escrow and pay buyer invoice!'''

        if order.status == Order.Status.CHA or order.status == Order.Status.FSE: # TODO Alternatively, if all collateral is locked? test out
            
            # If buyer, settle escrow and mark fiat sent
            if cls.is_buyer(order, user):
                order.status = Order.Status.FSE
                order.is_fiat_sent = True

            # If seller and fiat was sent, SETTLE ESCROW AND PAY BUYER INVOICE
            elif cls.is_seller(order, user):
                if not order.is_fiat_sent:
                    return False, {'bad_request':'You cannot confirm to have received the fiat before it is confirmed to be sent by the buyer.'}
                
                # Make sure the trade escrow is at least as big as the buyer invoice 
                if order.trade_escrow.num_satoshis <= order.buyer_invoice.num_satoshis:
                    return False, {'bad_request':'Woah, something broke badly. Report in the public channels, or open a Github Issue.'}

                if cls.settle_escrow(order): ##### !!! KEY LINE - SETTLES THE TRADE ESCROW !!!
                    order.trade_escrow.status = LNPayment.Status.SETLED
                
                # Double check the escrow is settled.
                if LNNode.double_check_htlc_is_settled(order.trade_escrow.payment_hash): 
                    is_payed, context = follow_send_payment(order.buyer_invoice) ##### !!! KEY LINE - PAYS THE BUYER INVOICE !!!
                    if is_payed:
                        order.status = Order.Status.SUC
                        order.buyer_invoice.status = LNPayment.Status.SUCCED
                        order.expires_at = timezone.now() + timedelta(seconds=Order.t_to_expire[Order.Status.SUC])
                        # RETURN THE BONDS
                        cls.return_bond(order.taker_bond)
                        cls.return_bond(order.maker_bond)
                        order.save()

                        return True, context
                    else:
                        # error handling here
                        return False, context
        else:
            return False, {'bad_request':'You cannot confirm the fiat payment at this stage'}

        order.save()
        return True, None

    @classmethod
    def rate_counterparty(cls, order, user, rating):

        # If the trade is finished
        if order.status > Order.Status.PAY:
            # if maker, rates taker
            if order.maker == user and order.maker_rated == False:
                cls.add_profile_rating(order.taker.profile, rating)
                order.maker_rated = True
                order.save()
            # if taker, rates maker
            if order.taker == user and order.taker_rated == False:
                cls.add_profile_rating(order.maker.profile, rating)
                order.taker_rated = True
                order.save()
        else:
            return False, {'bad_request':'You cannot rate your counterparty yet.'}

        return True, None
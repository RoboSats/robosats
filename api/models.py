from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator, validate_comma_separated_integer_list
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.utils.html import mark_safe
import uuid

from decouple import config
from pathlib import Path
from .utils import get_exchange_rate
import json

MIN_TRADE = int(config('MIN_TRADE'))
MAX_TRADE = int(config('MAX_TRADE'))
FEE = float(config('FEE'))
BOND_SIZE = float(config('BOND_SIZE'))

class LNPayment(models.Model):

    class Types(models.IntegerChoices):
        NORM = 0, 'Regular invoice' # Only outgoing buyer payment will be a regular invoice (Non-hold)
        HOLD = 1, 'hold invoice'

    class Concepts(models.IntegerChoices):
        MAKEBOND = 0, 'Maker bond'
        TAKEBOND = 1, 'Taker bond'
        TRESCROW = 2, 'Trade escrow'
        PAYBUYER = 3, 'Payment to buyer'

    class Status(models.IntegerChoices):
        INVGEN = 0, 'Generated'
        LOCKED = 1, 'Locked'
        SETLED = 2, 'Settled'
        RETNED = 3, 'Returned'
        EXPIRE = 4, 'Expired'
        VALIDI = 5, 'Valid'
        FLIGHT = 6, 'In flight'
        SUCCED = 7, 'Succeeded'
        FAILRO = 8, 'Routing failed'
        

    # payment use details
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.PositiveSmallIntegerField(choices=Types.choices, null=False, default=Types.HOLD)
    concept = models.PositiveSmallIntegerField(choices=Concepts.choices, null=False, default=Concepts.MAKEBOND)
    status = models.PositiveSmallIntegerField(choices=Status.choices, null=False, default=Status.INVGEN)
    routing_retries = models.PositiveSmallIntegerField(null=False, default=0)
    
    # payment info
    invoice = models.CharField(max_length=1200, unique=True, null=True, default=None, blank=True) # Some invoices with lots of routing hints might be long
    payment_hash = models.CharField(max_length=100, unique=True, null=True, default=None, blank=True)
    preimage = models.CharField(max_length=64, unique=True, null=True, default=None, blank=True)
    description = models.CharField(max_length=500, unique=False, null=True, default=None, blank=True)
    num_satoshis = models.PositiveBigIntegerField(validators=[MinValueValidator(MIN_TRADE*BOND_SIZE), MaxValueValidator(MAX_TRADE*(1+BOND_SIZE+FEE))])
    created_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    
    # involved parties
    sender = models.ForeignKey(User, related_name='sender', on_delete=models.CASCADE, null=True, default=None)
    receiver = models.ForeignKey(User, related_name='receiver', on_delete=models.CASCADE, null=True, default=None)

    def __str__(self):
        return (f'LN-{str(self.id)[:8]}: {self.Concepts(self.concept).label} - {self.Status(self.status).label}')

class Order(models.Model):
    
    class Types(models.IntegerChoices):
        BUY  = 0, 'BUY'
        SELL = 1, 'SELL'

    class Status(models.IntegerChoices):
        WFB = 0,  'Waiting for maker bond'
        PUB = 1,  'Public'
        DEL = 2,  'Deleted'
        TAK = 3,  'Waiting for taker bond'
        UCA = 4,  'Cancelled'
        EXP = 5,  'Expired'
        WF2 = 6,  'Waiting for trade collateral and buyer invoice'
        WFE = 7,  'Waiting only for seller trade collateral'
        WFI = 8,  'Waiting only for buyer invoice'
        CHA = 9,  'Sending fiat - In chatroom'
        FSE = 10, 'Fiat sent - In chatroom'
        DIS = 11, 'In dispute'
        CCA = 12, 'Collaboratively cancelled'
        PAY = 13, 'Sending satoshis to buyer'
        SUC = 14, 'Sucessful trade'
        FAI = 15, 'Failed lightning network routing'
        MLD = 16, 'Maker lost dispute'
        TLD = 17, 'Taker lost dispute'
    
    currency_dict = json.load(open('./frontend/static/assets/currencies.json'))
    currency_choices = [(int(val), label) for val, label in list(currency_dict.items())]

    # order info
    status = models.PositiveSmallIntegerField(choices=Status.choices, null=False, default=Status.WFB)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    # order details
    type = models.PositiveSmallIntegerField(choices=Types.choices, null=False)
    currency = models.PositiveSmallIntegerField(choices=currency_choices, null=False)
    amount = models.DecimalField(max_digits=9, decimal_places=4, validators=[MinValueValidator(0.00001)])
    payment_method = models.CharField(max_length=35, null=False, default="not specified", blank=True)

    # order pricing method. A explicit amount of sats, or a relative premium above/below market.
    is_explicit = models.BooleanField(default=False, null=False)
    # marked to market
    premium = models.DecimalField(max_digits=5, decimal_places=2, default=0, null=True, validators=[MinValueValidator(-100), MaxValueValidator(999)], blank=True)
    # explicit
    satoshis = models.PositiveBigIntegerField(null=True, validators=[MinValueValidator(MIN_TRADE), MaxValueValidator(MAX_TRADE)], blank=True)
    # how many sats at creation and at last check (relevant for marked to market)
    t0_satoshis = models.PositiveBigIntegerField(null=True, validators=[MinValueValidator(MIN_TRADE), MaxValueValidator(MAX_TRADE)], blank=True) # sats at creation
    last_satoshis = models.PositiveBigIntegerField(null=True, validators=[MinValueValidator(0), MaxValueValidator(MAX_TRADE*2)], blank=True) # sats last time checked. Weird if 2* trade max...
    
    # order participants
    maker = models.ForeignKey(User, related_name='maker', on_delete=models.CASCADE, null=True, default=None)  # unique = True, a maker can only make one order
    taker = models.ForeignKey(User, related_name='taker', on_delete=models.SET_NULL, null=True, default=None, blank=True)  # unique = True, a taker can only take one order
    is_pending_cancel = models.BooleanField(default=False, null=False) # When collaborative cancel is needed and one partner has cancelled.
    is_disputed = models.BooleanField(default=False, null=False)
    is_fiat_sent = models.BooleanField(default=False, null=False)

    # HTLCs
    # Order collateral
    maker_bond = models.ForeignKey(LNPayment, related_name='maker_bond', on_delete=models.SET_NULL, null=True, default=None, blank=True)
    taker_bond = models.ForeignKey(LNPayment, related_name='taker_bond', on_delete=models.SET_NULL, null=True, default=None, blank=True)
    trade_escrow = models.ForeignKey(LNPayment, related_name='trade_escrow', on_delete=models.SET_NULL, null=True, default=None, blank=True)

    # buyer payment LN invoice
    buyer_invoice = models.ForeignKey(LNPayment, related_name='buyer_invoice', on_delete=models.SET_NULL, null=True, default=None, blank=True)

    # cancel LN invoice // these are only needed to charge lower-than-bond amounts. E.g., a taken order has a small cost if cancelled, to avoid DDOSing.
    maker_cancel = models.ForeignKey(LNPayment, related_name='maker_cancel', on_delete=models.SET_NULL, null=True, default=None, blank=True)
    taker_cancel = models.ForeignKey(LNPayment, related_name='taker_cancel', on_delete=models.SET_NULL, null=True, default=None, blank=True)

    total_time_to_expire = {
        0  : int(config('EXP_MAKER_BOND_INVOICE')) ,         # 'Waiting for maker bond'
        1  : 60*60*int(config('PUBLIC_ORDER_DURATION')),     # 'Public'
        2  : 0,                                              # 'Deleted'
        3  : int(config('EXP_TAKER_BOND_INVOICE')),          # 'Waiting for taker bond'
        4  : 0,                                              # 'Cancelled'
        5  : 0,                                              # 'Expired'
        6  : 60*int(config('INVOICE_AND_ESCROW_DURATION')),  # 'Waiting for trade collateral and buyer invoice'
        7  : 60*int(config('INVOICE_AND_ESCROW_DURATION')),  # 'Waiting only for seller trade collateral'
        8  : 60*int(config('INVOICE_AND_ESCROW_DURATION')),  # 'Waiting only for buyer invoice'
        9  : 60*60*int(config('FIAT_EXCHANGE_DURATION')),    # 'Sending fiat - In chatroom'
        10 : 60*60*int(config('FIAT_EXCHANGE_DURATION')),    # 'Fiat sent - In chatroom'
        11 : 24*60*60,                                       # 'In dispute'
        12 : 0,                                              # 'Collaboratively cancelled'
        13 : 24*60*60,                                       # 'Sending satoshis to buyer'
        14 : 24*60*60,                                       # 'Sucessful trade'
        15 : 24*60*60,                                       # 'Failed lightning network routing'
        16 : 24*60*60,                                       # 'Maker lost dispute'
        17 : 24*60*60,                                       # 'Taker lost dispute'
        }

    def __str__(self):
        # Make relational back to ORDER
        return (f'Order {self.id}: {self.Types(self.type).label} BTC for {float(self.amount)} {self.currency_dict[str(self.currency)]}')

@receiver(pre_delete, sender=Order)
def delete_HTLCs_at_order_deletion(sender, instance, **kwargs):
    to_delete = (instance.maker_bond, instance.buyer_invoice, instance.taker_bond, instance.trade_escrow)

    for htlc in to_delete:
        try:
            htlc.delete()
        except:
            pass

class Profile(models.Model):

    user = models.OneToOneField(User,on_delete=models.CASCADE)

    # Ratings stored as a comma separated integer list
    total_ratings = models.PositiveIntegerField(null=False, default=0) 
    latest_ratings = models.CharField(max_length=999, null=True, default=None, validators=[validate_comma_separated_integer_list], blank=True) # Will only store latest ratings
    avg_rating = models.DecimalField(max_digits=4, decimal_places=1, default=None, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)], blank=True)

    # Disputes
    num_disputes = models.PositiveIntegerField(null=False, default=0)
    lost_disputes = models.PositiveIntegerField(null=False, default=0)

    # RoboHash
    avatar = models.ImageField(default="static/assets/misc/unknown_avatar.png", verbose_name='Avatar', blank=True)

    # Penalty expiration (only used then taking/cancelling repeatedly orders in the book before comitting bond)
    penalty_expiration = models.DateTimeField(null=True)

    @receiver(post_save, sender=User)
    def create_user_profile(sender, instance, created, **kwargs):
        if created:
            Profile.objects.create(user=instance)

    @receiver(post_save, sender=User)
    def save_user_profile(sender, instance, **kwargs):
        instance.profile.save()

    @receiver(pre_delete, sender=User)
    def del_avatar_from_disk(sender, instance, **kwargs):
        avatar_file=Path('frontend/' + instance.profile.avatar.url)
        avatar_file.unlink() # FIX deleting user fails if avatar is not found

    def __str__(self):
        return self.user.username
    
    # to display avatars in admin panel
    def get_avatar(self):
        if not self.avatar:
            return 'static/assets/misc/unknown_avatar.png'
        return self.avatar.url

    # method to create a fake table field in read only mode
    def avatar_tag(self):
        return mark_safe('<img src="%s" width="50" height="50" />' % self.get_avatar())

class MarketTick(models.Model):
    ''' 
    Records tick by tick Non-KYC Bitcoin price. 
    Data to be aggregated and offered via public API.

    It is checked against current CEX price for useful
    insight on the historical premium of Non-KYC BTC

    Price is set when taker bond is locked. Both 
    maker and taker are commited with bonds (contract 
    is finished and cancellation has a cost)
    '''
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=None, null=True, validators=[MinValueValidator(0)])
    volume = models.DecimalField(max_digits=8, decimal_places=8, default=None, null=True, validators=[MinValueValidator(0)])
    premium = models.DecimalField(max_digits=5, decimal_places=2, default=None, null=True, validators=[MinValueValidator(-100), MaxValueValidator(999)], blank=True)
    currency = models.PositiveSmallIntegerField(choices=Order.currency_choices, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Relevant to keep record of the historical fee, so the insight on the premium can be better analyzed
    fee = models.DecimalField(max_digits=4, decimal_places=4, default=FEE, validators=[MinValueValidator(0), MaxValueValidator(1)])

    def log_a_tick(order):
        '''
        Creates a new tick
        '''

        if not order.taker_bond:
            return None

        elif order.taker_bond.status == LNPayment.Status.LOCKED:
            volume = order.last_satoshis / 100000000
            price = float(order.amount) / volume  # Amount Fiat / Amount BTC
            premium = 100 * (price / get_exchange_rate(Order.currency_dict[str(order.currency)]) - 1)

            tick = MarketTick.objects.create(
                price=price, 
                volume=volume, 
                premium=premium, 
                currency=order.currency)

            tick.save()

    def __str__(self):
        return f'Tick: {str(self.id)[:8]}'



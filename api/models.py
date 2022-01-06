from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator, validate_comma_separated_integer_list
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.utils.html import mark_safe

from datetime import timedelta
from django.utils import timezone

from pathlib import Path

from .lightning import LNNode

#############################
# TODO
# Load hparams from .env file

MIN_TRADE = 10*1000  #In sats
MAX_TRADE = 500*1000
FEE = 0.002 # Trade fee in %
BOND_SIZE = 0.01 # Bond in %
ESCROW_USERNAME = 'admin'

class LNPayment(models.Model):

    class Types(models.IntegerChoices):
        NORM = 0, 'Regular invoice' # Only outgoing HTLCs will be regular invoices (Non-hodl)
        HODL = 1, 'Hodl invoice'

    class Concepts(models.IntegerChoices):
        MAKEBOND = 0, 'Maker bond'
        TAKEBOND = 1, 'Taker-buyer bond'
        TRESCROW = 2, 'Trade escrow'
        PAYBUYER = 3, 'Payment to buyer'

    class Status(models.IntegerChoices):
        INVGEN = 0, 'Hodl invoice was generated'
        LOCKED = 1, 'Hodl invoice has HTLCs locked'
        SETLED = 2, 'Invoice settled'
        RETNED = 3, 'Hodl invoice was returned'
        MISSNG = 4, 'Buyer invoice is missing'
        VALIDI = 5, 'Buyer invoice is valid'
        INFAIL = 6, 'Buyer invoice routing failed'

    # payment use details
    type = models.PositiveSmallIntegerField(choices=Types.choices, null=False, default=Types.HODL)
    concept = models.PositiveSmallIntegerField(choices=Concepts.choices, null=False, default=Concepts.MAKEBOND)
    status = models.PositiveSmallIntegerField(choices=Status.choices, null=False, default=Status.INVGEN)
    routing_retries = models.PositiveSmallIntegerField(null=False, default=0)
    
    # payment info
    invoice = models.CharField(max_length=300, unique=False, null=True, default=None, blank=True)
    payment_hash = models.CharField(max_length=300, unique=False, null=True, default=None, blank=True)
    preimage = models.CharField(max_length=300, unique=False, null=True, default=None, blank=True)
    description = models.CharField(max_length=300, unique=False, null=True, default=None, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    num_satoshis = models.PositiveBigIntegerField(validators=[MinValueValidator(MIN_TRADE*BOND_SIZE), MaxValueValidator(MAX_TRADE*(1+BOND_SIZE+FEE))])
    
    # involved parties
    sender = models.ForeignKey(User, related_name='sender', on_delete=models.CASCADE, null=True, default=None)
    receiver = models.ForeignKey(User, related_name='receiver', on_delete=models.CASCADE, null=True, default=None)

    def __str__(self):
        # Make relational back to ORDER
        return (f'HTLC {self.id}: {self.Concepts(self.concept).label}')

class Order(models.Model):
    
    class Types(models.IntegerChoices):
        BUY  = 0, 'BUY'
        SELL = 1, 'SELL'

    class Currencies(models.IntegerChoices):
        USD = 1, 'USD'
        EUR = 2, 'EUR'
        ETH = 3, 'ETH'

    class Status(models.IntegerChoices):
        WFB = 0, 'Waiting for maker bond'
        PUB = 1, 'Public'
        DEL = 2, 'Deleted'
        TAK = 3, 'Waiting for taker bond' # only needed when taker is a buyer
        UCA = 4, 'Unilaterally cancelled'
        RET = 5, 'Returned to order book' # Probably same as 1 in most cases.
        WF2 = 6, 'Waiting for trade collateral and buyer invoice'
        WTC = 7, 'Waiting only for trade collateral'
        WBI = 8, 'Waiting only for buyer invoice'
        EXF = 9, 'Exchanging fiat / In chat'
        CCA = 10, 'Collaboratively cancelled'
        FSE = 11, 'Fiat sent'
        FCO = 12, 'Fiat confirmed'
        SUC = 13, 'Sucessfully settled'
        FAI = 14, 'Failed lightning network routing'
        UPI = 15, 'Updated invoice'
        DIS = 16, 'In dispute'
        MLD = 17, 'Maker lost dispute'
        TLD = 18, 'Taker lost dispute'
        EXP = 19, 'Expired'

    # order info
    status = models.PositiveSmallIntegerField(choices=Status.choices, null=False, default=Status.WFB)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    # order details
    type = models.PositiveSmallIntegerField(choices=Types.choices, null=False)
    currency = models.PositiveSmallIntegerField(choices=Currencies.choices, null=False)
    amount = models.DecimalField(max_digits=9, decimal_places=4, validators=[MinValueValidator(0.00001)])
    payment_method = models.CharField(max_length=30, null=False, default="not specified", blank=True)

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
    
    # order collateral
    maker_bond = models.ForeignKey(LNPayment, related_name='maker_bond', on_delete=models.SET_NULL, null=True, default=None, blank=True)
    taker_bond = models.ForeignKey(LNPayment, related_name='taker_bond', on_delete=models.SET_NULL, null=True, default=None, blank=True)
    trade_escrow = models.ForeignKey(LNPayment, related_name='trade_escrow', on_delete=models.SET_NULL, null=True, default=None, blank=True)

    # buyer payment LN invoice
    buyer_invoice = models.ForeignKey(LNPayment, related_name='buyer_invoice', on_delete=models.SET_NULL, null=True, default=None, blank=True)

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
        # TODO
        # order.last_satoshis =
        # order.save()

        return 50000
    
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
            return True

        return False

    @classmethod
    def gen_maker_hodl_invoice(cls, order, user):

        # Do not and delete if order is more than 5 minutes old
        if order.expires_at < timezone.now():
            cls.order_expires(order)
            return False, {'Order expired':'cannot generate a bond invoice for an expired order. Make a new one.'}

        if order.maker_bond:
            return order.maker_bond.invoice
            
        bond_amount = cls.satoshis_now(order)
        description = f'Robosats maker bond for order ID {order.id}. Will return to you if you do not cheat!'
        invoice, payment_hash, expires_at = LNNode.gen_hodl_invoice(num_satoshis = bond_amount, description=description)
        
        order.maker_bond = LNPayment.objects.create(
            concept = LNPayment.Concepts.MAKEBOND, 
            type = LNPayment.Types.HODL, 
            sender = user,
            receiver = User.objects.get(username=ESCROW_USERNAME),
            invoice = invoice,
            status = LNPayment.Status.INVGEN,
            num_satoshis = bond_amount,
            description =  description,
            payment_hash = payment_hash,
            expires_at = expires_at,
            )

        order.save()
        return invoice


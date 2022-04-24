from django.db import models
from django.contrib.auth.models import User
from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
    validate_comma_separated_integer_list,
)
from django.utils import timezone
from django.db.models.signals import post_save, pre_delete
from django.template.defaultfilters import truncatechars
from django.dispatch import receiver
from django.utils.html import mark_safe
import uuid
from django.conf import settings

from decouple import config
from pathlib import Path
import json

MIN_TRADE = int(config("MIN_TRADE"))
MAX_TRADE = int(config("MAX_TRADE"))
FEE = float(config("FEE"))
DEFAULT_BOND_SIZE = float(config("DEFAULT_BOND_SIZE"))


class Currency(models.Model):

    currency_dict = json.load(open("frontend/static/assets/currencies.json"))
    currency_choices = [(int(val), label)
                        for val, label in list(currency_dict.items())]

    currency = models.PositiveSmallIntegerField(choices=currency_choices,
                                                null=False,
                                                unique=True)
    exchange_rate = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        default=None,
        null=True,
        validators=[MinValueValidator(0)],
    )
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        # returns currency label ( 3 letters code)
        return self.currency_dict[str(self.currency)]

    class Meta:
        verbose_name = "Cached market currency"
        verbose_name_plural = "Currencies"


class LNPayment(models.Model):

    class Types(models.IntegerChoices):
        NORM = 0, "Regular invoice"
        HOLD = 1, "hold invoice"

    class Concepts(models.IntegerChoices):
        MAKEBOND = 0, "Maker bond"
        TAKEBOND = 1, "Taker bond"
        TRESCROW = 2, "Trade escrow"
        PAYBUYER = 3, "Payment to buyer"
        WITHREWA = 4, "Withdraw rewards"

    class Status(models.IntegerChoices):
        INVGEN = 0, "Generated"
        LOCKED = 1, "Locked"
        SETLED = 2, "Settled"
        RETNED = 3, "Returned"
        CANCEL = 4, "Cancelled"
        EXPIRE = 5, "Expired"
        VALIDI = 6, "Valid"
        FLIGHT = 7, "In flight"
        SUCCED = 8, "Succeeded"
        FAILRO = 9, "Routing failed"

    # payment use details
    type = models.PositiveSmallIntegerField(choices=Types.choices,
                                            null=False,
                                            default=Types.HOLD)
    concept = models.PositiveSmallIntegerField(choices=Concepts.choices,
                                               null=False,
                                               default=Concepts.MAKEBOND)
    status = models.PositiveSmallIntegerField(choices=Status.choices,
                                              null=False,
                                              default=Status.INVGEN)

    # payment info
    payment_hash = models.CharField(max_length=100,
                                    unique=True,
                                    default=None,
                                    blank=True,
                                    primary_key=True)
    invoice = models.CharField(
        max_length=1200, unique=True, null=True, default=None,
        blank=True)  # Some invoices with lots of routing hints might be long
    preimage = models.CharField(max_length=64,
                                unique=True,
                                null=True,
                                default=None,
                                blank=True)
    description = models.CharField(max_length=500,
                                   unique=False,
                                   null=True,
                                   default=None,
                                   blank=True)
    num_satoshis = models.PositiveBigIntegerField(validators=[
        MinValueValidator(100),
        MaxValueValidator(MAX_TRADE * (1 + DEFAULT_BOND_SIZE + FEE)),
    ])
    # Fee in sats with mSats decimals fee_msat
    fee = models.DecimalField(max_digits=10, decimal_places=3, default=0, null=False, blank=False)
    created_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    cltv_expiry = models.PositiveSmallIntegerField(null=True,
                                                   default=None,
                                                   blank=True)
    expiry_height = models.PositiveBigIntegerField(null=True,
                                                   default=None,
                                                   blank=True)

    # routing
    routing_attempts = models.PositiveSmallIntegerField(null=False, default=0)
    last_routing_time = models.DateTimeField(null=True,
                                             default=None,
                                             blank=True)
    in_flight = models.BooleanField(default=False, null=False, blank=False)
    # involved parties
    sender = models.ForeignKey(User,
                               related_name="sender",
                               on_delete=models.SET_NULL,
                               null=True,
                               default=None)
    receiver = models.ForeignKey(User,
                                 related_name="receiver",
                                 on_delete=models.SET_NULL,
                                 null=True,
                                 default=None)

    def __str__(self):
        return f"LN-{str(self.payment_hash)[:8]}: {self.Concepts(self.concept).label} - {self.Status(self.status).label}"

    class Meta:
        verbose_name = "Lightning payment"
        verbose_name_plural = "Lightning payments"

    @property
    def hash(self):
        # Payment hash is the primary key of LNpayments
        # However it is too long for the admin panel.
        # We created a truncated property for display 'hash'
        return truncatechars(self.payment_hash, 10)


class Order(models.Model):

    class Types(models.IntegerChoices):
        BUY = 0, "BUY"
        SELL = 1, "SELL"

    class Status(models.IntegerChoices):
        WFB = 0, "Waiting for maker bond"
        PUB = 1, "Public"
        PAU = 2, "Paused"
        TAK = 3, "Waiting for taker bond"
        UCA = 4, "Cancelled"
        EXP = 5, "Expired"
        WF2 = 6, "Waiting for trade collateral and buyer invoice"
        WFE = 7, "Waiting only for seller trade collateral"
        WFI = 8, "Waiting only for buyer invoice"
        CHA = 9, "Sending fiat - In chatroom"
        FSE = 10, "Fiat sent - In chatroom"
        DIS = 11, "In dispute"
        CCA = 12, "Collaboratively cancelled"
        PAY = 13, "Sending satoshis to buyer"
        SUC = 14, "Sucessful trade"
        FAI = 15, "Failed lightning network routing"
        WFR = 16, "Wait for dispute resolution"
        MLD = 17, "Maker lost dispute"
        TLD = 18, "Taker lost dispute"

    # order info
    status = models.PositiveSmallIntegerField(choices=Status.choices,
                                              null=False,
                                              default=Status.WFB)
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()

    # order details
    type = models.PositiveSmallIntegerField(choices=Types.choices, null=False)
    currency = models.ForeignKey(Currency,
                                 null=True,
                                 on_delete=models.SET_NULL)
    amount = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    has_range = models.BooleanField(default=False, null=False, blank=False)
    min_amount = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    max_amount = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    payment_method = models.CharField(max_length=70,
                                      null=False,
                                      default="not specified",
                                      blank=True)
    bondless_taker = models.BooleanField(default=False, null=False, blank=False)
    # order pricing method. A explicit amount of sats, or a relative premium above/below market.
    is_explicit = models.BooleanField(default=False, null=False)
    # marked to market
    premium = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        null=True,
        validators=[MinValueValidator(-100),
                    MaxValueValidator(999)],
        blank=True,
    )
    # explicit
    satoshis = models.PositiveBigIntegerField(
        null=True,
        validators=[
            MinValueValidator(MIN_TRADE),
            MaxValueValidator(MAX_TRADE)
        ],
        blank=True,
    )
    # optionally makers can choose the public order duration length (seconds)
    public_duration = models.PositiveBigIntegerField(
        default=60*60*int(config("DEFAULT_PUBLIC_ORDER_DURATION"))-1,
        null=False,
        validators=[
            MinValueValidator(60*60*float(config("MIN_PUBLIC_ORDER_DURATION"))),   # Min is 10 minutes
            MaxValueValidator(60*60*float(config("MAX_PUBLIC_ORDER_DURATION"))),   # Max is 24 Hours
        ],
        blank=False,
    )

    # optionally makers can choose the escro lock / invoice submission step length (seconds)
    escrow_duration = models.PositiveBigIntegerField(
        default=60 * int(config("INVOICE_AND_ESCROW_DURATION"))-1,
        null=False,
        validators=[
            MinValueValidator(60*30),        # Min is 30 minutes
            MaxValueValidator(60*60*8),      # Max is 8 Hours
        ],
        blank=False,
    )

    # optionally makers can choose the fidelity bond size of the maker and taker (%)
    bond_size = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=DEFAULT_BOND_SIZE,
        null=False,
        validators=[
            MinValueValidator(float(config("MIN_BOND_SIZE"))),   # 1  %
            MaxValueValidator(float(config("MAX_BOND_SIZE"))),   # 15 %
        ],
        blank=False,
    )

    # how many sats at creation and at last check (relevant for marked to market)
    t0_satoshis = models.PositiveBigIntegerField(
        null=True,
        validators=[
            MinValueValidator(MIN_TRADE),
            MaxValueValidator(MAX_TRADE)
        ],
        blank=True,
    )  # sats at creation
    last_satoshis = models.PositiveBigIntegerField(
        null=True,
        validators=[MinValueValidator(0),
                    MaxValueValidator(MAX_TRADE * 2)],
        blank=True,
    )  # sats last time checked. Weird if 2* trade max...

    # order participants
    maker = models.ForeignKey(
        User,
        related_name="maker",
        on_delete=models.SET_NULL,
        null=True,
        default=None)  # unique = True, a maker can only make one order
    taker = models.ForeignKey(
        User,
        related_name="taker",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )  # unique = True, a taker can only take one order
    maker_last_seen = models.DateTimeField(null=True, default=None, blank=True)
    taker_last_seen = models.DateTimeField(null=True, default=None, blank=True)

    # When collaborative cancel is needed and one partner has cancelled.
    maker_asked_cancel = models.BooleanField(default=False, null=False)  
    taker_asked_cancel = models.BooleanField(default=False, null=False)

    is_fiat_sent = models.BooleanField(default=False, null=False)

    # in dispute
    is_disputed = models.BooleanField(default=False, null=False)
    maker_statement = models.TextField(max_length=5000,
                                       null=True,
                                       default=None,
                                       blank=True)
    taker_statement = models.TextField(max_length=5000,
                                       null=True,
                                       default=None,
                                       blank=True)

    # LNpayments
    # Order collateral
    maker_bond = models.OneToOneField(
        LNPayment,
        related_name="order_made",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )
    taker_bond = models.OneToOneField(
        LNPayment,
        related_name="order_taken",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )
    trade_escrow = models.OneToOneField(
        LNPayment,
        related_name="order_escrow",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )
    # buyer payment LN invoice
    payout = models.OneToOneField(
        LNPayment,
        related_name="order_paid",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )

    # ratings
    maker_rated = models.BooleanField(default=False, null=False)
    taker_rated = models.BooleanField(default=False, null=False)
    maker_platform_rated = models.BooleanField(default=False, null=False)
    taker_platform_rated = models.BooleanField(default=False, null=False)

    def __str__(self):
        if self.has_range and self.amount == None:
            amt = str(float(self.min_amount))+"-"+ str(float(self.max_amount))
        else:
            amt = float(self.amount)
        return f"Order {self.id}: {self.Types(self.type).label} BTC for {amt} {self.currency}"

    def t_to_expire(self, status):

        t_to_expire = {
            0: int(config("EXP_MAKER_BOND_INVOICE")),           # 'Waiting for maker bond'
            1: self.public_duration,  # 'Public'
            2: 0,                                               # 'Deleted'
            3: int(config("EXP_TAKER_BOND_INVOICE")),           # 'Waiting for taker bond'
            4: 0,                                               # 'Cancelled'
            5: 0,                                               # 'Expired'
            6: self.escrow_duration,                               # 'Waiting for trade collateral and buyer invoice'
            7: 60 * int(config("INVOICE_AND_ESCROW_DURATION")), # 'Waiting only for seller trade collateral'
            8: 60 * int(config("INVOICE_AND_ESCROW_DURATION")), # 'Waiting only for buyer invoice'
            9: 60 * 60 * int(config("FIAT_EXCHANGE_DURATION")), # 'Sending fiat - In chatroom'
            10: 60 * 60 * int(config("FIAT_EXCHANGE_DURATION")),# 'Fiat sent - In chatroom'
            11: 1 * 24 * 60 * 60,                               # 'In dispute'
            12: 0,                                              # 'Collaboratively cancelled'
            13: 24 * 60 * 60,                                   # 'Sending satoshis to buyer'
            14: 24 * 60 * 60,                                   # 'Sucessful trade'
            15: 24 * 60 * 60,                                   # 'Failed lightning network routing'
            16: 10 * 24 * 60 * 60,                              # 'Wait for dispute resolution'
            17: 24 * 60 * 60,                                   # 'Maker lost dispute'
            18: 24 * 60 * 60,                                   # 'Taker lost dispute'
        }
        
        return t_to_expire[status]


@receiver(pre_delete, sender=Order)
def delete_lnpayment_at_order_deletion(sender, instance, **kwargs):
    to_delete = (
        instance.maker_bond,
        instance.payout,
        instance.taker_bond,
        instance.trade_escrow,
    )

    for lnpayment in to_delete:
        try:
            lnpayment.delete()
        except:
            pass


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # Total trades
    total_contracts = models.PositiveIntegerField(null=False, default=0)

    # Ratings stored as a comma separated integer list
    total_ratings = models.PositiveIntegerField(null=False, default=0)
    latest_ratings = models.CharField(
        max_length=999,
        null=True,
        default=None,
        validators=[validate_comma_separated_integer_list],
        blank=True,
    )  # Will only store latest rating
    avg_rating = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        default=None,
        null=True,
        validators=[MinValueValidator(0),
                    MaxValueValidator(100)],
        blank=True,
    )
    # Used to deep link telegram chat in case telegram notifications are enabled
    telegram_token = models.CharField(
        max_length=20,
        null=True,
        blank=True
    )
    telegram_chat_id = models.BigIntegerField(
        null=True,
        default=None,
        blank=True
    )
    telegram_enabled = models.BooleanField(
        default=False, 
        null=False
    )
    telegram_lang_code = models.CharField(
        max_length=10,
        null=True,
        blank=True
    )
    telegram_welcomed = models.BooleanField(
        default=False, 
        null=False
    )

    # Referral program
    is_referred = models.BooleanField(
        default=False, 
        null=False
    )
    referred_by = models.ForeignKey(
        'self',
        related_name="referee",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )
    referral_code = models.CharField(
        max_length=15,
        null=True,
        blank=True
    )
    # Recent rewards from referred trades that will be "earned" at a later point to difficult spionage.
    pending_rewards = models.PositiveIntegerField(null=False, default=0)
    # Claimable rewards
    earned_rewards = models.PositiveIntegerField(null=False, default=0)
    # Total claimed rewards
    claimed_rewards = models.PositiveIntegerField(null=False, default=0)

    # Disputes
    num_disputes = models.PositiveIntegerField(null=False, default=0)
    lost_disputes = models.PositiveIntegerField(null=False, default=0)
    num_disputes_started = models.PositiveIntegerField(null=False, default=0)
    orders_disputes_started = models.CharField(
        max_length=999,
        null=True,
        default=None,
        validators=[validate_comma_separated_integer_list],
        blank=True,
    )  # Will only store ID of orders

    # RoboHash
    avatar = models.ImageField(
        default=("static/assets/avatars/" + "unknown_avatar.png"),
        verbose_name="Avatar",
        blank=True,
    )

    # Penalty expiration (only used then taking/cancelling repeatedly orders in the book before comitting bond)
    penalty_expiration = models.DateTimeField(null=True,
                                              default=None,
                                              blank=True)

    # Platform rate
    platform_rating = models.PositiveIntegerField(null=True,
                                                  default=None,
                                                  blank=True)

    @receiver(post_save, sender=User)
    def create_user_profile(sender, instance, created, **kwargs):
        if created:
            Profile.objects.create(user=instance)

    @receiver(post_save, sender=User)
    def save_user_profile(sender, instance, **kwargs):
        instance.profile.save()

    @receiver(pre_delete, sender=User)
    def del_avatar_from_disk(sender, instance, **kwargs):
        try:
            avatar_file = Path(settings.AVATAR_ROOT +
                               instance.profile.avatar.url.split("/")[-1])
            avatar_file.unlink()
        except:
            pass

    def __str__(self):
        return self.user.username

    # to display avatars in admin panel
    def get_avatar(self):
        if not self.avatar:
            return settings.STATIC_ROOT + "unknown_avatar.png"
        return self.avatar.url

    # method to create a fake table field in read only mode
    def avatar_tag(self):
        return mark_safe('<img src="%s" width="50" height="50" />' %
                         self.get_avatar())


class MarketTick(models.Model):
    """
    Records tick by tick Non-KYC Bitcoin price.
    Data to be aggregated and offered via public API.

    It is checked against current CEX price for useful
    insight on the historical premium of Non-KYC BTC

    Price is set when taker bond is locked. Both
    maker and taker are commited with bonds (contract
    is finished and cancellation has a cost)
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    price = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=None,
        null=True,
        validators=[MinValueValidator(0)],
    )
    volume = models.DecimalField(
        max_digits=8,
        decimal_places=8,
        default=None,
        null=True,
        validators=[MinValueValidator(0)],
    )
    premium = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=None,
        null=True,
        validators=[MinValueValidator(-100),
                    MaxValueValidator(999)],
        blank=True,
    )
    currency = models.ForeignKey(Currency,
                                 null=True,
                                 on_delete=models.SET_NULL)
    timestamp = models.DateTimeField(default=timezone.now)

    # Relevant to keep record of the historical fee, so the insight on the premium can be better analyzed
    fee = models.DecimalField(
        max_digits=4,
        decimal_places=4,
        default=FEE,
        validators=[MinValueValidator(0),
                    MaxValueValidator(1)],
    )

    def log_a_tick(order):
        """
        Creates a new tick
        """

        if not order.taker_bond:
            return None

        elif order.taker_bond.status == LNPayment.Status.LOCKED:
            volume = order.last_satoshis / 100000000
            price = float(order.amount) / volume  # Amount Fiat / Amount BTC
            market_exchange_rate = float(order.currency.exchange_rate)
            premium = 100 * (price / market_exchange_rate - 1)

            tick = MarketTick.objects.create(price=price,
                                             volume=volume,
                                             premium=premium,
                                             currency=order.currency)

            tick.save()

    def __str__(self):
        return f"Tick: {str(self.id)[:8]}"

    class Meta:
        verbose_name = "Market tick"
        verbose_name_plural = "Market ticks"
# We use custom seeded UUID generation during testing
import uuid

from decimal import Decimal
from decouple import config
from django.conf import settings
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.utils import timezone
from api.tasks import send_notification

if config("TESTING", cast=bool, default=False):
    import random
    import string

    random.seed(1)
    chars = string.ascii_lowercase + string.digits

    def custom_uuid():
        return uuid.uuid5(uuid.NAMESPACE_DNS, "".join(random.choices(chars, k=20)))

else:
    custom_uuid = uuid.uuid4


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
        SUC = 14, "Successful trade"
        FAI = 15, "Failed lightning network routing"
        WFR = 16, "Wait for dispute resolution"
        MLD = 17, "Maker lost dispute"
        TLD = 18, "Taker lost dispute"

    class ExpiryReasons(models.IntegerChoices):
        NTAKEN = 0, "Expired not taken"
        NMBOND = 1, "Maker bond not locked"
        NESCRO = 2, "Escrow not locked"
        NINVOI = 3, "Invoice not submitted"
        NESINV = 4, "Neither escrow locked or invoice submitted"

    # order info
    reference = models.UUIDField(default=custom_uuid, editable=False)
    status = models.PositiveSmallIntegerField(
        choices=Status.choices, null=False, default=Status.WFB
    )
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    expiry_reason = models.PositiveSmallIntegerField(
        choices=ExpiryReasons.choices, null=True, blank=True, default=None
    )

    # order details
    type = models.PositiveSmallIntegerField(choices=Types.choices, null=False)
    currency = models.ForeignKey("api.Currency", null=True, on_delete=models.SET_NULL)
    amount = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    has_range = models.BooleanField(default=False, null=False, blank=False)
    min_amount = models.DecimalField(
        max_digits=18, decimal_places=8, null=True, blank=True
    )
    max_amount = models.DecimalField(
        max_digits=18, decimal_places=8, null=True, blank=True
    )
    payment_method = models.CharField(
        max_length=70, null=False, default="not specified", blank=True
    )
    # order pricing method. A explicit amount of sats, or a relative premium above/below market.
    is_explicit = models.BooleanField(default=False, null=False)
    # marked to market
    premium = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        null=True,
        validators=[MinValueValidator(Decimal(-100)), MaxValueValidator(Decimal(999))],
        blank=True,
    )
    # explicit
    satoshis = models.PositiveBigIntegerField(
        null=True,
        validators=[
            MinValueValidator(settings.MIN_TRADE),
            MaxValueValidator(settings.MAX_TRADE),
        ],
        blank=True,
    )
    # optionally makers can choose the public order duration length (seconds)
    public_duration = models.PositiveBigIntegerField(
        default=60 * 60 * settings.DEFAULT_PUBLIC_ORDER_DURATION - 1,
        null=False,
        validators=[
            MinValueValidator(
                60 * 60 * settings.MIN_PUBLIC_ORDER_DURATION
            ),  # Min is 10 minutes
            MaxValueValidator(
                60 * 60 * settings.MAX_PUBLIC_ORDER_DURATION
            ),  # Max is 24 Hours
        ],
        blank=False,
    )

    # optionally makers can choose the escrow lock / invoice submission step length (seconds)
    escrow_duration = models.PositiveBigIntegerField(
        default=60 * settings.INVOICE_AND_ESCROW_DURATION - 1,
        null=False,
        validators=[
            MinValueValidator(60 * 30),  # Min is 30 minutes
            MaxValueValidator(60 * 60 * 8),  # Max is 8 Hours
        ],
        blank=False,
    )

    # optionally makers can choose the fidelity bond size of the maker and taker (%)
    bond_size = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=settings.DEFAULT_BOND_SIZE,
        null=False,
        validators=[
            MinValueValidator(Decimal(settings.MIN_BOND_SIZE)),  # 2  %
            MaxValueValidator(Decimal(settings.MAX_BOND_SIZE)),  # 15 %
        ],
        blank=False,
    )

    # optionally makers can choose a coordinate for F2F
    latitude = models.DecimalField(
        max_digits=8,
        decimal_places=6,
        null=True,
        validators=[
            MinValueValidator(Decimal(-90)),
            MaxValueValidator(Decimal(90)),
        ],
        blank=True,
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        validators=[
            MinValueValidator(Decimal(-180)),
            MaxValueValidator(Decimal(180)),
        ],
        blank=True,
    )

    # optionally makers can set a password for the order to be taken
    password = models.TextField(
        max_length=2000,
        null=True,
        default=None,
        blank=True,
    )

    # optionally makers can set a description to give more details about the contract terms
    description = models.TextField(
        max_length=240,
        null=True,
        default=None,
        blank=True,
    )

    # how many sats at creation and at last check (relevant for marked to market)
    t0_satoshis = models.PositiveBigIntegerField(
        null=True,
        validators=[
            MinValueValidator(settings.MIN_TRADE),
            MaxValueValidator(settings.MAX_TRADE),
        ],
        blank=True,
    )  # sats at creation
    last_satoshis = models.PositiveBigIntegerField(
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(settings.MAX_TRADE * 2)],
        blank=True,
    )  # sats last time checked. Weird if 2* trade max...
    # timestamp of last_satoshis
    last_satoshis_time = models.DateTimeField(null=True, default=None, blank=True)
    # time the fiat exchange is confirmed and Sats released to buyer
    contract_finalization_time = models.DateTimeField(
        null=True, default=None, blank=True
    )
    # order participants
    maker = models.ForeignKey(
        User, related_name="maker", on_delete=models.SET_NULL, null=True, default=None
    )  # unique = True, a maker can only make one order
    taker = models.ForeignKey(
        User,
        related_name="taker",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )  # unique = True, a taker can only take one order

    # When collaborative cancel is needed and one partner has cancelled.
    maker_asked_cancel = models.BooleanField(default=False, null=False)
    taker_asked_cancel = models.BooleanField(default=False, null=False)

    is_fiat_sent = models.BooleanField(default=False, null=False)
    reverted_fiat_sent = models.BooleanField(default=False, null=False)

    # in dispute
    is_disputed = models.BooleanField(default=False, null=False)
    maker_statement = models.TextField(
        max_length=50_000, null=True, default=None, blank=True
    )
    taker_statement = models.TextField(
        max_length=50_000, null=True, default=None, blank=True
    )

    # LNpayments
    # Order collateral
    maker_bond = models.OneToOneField(
        "api.LNPayment",
        related_name="order_made",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )
    taker_bond = models.OneToOneField(
        "api.LNPayment",
        related_name="order_taken",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )
    trade_escrow = models.OneToOneField(
        "api.LNPayment",
        related_name="order_escrow",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )
    # is buyer payout a LN invoice (false) or on chain address (true)
    is_swap = models.BooleanField(default=False, null=False)
    # buyer payment LN invoice
    payout = models.OneToOneField(
        "api.LNPayment",
        related_name="order_paid_LN",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )
    # buyer payment address
    payout_tx = models.OneToOneField(
        "api.OnchainPayment",
        related_name="order_paid_TX",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )

    # coordinator proceeds (sats revenue for this order)
    proceeds = models.PositiveBigIntegerField(
        default=0,
        null=True,
        validators=[MinValueValidator(0)],
        blank=True,
    )

    # ratings
    maker_rated = models.BooleanField(default=False, null=False)
    taker_rated = models.BooleanField(default=False, null=False)
    maker_platform_rated = models.BooleanField(default=False, null=False)
    taker_platform_rated = models.BooleanField(default=False, null=False)

    logs = models.TextField(
        max_length=80_000,
        null=True,
        default="<thead><tr><b><th>Timestamp</th><th>Level</th><th>Event</th></b></tr></thead>",
        blank=True,
        editable=False,
    )

    def __str__(self):
        if self.has_range and self.amount is None:
            amt = str(float(self.min_amount)) + "-" + str(float(self.max_amount))
        else:
            amt = float(self.amount)
        return f"Order {self.id}: {self.Types(self.type).label} BTC for {amt} {self.currency}"

    def t_to_expire(self, status):
        t_to_expire = {
            0: config(
                "EXP_MAKER_BOND_INVOICE", cast=int, default=300
            ),  # 'Waiting for maker bond'
            1: self.public_duration,  # 'Public'
            2: 0,  # 'Deleted'
            3: config(
                "EXP_TAKER_BOND_INVOICE", cast=int, default=150
            ),  # 'Waiting for taker bond'
            4: 0,  # 'Cancelled'
            5: 0,  # 'Expired'
            6: int(
                self.escrow_duration
            ),  # 'Waiting for trade collateral and buyer invoice'
            7: int(self.escrow_duration),  # 'Waiting only for seller trade collateral'
            8: int(self.escrow_duration),  # 'Waiting only for buyer invoice'
            9: 60
            * 60
            * settings.FIAT_EXCHANGE_DURATION,  # 'Sending fiat - In chatroom'
            10: 60 * 60 * settings.FIAT_EXCHANGE_DURATION,  # 'Fiat sent - In chatroom'
            11: 1 * 24 * 60 * 60,  # 'In dispute'
            12: 0,  # 'Collaboratively cancelled'
            13: 100 * 24 * 60 * 60,  # 'Sending satoshis to buyer'
            14: 100 * 24 * 60 * 60,  # 'Successful trade'
            15: 100 * 24 * 60 * 60,  # 'Failed lightning network routing'
            16: 100 * 24 * 60 * 60,  # 'Wait for dispute resolution'
            17: 100 * 24 * 60 * 60,  # 'Maker lost dispute'
            18: 100 * 24 * 60 * 60,  # 'Taker lost dispute'
        }

        return t_to_expire[status]

    def log(self, event="empty event", level="INFO"):
        """
        log() adds a new line to the Order.log field. We wrap it all in a
        try/catch block since this function is called inside the main request->response
        pipe and any error here would lead to a 500 response.
        """
        if config("DISABLE_ORDER_LOGS", cast=bool, default=True):
            return
        try:
            timestamp = timezone.now().replace(microsecond=0).isoformat()
            level_in_tag = "" if level == "INFO" else "<b>"
            level_out_tag = "" if level == "INFO" else "</b>"
            self.logs = (
                self.logs
                + f"<tr><td>{timestamp}</td><td>{level_in_tag}{level}{level_out_tag}</td><td>{event}</td></tr>"
            )
            self.save(update_fields=["logs"])
        except Exception:
            pass

    def update_status(self, new_status):
        old_status = self.status
        self.status = new_status
        self.save(update_fields=["status"])
        self.log(
            f"Order state went from {old_status}: <i>{Order.Status(old_status).label}</i> to {new_status}: <i>{Order.Status(new_status).label}</i>"
        )
        if new_status == Order.Status.FAI:
            send_notification.delay(order_id=self.id, message="lightning_failed")


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
        except Exception:
            pass

from decouple import config
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.template.defaultfilters import truncatechars
from django.utils import timezone

from control.models import BalanceLog

MIN_TRADE = int(config("MIN_TRADE"))
MAX_TRADE = int(config("MAX_TRADE"))
MIN_SWAP_AMOUNT = int(config("MIN_SWAP_AMOUNT"))
FEE = float(config("FEE"))
DEFAULT_BOND_SIZE = float(config("DEFAULT_BOND_SIZE"))


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

    class FailureReason(models.IntegerChoices):
        NOTYETF = 0, "Payment isn't failed (yet)"
        TIMEOUT = (
            1,
            "There are more routes to try, but the payment timeout was exceeded.",
        )
        NOROUTE = (
            2,
            "All possible routes were tried and failed permanently. Or there were no routes to the destination at all.",
        )
        NONRECO = 3, "A non-recoverable error has occurred."
        INCORRE = (
            4,
            "Payment details are incorrect (unknown hash, invalid amount or invalid final CLTV delta).",
        )
        NOBALAN = 5, "Insufficient unlocked balance in RoboSats' node."

    # payment use details
    type = models.PositiveSmallIntegerField(
        choices=Types.choices, null=False, default=Types.HOLD
    )
    concept = models.PositiveSmallIntegerField(
        choices=Concepts.choices, null=False, default=Concepts.MAKEBOND
    )
    status = models.PositiveSmallIntegerField(
        choices=Status.choices, null=False, default=Status.INVGEN
    )
    failure_reason = models.PositiveSmallIntegerField(
        choices=FailureReason.choices, null=True, default=None
    )

    # payment info
    payment_hash = models.CharField(
        max_length=100, unique=True, default=None, blank=True, primary_key=True
    )
    invoice = models.CharField(
        max_length=1200, unique=True, null=True, default=None, blank=True
    )  # Some invoices with lots of routing hints might be long
    preimage = models.CharField(
        max_length=64, unique=True, null=True, default=None, blank=True
    )
    description = models.CharField(
        max_length=500, unique=False, null=True, default=None, blank=True
    )
    num_satoshis = models.PositiveBigIntegerField(
        validators=[
            MinValueValidator(100),
            MaxValueValidator(1.5 * MAX_TRADE),
        ]
    )
    # Fee in sats with mSats decimals fee_msat
    fee = models.DecimalField(
        max_digits=10, decimal_places=3, default=0, null=False, blank=False
    )
    created_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    cltv_expiry = models.PositiveSmallIntegerField(null=True, default=None, blank=True)
    expiry_height = models.PositiveBigIntegerField(null=True, default=None, blank=True)

    # routing
    routing_attempts = models.PositiveSmallIntegerField(null=False, default=0)
    last_routing_time = models.DateTimeField(null=True, default=None, blank=True)
    in_flight = models.BooleanField(default=False, null=False, blank=False)
    # involved parties
    sender = models.ForeignKey(
        User, related_name="sender", on_delete=models.SET_NULL, null=True, default=None
    )
    receiver = models.ForeignKey(
        User,
        related_name="receiver",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
    )

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


class OnchainPayment(models.Model):
    class Concepts(models.IntegerChoices):
        PAYBUYER = 3, "Payment to buyer"

    class Status(models.IntegerChoices):
        CREAT = 0, "Created"  # User was given platform fees and suggested mining fees
        VALID = 1, "Valid"  # Valid onchain address submitted
        MEMPO = 2, "In mempool"  # Tx is sent to mempool
        CONFI = 3, "Confirmed"  # Tx is confirme +2 blocks
        CANCE = 4, "Cancelled"  # Cancelled tx

    def get_balance():
        balance = BalanceLog.objects.create()
        return balance.time

    # payment use details
    concept = models.PositiveSmallIntegerField(
        choices=Concepts.choices, null=False, default=Concepts.PAYBUYER
    )
    status = models.PositiveSmallIntegerField(
        choices=Status.choices, null=False, default=Status.CREAT
    )

    # payment info
    address = models.CharField(
        max_length=100, unique=False, default=None, null=True, blank=True
    )

    txid = models.CharField(
        max_length=64, unique=True, null=True, default=None, blank=True
    )

    num_satoshis = models.PositiveBigIntegerField(
        null=True,
        validators=[
            MinValueValidator(0.5 * MIN_SWAP_AMOUNT),
            MaxValueValidator(1.5 * MAX_TRADE),
        ],
    )
    sent_satoshis = models.PositiveBigIntegerField(
        null=True,
        validators=[
            MinValueValidator(0.5 * MIN_SWAP_AMOUNT),
            MaxValueValidator(1.5 * MAX_TRADE),
        ],
    )
    # fee in sats/vbyte with mSats decimals fee_msat
    suggested_mining_fee_rate = models.DecimalField(
        max_digits=6, decimal_places=3, default=1.05, null=False, blank=False
    )
    mining_fee_rate = models.DecimalField(
        max_digits=6, decimal_places=3, default=1.05, null=False, blank=False
    )
    mining_fee_sats = models.PositiveBigIntegerField(default=0, null=False, blank=False)

    # platform onchain/channels balance at creation, swap fee rate as percent of total volume
    balance = models.ForeignKey(
        BalanceLog,
        related_name="balance",
        on_delete=models.SET_NULL,
        null=True,
        default=get_balance,
    )

    swap_fee_rate = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=float(config("MIN_SWAP_FEE")) * 100,
        null=False,
        blank=False,
    )

    created_at = models.DateTimeField(default=timezone.now)

    # involved parties
    receiver = models.ForeignKey(
        User,
        related_name="tx_receiver",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
    )

    def __str__(self):
        return f"TX-{str(self.id)}: {self.Concepts(self.concept).label} - {self.Status(self.status).label}"

    class Meta:
        verbose_name = "Onchain payment"
        verbose_name_plural = "Onchain payments"

    @property
    def hash(self):
        # Display txid as 'hash' truncated
        return truncatechars(self.txid, 10)

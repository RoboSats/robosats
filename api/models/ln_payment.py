from decouple import config
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.template.defaultfilters import truncatechars


class LNPayment(models.Model):
    class Types(models.IntegerChoices):
        NORM = 0, "Regular invoice"
        HOLD = 1, "hold invoice"
        KEYS = 2, "Keysend"

    class Concepts(models.IntegerChoices):
        MAKEBOND = 0, "Maker bond"
        TAKEBOND = 1, "Taker bond"
        TRESCROW = 2, "Trade escrow"
        PAYBUYER = 3, "Payment to buyer"
        WITHREWA = 4, "Withdraw rewards"
        DEVDONAT = 5, "Devfund donation"

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
            MaxValueValidator(1.5 * config("MAX_TRADE", cast=int, default=1_000_000)),
        ]
    )
    # Routing budget in PPM
    routing_budget_ppm = models.PositiveBigIntegerField(
        default=0,
        null=False,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100_000),
        ],
    )
    # Routing budget in Sats. Only for reporting summaries.
    routing_budget_sats = models.DecimalField(
        max_digits=10, decimal_places=3, default=0, null=False, blank=False
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
    order_donated = models.ForeignKey(
        "api.Order",
        related_name="order_donated",
        null=True,
        on_delete=models.SET_NULL,
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

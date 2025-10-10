from decimal import Decimal
from django.conf import settings
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.template.defaultfilters import truncatechars
from django.utils import timezone

from control.models import BalanceLog


class OnchainPayment(models.Model):
    class Concepts(models.IntegerChoices):
        PAYBUYER = 3, "Payment to buyer"

    class Status(models.IntegerChoices):
        CREAT = 0, "Created"  # User was given platform fees and suggested mining fees
        VALID = 1, "Valid"  # Valid onchain address and fee submitted
        MEMPO = 2, "In mempool"  # Tx is sent to mempool
        CONFI = 3, "Confirmed"  # Tx is confirmed +2 blocks
        CANCE = 4, "Cancelled"  # Cancelled tx
        QUEUE = 5, "Queued"  # Payment is queued to be sent out

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

    broadcasted = models.BooleanField(default=False, null=False, blank=False)

    # payment info
    address = models.CharField(
        max_length=100, unique=False, default=None, null=True, blank=True
    )

    txid = models.CharField(
        max_length=64, unique=True, null=True, default=None, blank=True
    )

    num_satoshis = models.PositiveBigIntegerField(
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(1.5 * settings.MAX_TRADE)],
    )
    sent_satoshis = models.PositiveBigIntegerField(
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(1.5 * settings.MAX_TRADE)],
    )
    # fee in sats/vbyte with mSats decimals fee_msat
    suggested_mining_fee_rate = models.DecimalField(
        max_digits=6,
        decimal_places=3,
        default=2.05,
        null=False,
        blank=False,
        validators=[MinValueValidator(Decimal(1)), MaxValueValidator(Decimal(999))],
    )
    mining_fee_rate = models.DecimalField(
        max_digits=6,
        decimal_places=3,
        default=2.05,
        null=False,
        blank=False,
        validators=[MinValueValidator(Decimal(1)), MaxValueValidator(Decimal(999))],
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
        default=1,
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

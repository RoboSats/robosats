import uuid

from decouple import config
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from api.models.order import Currency
from api.models.payments import LNPayment

FEE = float(config("FEE"))


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
        validators=[MinValueValidator(-100), MaxValueValidator(999)],
        blank=True,
    )
    currency = models.ForeignKey(Currency, null=True, on_delete=models.SET_NULL)
    timestamp = models.DateTimeField(default=timezone.now)

    # Relevant to keep record of the historical fee, so the insight on the premium can be better analyzed
    fee = models.DecimalField(
        max_digits=4,
        decimal_places=4,
        default=FEE,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
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

            tick = MarketTick.objects.create(
                price=price, volume=volume, premium=premium, currency=order.currency
            )

            tick.save()

    def __str__(self):
        return f"Tick: {str(self.id)[:8]}"

    class Meta:
        verbose_name = "Market tick"
        verbose_name_plural = "Market ticks"

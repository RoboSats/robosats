from django.core.validators import MaxValueValidator, MinValueValidator
from django.contrib.auth.models import User
from django.db import models
from django.conf import settings


class TakeOrder(models.Model):
    amount = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    order = models.ForeignKey(
        "api.Order",
        related_name="order",
        on_delete=models.CASCADE,
        null=False,
        default=None,
        blank=False,
    )
    taker = models.ForeignKey(
        User,
        related_name="pretaker",
        on_delete=models.CASCADE,
        null=False,
        default=None,
        blank=False,
    )
    expires_at = models.DateTimeField()
    taker_bond = models.OneToOneField(
        "api.LNPayment",
        related_name="take_order",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )
    last_satoshis = models.PositiveBigIntegerField(
        null=True,
        default=None,
        validators=[MinValueValidator(0), MaxValueValidator(settings.MAX_TRADE * 2)],
        blank=True,
    )
    # timestamp of last_satoshis
    last_satoshis_time = models.DateTimeField(null=True, default=None, blank=True)

    def __str__(self):
        return f"Order {self.order.id} taken by Robot({self.taker.robot.id},{self.taker.username}) for {self.amount} fiat units"

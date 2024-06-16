import json

from decimal import Decimal
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Currency(models.Model):
    with open("frontend/static/assets/currencies.json") as f:
        currency_dict = json.load(f)
    currency_choices = [(int(val), label) for val, label in list(currency_dict.items())]

    currency = models.PositiveSmallIntegerField(
        choices=currency_choices, null=False, unique=True
    )
    exchange_rate = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        default=None,
        null=True,
        validators=[MinValueValidator(Decimal(0))],
    )
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        # returns currency label ( 3 letters code)
        return self.currency_dict[str(self.currency)]

    class Meta:
        verbose_name = "Cached market currency"
        verbose_name_plural = "Currencies"

from decimal import Decimal
from django.utils import timezone

from api.models import Currency


class PriceUtil:
    """
    Utility for manipulating exchange rates in tests.

    - Reads current exchange rate
    - Updates exchange rate
    - Restores original rate
    """

    def __init__(self, currency_code=1):
        self.currency_code = currency_code
        self.currency = Currency.objects.get(id=currency_code)

        # Save original state (important!)
        self.original_rate = self.currency.exchange_rate
        self.original_timestamp = self.currency.timestamp

    # -------------------------
    # Exchange rate operations
    # -------------------------

    def get_rate(self) -> Decimal:
        """Return current exchange rate"""
        self.currency.refresh_from_db()
        return self.currency.exchange_rate

    def set_rate(self, rate) -> Decimal:
        """Set exchange rate to an exact value"""
        self.currency.exchange_rate = Decimal(rate)
        self.currency.timestamp = timezone.now()
        self.currency.save(update_fields=["exchange_rate", "timestamp"])
        return self.currency.exchange_rate

    def restore(self) -> Decimal:
        """Restore exchange rate to original value"""
        self.currency.exchange_rate = self.original_rate
        self.currency.timestamp = timezone.now()
        self.currency.save(update_fields=["exchange_rate", "timestamp"])
        return self.currency.exchange_rate


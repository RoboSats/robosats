from django.db import models
from django.utils import timezone

class AccountingDay(models.Model):
    day = models.DateTimeField(primary_key=True, auto_now=False, auto_now_add=False)

    # Every field is denominated in Sats with (3 decimals for millisats)
    # Total volume contracted
    contracted = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Net volume of trading invoices settled (excludes disputes)
    net_settled = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Net volume of trading invoices paid (excludes rewards and disputes)
    net_paid = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Sum of net settled and net paid
    net_balance = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Total volume of invoices settled
    total_inflow = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Total volume of invoices paid
    total_outflow = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Total cost in routing fees
    total_routing_fees = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Total inflows minus outflows and routing fees
    total_cashflow = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Balance on pending rewards (referral rewards and slashed bonds)
    pending_rewards = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Balance on pending disputes (not resolved yet)
    pending_disputes = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Balance on pending rewards and resolved disputes
    pending_claimable = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)


class AccountingMonth(models.Model):
    month = models.DateTimeField(primary_key=True, auto_now=False, auto_now_add=False)

    # Every field is denominated in Sats with (3 decimals for millisats)
    # Total volume contracted
    contracted = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Net volume of trading invoices settled (excludes disputes)
    net_settled = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Net volume of trading invoices paid (excludes rewards and disputes)
    net_paid = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Sum of net settled and net paid
    net_balance = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Total volume of invoices settled
    total_inflow = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Total volume of invoices paid
    total_outflow = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Total cost in routing fees
    total_routing_fees = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Total inflows minus outflows and routing fees
    total_cashflow = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Balance on pending rewards (referral rewards and slashed bonds)
    pending_rewards = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Balance on pending disputes (not resolved yet)
    pending_disputes = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)
    # Balance on pending rewards and resolved disputes
    pending_claimable = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=False, blank=False)

class Dispute(models.Model):
    pass
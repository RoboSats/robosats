from django.contrib import admin
from control.models import AccountingDay, AccountingMonth, Dispute
# Register your models here.

@admin.register(AccountingDay)
class AccountingDayAdmin(admin.ModelAdmin):
    list_display = (
        "day",
        "contracted",
        "net_settled",
        "net_paid",
        "net_balance",
        "total_inflow",
        "total_outflow",
        "total_routing_fees",
        "total_cashflow",
        "pending_rewards",
        "pending_disputes",
        "pending_claimable",
    )
    change_links = ["day"]
    search_fields = ["day"]

@admin.register(AccountingMonth)
class AccountingMonthAdmin(admin.ModelAdmin):
    list_display = (
        "month",
        "contracted",
        "net_settled",
        "net_paid",
        "net_balance",
        "total_inflow",
        "total_outflow",
        "total_routing_fees",
        "total_cashflow",
        "pending_rewards",
        "pending_disputes",
        "pending_claimable",
    )
    change_links = ["month"]
    search_fields = ["month"]
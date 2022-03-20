from django.contrib import admin
from control.models import AccountingDay, AccountingMonth, Dispute
from import_export.admin import ImportExportModelAdmin

# Register your models here.

@admin.register(AccountingDay)
class AccountingDayAdmin(ImportExportModelAdmin):

    list_display = (
        "day",
        "contracted",
        "num_contracts",
        "net_settled",
        "net_paid",
        "net_balance",
        "inflow",
        "outflow",
        "routing_fees",
        "cashflow",
        "outstanding_earned_rewards",
        "outstanding_pending_disputes",
        "lifetime_rewards_claimed",
        "outstanding_earned_rewards",
        "pending_disputes",
        "rewards_claimed",
    )
    change_links = ["day"]
    search_fields = ["day"]

@admin.register(AccountingMonth)
class AccountingMonthAdmin(ImportExportModelAdmin):

    list_display = (
        "month",
        "contracted",
        "num_contracts",
        "net_settled",
        "net_paid",
        "net_balance",
        "inflow",
        "outflow",
        "routing_fees",
        "cashflow",
        "outstanding_earned_rewards",
        "outstanding_pending_disputes",
        "lifetime_rewards_claimed",
        "outstanding_earned_rewards",
        "pending_disputes",
        "rewards_claimed",
    )
    change_links = ["month"]
    search_fields = ["month"]
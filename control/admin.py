from django.contrib import admin
from control.models import AccountingDay, BalanceLog
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
        "mining_fees",
        "cashflow",
        "outstanding_earned_rewards",
        "outstanding_pending_disputes",
        "lifetime_rewards_claimed",
        "earned_rewards",
        "disputes",
        "rewards_claimed",
    )
    change_links = ["day"]
    search_fields = ["day"]


@admin.register(BalanceLog)
class BalanceLogAdmin(ImportExportModelAdmin):

    list_display = (
        "time",
        "total",
        "onchain_fraction",
        "onchain_total",
        "onchain_confirmed",
        "onchain_unconfirmed",
        "ln_local",
        "ln_remote",
        "ln_local_unsettled",
        "ln_remote_unsettled",
    )
    readonly_fields = [
        "time",
        "total",
        "onchain_fraction",
        "onchain_total",
        "onchain_confirmed",
        "onchain_unconfirmed",
        "ln_local",
        "ln_remote",
        "ln_local_unsettled",
        "ln_remote_unsettled",
    ]
    change_links = ["time"]
    search_fields = ["time"]

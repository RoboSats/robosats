from statistics import median

from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group, User
from django.utils.html import format_html
from django_admin_relation_links import AdminChangeLinksMixin
from rest_framework.authtoken.admin import TokenAdmin
from rest_framework.authtoken.models import TokenProxy

from api.logics import Logics
from api.models import Currency, LNPayment, MarketTick, OnchainPayment, Order, Robot
from api.utils import objects_to_hyperlinks
from api.tasks import send_notification

admin.site.unregister(Group)
admin.site.unregister(User)
admin.site.unregister(TokenProxy)


class RobotInline(admin.StackedInline):
    model = Robot
    can_delete = False
    show_change_link = True


@admin.register(User)
class EUserAdmin(AdminChangeLinksMixin, UserAdmin):
    inlines = [RobotInline]
    list_display = (
        "id",
        "robot_link",
        "username",
        "last_login",
        "date_joined",
        "is_staff",
    )
    list_display_links = ("id", "username")
    change_links = ("robot",)
    ordering = ("-id",)


# extended tokens with raw id fields
@admin.register(TokenProxy)
class ETokenAdmin(AdminChangeLinksMixin, TokenAdmin):
    raw_id_fields = ["user"]
    list_display = (
        "key",
        "user_link",
    )
    list_display_links = ("key",)
    change_links = ("user",)


class LNPaymentInline(admin.StackedInline):
    model = LNPayment
    can_delete = True
    fields = ("num_satoshis", "status", "routing_budget_sats", "description")
    readonly_fields = ("num_satoshis", "status", "routing_budget_sats", "description")
    show_change_link = True
    show_full_result_count = True
    extra = 0


@admin.register(Order)
class OrderAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
    inlines = [LNPaymentInline]
    list_display = (
        "id",
        "type",
        "maker_link",
        "taker_link",
        "status",
        "amt",
        "currency_link",
        "t0_satoshis",
        "is_disputed",
        "is_fiat_sent",
        "created_at",
        "expires_at",
        "payout_tx_link",
        "payout_link",
        "maker_bond_link",
        "taker_bond_link",
        "trade_escrow_link",
    )
    list_display_links = ("id", "type")
    change_links = (
        "maker",
        "taker",
        "currency",
        "payout_tx",
        "payout",
        "maker_bond",
        "taker_bond",
        "trade_escrow",
    )
    raw_id_fields = (
        "maker",
        "taker",
        "payout_tx",
        "payout",
        "maker_bond",
        "taker_bond",
        "trade_escrow",
    )
    list_filter = (
        "is_disputed",
        "is_fiat_sent",
        "is_swap",
        "type",
        "currency",
        "status",
    )
    search_fields = [
        "id",
        "reference",
        "maker__username",
        "taker__username",
        "amount",
        "payout__payment_hash",
        "maker_bond__payment_hash",
        "taker_bond__payment_hash",
        "trade_escrow__payment_hash",
        "payout_tx__txid",
        "payout_tx__address",
        "min_amount",
        "max_amount",
    ]
    readonly_fields = ("reference", "_logs")

    def _logs(self, obj):
        if not obj.logs:
            return format_html("<b>No logs were recorded</b>")
        with_hyperlinks = objects_to_hyperlinks(obj.logs)
        try:
            html_logs = format_html(
                f'<table style="width: 100%">{with_hyperlinks}</table>'
            )
        except Exception as e:
            html_logs = f"An error occurred while formatting the parsed logs as HTML. Exception {e}"
        return html_logs

    actions = [
        "cancel_public_order",
        "maker_wins",
        "taker_wins",
        "return_everything",
        "successful_trade",
        "compute_median_trade_time",
    ]

    @admin.action(description="Close public order")
    def cancel_public_order(self, request, queryset):
        """
        Closes an existing Public/Paused order.
        """
        for order in queryset:
            if order.status in [Order.Status.PUB, Order.Status.PAU]:
                if Logics.return_bond(order.maker_bond):
                    order.update_status(Order.Status.UCA)
                    self.message_user(
                        request,
                        f"Order {order.id} successfully closed",
                        messages.SUCCESS,
                    )
                    send_notification.delay(
                        order_id=order.id, message="coordinator_cancelled"
                    )
                else:
                    self.message_user(
                        request,
                        f"Could not unlock bond of {order.id}",
                        messages.ERROR,
                    )

            else:
                self.message_user(
                    request,
                    f"Order {order.id} is not public or paused",
                    messages.ERROR,
                )

    @admin.action(description="Solve dispute: maker wins")
    def maker_wins(self, request, queryset):
        """
        Solves a dispute on favor of the maker.
        Adds Sats to compensations (earned_rewards) of the maker robot.
        """
        for order in queryset:
            if (
                order.status in [Order.Status.DIS, Order.Status.WFR]
                and order.is_disputed
            ):
                own_bond_sats = order.maker_bond.num_satoshis
                if Logics.is_buyer(order, order.maker):
                    if order.is_swap:
                        trade_sats = order.payout_tx.num_satoshis
                    else:
                        trade_sats = order.payout.num_satoshis
                else:
                    trade_sats = order.trade_escrow.num_satoshis

                order.maker.robot.earned_rewards = own_bond_sats + trade_sats
                order.maker.robot.save(update_fields=["earned_rewards"])
                order.update_status(Order.Status.TLD)

                self.message_user(
                    request,
                    f"Dispute of order {order.id} solved successfully on favor of the maker",
                    messages.SUCCESS,
                )
                send_notification.delay(order_id=order.id, message="dispute_closed")

            else:
                self.message_user(
                    request,
                    f"Order {order.id} is not in a disputed state",
                    messages.ERROR,
                )

    @admin.action(description="Solve dispute: taker wins")
    def taker_wins(self, request, queryset):
        """
        Solves a dispute on favor of the taker.
        Adds Sats to compensations (earned_rewards) of the taker robot.
        """
        for order in queryset:
            if (
                order.status in [Order.Status.DIS, Order.Status.WFR]
                and order.is_disputed
            ):
                own_bond_sats = order.maker_bond.num_satoshis
                if Logics.is_buyer(order, order.taker):
                    if order.is_swap:
                        trade_sats = order.payout_tx.num_satoshis
                    else:
                        trade_sats = order.payout.num_satoshis
                else:
                    trade_sats = order.trade_escrow.num_satoshis

                order.taker.robot.earned_rewards = own_bond_sats + trade_sats
                order.taker.robot.save(update_fields=["earned_rewards"])

                order.update_status(Order.Status.MLD)

                self.message_user(
                    request,
                    f"Dispute of order {order.id} solved successfully on favor of the taker",
                    messages.SUCCESS,
                )
                send_notification.delay(order_id=order.id, message="dispute_closed")

            else:
                self.message_user(
                    request,
                    f"Order {order.id} is not in a disputed state",
                    messages.ERROR,
                )

    @admin.action(description="Solve dispute: return everything")
    def return_everything(self, request, queryset):
        """
        Solves a dispute by pushing back every bond and escrow to their sender.
        """
        for order in queryset:
            if (
                order.status in [Order.Status.DIS, Order.Status.WFR]
                and order.is_disputed
            ):
                order.maker_bond.sender.robot.earned_rewards += (
                    order.maker_bond.num_satoshis
                )
                order.maker_bond.sender.robot.save(update_fields=["earned_rewards"])

                order.taker_bond.sender.robot.earned_rewards += (
                    order.taker_bond.num_satoshis
                )

                order.taker_bond.sender.robot.save(update_fields=["earned_rewards"])
                order.trade_escrow.sender.robot.earned_rewards += (
                    order.trade_escrow.num_satoshis
                )
                order.trade_escrow.sender.robot.save(update_fields=["earned_rewards"])

                order.update_status(Order.Status.CCA)

                self.message_user(
                    request,
                    f"Dispute of order {order.id} solved successfully, everything returned as compensations",
                    messages.SUCCESS,
                )

            else:
                self.message_user(
                    request,
                    f"Order {order.id} is not in a disputed state",
                    messages.ERROR,
                )

    @admin.action(description="Solve dispute: successful trade")
    def successful_trade(self, request, queryset):
        """
        Solves a dispute as if the trade had been successful, i.e.,
        returns both bonds (added as compensations) and triggers the payout.
        """
        for order in queryset:
            if (
                order.status in [Order.Status.DIS, Order.Status.WFR]
                and order.is_disputed
            ):
                order.maker.robot.earned_rewards = order.maker_bond.num_satoshis
                order.maker.robot.save(update_fields=["earned_rewards"])
                order.taker.robot.earned_rewards = order.taker_bond.num_satoshis
                order.taker.robot.save(update_fields=["earned_rewards"])

                if order.is_swap:
                    order.payout_tx.status = OnchainPayment.Status.VALID
                    order.payout_tx.save(update_fields=["status"])
                    order.update_status(Order.Status.SUC)
                else:
                    order.update_status(Order.Status.PAY)

                Logics.pay_buyer(order)

                self.message_user(
                    request,
                    f"Dispute of order {order.id} solved as successful trade",
                    messages.SUCCESS,
                )

            else:
                self.message_user(
                    request,
                    f"Order {order.id} is not in a disputed state",
                    messages.ERROR,
                )

    @admin.action(description="Compute median trade completion time")
    def compute_median_trade_time(self, request, queryset):
        """
        Computes the median time from an order taken to finishing
        successfully for the set of selected orders.
        """
        times = []
        for order in queryset:
            if order.contract_finalization_time:
                timedelta = order.contract_finalization_time - order.last_satoshis_time
                times.append(timedelta.total_seconds())

        if len(times) > 0:
            median_time_secs = median(times)
            mins = int(median_time_secs / 60)
            secs = int(median_time_secs - mins * 60)
            self.message_user(
                request,
                f"The median time to complete the trades is {mins}m {secs}s",
                messages.SUCCESS,
            )
        else:
            self.message_user(
                request,
                "There is no successfully finished orders in the selection",
                messages.ERROR,
            )

    def amt(self, obj):
        if obj.has_range and obj.amount is None:
            return str(float(obj.min_amount)) + "-" + str(float(obj.max_amount))
        else:
            return float(obj.amount)


class OrderInline(admin.StackedInline):
    model = Order
    can_delete = False
    show_change_link = True
    extra = 0
    fields = (
        "id",
        "type",
        "maker",
        "taker",
        "status",
        "amount",
        "currency",
        "last_satoshis",
        "is_disputed",
        "is_fiat_sent",
        "created_at",
        "expires_at",
        "payout_tx",
        "payout",
        "maker_bond",
        "taker_bond",
        "trade_escrow",
    )
    readonly_fields = fields


class PayoutOrderInline(OrderInline):
    verbose_name = "Order Paid"
    fk_name = "payout"


class MakerBondOrderInline(OrderInline):
    verbose_name = "Order Made"
    fk_name = "maker_bond"


class TakerBondOrderInline(OrderInline):
    verbose_name = "Order Taken"
    fk_name = "taker_bond"


class EscrowOrderInline(OrderInline):
    verbose_name = "Order Escrow"
    fk_name = "trade_escrow"


@admin.register(LNPayment)
class LNPaymentAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
    inlines = [
        PayoutOrderInline,
        MakerBondOrderInline,
        TakerBondOrderInline,
        EscrowOrderInline,
    ]
    list_display = (
        "hash",
        "concept",
        "status",
        "num_satoshis",
        "fee",
        "type",
        "expires_at",
        "expiry_height",
        "sender_link",
        "receiver_link",
        "order_made_link",
        "order_taken_link",
        "order_escrow_link",
        "order_paid_LN_link",
        "order_donated_link",
    )
    list_display_links = ("hash", "concept")
    change_links = (
        "sender",
        "receiver",
        "order_made",
        "order_taken",
        "order_escrow",
        "order_paid_LN",
        "order_donated",
    )
    raw_id_fields = (
        "receiver",
        "sender",
        "order_donated",
    )
    list_filter = ("type", "concept", "status")
    ordering = ("-expires_at",)
    search_fields = [
        "payment_hash",
        "preimage",
        "num_satoshis",
        "sender__username",
        "receiver__username",
        "description",
    ]


@admin.register(OnchainPayment)
class OnchainPaymentAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "address",
        "concept",
        "status",
        "broadcasted",
        "num_satoshis",
        "hash",
        "swap_fee_rate",
        "mining_fee_sats",
        "balance_link",
        "order_paid_TX_link",
    )
    change_links = (
        "balance",
        "order_paid_TX",
    )
    raw_id_fields = (
        "receiver",
        "balance",
    )
    list_display_links = ("id", "address", "concept")
    list_filter = ("concept", "status")
    search_fields = ["address", "num_satoshis", "receiver__username", "txid"]


@admin.register(Robot)
class UserRobotAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "user_link",
        "telegram_enabled",
        "webhook_enabled",
        "total_contracts",
        "earned_rewards",
        "claimed_rewards",
        "platform_rating",
        "num_disputes",
        "lost_disputes",
    )
    raw_id_fields = ("user",)
    list_editable = ["earned_rewards"]
    list_display_links = ["id"]
    change_links = ["user"]
    search_fields = ["user__username", "id"]
    readonly_fields = ("hash_id", "public_key", "encrypted_private_key")


@admin.register(Currency)
class CurrencieAdmin(admin.ModelAdmin):
    list_display = ("id", "currency", "exchange_rate", "timestamp")
    list_display_links = ("id", "currency")
    readonly_fields = ("currency", "exchange_rate", "timestamp")
    ordering = ("id",)


@admin.register(MarketTick)
class MarketTickAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "price", "volume", "premium", "currency", "fee")
    readonly_fields = ("timestamp", "price", "volume", "premium", "currency", "fee")
    list_filter = ["currency"]
    ordering = ("-timestamp",)

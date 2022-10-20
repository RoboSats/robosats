from django.contrib import admin, messages
from django_admin_relation_links import AdminChangeLinksMixin
from django.contrib.auth.models import Group, User
from django.contrib.auth.admin import UserAdmin
from api.models import OnchainPayment, Order, LNPayment, Profile, MarketTick, Currency
from api.logics import Logics
from statistics import median

admin.site.unregister(Group)
admin.site.unregister(User)


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    fields = ("avatar_tag",)
    readonly_fields = ["avatar_tag"]
    show_change_link = True


# extended users with avatars
@admin.register(User)
class EUserAdmin(AdminChangeLinksMixin, UserAdmin):
    inlines = [ProfileInline]
    list_display = (
        "avatar_tag",
        "id",
        "profile_link",
        "username",
        "last_login",
        "date_joined",
        "is_staff",
    )
    list_display_links = ("id", "username")
    change_links = ("profile",)
    ordering = ("-id",)

    def avatar_tag(self, obj):
        return obj.profile.avatar_tag()


@admin.register(Order)
class OrderAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
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
    search_fields = ["id", "amount", "min_amount", "max_amount"]

    actions = [
        "maker_wins",
        "taker_wins",
        "return_everything",
        "compite_median_trade_time",
    ]

    @admin.action(description="Solve dispute: maker wins")
    def maker_wins(self, request, queryset):
        """
        Solves a dispute on favor of the maker.
        Adds Sats to compensations (earned_rewards) of the maker profile.
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

                order.status = Order.Status.TLD
                order.maker.profile.earned_rewards = own_bond_sats + trade_sats
                order.maker.profile.save()
                order.save()
                self.message_user(
                    request,
                    f"Dispute of order {order.id} solved successfully on favor of the maker",
                    messages.SUCCESS,
                )

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
        Adds Sats to compensations (earned_rewards) of the taker profile.
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

                order.status = Order.Status.MLD
                order.taker.profile.earned_rewards = own_bond_sats + trade_sats
                order.taker.profile.save()
                order.save()
                self.message_user(
                    request,
                    f"Dispute of order {order.id} solved successfully on favor of the taker",
                    messages.SUCCESS,
                )

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
                order.maker_bond.sender.profile.earned_rewards += (
                    order.maker_bond.num_satoshis
                )
                order.maker_bond.sender.profile.save()
                order.taker_bond.sender.profile.earned_rewards += (
                    order.taker_bond.num_satoshis
                )
                order.taker_bond.sender.profile.save()
                order.trade_escrow.sender.profile.earned_rewards += (
                    order.trade_escrow.num_satoshis
                )
                order.trade_escrow.sender.profile.save()
                order.status = Order.Status.CCA
                order.save()
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

    @admin.action(description="Compute median trade completion time")
    def compite_median_trade_time(self, request, queryset):
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
        if obj.has_range and obj.amount == None:
            return str(float(obj.min_amount)) + "-" + str(float(obj.max_amount))
        else:
            return float(obj.amount)


@admin.register(LNPayment)
class LNPaymentAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
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
    )
    list_display_links = ("hash", "concept")
    change_links = (
        "sender",
        "receiver",
        "order_made",
        "order_taken",
        "order_escrow",
        "order_paid_LN",
    )
    list_filter = ("type", "concept", "status")
    ordering = ("-expires_at",)
    search_fields = [
        "payment_hash",
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
    list_display_links = ("id", "address", "concept")
    list_filter = ("concept", "status")
    search_fields = ["address", "num_satoshis", "receiver__username", "txid"]


@admin.register(Profile)
class UserProfileAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
    list_display = (
        "avatar_tag",
        "id",
        "user_link",
        "is_referred",
        "telegram_enabled",
        "total_contracts",
        "pending_rewards",
        "earned_rewards",
        "claimed_rewards",
        "platform_rating",
        "total_ratings",
        "avg_rating",
        "num_disputes",
        "lost_disputes",
    )
    raw_id_fields = (
        "user",
        "referred_by",
    )
    list_editable = ["pending_rewards", "earned_rewards"]
    list_display_links = ("avatar_tag", "id")
    change_links = ["user"]
    readonly_fields = ["avatar_tag"]
    search_fields = ["user__username", "id"]
    readonly_fields = ("public_key", "encrypted_private_key")


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

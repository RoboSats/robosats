from django.contrib import admin
from django_admin_relation_links import AdminChangeLinksMixin
from django.contrib.auth.models import Group, User
from django.contrib.auth.admin import UserAdmin
from .models import Order, LNPayment, Profile, MarketTick, Currency

admin.site.unregister(Group)
admin.site.unregister(User)

class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False 
    fields = ('avatar_tag',) 
    readonly_fields = ['avatar_tag']
 
# extended users with avatars
@admin.register(User)
class EUserAdmin(UserAdmin):
    inlines = [ProfileInline]
    list_display = ('avatar_tag','id','username','last_login','date_joined','is_staff')
    list_display_links = ('id','username')
    def avatar_tag(self, obj):
        return obj.profile.avatar_tag()


@admin.register(Order)
class OrderAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
    list_display = ('id','type','maker_link','taker_link','status','amount','currency_link','t0_satoshis','is_disputed','is_fiat_sent','created_at','expires_at', 'payout_link','maker_bond_link','taker_bond_link','trade_escrow_link')
    list_display_links = ('id','type')
    change_links = ('maker','taker','currency','payout','maker_bond','taker_bond','trade_escrow')
    list_filter = ('is_disputed','is_fiat_sent','type','currency','status')

@admin.register(LNPayment)
class LNPaymentAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
    list_display = ('hash','concept','status','num_satoshis','type','expires_at','expiry_height','sender_link','receiver_link','order_made_link','order_taken_link','order_escrow_link','order_paid_link')
    list_display_links = ('hash','concept')
    change_links = ('sender','receiver','order_made','order_taken','order_escrow','order_paid')
    list_filter = ('type','concept','status')

@admin.register(Profile)
class UserProfileAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
    list_display = ('avatar_tag','id','user_link','total_contracts','total_ratings','avg_rating','num_disputes','lost_disputes')
    list_display_links = ('avatar_tag','id')
    change_links =['user']
    readonly_fields = ['avatar_tag']

@admin.register(Currency)
class CurrencieAdmin(admin.ModelAdmin):
    list_display = ('id','currency','exchange_rate','timestamp')
    list_display_links = ('id','currency')
    readonly_fields = ('currency','exchange_rate','timestamp')

@admin.register(MarketTick)
class MarketTickAdmin(admin.ModelAdmin):
    list_display = ('timestamp','price','volume','premium','currency','fee')
    readonly_fields = ('timestamp','price','volume','premium','currency','fee')
    list_filter = ['currency']
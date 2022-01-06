from django.contrib import admin
from django_admin_relation_links import AdminChangeLinksMixin
from django.contrib.auth.models import Group, User
from django.contrib.auth.admin import UserAdmin
from .models import Order, LNPayment, Profile

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
    list_display = ('avatar_tag',) + UserAdmin.list_display
    list_display_links = ['username']
    def avatar_tag(self, obj):
        return obj.profile.avatar_tag()

@admin.register(Order)
class OrderAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
    list_display = ('id','type','maker_link','taker_link','status','amount','currency','created_at','expires_at', 'buyer_invoice_link','maker_bond_link','taker_bond_link','trade_escrow_link')
    list_display_links = ('id','type')
    change_links = ('maker','taker','buyer_invoice','maker_bond','taker_invoice','taker_bond','trade_escrow')

@admin.register(LNPayment)
class LNPaymentAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
    list_display = ('id','concept','status','num_satoshis','type','invoice','preimage','expires_at','sender_link','receiver_link')
    list_display_links = ('id','concept')
    change_links = ('sender','receiver')

@admin.register(Profile)
class UserProfileAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
    list_display = ('avatar_tag','id','user_link','total_ratings','avg_rating','num_disputes','lost_disputes')
    list_display_links = ('avatar_tag','id')
    change_links =['user']
    readonly_fields = ['avatar_tag']
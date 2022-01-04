from django.contrib import admin
from django.contrib.auth.models import Group
from .models import Order, Profile

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id','type','maker','taker','status','amount','currency','created_at','expires_at')
    list_display_links = ('maker','taker')
    pass

@admin.register(Profile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user','id','total_ratings','avg_rating','num_disputes','lost_disputes','avatar')
    pass

admin.site.unregister(Group)
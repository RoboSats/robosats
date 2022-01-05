from django.contrib import admin
from django.db import models 
from django.contrib.auth.models import Group, User
from django.contrib.auth.admin import UserAdmin
from .models import Order, Profile

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
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id','type','maker','taker','status','amount','currency','created_at','expires_at', 'invoice')
    list_display_links = ['id']
    pass

@admin.register(Profile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('avatar_tag','user','id','total_ratings','avg_rating','num_disputes','lost_disputes')
    list_display_links =['user']
    readonly_fields = ['avatar_tag']
    pass
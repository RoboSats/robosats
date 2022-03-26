from django.contrib import admin
from django_admin_relation_links import AdminChangeLinksMixin
from chat.models import ChatRoom
# Register your models here.


@admin.register(ChatRoom)
class ChatRoomAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "order_link",
        "maker_link",
        "taker_link",
        "maker_connected",
        "taker_connected",
        "maker_connect_date",
        "taker_connect_date",
        "room_group_name",
    )
    change_links = ["order","maker","taker"]
    search_fields = ["id"]
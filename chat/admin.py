from django.contrib import admin
from django_admin_relation_links import AdminChangeLinksMixin
from chat.models import ChatRoom, Message

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
    change_links = ["order", "maker", "taker"]
    search_fields = ["id"]


@admin.register(Message)
class MessageAdmin(AdminChangeLinksMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "chatroom_link",
        "index",
        "order_link",
        "sender_link",
        "receiver_link",
        "created_at",
    )
    change_links = ["chatroom", "order", "sender", "receiver"]
    search_fields = ["id", "index"]
    ordering = ["-chatroom_id", "-index"]
    list_filter = ("chatroom",)

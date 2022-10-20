from django.db import models
from api.models import User, Order
from django.utils import timezone
import uuid


class ChatRoom(models.Model):
    """
    Simple ChatRoom model. Needed to facilitate communication: Is my counterpart in the room?
    """

    id = models.PositiveBigIntegerField(
        primary_key=True, null=False, default=None, blank=True
    )
    order = models.ForeignKey(
        Order,
        related_name="chatroom",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
    )
    maker = models.ForeignKey(
        User,
        related_name="chat_maker",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
    )
    taker = models.ForeignKey(
        User,
        related_name="chat_taker",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        blank=True,
    )

    maker_connected = models.BooleanField(default=False, null=False)
    taker_connected = models.BooleanField(default=False, null=False)

    maker_connect_date = models.DateTimeField(auto_now_add=True)
    taker_connect_date = models.DateTimeField(auto_now_add=True)

    room_group_name = models.CharField(
        max_length=50,
        null=True,
        default=None,
        blank=True,
    )

    def __str__(self):
        return f"Chat:{str(self.id)}"


class Message(models.Model):
    class Meta:
        get_latest_by = "index"

    # id = models.PositiveBigIntegerField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order, related_name="message", on_delete=models.CASCADE, null=True, default=None
    )
    chatroom = models.ForeignKey(
        ChatRoom,
        related_name="chatroom",
        on_delete=models.CASCADE,
        null=True,
        default=None,
    )
    index = models.PositiveIntegerField(null=False, default=None, blank=True)
    sender = models.ForeignKey(
        User,
        related_name="message_sender",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
    )
    receiver = models.ForeignKey(
        User,
        related_name="message_receiver",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
    )

    PGP_message = models.TextField(max_length=5000, null=True, default=None, blank=True)

    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Chat:{str(self.chatroom.id)} - Idx:{self.index}"

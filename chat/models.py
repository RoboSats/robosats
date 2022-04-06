from django.db import models
from api.models import User, Order


class ChatRoom(models.Model):
    '''
    Simple ChatRoom model. Needed to facilitate communication: Is my counterpart in the room?
    '''

    id = models.PositiveBigIntegerField(primary_key=True, null=False,default=None, blank=True)
    order = models.ForeignKey(
        Order,
        related_name="order",
        on_delete=models.SET_NULL,
        null=True,
        default=None)
    maker = models.ForeignKey(
        User,
        related_name="chat_maker",
        on_delete=models.SET_NULL,
        null=True,
        default=None)
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
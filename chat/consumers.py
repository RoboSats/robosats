from channels.generic.websocket import AsyncWebsocketConsumer
from api.logics import Logics
from api.models import Order

import json


class ChatRoomConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.order_id = self.scope["url_route"]["kwargs"]["order_id"]
        self.room_group_name = f"chat_order_{self.order_id}"
        self.user = self.scope["user"]
        self.user_nick = str(self.user)

        # Forbit if user is not part of the order
        # Does not work Async
        # order = Order.objects.get(id=self.order_id)

        # # Check if user is participant on the order.
        # if not (Logics.is_buyer(order[0], self.user) or Logics.is_seller(order[0], self.user)):
        #     print ("Outta this chat")
        #     return False

        await self.channel_layer.group_add(self.room_group_name,
                                           self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name,
                                               self.channel_name)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        nick = text_data_json["nick"]

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chatroom_message",
                "message": message,
                "nick": nick,
            },
        )

    async def chatroom_message(self, event):
        message = event["message"]
        nick = event["nick"]

        await self.send(text_data=json.dumps({
            "message": message,
            "user_nick": nick,
        }))

    pass

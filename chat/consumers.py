from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from api.models import Order
from chat.models import ChatRoom
from django.utils import timezone

import json

class ChatRoomConsumer(AsyncWebsocketConsumer):

    @database_sync_to_async
    def allow_in_chatroom(self):
        order = Order.objects.get(id=self.order_id)
        if not (order.maker == self.user or order.taker == self.user):
            print("Not allowed in this chat")
            return False
        return True

    @database_sync_to_async
    def save_connect_user(self):
        '''Creates or updates the ChatRoom object'''

        order = Order.objects.get(id=self.order_id)

        if order.maker == self.user:
            ChatRoom.objects.update_or_create(
                id=self.order_id, 
                order=order,  
                room_group_name=self.room_group_name,
                defaults={
                    "maker": self.user,
                    "maker_connected": True,
                    }
                )

        elif order.taker == self.user:
            ChatRoom.objects.update_or_create(
                id=self.order_id, 
                order=order,  
                room_group_name=self.room_group_name,
                defaults={
                    "taker": self.user,
                    "taker_connected": True,
                    }
                )

        return None

    @database_sync_to_async
    def save_disconnect_user(self):
        '''Creates or updates the ChatRoom object'''
        
        order = Order.objects.get(id=self.order_id)
        if order.maker == self.user:
            ChatRoom.objects.update_or_create(
                id=self.order_id, 
                defaults={
                    "maker_connected": False
                    }
                )
        elif order.taker == self.user:
            ChatRoom.objects.update_or_create(
                id=self.order_id,
                defaults={
                    "taker_connected": False
                    }
                )
        return None

    @database_sync_to_async
    def is_peer_connected(self):
        '''Creates or updates the ChatRoom object'''

        chatroom = ChatRoom.objects.get(id=self.order_id)

        if chatroom.maker == self.user:
            return chatroom.taker_connected

        if chatroom.taker == self.user:
            return chatroom.maker_connected

    async def connect(self):
        self.order_id = self.scope["url_route"]["kwargs"]["order_id"]
        self.room_group_name = f"chat_order_{self.order_id}"
        self.user = self.scope["user"]
        self.user_nick = str(self.user)

        allowed = await self.allow_in_chatroom()

        if allowed:
            await self.save_connect_user()
            await self.channel_layer.group_add(self.room_group_name,
                                            self.channel_name)

            await self.accept()

    async def disconnect(self, close_code):
        await self.save_disconnect_user()
        await self.channel_layer.group_discard(self.room_group_name,
                                               self.channel_name)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chatroom_message",
                "message": 'peer-disconnected',
                "nick": self.scope["user"].username,
                "peer_connected": False,
            },
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        
        peer_connected = await self.is_peer_connected()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chatroom_message",
                "message": message,
                "nick": self.scope["user"].username,
                "peer_connected": peer_connected,
            },
        )

    async def chatroom_message(self, event):
        message = event["message"]
        nick = event["nick"]
        peer_connected = event["peer_connected"]

        await self.send(text_data=json.dumps({
            "message": message,
            "user_nick": nick,
            "peer_connected": peer_connected,
            "time":str(timezone.now()),
        }))

    pass

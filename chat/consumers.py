import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from api.models import Order
from api.tasks import send_notification
from chat.models import ChatRoom, Message


class ChatRoomConsumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def allow_in_chatroom(self):
        order = Order.objects.get(id=self.order_id)

        if order.status not in [
            Order.Status.CHA,
            Order.Status.FSE,
            Order.Status.DIS,
            Order.Status.WFR,
        ]:
            print("Order is not in chat status")
            return False

        if not (order.maker == self.user or order.taker == self.user):
            print("Not allowed in this chat")
            return False
        return True

    @database_sync_to_async
    def save_connect_user(self):
        """Creates or updates the ChatRoom object"""

        order = Order.objects.get(id=self.order_id)

        if order.maker == self.user:
            ChatRoom.objects.update_or_create(
                id=self.order_id,
                order=order,
                room_group_name=self.room_group_name,
                defaults={
                    "maker": self.user,
                    "maker_connected": True,
                    "taker": order.taker,
                    "taker_connected": True,
                },
            )

        elif order.taker == self.user:
            ChatRoom.objects.update_or_create(
                id=self.order_id,
                order=order,
                room_group_name=self.room_group_name,
                defaults={
                    "taker": self.user,
                    "taker_connected": True,
                    "maker": order.maker,
                    "maker_connected": False,
                },
            )

        return None

    @database_sync_to_async
    def save_new_PGP_message(self, PGP_message):
        """Creates a Message object"""

        order = Order.objects.get(id=self.order_id)
        chatroom = ChatRoom.objects.get(order=order)

        try:
            last_message = Message.objects.filter(order=order).latest()
            index = last_message.index + 1
        except Exception:
            index = 1

        sender = self.scope["user"]
        if order.taker == sender:
            receiver = order.maker
        elif order.maker == sender:
            receiver = order.taker

        msg_obj = Message.objects.create(
            order=order,
            chatroom=chatroom,
            index=index,
            sender=sender,
            receiver=receiver,
            PGP_message=PGP_message,
        )

        # send Telegram notification for new message (if conditions apply)
        send_notification.delay(chat_message_id=msg_obj.id, message="new_chat_message")
        return msg_obj

    @database_sync_to_async
    def save_disconnect_user(self):
        """Creates or updates the ChatRoom object"""

        order = Order.objects.get(id=self.order_id)
        if order.maker == self.user:
            ChatRoom.objects.update_or_create(
                id=self.order_id, defaults={"maker_connected": False}
            )
        elif order.taker == self.user:
            ChatRoom.objects.update_or_create(
                id=self.order_id, defaults={"taker_connected": False}
            )
        return None

    @database_sync_to_async
    def is_peer_connected(self):
        """Returns whether the consumer's peer is connected"""

        chatroom = ChatRoom.objects.get(id=self.order_id)

        if chatroom.maker == self.user:
            return chatroom.taker_connected

        if chatroom.taker == self.user:
            return chatroom.maker_connected

    @database_sync_to_async
    def get_peer_PGP_public_key(self):
        """Returns peer PGP public key"""

        order = Order.objects.get(id=self.order_id)

        if order.maker == self.user:
            return order.taker.robot.public_key

        if order.taker == self.user:
            return order.maker.robot.public_key

    @database_sync_to_async
    def get_all_PGP_messages(self):
        """Returns all PGP messages"""

        order = Order.objects.get(id=self.order_id)
        messages = Message.objects.filter(order=order)

        msgs = []
        for message in messages:
            msgs.append(
                {
                    "index": message.index,
                    "time": str(message.created_at),
                    "message": message.PGP_message,
                    "nick": str(message.sender),
                }
            )

        return msgs

    async def connect(self):
        self.order_id = self.scope["url_route"]["kwargs"]["order_id"]
        self.room_group_name = f"chat_order_{self.order_id}"
        self.user = self.scope["user"]
        self.user_nick = str(self.user)

        allowed = await self.allow_in_chatroom()

        if allowed:
            await self.save_connect_user()
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

            await self.accept()

            # Send peer PGP public keys
            peer_public_key = await self.get_peer_PGP_public_key()
            peer_connected = await self.is_peer_connected()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chatroom_message",
                    "message": peer_public_key,
                    "nick": self.scope["user"].username,
                    "peer_connected": peer_connected,
                },
            )

    async def disconnect(self, close_code):
        await self.save_disconnect_user()
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chatroom_message",
                "message": "peer-disconnected",
                "nick": self.scope["user"].username,
                "peer_connected": False,
            },
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        peer_connected = await self.is_peer_connected()

        # Encrypted messages are stored. They are served later when a user reconnects.
        if message[0:27] == "-----BEGIN PGP MESSAGE-----":
            # save to database
            msg_obj = await self.save_new_PGP_message(message)

            index = msg_obj.index
            message = msg_obj.PGP_message
            time = str(msg_obj.created_at)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "PGP_message",
                    "index": index,
                    "message": message,
                    "time": time,
                    "nick": self.scope["user"].username,
                    "peer_connected": peer_connected,
                },
            )

        # Encrypted messages are served when the user requests them
        elif message[0:23] == "-----SERVE HISTORY-----":
            # If there is any stored message, serve them.
            msgs = await self.get_all_PGP_messages()
            peer_connected = await self.is_peer_connected()
            for msg in msgs:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "PGP_message",
                        "index": msg["index"],
                        "time": msg["time"],
                        "message": msg["message"],
                        "nick": msg["nick"],
                        "peer_connected": peer_connected,
                    },
                )
        # Unencrypted messages are not stored, just echoed.
        else:
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

        await self.send(
            text_data=json.dumps(
                {
                    "message": message,
                    "user_nick": nick,
                    "peer_connected": peer_connected,
                }
            )
        )

    async def PGP_message(self, event):
        message = event["message"]
        nick = event["nick"]
        index = event["index"]
        peer_connected = event["peer_connected"]
        time = event["time"]

        await self.send(
            text_data=json.dumps(
                {
                    "index": index,
                    "message": message,
                    "user_nick": nick,
                    "peer_connected": peer_connected,
                    "time": time,
                }
            )
        )

from operator import index
from rest_framework import status, viewsets
from chat.serializers import ChatSerializer, PostMessageSerializer
from chat.models import Message, ChatRoom
from api.models import Order, User
from rest_framework.response import Response
from datetime import timedelta
from django.utils import timezone

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


class ChatView(viewsets.ViewSet):
    serializer_class = PostMessageSerializer
    lookup_url_kwarg = ["order_id", "offset"]

    queryset = Message.objects.filter(
        order__status__in=[Order.Status.CHA, Order.Status.FSE]
    )

    def get(self, request, format=None):
        """
        Returns chat messages for an order with an index higher than `offset`.
        """

        order_id = request.GET.get("order_id", None)
        offset = request.GET.get("offset", 0)

        if order_id is None:
            return Response(
                {"bad_request": "Order ID does not exist"},
                status.HTTP_400_BAD_REQUEST,
            )

        order = Order.objects.get(id=order_id)

        if not (request.user == order.maker or request.user == order.taker):
            return Response(
                {"bad_request": "You are not participant in this order"},
                status.HTTP_400_BAD_REQUEST,
            )

        if not order.status in [Order.Status.CHA, Order.Status.FSE]:
            return Response(
                {"bad_request": "Order is not in chat status"},
                status.HTTP_400_BAD_REQUEST,
            )

        queryset = Message.objects.filter(order=order, index__gt=offset)
        chatroom = ChatRoom.objects.get(order=order)

        # Poor idea: is_peer_connected() mockup. Update connection status based on last time a GET request was sent
        if chatroom.maker == request.user:
            chatroom.taker_connected = order.taker_last_seen > (
                timezone.now() - timedelta(minutes=1)
            )
            chatroom.maker_connected = True
            chatroom.save()
            peer_connected = chatroom.taker_connected
        elif chatroom.taker == request.user:
            chatroom.maker_connected = order.maker_last_seen > (
                timezone.now() - timedelta(minutes=1)
            )
            chatroom.taker_connected = True
            chatroom.save()
            peer_connected = chatroom.maker_connected

        messages = []
        for message in queryset:
            d = ChatSerializer(message).data
            print(d)
            # Re-serialize so the response is identical to the consumer message
            data = {
                "index": d["index"],
                "time": d["created_at"],
                "message": d["PGP_message"],
                "nick": User.objects.get(id=d["sender"]).username,
            }
            messages.append(data)

        response = {"peer_connected": peer_connected, "messages": messages}

        return Response(response, status.HTTP_200_OK)

    def post(self, request, format=None):
        """
        Adds one new message to the chatroom.
        """

        serializer = self.serializer_class(data=request.data)
        # Return bad request if serializer is not valid
        if not serializer.is_valid():
            context = {"bad_request": "Invalid serializer"}
            return Response(context, status=status.HTTP_400_BAD_REQUEST)

        print(request)
        order_id = serializer.data.get("order", None)

        if order_id is None:
            return Response(
                {"bad_request": "Order ID does not exist"},
                status.HTTP_400_BAD_REQUEST,
            )

        order = Order.objects.get(id=order_id)

        if not (request.user == order.maker or request.user == order.taker):
            return Response(
                {"bad_request": "You are not participant in this order"},
                status.HTTP_400_BAD_REQUEST,
            )

        if not order.status in [Order.Status.CHA, Order.Status.FSE]:
            return Response(
                {"bad_request": "Order is not in chat status"},
                status.HTTP_400_BAD_REQUEST,
            )

        if order.maker == request.user:
            sender = order.maker
            receiver = order.taker
        elif order.taker == request.user:
            sender = order.taker
            receiver = order.maker

        chatroom, _ = ChatRoom.objects.get_or_create(
            id=order_id,
            order=order,
            room_group_name=f"chat_order_{order_id}",
            defaults={
                "maker": order.maker,
                "maker_connected": order.maker == request.user,
                "taker": order.taker,
                "taker_connected": order.taker == request.user,
            },
        )

        last_index = Message.objects.filter(order=order, chatroom=chatroom).count()
        new_message = Message.objects.create(
            index=last_index + 1,
            PGP_message=serializer.data.get("PGP_message"),
            order=order,
            chatroom=chatroom,
            sender=sender,
            receiver=receiver,
        )

        # Send websocket message
        if chatroom.maker == request.user:
            peer_connected = chatroom.taker_connected
        elif chatroom.taker == request.user:
            peer_connected = chatroom.maker_connected

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_order_{order_id}",
            {
                "type": "PGP_message",
                "index": new_message.index,
                "message": new_message.PGP_message,
                "time": str(new_message.created_at),
                "nick": new_message.sender.username,
                "peer_connected": peer_connected,
            },
        )

        # if offset is given, reply with messages
        offset = serializer.data.get("offset", None)
        if offset:
            queryset = Message.objects.filter(order=order, index__gt=offset)
            messages = []
            for message in queryset:
                d = ChatSerializer(message).data
                print(d)
                # Re-serialize so the response is identical to the consumer message
                data = {
                    "index": d["index"],
                    "time": d["created_at"],
                    "message": d["PGP_message"],
                    "nick": User.objects.get(id=d["sender"]).username,
                }
                messages.append(data)

            response = {"peer_connected": peer_connected, "messages": messages}
        else:
            response = {}

        return Response(response, status.HTTP_200_OK)

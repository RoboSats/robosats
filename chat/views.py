from operator import index
from rest_framework import status, viewsets
from chat.serializers import ChatSerializer
from chat.models import Message
from api.models import Order, User
from rest_framework.response import Response

class ChatView(viewsets.ViewSet):
    serializer_class = ChatSerializer
    lookup_url_kwarg = ["order_id","offset"]

    queryset = Message.objects.filter(order__status__in=[Order.Status.CHA, Order.Status.FSE])

    def get(self, request, format=None):
        """
        Returns chat messages for an order with an index higher than `offset`.
        """

        order_id = request.GET.get("order_id", None)
        offset = request.GET.get("offset", 0)

        order = Order.objects.get(id=order_id)
        if order is None:
            return Response(
                {
                    "bad_request":
                    "Order ID does not exist"
                },
                status.HTTP_400_BAD_REQUEST,
            )    

        if not order.status in [Order.Status.CHA, Order.Status.FSE]:
            return Response(
                {
                    "bad_request":
                    "Order is not in chat status"
                },
                status.HTTP_400_BAD_REQUEST,
            )

        queryset = Message.objects.filter(order=order, index__gt=offset)
        
        messages = []
        for message in queryset:
            d = ChatSerializer(message).data
            print(d)
            # Re-serialize so the response is identical to the consumer message
            data = {
                'index':d['index'], 
                'time':d['created_at'], 
                'message':d['PGP_message'], 
                'nick': User.objects.get(id=d['sender']).username
                } 
            messages.append(data)

        return Response(messages, status.HTTP_200_OK)

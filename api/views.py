from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .serializers import OrderSerializer, MakeOrderSerializer
from .models import Order

# Create your views here.

class MakeOrder(APIView):
    serializer_class  = MakeOrderSerializer

    def post(self,request):

        serializer = self.serializer_class(data=request.data)
        print(serializer)
        if serializer.is_valid():
            otype = serializer.data.get('type')
            currency = serializer.data.get('currency')
            amount = serializer.data.get('amount')
            premium = serializer.data.get('premium')
            satoshis = serializer.data.get('satoshis')

            #################
            # TODO
            # query if the user is already a maker or taker, return error

            # Creates a new order in db
            order = Order(
                type=otype,
                currency=currency,
                amount=amount,
                premium=premium,
                satoshis=satoshis)
            order.save()

        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST)
            
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
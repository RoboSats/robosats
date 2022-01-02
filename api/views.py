from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from django.contrib.auth.models import User

from .serializers import OrderSerializer, MakeOrderSerializer
from .models import Order

# Create your views here.

class MakeOrder(APIView):
    serializer_class  = MakeOrderSerializer

    def post(self,request):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            otype = serializer.data.get('type')
            currency = serializer.data.get('currency')
            amount = serializer.data.get('amount')
            payment_method = serializer.data.get('payment_method')
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
                payment_method=payment_method,
                premium=premium,
                satoshis=satoshis)
            order.save()

        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST)
            
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderView(APIView):
    serializer_class = OrderSerializer
    lookup_url_kwarg = 'order_id'

    def get(self, request, format=None):
        order_id = request.GET.get(self.lookup_url_kwarg)

        if order_id != None:
            order = Order.objects.filter(id=order_id)

            # check if exactly one order is found in the db
            if len(order) == 1 :
                print("It is only one!")
                order = order[0]
                data = self.serializer_class(order).data
                
                # TODO
                # # Check if requester is participant in the order and add boolean to response
                
                # user = authenticate(username=username, password=password)
                # data['is_participant'] = any(user.id == order.maker, user.id == order.taker)

                # if data['is_participant']:
                #     return Response(data, status=status.HTTP_200_OK)
                # else:
                #     # Non participants can't get access to the status or who is the taker
                #     data.pop(['status'],['taker'])
                #     return Response(data, status=status.HTTP_200_OK)

                return Response(data, status=status.HTTP_200_OK)

            return Response({'Order Not Found':'Invalid Order Id'},status=status.HTTP_404_NOT_FOUND)

        return Response({'Bad Request':'Order ID parameter not found in request'}, status=status.HTTP_400_BAD_REQUEST)



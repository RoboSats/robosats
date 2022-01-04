from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.conf.urls.static import static

from .serializers import OrderSerializer, MakeOrderSerializer
from .models import Order

from .nick_generator.nick_generator import NickGenerator
from robohash import Robohash
from scipy.stats import entropy
from math import log2
import numpy as np
import hashlib
from pathlib import Path
from datetime import timedelta
from django.utils import timezone

# .env
expiration_time = 8

avatar_path = Path('frontend/static/assets/avatars')
avatar_path.mkdir(parents=True, exist_ok=True)

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
            is_explicit = serializer.data.get('is_explicit')

            # query if the user is already a maker or taker, return error
            queryset = Order.objects.filter(maker=request.user.id)
            if queryset.exists():
                return Response({'Bad Request':'You are already maker of an order'},status=status.HTTP_400_BAD_REQUEST)
            queryset = Order.objects.filter(taker=request.user.id)
            if queryset.exists():
                return Response({'Bad Request':'You are already taker of an order'},status=status.HTTP_400_BAD_REQUEST) 

            # Creates a new order in db
            order = Order(
                type=otype,
                currency=currency,
                amount=amount,
                payment_method=payment_method,
                premium=premium,
                satoshis=satoshis,
                is_explicit=is_explicit,
                expires_at= timezone.now()+timedelta(hours=expiration_time),
                maker=request.user)
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
                order = order[0]
                data = self.serializer_class(order).data
                nickname = request.user.username

                # Check if requester is participant in the order and add boolean to response
                data['is_participant'] = (str(order.maker) == nickname or str(order.taker) == nickname)
                
                #To do fix: data['status_message'] = Order.Status.get(order.status).label
                data['status_message'] = Order.Status.WFB.label # Hardcoded WFB, should use order.status value.

                data['maker_nick'] = str(order.maker)
                data['taker_nick'] = str(order.taker)

                if data['is_participant']:
                    return Response(data, status=status.HTTP_200_OK)
                else:
                    # Non participants should not see the status or who is the taker
                    data.pop('status','status_message','taker','taker_nick')
                    return Response(data, status=status.HTTP_200_OK)

            return Response({'Order Not Found':'Invalid Order Id'},status=status.HTTP_404_NOT_FOUND)

        return Response({'Bad Request':'Order ID parameter not found in request'}, status=status.HTTP_400_BAD_REQUEST)

class UserGenerator(APIView):
    lookup_url_kwarg = 'token'
    NickGen = NickGenerator(
        lang='English', 
        use_adv=False, 
        use_adj=True, 
        use_noun=True, 
        max_num=999)

    def get(self,request, format=None):
        '''
        Get a new user derived from a high entropy token
        
        - Request has a high-entropy token,
        - Generates new nickname and avatar.
        - Creates login credentials (new User object)
        Response with Avatar and Nickname.
        '''
        token = request.GET.get(self.lookup_url_kwarg)

        # Compute token entropy
        value, counts = np.unique(list(token), return_counts=True)
        shannon_entropy = entropy(counts, base=62)
        bits_entropy = log2(len(value)**len(token))

        # Start preparing payload
        context = {'token_shannon_entropy': shannon_entropy, 'token_bits_entropy': bits_entropy}

        # Deny user gen if entropy below 128 bits or 0.7 shannon heterogeneity
        if bits_entropy < 128 or shannon_entropy < 0.7:
            context['bad_request'] = 'The token does not have enough entropy'
            return Response(context, status=status.HTTP_400_BAD_REQUEST)

        # Hashes the token, only 1 iteration. Maybe more is better.
        hash = hashlib.sha256(str.encode(token)).hexdigest() 

        # generate nickname
        nickname = self.NickGen.short_from_SHA256(hash, max_length=18)[0] 
        context['nickname'] = nickname

        # generate avatar
        rh = Robohash(hash)
        rh.assemble(roboset='set1', bgset='any')# for backgrounds ON

        # Does not replace image if existing (avoid re-avatar in case of nick collusion)

        image_path = avatar_path.joinpath(nickname+".png")
        if not image_path.exists():
            with open(image_path, "wb") as f:
                rh.img.save(f, format="png")

        # Create new credentials and logsin if nickname is new
        if len(User.objects.filter(username=nickname)) == 0:
            User.objects.create_user(username=nickname, password=token, is_staff=False)
            user = authenticate(request, username=nickname, password=token)
            user.profile.avatar = str(image_path)[9:] # removes frontend/ from url (ugly, to be fixed) 
            login(request, user)
            return Response(context, status=status.HTTP_201_CREATED)

        else:
            user = authenticate(request, username=nickname, password=token)
            if user is not None:
                login(request, user)
                # Sends the welcome back message, only if created +30 mins ago
                if request.user.date_joined < (timezone.now()-timedelta(minutes=30)):
                    context['found'] = 'We found your Robosat. Welcome back!'
                return Response(context, status=status.HTTP_202_ACCEPTED)
            else:
                # It is unlikely, but maybe the nickname is taken (1 in 20 Billion change)
                context['found'] = 'Bad luck, this nickname is taken'
                context['bad_request'] = 'Enter a different token'
                return Response(context, status=status.HTTP_403_FORBIDDEN)

    def delete(self,request):
        user = User.objects.get(id = request.user.id)

        # TO DO. Pressing give me another will delete the logged in user
        # However it might be a long time recovered user
        # Only delete if user live is < 5 minutes

        # TODO check if user exists AND it is not a maker or taker!
        if user is not None:
            avatar_file = avatar_path.joinpath(str(request.user)+".png")
            avatar_file.unlink() # Unsafe if avatar does not exist.
            logout(request)
            user.delete()

            return Response({'user_deleted':'User deleted permanently'},status=status.HTTP_301_MOVED_PERMANENTLY)

        return Response(status=status.HTTP_403_FORBIDDEN)

class BookView(APIView):
    serializer_class = OrderSerializer

    def get(self,request, format=None):
        currency = request.GET.get('currency')
        type = request.GET.get('type') 
        queryset = Order.objects.filter(currency=currency, type=type, status=0) # TODO status = 1 for orders that are Public
        if len(queryset)== 0:
            return Response({'not_found':'No orders found, be the first to make one'}, status=status.HTTP_404_NOT_FOUND)

        queryset = queryset.order_by('created_at')
        book_data = []
        for order in queryset:
            data = OrderSerializer(order).data
            user = User.objects.filter(id=data['maker'])
            if len(user) == 1:
                data['maker_nick'] = user[0].username
            # TODO avoid sending status and takers for book views
            #data.pop('status','taker')
            book_data.append(data)
        
        return Response(book_data, status=status.HTTP_200_OK)
        

        


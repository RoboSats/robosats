from rest_framework import status, serializers
from rest_framework.generics import CreateAPIView, ListAPIView
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.response import Response

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User

from .serializers import ListOrderSerializer, MakeOrderSerializer, UpdateOrderSerializer
from .models import Order, LNPayment
from .lightning import LNNode

from .nick_generator.nick_generator import NickGenerator
from robohash import Robohash
from scipy.stats import entropy
from math import log2
import numpy as np
import hashlib
from pathlib import Path
from datetime import timedelta
from django.utils import timezone

import json
from django.http import HttpResponse

# .env
expiration_time = 8

avatar_path = Path('frontend/static/assets/avatars')
avatar_path.mkdir(parents=True, exist_ok=True)

def validate_already_maker_or_taker(request):
    '''Checks if the user is already partipant of an order'''

    queryset = Order.objects.filter(maker=request.user.id)
    if queryset.exists():
        return False, Response({'Bad Request':'You are already maker of an order'}, status=status.HTTP_400_BAD_REQUEST)

    queryset = Order.objects.filter(taker=request.user.id)
    if queryset.exists():
        return False, Response({'Bad Request':'You are already taker of an order'}, status=status.HTTP_400_BAD_REQUEST) 
    
    return True, None

# Create your views here.

class OrderMakerView(CreateAPIView):
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

            valid, response = validate_already_maker_or_taker(request)
            if not valid:
                return response

            # Creates a new order in db
            order = Order(
                type=otype,
                status=Order.Status.PUB, # TODO orders are public by default for the moment. Future it will be WFB (waiting for bond)
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
            
        return Response(ListOrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderView(viewsets.ViewSet):
    serializer_class = UpdateOrderSerializer
    lookup_url_kwarg = 'order_id'

    def get(self, request, format=None):
        order_id = request.GET.get(self.lookup_url_kwarg)

        if order_id != None:
            order = Order.objects.filter(id=order_id)

            # check if exactly one order is found in the db
            if len(order) == 1 :
                order = order[0]
                data = ListOrderSerializer(order).data
                nickname = request.user.username

                # Add booleans if user is maker, taker, partipant, buyer or seller
                data['is_maker'] = str(order.maker) == nickname
                data['is_taker'] = str(order.taker) == nickname
                data['is_participant'] = data['is_maker'] or data['is_taker']
                data['is_buyer'] = (data['is_maker'] and order.type == Order.Types.BUY) or (data['is_taker'] and order.type == Order.Types.SELL)
                data['is_seller'] = (data['is_maker'] and order.type == Order.Types.SELL) or (data['is_taker'] and order.type == Order.Types.BUY)
                
                # If not a participant and order is not public, forbid.
                if not data['is_participant'] and order.status != Order.Status.PUB:
                    return Response({'bad_request':'Not allowed to see this order'},status.HTTP_403_FORBIDDEN)

                # return nicks too
                data['maker_nick'] = str(order.maker)
                data['taker_nick'] = str(order.taker)
                
                data['status_message'] = Order.Status(order.status).label 

                if data['is_participant']:
                    return Response(data, status=status.HTTP_200_OK)
                else:
                    # Non participants should not see the status, who is the taker, etc
                    for key in ('status','status_message','taker','taker_nick','is_maker','is_taker','is_buyer','is_seller'):
                        del data[key]
                    return Response(data, status=status.HTTP_200_OK)

            return Response({'Order Not Found':'Invalid Order Id'},status=status.HTTP_404_NOT_FOUND)
        return Response({'Bad Request':'Order ID parameter not found in request'}, status=status.HTTP_400_BAD_REQUEST)


    def take_or_update(self, request, format=None):
        order_id = request.GET.get(self.lookup_url_kwarg)

        serializer = UpdateOrderSerializer(data=request.data)
        order = Order.objects.get(id=order_id)

        if serializer.is_valid():
            invoice = serializer.data.get('buyer_invoice')

        # If this is an empty POST request (no invoice), it must be taker request!
        if not invoice and order.status == Order.Status.PUB:
            
            valid, response = validate_already_maker_or_taker(request)
            if not valid:
                return response

            order.taker = self.request.user
            order.status = Order.Status.TAK

            #TODO REPLY WITH HODL INVOICE
            data = ListOrderSerializer(order).data

        # An invoice came in! update it
        elif invoice:
            if LNNode.validate_ln_invoice(invoice):
                order.invoice = invoice

            #TODO Validate if request comes from PARTICIPANT AND BUYER

                #If the order status was Payment Failed. Move foward to invoice Updated.
                if order.status == Order.Status.FAI:
                    order.status = Order.Status.UPI

            else:
                return Response({'bad_request':'Invalid Lightning Network Invoice. It starts by LNTB...'})
        
        # Something else is going on. Probably not allowed.
        else:
            return Response({'bad_request':'Not allowed'})

        order.save()
        return self.get(request)

class UserView(APIView):
    lookup_url_kwarg = 'token'
    NickGen = NickGenerator(
        lang='English', 
        use_adv=False, 
        use_adj=True, 
        use_noun=True, 
        max_num=999)

    # Probably should be turned into a post method
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
        # Payload
        context = {'token_shannon_entropy': shannon_entropy, 'token_bits_entropy': bits_entropy}

        # Deny user gen if entropy below 128 bits or 0.7 shannon heterogeneity
        if bits_entropy < 128 or shannon_entropy < 0.7:
            context['bad_request'] = 'The token does not have enough entropy'
            return Response(context, status=status.HTTP_400_BAD_REQUEST)

        # Hashes the token, only 1 iteration. Maybe more is better.
        hash = hashlib.sha256(str.encode(token)).hexdigest() 

        # Generate nickname
        nickname = self.NickGen.short_from_SHA256(hash, max_length=18)[0] 
        context['nickname'] = nickname

        # Generate avatar
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

        # TO DO. Pressing "give me another" deletes the logged in user
        # However it might be a long time recovered user
        # Only delete if user live is < 5 minutes

        # TODO check if user exists AND it is not a maker or taker!
        if user is not None:
            logout(request)
            user.delete()

            return Response({'user_deleted':'User deleted permanently'},status=status.HTTP_302_FOUND)

        return Response(status=status.HTTP_403_FORBIDDEN)

class BookView(ListAPIView):
    serializer_class = ListOrderSerializer

    def get(self,request, format=None):
        currency = request.GET.get('currency')
        print("currency:", currency)
        type = request.GET.get('type') 
        queryset = Order.objects.filter(currency=currency, type=type, status=int(Order.Status.PUB)) 
        if len(queryset)== 0:
            return Response({'not_found':'No orders found, be the first to make one'}, status=status.HTTP_404_NOT_FOUND)

        queryset = queryset.order_by('created_at')
        book_data = []
        for order in queryset:
            data = ListOrderSerializer(order).data
            user = User.objects.filter(id=data['maker'])
            if len(user) == 1:
                data['maker_nick'] = user[0].username
            # Non participants should not see the status or who is the taker
            for key in ('status','taker'):
                del data[key]
            book_data.append(data)
        
        return Response(book_data, status=status.HTTP_200_OK)

def get_currencies_json(request):
    currency_dict = json.load(open('./api/currencies.json'))
    return HttpResponse(json.dumps(currency_dict),content_type="application/json")

        


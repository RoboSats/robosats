from rest_framework import status, viewsets
from rest_framework.generics import CreateAPIView, ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User

from .serializers import ListOrderSerializer, MakeOrderSerializer, UpdateOrderSerializer
from .models import LNPayment, Order
from .logics import Logics

from .nick_generator.nick_generator import NickGenerator
from robohash import Robohash
from scipy.stats import entropy
from math import log2
import numpy as np
import hashlib
from pathlib import Path
from datetime import timedelta
from django.utils import timezone
from decouple import config

EXP_MAKER_BOND_INVOICE = int(config('EXP_MAKER_BOND_INVOICE'))
FEE = float(config('FEE'))

avatar_path = Path('frontend/static/assets/avatars')
avatar_path.mkdir(parents=True, exist_ok=True)

# Create your views here.

class MakerView(CreateAPIView):
    serializer_class  = MakeOrderSerializer

    def post(self,request):
        serializer = self.serializer_class(data=request.data)

        if not serializer.is_valid(): return Response(status=status.HTTP_400_BAD_REQUEST)

        type = serializer.data.get('type')
        currency = serializer.data.get('currency')
        amount = serializer.data.get('amount')
        payment_method = serializer.data.get('payment_method')
        premium = serializer.data.get('premium')
        satoshis = serializer.data.get('satoshis')
        is_explicit = serializer.data.get('is_explicit')

        valid, context = Logics.validate_already_maker_or_taker(request.user)
        if not valid: return Response(context, status.HTTP_409_CONFLICT)

        # Creates a new order
        order = Order(
            type=type,
            currency=currency,
            amount=amount,
            payment_method=payment_method,
            premium=premium,
            satoshis=satoshis,
            is_explicit=is_explicit,
            expires_at=timezone.now()+timedelta(minutes=EXP_MAKER_BOND_INVOICE), # TODO Move to class method
            maker=request.user)
        
        # TODO move to Order class method when new instance is created!
        order.last_satoshis = order.t0_satoshis = Logics.satoshis_now(order)

        valid, context = Logics.validate_order_size(order)
        if not valid: return Response(context, status.HTTP_400_BAD_REQUEST)
        
        order.save()
        return Response(ListOrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderView(viewsets.ViewSet):
    serializer_class = UpdateOrderSerializer
    lookup_url_kwarg = 'order_id'

    def get(self, request, format=None):
        '''
        Full trade pipeline takes place while looking/refreshing the order page.
        '''
        order_id = request.GET.get(self.lookup_url_kwarg)

        if order_id == None:
            return Response({'bad_request':'Order ID parameter not found in request'}, status=status.HTTP_400_BAD_REQUEST)
        
        order = Order.objects.filter(id=order_id)

        # check if exactly one order is found in the db
        if len(order) != 1 :
            return Response({'bad_request':'Invalid Order Id'}, status.HTTP_404_NOT_FOUND)
        
        # This is our order.
        order = order[0]

        # 1) If order expired
        if order.status == Order.Status.EXP:
            return Response({'bad_request':'This order has expired'},status.HTTP_400_BAD_REQUEST)

        # 2) If order cancelled
        if order.status == Order.Status.UCA:
            return Response({'bad_request':'This order has been cancelled by the maker'},status.HTTP_400_BAD_REQUEST)
        if order.status == Order.Status.CCA:
            return Response({'bad_request':'This order has been cancelled collaborativelly'},status.HTTP_400_BAD_REQUEST)

        data = ListOrderSerializer(order).data

        # Add booleans if user is maker, taker, partipant, buyer or seller
        data['is_maker'] = order.maker == request.user
        data['is_taker'] = order.taker == request.user
        data['is_participant'] = data['is_maker'] or data['is_taker']
        
        # 3) If not a participant and order is not public, forbid.
        if not data['is_participant'] and order.status != Order.Status.PUB:
            return Response({'bad_request':'You are not allowed to see this order'},status.HTTP_403_FORBIDDEN)
        
        # 4) Non participants can view details (but only if PUB)
        elif not data['is_participant'] and order.status != Order.Status.PUB:
            return Response(data, status=status.HTTP_200_OK) 

        # For participants add position side, nicks and status as message
        data['is_buyer'] = Logics.is_buyer(order,request.user)
        data['is_seller'] = Logics.is_seller(order,request.user)
        data['maker_nick'] = str(order.maker)
        data['taker_nick'] = str(order.taker)
        data['status_message'] = Order.Status(order.status).label
        data['is_fiat_sent'] = order.is_fiat_sent
        data['is_disputed'] = order.is_disputed

        # If both bonds are locked, participants can see the trade in sats is also final.
        if order.taker_bond:
            if order.maker_bond.status == order.taker_bond.status == LNPayment.Status.LOCKED:
                # Seller sees the amount he pays
                if data['is_seller']:
                    data['trade_satoshis'] = order.last_satoshis
                # Buyer sees the amount he receives
                elif data['is_buyer']:
                    data['trade_satoshis'] = Logics.buyer_invoice_amount(order, request.user)[1]['invoice_amount']

        # 5) If status is 'waiting for maker bond' and user is MAKER, reply with a MAKER HODL invoice.
        if order.status == Order.Status.WFB and data['is_maker']:
            valid, context = Logics.gen_maker_hodl_invoice(order, request.user)
            if valid:
                data = {**data, **context}
            else:
                return Response(context, status.HTTP_400_BAD_REQUEST)
        
        # 6)  If status is 'waiting for taker bond' and user is TAKER, reply with a TAKER HODL invoice.
        elif order.status == Order.Status.TAK and data['is_taker']:
            valid, context = Logics.gen_taker_hodl_invoice(order, request.user)
            if valid:
                data = {**data, **context}
            else:
                return Response(context, status.HTTP_400_BAD_REQUEST)
        
        # 7 a. ) If seller and status is 'WF2' or 'WFE' 
        elif data['is_seller'] and (order.status == Order.Status.WF2 or order.status == Order.Status.WFE):

            # If the two bonds are locked, reply with an ESCROW HODL invoice.
            if order.maker_bond.status == order.taker_bond.status == LNPayment.Status.LOCKED:
                valid, context = Logics.gen_escrow_hodl_invoice(order, request.user)
                if valid:
                    data = {**data, **context}
                else:
                    return Response(context, status.HTTP_400_BAD_REQUEST)

        # 7.b) If user is Buyer and status is 'WF2' or 'WFI' 
        elif data['is_buyer'] and (order.status == Order.Status.WF2 or order.status == Order.Status.WFI):

            # If the two bonds are locked, reply with an AMOUNT so he can send the buyer invoice.
            if order.maker_bond.status == order.taker_bond.status == LNPayment.Status.LOCKED:
                valid, context = Logics.buyer_invoice_amount(order, request.user)
                if valid:
                    data = {**data, **context}
                else:
                    return Response(context, status.HTTP_400_BAD_REQUEST)

        # 8) If status is 'CHA'or '' or '' and all HTLCS are in LOCKED
        elif order.status == Order.Status.CHA: # TODO Add the other status
            if order.maker_bond.status == order.taker_bond.status == order.trade_escrow.status == LNPayment.Status.LOCKED:
                # add whether a collaborative cancel is pending
                data['pending_cancel'] = order.is_pending_cancel
        
        # 9) if buyer confirmed FIAT SENT
        elif order.status == Order.Status.FSE:
                data['buyer_confirmed']
        
        return Response(data, status.HTTP_200_OK)

    def take_update_confirm_dispute_cancel(self, request, format=None):
        '''
        Here take place all of the user updates to the order object.
        That is: take, confim, cancel, dispute, update_invoice or rate.
        '''
        order_id = request.GET.get(self.lookup_url_kwarg)

        serializer = UpdateOrderSerializer(data=request.data)
        if not serializer.is_valid(): return Response(status=status.HTTP_400_BAD_REQUEST)
        
        order = Order.objects.get(id=order_id)

        # action is either 1)'take', 2)'confirm', 3)'cancel', 4)'dispute' , 5)'update_invoice' 6)'rate' (counterparty)
        action = serializer.data.get('action') 
        invoice = serializer.data.get('invoice')
        rating = serializer.data.get('rating')

        # 1) If action is take, it is be taker request!
        if action == 'take':
            if order.status == Order.Status.PUB: 
                valid, context = Logics.validate_already_maker_or_taker(request.user)
                if not valid: return Response(context, status=status.HTTP_409_CONFLICT)

                Logics.take(order, request.user)
            else: Response({'bad_request':'This order is not public anymore.'}, status.HTTP_400_BAD_REQUEST)

        # Any other action is only allowed if the user is a participant
        if not (order.maker == request.user or order.taker == request.user):
            return Response({'bad_request':'You are not a participant in this order'}, status.HTTP_403_FORBIDDEN)

        # 2) If action is 'update invoice'
        if action == 'update_invoice' and invoice:
            valid, context = Logics.update_invoice(order,request.user,invoice)
            if not valid: return Response(context, status.HTTP_400_BAD_REQUEST)
        
        # 3) If action is cancel
        elif action == 'cancel':
            valid, context = Logics.cancel_order(order,request.user)
            if not valid: return Response(context, status.HTTP_400_BAD_REQUEST)

        # 4) If action is confirm
        elif action == 'confirm':
            valid, context = Logics.confirm_fiat(order,request.user)
            if not valid: return Response(context, status.HTTP_400_BAD_REQUEST)

        # 5) If action is dispute
        elif action == 'dispute':
            valid, context = Logics.open_dispute(order,request.user, rating)
            if not valid: return Response(context, status.HTTP_400_BAD_REQUEST)

        # 6) If action is rate
        elif action == 'rate' and rating:
            valid, context = Logics.rate_counterparty(order,request.user, rating)
            if not valid: return Response(context, status.HTTP_400_BAD_REQUEST)

        # If nothing of the above... something else is going on. Probably not allowed!
        else:
            return Response(
                {'bad_request':
                'The Robotic Satoshis working in the warehouse did not understand you. ' + 
                'Please, fill a Bug Issue in Github https://github.com/Reckless-Satoshi/robosats/issues'},
                status.HTTP_501_NOT_IMPLEMENTED)

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

        # Create new credentials and log in if nickname is new
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
                return Response(context, status.HTTP_403_FORBIDDEN)

    def delete(self,request):
        ''' Pressing "give me another" deletes the logged in user '''
        user = request.user
        if not user:
            return Response(status.HTTP_403_FORBIDDEN)

        # Only delete if user life is shorter than 30 minutes. Helps deleting users by mistake
        if user.date_joined < (timezone.now() - timedelta(minutes=30)):
            return Response(status.HTTP_400_BAD_REQUEST)

        # Check if it is not a maker or taker!
        if not Logics.validate_already_maker_or_taker(user):
            return Response({'bad_request':'User cannot be deleted while he is part of an order'}, status.HTTP_400_BAD_REQUEST)

        logout(request)
        user.delete()
        return Response({'user_deleted':'User deleted permanently'}, status.HTTP_301_MOVED_PERMANENTLY)

        

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

class InfoView(ListAPIView):

    def get(self, request):
        context = {}

        context['num_public_buy_orders'] = len(Order.objects.filter(type=Order.Types.BUY, status=Order.Status.PUB))
        context['num_public_sell_orders'] = len(Order.objects.filter(type=Order.Types.BUY, status=Order.Status.PUB))
        context['last_day_avg_btc_premium'] = None # Todo
        context['num_active_robots'] = None 
        context['total_volume'] = None

        return Response(context, status.HTTP_200_OK)
        


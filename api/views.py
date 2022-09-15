import os
from re import T
from django.db.models import Sum, Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.exceptions import bad_request
from rest_framework.generics import CreateAPIView, ListAPIView, UpdateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
import textwrap

from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User

from api.serializers import InfoSerializer, ListOrderSerializer, MakeOrderSerializer, OrderPublicSerializer, UpdateOrderSerializer, ClaimRewardSerializer, PriceSerializer, UserGenSerializer, TickSerializer, StealthSerializer
from api.models import LNPayment, MarketTick, OnchainPayment, Order, Currency, Profile
from control.models import AccountingDay, BalanceLog
from api.logics import Logics
from api.messages import Telegram
from secrets import token_urlsafe
from api.utils import get_lnd_version, get_commit_robosats, compute_premium_percentile, compute_avg_premium

from .nick_generator.nick_generator import NickGenerator
from robohash import Robohash
from scipy.stats import entropy
from math import log2
import numpy as np
import hashlib
from pathlib import Path
from datetime import timedelta, datetime
from django.utils import timezone
from django.conf import settings
from decouple import config

EXP_MAKER_BOND_INVOICE = int(config("EXP_MAKER_BOND_INVOICE"))
RETRY_TIME = int(config("RETRY_TIME"))
PUBLIC_DURATION = 60*60*int(config("DEFAULT_PUBLIC_ORDER_DURATION"))-1
ESCROW_DURATION = 60 * int(config("INVOICE_AND_ESCROW_DURATION"))
BOND_SIZE = int(config("DEFAULT_BOND_SIZE"))

avatar_path = Path(settings.AVATAR_ROOT)
avatar_path.mkdir(parents=True, exist_ok=True)

# Create your views here.


class MakerView(CreateAPIView):
    serializer_class = MakeOrderSerializer

    @extend_schema(
        summary='Create a maker order',
        description=textwrap.dedent(
            f"""
            Create a new order as a maker.

            
            Default values for the following fields if not specified:
            - `public_duration` - **{PUBLIC_DURATION}**
            - `escrow_duration` - **{ESCROW_DURATION}**
            - `bond_size` -  **{BOND_SIZE}**
            - `bondless_taker` - **false**
            - `has_range` - **false**
            - `premium` - **0**
            """
        ),
        responses={
            201: ListOrderSerializer,
            400: {
                'type': 'object',
                'properties': {
                    'bad_request': {
                        'type': 'string',
                        'description': 'Reason for the failure',
                    },
                },
            },
            409: {
                'type': 'object',
                'properties': {
                    'bad_request': {
                        'type': 'string',
                        'description': 'Reason for the failure',
                    },
                },
            }
        }
    )
    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        if not request.user.is_authenticated:
            return Response(
                {
                    "bad_request":
                    "Woops! It seems you do not have a robot avatar"
                },
                status.HTTP_400_BAD_REQUEST,
            )

        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST)

        # In case it gets overwhelming. Limit the number of public orders.
        if Order.objects.filter(status=Order.Status.PUB).count() >= int(config("MAX_PUBLIC_ORDERS")):
            return Response(
                {
                    "bad_request":
                    "Woah! RoboSats' book is at full capacity! Try again later"
                },
                status.HTTP_400_BAD_REQUEST,
            )
        # Only allow users who are not already engaged in an order
        valid, context, _ = Logics.validate_already_maker_or_taker(request.user)
        if not valid:
            return Response(context, status.HTTP_409_CONFLICT)

        type = serializer.data.get("type")
        currency = serializer.data.get("currency")
        amount = serializer.data.get("amount")
        has_range = serializer.data.get("has_range")
        min_amount = serializer.data.get("min_amount")
        max_amount = serializer.data.get("max_amount")
        payment_method = serializer.data.get("payment_method")
        premium = serializer.data.get("premium")
        satoshis = serializer.data.get("satoshis")
        is_explicit = serializer.data.get("is_explicit")
        public_duration = serializer.data.get("public_duration")
        escrow_duration = serializer.data.get("escrow_duration")
        bond_size = serializer.data.get("bond_size")
        bondless_taker = serializer.data.get("bondless_taker")

        # Optional params
        if public_duration == None: public_duration = PUBLIC_DURATION
        if escrow_duration == None: escrow_duration = ESCROW_DURATION
        if bond_size == None: bond_size = BOND_SIZE
        if bondless_taker == None: bondless_taker = False
        if has_range == None: has_range = False

        # An order can either have an amount or a range (min_amount and max_amount)
        if has_range:
            amount = None
        else:
            min_amount = None
            max_amount = None

        # Either amount or min_max has to be specified.
        if has_range and (min_amount == None or max_amount == None):
            return Response(
                {
                    "bad_request":
                    "You must specify min_amount and max_amount for a range order"
                },
                status.HTTP_400_BAD_REQUEST,
            )
        elif not has_range and amount == None:
            return Response(
                {
                    "bad_request":
                    "You must specify an order amount"
                },
                status.HTTP_400_BAD_REQUEST,
            )


        # Creates a new order
        order = Order(
            type=type,
            currency=Currency.objects.get(id=currency),
            amount=amount,
            has_range=has_range,
            min_amount=min_amount,
            max_amount=max_amount,
            payment_method=payment_method,
            premium=premium,
            satoshis=satoshis,
            is_explicit=is_explicit,
            expires_at=timezone.now() + timedelta(
                seconds=EXP_MAKER_BOND_INVOICE),
            maker=request.user,
            public_duration=public_duration,
            escrow_duration=escrow_duration,
            bond_size=bond_size,
            bondless_taker=bondless_taker,
        )

        order.last_satoshis = order.t0_satoshis = Logics.satoshis_now(order)

        valid, context = Logics.validate_order_size(order)
        if not valid:
            return Response(context, status.HTTP_400_BAD_REQUEST)

        order.save()
        return Response(ListOrderSerializer(order).data,
                        status=status.HTTP_201_CREATED)


class OrderView(viewsets.ViewSet):
    serializer_class = UpdateOrderSerializer
    lookup_url_kwarg = "order_id"

    @extend_schema(
        summary='[WIP] Get order',
        description=textwrap.dedent(
            """
            **NOT COMPLETE**
            """
        ),
        parameters=[
            OpenApiParameter(
                name='order_id',
                location=OpenApiParameter.QUERY,
                required=True,
                type=int,
            ),
        ],
        responses={
        #     201: ListOrderSerializer,
            400: {
                'type': 'object',
                'properties': {
                    'bad_request': {
                        'type': 'string',
                        'description': 'Reason for the failure',
                    },
                },
            },
            403: {
                'type': 'object',
                'properties': {
                    'bad_request': {
                        'type': 'string',
                        'description': 'Reason for the failure',
                        'default': 'This order is not available'
                    },
                },
            },
        #     409: {
        #         'type': 'object',
        #         'properties': {
        #             'bad_request': {
        #                 'type': 'string',
        #                 'description': 'Reason for the failure',
        #             },
        #         },
        #     }
        }
    )
    def get(self, request, format=None):
        """
        Full trade pipeline takes place while looking/refreshing the order page.
        """
        order_id = request.GET.get(self.lookup_url_kwarg)

        if not request.user.is_authenticated:
            return Response(
                {
                    "bad_request":
                    "You must have a robot avatar to see the order details"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order_id == None:
            return Response(
                {"bad_request": "Order ID parameter not found in request"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = Order.objects.filter(id=order_id)

        # check if exactly one order is found in the db
        if len(order) != 1:
            return Response({"bad_request": "Invalid Order Id"},
                            status.HTTP_404_NOT_FOUND)

        # This is our order.
        order = order[0]

        # 2) If order has been cancelled
        if order.status == Order.Status.UCA:
            return Response(
                {"bad_request": "This order has been cancelled by the maker"},
                status.HTTP_400_BAD_REQUEST,
            )
        if order.status == Order.Status.CCA:
            return Response(
                {
                    "bad_request":
                    "This order has been cancelled collaborativelly"
                },
                status.HTTP_400_BAD_REQUEST,
            )

        data = ListOrderSerializer(order).data
        data["total_secs_exp"] = order.t_to_expire(order.status)

        # if user is under a limit (penalty), inform him.
        is_penalized, time_out = Logics.is_penalized(request.user)
        if is_penalized:
            data["penalty"] = request.user.profile.penalty_expiration

        # Add booleans if user is maker, taker, partipant, buyer or seller
        data["is_maker"] = order.maker == request.user
        data["is_taker"] = order.taker == request.user
        data["is_participant"] = data["is_maker"] or data["is_taker"]

        # 3.a) If not a participant and order is not public, forbid.
        if not data["is_participant"] and order.status != Order.Status.PUB:
            return Response(
                {"bad_request": "This order is not available"},
                status.HTTP_403_FORBIDDEN,
            )

        # WRITE Update last_seen for maker and taker.
        # Note down that the taker/maker was here recently, so counterpart knows if the user is paying attention.
        if order.maker == request.user:
            order.maker_last_seen = timezone.now()
            order.save()
        if order.taker == request.user:
            order.taker_last_seen = timezone.now()
            order.save()

        # Add activity status of participants based on last_seen
        if order.taker_last_seen != None:
            data["taker_status"] = Logics.user_activity_status(
                order.taker_last_seen)
        if order.maker_last_seen != None:
            data["maker_status"] = Logics.user_activity_status(
                order.maker_last_seen)

        # 3.b If order is between public and WF2
        if order.status >= Order.Status.PUB and order.status < Order.Status.WF2:
            data["price_now"], data["premium_now"] = Logics.price_and_premium_now(order)

            # 3. c) If maker and Public/Paused, add premium percentile 
            # num similar orders, and maker information to enable telegram notifications.
            if data["is_maker"] and order.status in [Order.Status.PUB, Order.Status.PAU]:
                data["premium_percentile"] = compute_premium_percentile(order)
                data["num_similar_orders"] = len(
                    Order.objects.filter(currency=order.currency,
                                         status=Order.Status.PUB))
                # Adds/generate telegram token and whether it is enabled
                data = {**data,**Telegram.get_context(request.user)}

        # 4) Non participants can view details (but only if PUB)
        elif not data["is_participant"] and order.status != Order.Status.PUB:
            return Response(data, status=status.HTTP_200_OK)

        # For participants add positions, nicks and status as a message and hold invoices status
        data["is_buyer"] = Logics.is_buyer(order, request.user)
        data["is_seller"] = Logics.is_seller(order, request.user)
        data["maker_nick"] = str(order.maker)
        data["taker_nick"] = str(order.taker)
        data["status_message"] = Order.Status(order.status).label
        data["is_fiat_sent"] = order.is_fiat_sent
        data["is_disputed"] = order.is_disputed
        data["ur_nick"] = request.user.username

        # Add whether hold invoices are LOCKED (ACCEPTED)
        # Is there a maker bond? If so, True if locked, False otherwise
        if order.maker_bond:
            data[
                "maker_locked"] = order.maker_bond.status == LNPayment.Status.LOCKED
        else:
            data["maker_locked"] = False

        # Is there a taker bond? If so, True if locked, False otherwise
        if order.taker_bond:
            data[
                "taker_locked"] = order.taker_bond.status == LNPayment.Status.LOCKED
        else:
            data["taker_locked"] = False

        # Is there an escrow? If so, True if locked, False otherwise
        if order.trade_escrow:
            data[
                "escrow_locked"] = order.trade_escrow.status == LNPayment.Status.LOCKED
        else:
            data["escrow_locked"] = False

        # If both bonds are locked, participants can see the final trade amount in sats.
        if order.taker_bond:
            if (order.maker_bond.status == order.taker_bond.status ==
                    LNPayment.Status.LOCKED):
                # Seller sees the amount he sends
                if data["is_seller"]:
                    data["trade_satoshis"] = Logics.escrow_amount(
                        order, request.user)[1]["escrow_amount"]
                # Buyer sees the amount he receives
                elif data["is_buyer"]:
                    data["trade_satoshis"] = Logics.payout_amount(
                        order, request.user)[1]["invoice_amount"]

        # 5) If status is 'waiting for maker bond' and user is MAKER, reply with a MAKER hold invoice.
        if order.status == Order.Status.WFB and data["is_maker"]:
            valid, context = Logics.gen_maker_hold_invoice(order, request.user)
            if valid:
                data = {**data, **context}
            else:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 6)  If status is 'waiting for taker bond' and user is TAKER, reply with a TAKER hold invoice.
        elif order.status == Order.Status.TAK and data["is_taker"]:
            valid, context = Logics.gen_taker_hold_invoice(order, request.user)
            if valid:
                data = {**data, **context}
            else:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 7 a. ) If seller and status is 'WF2' or 'WFE'
        elif data["is_seller"] and (order.status == Order.Status.WF2
                                    or order.status == Order.Status.WFE):
            # If the two bonds are locked, reply with an ESCROW hold invoice.
            if (order.maker_bond.status == order.taker_bond.status ==
                    LNPayment.Status.LOCKED):
                valid, context = Logics.gen_escrow_hold_invoice(
                    order, request.user)
                if valid:
                    data = {**data, **context}
                else:
                    return Response(context, status.HTTP_400_BAD_REQUEST)

        # 7.b) If user is Buyer and status is 'WF2' or 'WFI'
        elif data["is_buyer"] and (order.status == Order.Status.WF2
                                   or order.status == Order.Status.WFI):

            # If the two bonds are locked, reply with an AMOUNT and onchain swap cost so he can send the buyer invoice/address.
            if (order.maker_bond.status == order.taker_bond.status ==
                    LNPayment.Status.LOCKED):
                valid, context = Logics.payout_amount(order, request.user)
                if valid:
                    data = {**data, **context}
                else:
                    return Response(context, status.HTTP_400_BAD_REQUEST)

        # 8) If status is 'CHA' or 'FSE' and all HTLCS are in LOCKED
        elif order.status in [
                Order.Status.WFI, Order.Status.CHA, Order.Status.FSE
        ]:
            # If all bonds are locked.
            if (order.maker_bond.status == order.taker_bond.status ==
                    order.trade_escrow.status == LNPayment.Status.LOCKED):
                # add whether a collaborative cancel is pending or has been asked
                if (data["is_maker"] and order.taker_asked_cancel) or (
                        data["is_taker"] and order.maker_asked_cancel):
                    data["pending_cancel"] = True
                elif (data["is_maker"] and order.maker_asked_cancel) or (
                        data["is_taker"] and order.taker_asked_cancel):
                    data["asked_for_cancel"] = True
                else:
                    data["asked_for_cancel"] = False

        # 9) If status is 'DIS' and all HTLCS are in LOCKED
        elif order.status == Order.Status.DIS:

            # add whether the dispute statement has been received
            if data["is_maker"]:
                data["statement_submitted"] = (order.maker_statement != None
                                               and order.maker_statement != "")
            elif data["is_taker"]:
                data["statement_submitted"] = (order.taker_statement != None
                                               and order.taker_statement != "")

        # 9) If status is 'Failed routing', reply with retry amounts, time of next retry and ask for invoice at third.
        elif (order.status == Order.Status.FAI
              and order.payout.receiver == request.user
              ):  # might not be the buyer if after a dispute where winner wins
            data["retries"] = order.payout.routing_attempts
            data["next_retry_time"] = order.payout.last_routing_time + timedelta(
                    minutes=RETRY_TIME)
            if order.payout.failure_reason:
                data["failure_reason"] = LNPayment.FailureReason(order.payout.failure_reason).label

            if order.payout.status == LNPayment.Status.EXPIRE:
                data["invoice_expired"] = True
                # Add invoice amount once again if invoice was expired.
                data["invoice_amount"] = Logics.payout_amount(order,request.user)[1]["invoice_amount"]

        # 10) If status is 'Expired', "Sending", "Finished" or "failed routing", add info for renewal:
        elif order.status in [Order.Status.EXP, Order.Status.SUC, Order.Status.PAY,  Order.Status.FAI]:
            data["public_duration"] = order.public_duration
            data["bond_size"] = order.bond_size
            data["bondless_taker"] = order.bondless_taker

            # Adds trade summary
            if order.status in [Order.Status.SUC, Order.Status.PAY,  Order.Status.FAI]:
                valid, context = Logics.summarize_trade(order, request.user)
                if valid:
                    data = {**data, **context}

            # If status is 'Expired' add expiry reason
            if order.status == Order.Status.EXP:
                data["expiry_reason"] = order.expiry_reason
                data["expiry_message"] = Order.ExpiryReasons(order.expiry_reason).label

            # If status is 'Succes' add final stats and txid if it is a swap
            if order.status == Order.Status.SUC:
                # If buyer and is a swap, add TXID
                if Logics.is_buyer(order,request.user):
                    if order.is_swap:
                        data["num_satoshis"] = order.payout_tx.num_satoshis
                        data["sent_satoshis"] = order.payout_tx.sent_satoshis
                        if order.payout_tx.status in [OnchainPayment.Status.MEMPO, OnchainPayment.Status.CONFI]:
                            data["txid"] = order.payout_tx.txid
                            data["network"] = str(config("NETWORK"))
                            

            
        return Response(data, status.HTTP_200_OK)

    @extend_schema(
        summary='[WIP] Update order',
        description=textwrap.dedent(
            """
            **NOT COMPLETE**
            """
        ),
        parameters=[
            OpenApiParameter(
                name='order_id',
                location=OpenApiParameter.QUERY,
                required=True,
                type=int,
            ),
        ],
        responses={
        #     201: ListOrderSerializer,
            400: {
                'type': 'object',
                'properties': {
                    'bad_request': {
                        'type': 'string',
                        'description': 'Reason for the failure',
                    },
                },
            },
            403: {
                'type': 'object',
                'properties': {
                    'bad_request': {
                        'type': 'string',
                        'description': 'Reason for the failure',
                        'default': 'This order is not available'
                    },
                },
            },
        #     409: {
        #         'type': 'object',
        #         'properties': {
        #             'bad_request': {
        #                 'type': 'string',
        #                 'description': 'Reason for the failure',
        #             },
        #         },
        #     }
        }
    )
    def take_update_confirm_dispute_cancel(self, request, format=None):
        """
        Here takes place all of the updates to the order object.
        That is: take, confim, cancel, dispute, update_invoice or rate.
        """
        order_id = request.GET.get(self.lookup_url_kwarg)

        serializer = UpdateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.get(id=order_id)

        # action is either 1)'take', 2)'confirm', 3)'cancel', 4)'dispute' , 5)'update_invoice'
        # 5.b)'update_address' 6)'submit_statement' (in dispute), 7)'rate_user' , 8)'rate_platform'
        action = serializer.data.get("action")
        invoice = serializer.data.get("invoice")
        address = serializer.data.get("address")
        mining_fee_rate = serializer.data.get("mining_fee_rate")
        statement = serializer.data.get("statement")
        rating = serializer.data.get("rating")

        # 1) If action is take, it is a taker request!
        if action == "take":
            if order.status == Order.Status.PUB:
                valid, context, _ = Logics.validate_already_maker_or_taker(
                    request.user)
                if not valid:
                    return Response(context, status=status.HTTP_409_CONFLICT)

                # For order with amount range, set the amount now.
                if order.has_range:
                    amount = float(serializer.data.get("amount"))
                    valid, context = Logics.validate_amount_within_range(order, amount)
                    if not valid:
                        return Response(context, status=status.HTTP_400_BAD_REQUEST)

                    valid, context = Logics.take(order, request.user, amount)
                else:
                    valid, context = Logics.take(order, request.user)
                if not valid:
                    return Response(context, status=status.HTTP_403_FORBIDDEN)

                return self.get(request)

            else:
                Response(
                    {"bad_request": "This order is not public anymore."},
                    status.HTTP_400_BAD_REQUEST,
                )

        # Any other action is only allowed if the user is a participant
        if not (order.maker == request.user or order.taker == request.user):
            return Response(
                {"bad_request": "You are not a participant in this order"},
                status.HTTP_403_FORBIDDEN,
            )

        # 2) If action is 'update invoice'
        elif action == "update_invoice":
            valid, context = Logics.update_invoice(order, request.user,
                                                   invoice)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)
        
        # 2.b) If action is 'update address'
        elif action == "update_address":
            valid, context = Logics.update_address(order, request.user,
                                                   address, mining_fee_rate)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 3) If action is cancel
        elif action == "cancel":
            valid, context = Logics.cancel_order(order, request.user)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 4) If action is confirm
        elif action == "confirm":
            valid, context = Logics.confirm_fiat(order, request.user)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 5) If action is dispute
        elif action == "dispute":
            valid, context = Logics.open_dispute(order, request.user)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        elif action == "submit_statement":
            valid, context = Logics.dispute_statement(order, request.user,
                                                      statement)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 6) If action is rate
        elif action == "rate_user" and rating:
            valid, context = Logics.rate_counterparty(order, request.user,
                                                      rating)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 7) If action is rate_platform
        elif action == "rate_platform" and rating:
            valid, context = Logics.rate_platform(request.user, rating)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 8) If action is rate_platform
        elif action == "pause":
            valid, context = Logics.pause_unpause_public_order(order, request.user)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # If nothing of the above... something else is going on. Probably not allowed!
        else:
            return Response(
                {
                    "bad_request":
                    "The Robotic Satoshis working in the warehouse did not understand you. "
                    +
                    "Please, fill a Bug Issue in Github https://github.com/reckless-satoshi/robosats/issues"
                },
                status.HTTP_501_NOT_IMPLEMENTED,
            )

        return self.get(request)


class UserView(APIView):
    NickGen = NickGenerator(lang="English",
                            use_adv=False,
                            use_adj=True,
                            use_noun=True,
                            max_num=999)

    serializer_class = UserGenSerializer

    def get(self, request, format=None):
        """
        **[DEPRECATED]**
        The old way to generate a robot and login.
        Only for login. No new users allowed. Only available using API endpoint.
        Frontend does not support it anymore.

        Get a new user derived from a high entropy token

        - Request has a high-entropy token,
        - Generates new nickname and avatar.
        - Creates login credentials (new User object)
        Response with Avatar and Nickname.
        """
        context = {}
        # If an existing user opens the main page by mistake, we do not want it to create a new nickname/profile for him
        if request.user.is_authenticated:
            context = {"nickname": request.user.username}
            not_participant, _, order = Logics.validate_already_maker_or_taker(
                request.user)

            # Does not allow this 'mistake' if an active order
            if not not_participant:
                context["active_order_id"] = order.id
                context["bad_request"] = f"You are already logged in as {request.user} and have an active order"
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # Deprecated, kept temporarily for legacy reasons
        token = request.GET.get("token")                
                
        value, counts = np.unique(list(token), return_counts=True)
        shannon_entropy = entropy(counts, base=62)
        bits_entropy = log2(len(value)**len(token))

        # Hash the token, only 1 iteration.
        hash = hashlib.sha256(str.encode(token)).hexdigest()

        # Generate nickname deterministically
        nickname = self.NickGen.short_from_SHA256(hash, max_length=18)[0]
        context["nickname"] = nickname
        
        # Payload
        context = {
            "token_shannon_entropy": shannon_entropy,
            "token_bits_entropy": bits_entropy,
        }

        # Do not generate a new user for the old method! Only allow login.
        if len(User.objects.filter(username=nickname)) == 1:
            user = authenticate(request, username=nickname, password=token)
            if user is not None:
                login(request, user)
                # Sends the welcome back message, only if created +3 mins ago
                if request.user.date_joined < (timezone.now() -
                                            timedelta(minutes=3)):
                    context["found"] = "We found your Robot avatar. Welcome back!"
                return Response(context, status=status.HTTP_202_ACCEPTED)
            else:
                # It is unlikely, but maybe the nickname is taken (1 in 20 Billion change)
                context["found"] = "Bad luck, this nickname is taken"
                context["bad_request"] = "Enter a different token"
                return Response(context, status.HTTP_403_FORBIDDEN)

        elif len(User.objects.filter(username=nickname)) == 0:
            context["bad_request"] = "User Generation with explicit token deprecated. Only token_sha256 allowed."
            return Response(context, status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary='Create user',
        description=textwrap.dedent(
            """
            Create a new Robot 🤖

            `token_sha256` is the SHA256 hash of your token. Make sure you generate your token
            using cryptographically secure methods. [Here's]() the function the Javascript
            client uses to generate the tokens. Since the server only recieves the hash of the
            token, it trusts the client with computing `length`, `counts` and `unique_values`
            correctly. Check [here](https://github.com/Reckless-Satoshi/robosats/blob/main/frontend/src/utils/token.js#L13)
            to see how the Javascript client copmutes these values. These values are optional,
            but if provided, the api computes the entropy of the token adds two additional
            fields to the response JSON - `token_shannon_entropy` and `token_bits_entropy`.

            **Note: It is entirely the clients responsibilty to generate high entropy tokens, and the optional
            parameters are provided to act as an aid to help determine sufficient entropy, but the server is happy
            with just any sha256 hash you provide it**

            `public_key` - PGP key associated with the user (Armored ASCII format)
            `encrypted_private_key` - Private PGP key. This is only stored on the backend for later fetching by
            the frontend and the key can't really be used by the server since it's protected by the token
            that only the client knows. Will be made an optional parameter in a future release.
            On the Javascript client, It's passphrase is set to be the secret token generated.

            A gpg key can be created by:

            ```shell
            gpg --full-gen-key
            ```

            it's public key can be exported in ascii armored format with:

            ```shell
            gpg --export --armor <key-id | email | name>
            ```

            and it's private key can be exported in ascii armored format with:

            ```shell
            gpg --export-secret-keys --armor <key-id | email | name>
            ```

            """
        ),
        responses={
            201: {
                'type': 'object',
                'properties': {
                    'encrypted_private_key' : { 'type': 'string', 'description': 'Armored ASCII PGP private key block'},
                    'nickname' : { 'type': 'string', 'description': 'Username generated (Robot name)'},
                    'public_key' : { 'type': 'string', 'description': 'Armored ASCII PGP public key block'},
                    'referral_code': { 'type': 'string', 'description': 'User\'s referral code'},
                    'token_bits_entropy' : { 'type': 'integer'},
                    'token_shannon_entropy' : { 'type': 'integer'},
                    'wants_stealth': { 'type': 'boolean', 'default': False, 'description': 'Whether the user prefers stealth invoices'},
                }
            },
            202: {
                'type': 'object',
                'properties': {
                    'encrypted_private_key' : { 'type': 'string', 'description': 'Armored ASCII PGP private key block'},
                    'nickname' : { 'type': 'string', 'description': 'Username generated (Robot name)'},
                    'public_key' : { 'type': 'string', 'description': 'Armored ASCII PGP public key block'},
                    'referral_code': { 'type': 'string', 'description': 'User\'s referral code'},
                    'token_bits_entropy' : { 'type': 'integer'},
                    'token_shannon_entropy' : { 'type': 'integer'},
                    'wants_stealth': { 'type': 'boolean', 'default': False, 'description': 'Whether the user prefers stealth invoices'},
                    'found': { 'type': 'string', 'description': 'Welcome back message' },
                    'active_order_id': { 'type': 'integer', 'description': 'Active order id if present' },
                    'last_order_id': { 'type': 'integer', 'description': 'Last order id if present' },
                }
            },
            400: {
                'oneOf': [
                    {
                        'type': 'object',
                        'properties': {
                            'active_order_id': { 'type': 'string', 'description': 'Order id the robot is a maker/taker of'},
                            'nickname': { 'type': 'string', 'description': 'Username (Robot name)'},
                            'bad_request': {
                                'type': 'string',
                                'description': 'Reason for the failure',
                                'default': 'You are already logged in as {nickname} and have an active order'
                            },
                        },
                        'description': 'Response when you already authenticated and have an order'
                    },
                    {
                        'type': 'object',
                        'properties': {
                            'bad_request': {
                                'type': 'string',
                                'description': 'Reason for the failure',
                            },
                        },
                    },
                ]
            },
            403: {
                'type': 'object',
                'properties': {
                    'bad_request': {
                        'type': 'string',
                        'description': 'Reason for the failure',
                        'default': 'Enter a different token',
                    },
                    'found': { 'type': 'string', 'default': 'Bad luck, this nickname is taken' },
                },
            }
        },
        examples=[
            OpenApiExample('Successfuly created user',
                value={
                    "token_shannon_entropy": 0.7714559798089662,
                    "token_bits_entropy": 169.21582985307933,
                    "nickname": "StackerMan420",
                    "referral_code": "lfvv4-ppNi1",
                    "public_key": "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\n......\n......",
                    "encrypted_private_key": "-----BEGIN PGP PRIVATE KEY BLOCK-----\n\n......\n......",
                    "wants_stealth": False
                },
                status_codes=[201]
            ),
            OpenApiExample('Already authenticated and have an order',
                value={
                    'active_order_id': '42069',
                    'nickname': 'StackerMan210',
                    'bad_request': 'You are already logged in as {nickname} and have an active order'
                },
                status_codes=[400]
            ),
            OpenApiExample('When required token entropy not met',
                value={
                    'bad_request': 'The token does not have enough entropy'
                },
                status_codes=[400]
            ),
            OpenApiExample('Invalid PGP public key provided',
                value={
                    'bad_request': 'Your PGP public key does not seem valid'
                },
                status_codes=[400]
            ),
        ],
    )
    def post(self, request, format=None):
        """
        Get a new user derived from a high entropy token

        - Request has a hash of a high-entropy token
        - Request includes pubKey and encrypted privKey
        - Generates new nickname and avatar.
        - Creates login credentials (new User object)

        Response with Avatar, Nickname, pubKey, privKey.
        """
        context = {}
        serializer = self.serializer_class(data=request.data)

        # Return bad request if serializer is not valid         
        if not serializer.is_valid():
            context = {"bad_request": "Invalid serializer"}
            return Response(context, status=status.HTTP_400_BAD_REQUEST)

        # If an existing user opens the main page by mistake, we do not want it to create a new nickname/profile for him
        if request.user.is_authenticated:
            context = {"nickname": request.user.username}
            not_participant, _, order = Logics.validate_already_maker_or_taker(
                request.user)

            # Does not allow this 'mistake' if an active order
            if not not_participant:
                context["active_order_id"] = order.id
                context["bad_request"] = f"You are already logged in as {request.user} and have an active order"
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # The new way. The token is never sent. Only its SHA256
        token_sha256 = serializer.data.get("token_sha256")
        public_key = serializer.data.get("public_key")
        encrypted_private_key = serializer.data.get("encrypted_private_key")
        ref_code = serializer.data.get("ref_code")
        
        if not public_key or not encrypted_private_key:
            context["bad_request"] = "Must provide valid 'pub' and 'enc_priv' PGP keys"
            return Response(context, status.HTTP_400_BAD_REQUEST)

        valid, bad_keys_context, public_key, encrypted_private_key = Logics.validate_pgp_keys(public_key, encrypted_private_key)
        if not valid:
            return Response(bad_keys_context, status.HTTP_400_BAD_REQUEST)

        # Now the server only receives a hash of the token. So server trusts the client 
        # with computing length, counts and unique_values to confirm the high entropy of the token
        # In any case, it is up to the client if they want to create a bad high entropy token.

        # Submitting the three params needed to compute token entropy is not mandatory
        # If not submitted, avatars can be created with garbage entropy token. Frontend will always submit them.
        try:
            unique_values = serializer.data.get("unique_values")
            counts = serializer.data.get("counts")
            length = serializer.data.get("length")

            shannon_entropy = entropy(counts, base=62)
            bits_entropy = log2(unique_values**length)

            # Payload
            context = {
                "token_shannon_entropy": shannon_entropy,
                "token_bits_entropy": bits_entropy,
            }

            # Deny user gen if entropy below 128 bits or 0.7 shannon heterogeneity
            if bits_entropy < 128 or shannon_entropy < 0.7:
                context["bad_request"] = "The token does not have enough entropy"
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except:
            pass

        # Hash the token_sha256, only 1 iteration. (this is the second SHA256 of the user token, aka RoboSats ID)
        hash = hashlib.sha256(token_sha256.encode('utf-8')).hexdigest()

        # Generate nickname deterministically
        nickname = self.NickGen.short_from_SHA256(hash, max_length=18)[0]
        context["nickname"] = nickname

        # Generate avatar
        rh = Robohash(hash)
        rh.assemble(roboset="set1", bgset="any")  # for backgrounds ON

        # Does not replace image if existing (avoid re-avatar in case of nick collusion)
        image_path = avatar_path.joinpath(nickname + ".png")
        if not image_path.exists():
            with open(image_path, "wb") as f:
                rh.img.save(f, format="png", optimize=True)

        # Create new credentials and login if nickname is new
        if len(User.objects.filter(username=nickname)) == 0:
            User.objects.create_user(username=nickname,
                                     password=token_sha256,
                                     is_staff=False)
            user = authenticate(request, username=nickname, password=token_sha256)
            login(request, user)

            context['referral_code'] = token_urlsafe(8)
            user.profile.referral_code = context['referral_code']
            user.profile.avatar = "static/assets/avatars/" + nickname + ".png"
            
            # Noticed some PGP keys replaced at re-login. Should not happen. 
            # Let's implement this sanity check "If profile has not keys..."
            if not user.profile.public_key:
                user.profile.public_key = public_key
            if not user.profile.encrypted_private_key:
                user.profile.encrypted_private_key = encrypted_private_key

            # If the ref_code was created by another robot, this robot was referred.
            queryset = Profile.objects.filter(referral_code=ref_code)
            if len(queryset) == 1:
                user.profile.is_referred = True
                user.profile.referred_by = queryset[0]

            user.profile.wants_stealth = False

            user.profile.save()

            context["public_key"] = user.profile.public_key
            context["encrypted_private_key"] = user.profile.encrypted_private_key
            context["wants_stealth"] = user.profile.wants_stealth
            return Response(context, status=status.HTTP_201_CREATED)

        # log in user and return pub/priv keys if existing
        else:
            user = authenticate(request, username=nickname, password=token_sha256)
            if user is not None:
                login(request, user)
                context["public_key"] = user.profile.public_key
                context["encrypted_private_key"] = user.profile.encrypted_private_key
                context["earned_rewards"] = user.profile.earned_rewards
                context["referral_code"] = str(user.profile.referral_code)
                context["wants_stealth"] = user.profile.wants_stealth

                # return active order or last made order if any
                has_no_active_order, _, order = Logics.validate_already_maker_or_taker(request.user)
                if not has_no_active_order:
                    context["active_order_id"] = order.id
                else:
                    last_order = Order.objects.filter(Q(maker=request.user) | Q(taker=request.user)).last()
                    if last_order:
                        context["last_order_id"] = last_order.id
                        
                # Sends the welcome back message, only if created +3 mins ago
                if request.user.date_joined < (timezone.now() - timedelta(minutes=3)):
                    context["found"] = "We found your Robot avatar. Welcome back!"
                return Response(context, status=status.HTTP_202_ACCEPTED)
            else:
                # It is unlikely, but maybe the nickname is taken (1 in 20 Billion chance)
                context["found"] = "Bad luck, this nickname is taken"
                context["bad_request"] = "Enter a different token"
                return Response(context, status.HTTP_403_FORBIDDEN)

    @extend_schema(
        summary='Delete user',
        description=textwrap.dedent(
            """
            Delete a Robot. Deleting a robot is not allowed if the robot has an active order, has had completed trades or was created more than 30 mins ago.
            Mainly used on the frontend to "Generate new Robot" without flooding the DB with discarded robots.
            """
        ),
        responses={
            403: {},
            400: {
                'type': 'object',
                'properties': {
                    'bad_request': {
                        'type': 'string',
                        'description': 'Reason for the failure',
                    },
                },
            },
            301: {
                'type': 'object',
                'properties': {
                    'user_deleted': {
                        'type': 'string',
                        'default': 'User deleted permanently',
                    },
                },
            }
        }
    )
    def delete(self, request):
        """Pressing "give me another" deletes the logged in user"""
        user = request.user
        if not user.is_authenticated:
            return Response(status.HTTP_403_FORBIDDEN)

        # Only delete if user life is shorter than 30 minutes. Helps to avoid deleting users by mistake
        if user.date_joined < (timezone.now() - timedelta(minutes=30)):
            return Response(status.HTTP_400_BAD_REQUEST)

        # Check if it is not a maker or taker!
        not_participant, _, _ = Logics.validate_already_maker_or_taker(user)
        if not not_participant:
            return Response(
                {
                    "bad_request":
                    "Maybe a mistake? User cannot be deleted while he is part of an order"
                },
                status.HTTP_400_BAD_REQUEST,
            )
        # Check if has already a profile with
        if user.profile.total_contracts > 0:
            return Response(
                {
                    "bad_request":
                    "Maybe a mistake? User cannot be deleted as it has completed trades"
                },
                status.HTTP_400_BAD_REQUEST,
            )

        logout(request)
        user.delete()
        return Response(
            {"user_deleted": "User deleted permanently"},
            status.HTTP_301_MOVED_PERMANENTLY,
        )


class BookView(ListAPIView):
    serializer_class = OrderPublicSerializer
    queryset = Order.objects.filter(status=Order.Status.PUB)

    @extend_schema(
        summary='Get public orders',
        description='Get public orders in the book.',
        parameters=[
            OpenApiParameter(
                name='currency',
                location=OpenApiParameter.QUERY,
                description=(
                    'The currency id to filter by. Currency IDs can be found [here]'
                    '(https://github.com/Reckless-Satoshi/robosats/blob/main/frontend/static/assets/currencies.json). '
                    'Value of `0` means ANY currency'
                ),
                type=int,
            ),
            OpenApiParameter(
                name='type',
                location=OpenApiParameter.QUERY,
                description=(
                    'Order type to filter by\n'
                    '- `0` - BUY\n'
                    '- `1` - SELL\n'
                    '- `2` - ALL'
                ),
                type=int,
                enum=[0,1,2]
            )
        ]
    )
    def get(self, request, format=None):
        currency = request.GET.get("currency", 0)
        type = request.GET.get("type", 2)

        queryset = Order.objects.filter(status=Order.Status.PUB)

        # Currency 0 and type 2 are special cases treated as "ANY". (These are not really possible choices)
        if int(currency) == 0 and int(type) != 2:
            queryset = Order.objects.filter(type=type, status=Order.Status.PUB)
        elif int(type) == 2 and int(currency) != 0:
            queryset = Order.objects.filter(currency=currency,
                                            status=Order.Status.PUB)
        elif not (int(currency) == 0 and int(type) == 2):
            queryset = Order.objects.filter(currency=currency,
                                            type=type,
                                            status=Order.Status.PUB)

        if len(queryset) == 0:
            return Response(
                {"not_found": "No orders found, be the first to make one"},
                status=status.HTTP_404_NOT_FOUND,
            )

        book_data = []
        for order in queryset:
            data = ListOrderSerializer(order).data
            data["maker_nick"] = str(order.maker)

            # Compute current premium for those orders that are explicitly priced.
            data["price"], data["premium"] = Logics.price_and_premium_now(
                order)
            data["maker_status"] = Logics.user_activity_status(
                order.maker_last_seen)
            for key in ("status","taker"):  # Non participants should not see the status or who is the taker
                del data[key]

            book_data.append(data)

        return Response(book_data, status=status.HTTP_200_OK)


class InfoView(ListAPIView):

    serializer_class = InfoSerializer

    @extend_schema(
        summary='Get info',
        description=textwrap.dedent(
            """
            Get general info (overview) about the exchange.

            **Info**:
            - Current market data
              - num. of orders
              - book liquidity
              - 24h active robots 
              - 24h non-KYC premium
              - 24h volume
              - all time volume
            - Node info 
              - lnd version
              - node id
              - node alias
              - network
            - Fees
              - maker and taker fees
              - on-chain swap fees
            - Robot (If autheticated)
              - nickname
              - referral code
              - earned rewards
            """
        )
    )
    def get(self, request):
        context = {}

        context["num_public_buy_orders"] = len(
            Order.objects.filter(type=Order.Types.BUY,
                                 status=Order.Status.PUB))
        context["num_public_sell_orders"] = len(
            Order.objects.filter(type=Order.Types.SELL,
                                 status=Order.Status.PUB))
        context["book_liquidity"] = Order.objects.filter(status=Order.Status.PUB).aggregate(Sum('last_satoshis'))['last_satoshis__sum']
        context["book_liquidity"] = 0 if context["book_liquidity"] == None else context["book_liquidity"]

        # Number of active users (logged in in last 30 minutes)
        today = datetime.today()
        context["active_robots_today"] = len(
            User.objects.filter(last_login__day=today.day))

        # Compute average premium and volume of today
        last_day = timezone.now() - timedelta(days=1)
        queryset = MarketTick.objects.filter(timestamp__gt=last_day)
        if not len(queryset) == 0:
            avg_premium, total_volume = compute_avg_premium(queryset)
        # If no contracts, fallback to lifetime avg premium
        else:
            queryset = MarketTick.objects.all()
            avg_premium, _ = compute_avg_premium(queryset)
            total_volume = 0

        queryset = MarketTick.objects.all()
        if not len(queryset) == 0:
            volume_contracted = []
            for tick in queryset:
                volume_contracted.append(tick.volume)
            lifetime_volume = sum(volume_contracted)
        else:
            lifetime_volume = 0

        context["last_day_nonkyc_btc_premium"] = round(avg_premium, 2)
        context["last_day_volume"] = round(total_volume, 8)
        context["lifetime_volume"] = round(lifetime_volume, 8)
        context["lnd_version"] = get_lnd_version()
        context["robosats_running_commit_hash"] = get_commit_robosats()
        context["alternative_site"] = config("ALTERNATIVE_SITE")
        context["alternative_name"] = config("ALTERNATIVE_NAME")
        context["node_alias"] = config("NODE_ALIAS")
        context["node_id"] = config("NODE_ID")
        context["network"] = config("NETWORK")
        context["maker_fee"] = float(config("FEE"))*float(config("MAKER_FEE_SPLIT"))
        context["taker_fee"] = float(config("FEE"))*(1 - float(config("MAKER_FEE_SPLIT")))
        context["bond_size"] = float(config("DEFAULT_BOND_SIZE"))

        context["current_swap_fee_rate"] = Logics.compute_swap_fee_rate(BalanceLog.objects.latest('time'))

        if request.user.is_authenticated:
            context["nickname"] = request.user.username
            context["referral_code"] = str(request.user.profile.referral_code)
            context["earned_rewards"] = request.user.profile.earned_rewards
            has_no_active_order, _, order = Logics.validate_already_maker_or_taker(
                request.user)
            if not has_no_active_order:
                context["active_order_id"] = order.id
            else:
                last_order = Order.objects.filter(Q(maker=request.user) | Q(taker=request.user)).last()
                if last_order:
                    context["last_order_id"] = last_order.id

        return Response(context, status.HTTP_200_OK)


class RewardView(CreateAPIView):
    serializer_class = ClaimRewardSerializer

    @extend_schema(
        summary='Withdraw reward',
        description='Withdraw user reward by submitting an invoice',
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'successful_withdrawal' : { 'type': 'boolean', 'default': True}
                }
            },
            400: {
                'oneOf': [
                    {
                        'type': 'object',
                        'properties': {
                            'successful_withdrawal' : { 'type': 'boolean', 'default': False},
                            'bad_invoice': { 'type': 'string', 'description': 'More context for the reason of the failure'},
                        }
                    },
                    {
                        'type': 'object',
                        'properties': {
                            'successful_withdrawal' : { 'type': 'boolean', 'default': False},
                            'bad_request': { 'type': 'string', 'description': 'More context for the reason of the failure'},
                        },
                    },
                ]
            }
        },
        examples=[
            OpenApiExample('User not authenticated',
                value={
                    'bad_request': 'Woops! It seems you do not have a robot avatar',
                },
                status_codes=[400]
            ),
            OpenApiExample('When no rewards earned',
                value={
                    'successful_withdrawal': False,
                    'bad_invoice': 'You have not earned rewards',
                },
                status_codes=[400]
            ),
            OpenApiExample('Bad invoice or in case of payment failure',
                value={
                    'successful_withdrawal': False,
                    'bad_invoice': 'Does not look like a valid lightning invoice',
                },
                status_codes=[400]
            )
        ],
    )
    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        if not request.user.is_authenticated:
            return Response(
                {
                    "bad_request":
                    "Woops! It seems you do not have a robot avatar"
                },
                status.HTTP_400_BAD_REQUEST,
            )

        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST)

        invoice = serializer.data.get("invoice")

        valid, context = Logics.withdraw_rewards(request.user, invoice)

        if not valid:
            context['successful_withdrawal'] = False
            return Response(context, status.HTTP_400_BAD_REQUEST)

        return Response({"successful_withdrawal": True}, status.HTTP_200_OK)


class PriceView(ListAPIView):

    serializer_class = PriceSerializer

    @extend_schema(
        summary='Get last market prices',
        description='Get the last market price for each currency. Also, returns some more info about the last trade in each currency.',
        responses={
            200: {
                'type': 'object',
                'additionalProperties': {
                    'type': 'object',
                    'properties': {
                        'price': {'type': 'integer'},
                        'volume': {'type': 'integer'},
                        'premium': {'type': 'integer'},
                        'timestamp': {'type': 'string', 'format': 'date-time'},
                    }
                }
            },
        },
        examples=[
            OpenApiExample('Truncated example. Real response contains all the currencies',
                value={
                    "<currency symbol>": {
                        "price": 21948.89,
                        "volume": 0.01366812,
                        "premium": 3.5,
                        "timestamp": "2022-09-13T14:32:40.591774Z"
                    },
                },
                status_codes=[200]
            )
        ],
    )
    def get(self, request):

        payload = {}
        queryset = Currency.objects.all().order_by('currency')

        for currency in queryset:
            code = Currency.currency_dict[str(currency.currency)]
            try:
                last_tick = MarketTick.objects.filter(currency=currency).latest('timestamp')
                payload[code] = {
                    'price': last_tick.price,
                    'volume': last_tick.volume,
                    'premium': last_tick.premium,
                    'timestamp': last_tick.timestamp,
                }
            except:
                payload[code] = None

        return Response(payload, status.HTTP_200_OK)


class TickView(ListAPIView):

    queryset = MarketTick.objects.all()
    serializer_class = TickSerializer

    @extend_schema(
        summary='Get market ticks',
        description='Get all market ticks. Returns a list of all the market ticks since inception.\n'
        'CEX price is also recorded for useful insight on the historical premium of Non-KYC BTC. '
        'Price is set when taker bond is locked.',
    )
    def get(self, request):
        data = self.serializer_class(self.queryset.all(), many=True, read_only=True).data
        return Response(data, status=status.HTTP_200_OK)


class LimitView(ListAPIView):

    @extend_schema(
        summary='List order limits',
        description='Get a list of order limits for every currency pair available.',
        responses={
            200: {
                'type': 'object',
                'additionalProperties': {
                    'type': 'object',
                    'properties': {
                        'code': {'type': 'string', 'description': 'Three letter currency symbol'},
                        'price': {'type': 'integer'},
                        'min_amount': {'type': 'integer', 'description': 'Minimum amount allowed in an order in the particular currency'},
                        'max_amount': {'type': 'integer', 'description': 'Maximum amount allowed in an order in the particular currency'},
                        'max_bondless_amount': {'type': 'integer', 'description': 'Maximum amount allowed in a bondless order'},
                    }
                }
            },
        },
        examples=[
            OpenApiExample('Truncated example. Real response contains all the currencies',
                value={
                    "<currency number>": {
                        'code': 'USD',
                        'price': '42069.69',
                        'min_amount': '4.2',
                        'max_amount': '420.69',
                        'max_bondless_amount': '10.1',
                    },
                },
                status_codes=[200]
            )
        ],
    )
    def get(self, request):
        
        # Trade limits as BTC
        min_trade = float(config('MIN_TRADE')) / 100000000
        max_trade = float(config('MAX_TRADE')) / 100000000
        max_bondless_trade = float(config('MAX_TRADE_BONDLESS_TAKER')) / 100000000

        payload = {}
        queryset = Currency.objects.all().order_by('currency')

        for currency in queryset:
            code = Currency.currency_dict[str(currency.currency)]
            exchange_rate = float(currency.exchange_rate)
            payload[currency.currency] = {
                'code': code,
                'price': exchange_rate,
                'min_amount': min_trade * exchange_rate,
                'max_amount': max_trade * exchange_rate,
                'max_bondless_amount': max_bondless_trade * exchange_rate,
            }

        return Response(payload, status.HTTP_200_OK)


class HistoricalView(ListAPIView):

    @extend_schema(
        summary='Get historical exchange activity',
        description='Get historical exchange activity. Currently, it lists each day\'s total contracts and their volume in BTC since inception.',
        responses={
            200: {
                'type': 'object',
                'additionalProperties': {
                    'type': 'object',
                    'properties': {
                        'volume': {'type': 'integer', 'description': 'Total Volume traded on that particular date'},
                        'num_contracts': {'type': 'number', 'description': 'Number of successful trades on that particular date'},
                    }
                }
            },
        },
        examples=[
            OpenApiExample('Truncated example',
                value={
                    "<date>": {
                        'code': 'USD',
                        'price': '42069.69',
                        'min_amount': '4.2',
                        'max_amount': '420.69',
                        'max_bondless_amount': '10.1',
                    },
                },
                status_codes=[200]
            )
        ],
    )
    def get(self, request):
        payload = {}
        queryset = AccountingDay.objects.all().order_by('day')

        for accounting_day in queryset:
            payload[str(accounting_day.day)] = {
                'volume': accounting_day.contracted,
                'num_contracts': accounting_day.num_contracts,
            }

        return Response(payload, status.HTTP_200_OK)


class StealthView(UpdateAPIView):

    serializer_class = StealthSerializer
    @extend_schema(
        summary='Update stealth option',
        description='Update stealth invoice option for the user',
        responses={
            200: StealthSerializer,
            400: {
                'type': 'object',
                'properties': {
                    'bad_request': {
                        'type': 'string',
                        'description': 'Reason for the failure',
                    },
                },
            },
        },
    )
    def put(self, request):
        serializer = self.serializer_class(data=request.data)

        if not request.user.is_authenticated:
            return Response(
                {
                    "bad_request":
                    "Woops! It seems you do not have a robot avatar"
                },
                status.HTTP_400_BAD_REQUEST,
            )

        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST)

        stealth = serializer.data.get("wantsStealth")

        request.user.profile.wants_stealth = stealth
        request.user.profile.save()

        return Response({"wantsStealth": stealth})

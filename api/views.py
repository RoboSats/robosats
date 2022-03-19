import os
from re import T
from django.db.models import Sum
from rest_framework import status, viewsets
from rest_framework.generics import CreateAPIView, ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User

from api.serializers import ListOrderSerializer, MakeOrderSerializer, UpdateOrderSerializer, ClaimRewardSerializer, PriceSerializer
from api.models import LNPayment, MarketTick, Order, Currency, Profile
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
BOND_SIZE = int(config("DEFAULT_BOND_SIZE"))

avatar_path = Path(settings.AVATAR_ROOT)
avatar_path.mkdir(parents=True, exist_ok=True)

# Create your views here.


class MakerView(CreateAPIView):
    serializer_class = MakeOrderSerializer

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

        type = serializer.data.get("type")
        currency = serializer.data.get("currency")
        amount = serializer.data.get("amount")
        payment_method = serializer.data.get("payment_method")
        premium = serializer.data.get("premium")
        satoshis = serializer.data.get("satoshis")
        is_explicit = serializer.data.get("is_explicit")
        public_duration = serializer.data.get("public_duration")
        bond_size = serializer.data.get("bond_size")

        # Optional params
        if public_duration == None:
            public_duration = PUBLIC_DURATION
        if bond_size == None:
            bond_size = BOND_SIZE

        valid, context, _ = Logics.validate_already_maker_or_taker(
            request.user)
        if not valid:
            return Response(context, status.HTTP_409_CONFLICT)

        # Creates a new order
        order = Order(
            type=type,
            currency=Currency.objects.get(id=currency),
            amount=amount,
            payment_method=payment_method,
            premium=premium,
            satoshis=satoshis,
            is_explicit=is_explicit,
            expires_at=timezone.now() + timedelta(
                seconds=EXP_MAKER_BOND_INVOICE),
            maker=request.user,
            public_duration=public_duration,
            bond_size=bond_size,
        )

        # TODO move to Order class method when new instance is created!
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
                {"bad_request": "You are not allowed to see this order"},
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

            # 3. c) If maker and Public, add num robots in book, premium percentile 
            # num similar orders, and maker information to enable telegram notifications.
            if data["is_maker"] and order.status == Order.Status.PUB:
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

            # If the two bonds are locked, reply with an AMOUNT so he can send the buyer invoice.
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
            data[
                "next_retry_time"] = order.payout.last_routing_time + timedelta(
                    minutes=RETRY_TIME)

            if order.payout.status == LNPayment.Status.EXPIRE:
                data["invoice_expired"] = True
                # Add invoice amount once again if invoice was expired.
                data["invoice_amount"] = Logics.payout_amount(order,request.user)[1]["invoice_amount"]

        return Response(data, status.HTTP_200_OK)

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
        # 6)'submit_statement' (in dispute), 7)'rate_user' , 'rate_platform'
        action = serializer.data.get("action")
        invoice = serializer.data.get("invoice")
        statement = serializer.data.get("statement")
        rating = serializer.data.get("rating")

        # 1) If action is take, it is a taker request!
        if action == "take":
            if order.status == Order.Status.PUB:
                valid, context, _ = Logics.validate_already_maker_or_taker(
                    request.user)
                if not valid:
                    return Response(context, status=status.HTTP_409_CONFLICT)
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
        if action == "update_invoice" and invoice:
            valid, context = Logics.update_invoice(order, request.user,
                                                   invoice)
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

        # 6) If action is rate_platform
        elif action == "rate_platform" and rating:
            valid, context = Logics.rate_platform(request.user, rating)
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

    # Probably should be turned into a post method
    def get(self, request, format=None):
        """
        Get a new user derived from a high entropy token

        - Request has a high-entropy token,
        - Generates new nickname and avatar.
        - Creates login credentials (new User object)
        Response with Avatar and Nickname.
        """

        # If an existing user opens the main page by mistake, we do not want it to create a new nickname/profile for him
        if request.user.is_authenticated:
            context = {"nickname": request.user.username}
            not_participant, _, _ = Logics.validate_already_maker_or_taker(
                request.user)

            # Does not allow this 'mistake' if an active order
            if not not_participant:
                context[
                    "bad_request"] = f"You are already logged in as {request.user} and have an active order"
                return Response(context, status.HTTP_400_BAD_REQUEST)

        token = request.GET.get("token")
        ref_code = request.GET.get("ref_code")

        # Compute token entropy
        value, counts = np.unique(list(token), return_counts=True)
        shannon_entropy = entropy(counts, base=62)
        bits_entropy = log2(len(value)**len(token))
        # Payload
        context = {
            "token_shannon_entropy": shannon_entropy,
            "token_bits_entropy": bits_entropy,
        }

        # Deny user gen if entropy below 128 bits or 0.7 shannon heterogeneity
        if bits_entropy < 128 or shannon_entropy < 0.7:
            context["bad_request"] = "The token does not have enough entropy"
            return Response(context, status=status.HTTP_400_BAD_REQUEST)

        # Hash the token, only 1 iteration.
        hash = hashlib.sha256(str.encode(token)).hexdigest()

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
                rh.img.save(f, format="png")

        

        # Create new credentials and login if nickname is new
        if len(User.objects.filter(username=nickname)) == 0:
            User.objects.create_user(username=nickname,
                                     password=token,
                                     is_staff=False)
            user = authenticate(request, username=nickname, password=token)
            login(request, user)

            context['referral_code'] = token_urlsafe(8)
            user.profile.referral_code = context['referral_code']
            user.profile.avatar = "static/assets/avatars/" + nickname + ".png"

            # If the ref_code was created by another robot, this robot was referred.
            queryset = Profile.objects.filter(referral_code=ref_code)
            if len(queryset) == 1:
                user.profile.is_referred = True
                user.profile.referred_by = queryset[0]
            
            user.profile.save()
            return Response(context, status=status.HTTP_201_CREATED)

        else:
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
    serializer_class = ListOrderSerializer
    queryset = Order.objects.filter(status=Order.Status.PUB)

    def get(self, request, format=None):
        currency = request.GET.get("currency")
        type = request.GET.get("type")

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
            for key in (
                    "status",
                    "taker",
            ):  # Non participants should not see the status or who is the taker
                del data[key]

            book_data.append(data)

        return Response(book_data, status=status.HTTP_200_OK)

class InfoView(ListAPIView):

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
        context["last_day_volume"] = total_volume *100000000
        context["lifetime_volume"] = lifetime_volume
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

        if request.user.is_authenticated:
            context["nickname"] = request.user.username
            context["referral_code"] = str(request.user.profile.referral_code)
            context["earned_rewards"] = request.user.profile.earned_rewards
            has_no_active_order, _, order = Logics.validate_already_maker_or_taker(
                request.user)
            if not has_no_active_order:
                context["active_order_id"] = order.id

        return Response(context, status.HTTP_200_OK)


class RewardView(CreateAPIView):
    serializer_class = ClaimRewardSerializer

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

class PriceView(CreateAPIView):

    serializer_class = PriceSerializer

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
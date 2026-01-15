from datetime import datetime, timedelta
from hmac import compare_digest

from decouple import config
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Q, Sum
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.http import HttpResponseBadRequest
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.generics import CreateAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.errors import new_error
from api.logics import Logics
from api.tasks import cache_market
from api.models import (
    Currency,
    LNPayment,
    MarketTick,
    OnchainPayment,
    Order,
    Notification,
    TakeOrder,
)
from api.notifications import Notifications
from api.oas_schemas import (
    BookViewSchema,
    HistoricalViewSchema,
    InfoViewSchema,
    LimitViewSchema,
    MakerViewSchema,
    OrderViewSchema,
    PriceViewSchema,
    RewardViewSchema,
    RobotViewSchema,
    StealthViewSchema,
    ReviewViewSchema,
    TickViewSchema,
    NotificationSchema,
)
from api.serializers import (
    ClaimRewardSerializer,
    InfoSerializer,
    ListOrderSerializer,
    MakeOrderSerializer,
    OrderPublicSerializer,
    PriceSerializer,
    StealthSerializer,
    TickSerializer,
    ReviewSerializer,
    UpdateOrderSerializer,
    ListNotificationSerializer,
)
from api.utils import (
    compute_avg_premium,
    get_cln_version,
    get_lnd_version,
    get_robosats_commit,
    verify_signed_message,
)
from api.nostr import Nostr
from chat.models import Message
from control.models import AccountingDay, BalanceLog

EXP_MAKER_BOND_INVOICE = int(config("EXP_MAKER_BOND_INVOICE"))
RETRY_TIME = int(config("RETRY_TIME"))


class MakerView(CreateAPIView):
    serializer_class = MakeOrderSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(**MakerViewSchema.post)
    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        if not request.user.is_authenticated:
            return Response(new_error(1036), status.HTTP_400_BAD_REQUEST)

        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST)

        # In case it gets overwhelming. Limit the number of public orders.
        if Order.objects.filter(status=Order.Status.PUB).count() >= int(
            config("MAX_PUBLIC_ORDERS")
        ):
            return Response(
                new_error(
                    1037,
                    {
                        "coordinator_alias": config(
                            "COORDINATOR_ALIAS", cast=str, default="NoAlias"
                        ),
                        "max_public_orders": config("MAX_PUBLIC_ORDERS", cast=str),
                    },
                ),
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
        latitude = serializer.data.get("latitude")
        longitude = serializer.data.get("longitude")
        password = serializer.data.get("password")
        description = serializer.data.get("description")

        # Optional params
        if public_duration is None:
            public_duration = 60 * 60 * settings.DEFAULT_PUBLIC_ORDER_DURATION
        if escrow_duration is None:
            escrow_duration = 60 * settings.INVOICE_AND_ESCROW_DURATION
        if bond_size is None:
            bond_size = settings.DEFAULT_BOND_SIZE
        if has_range is None:
            has_range = False

        # An order can either have an amount or a range (min_amount and max_amount)
        if has_range:
            amount = None
        else:
            min_amount = None
            max_amount = None

        # Either amount or min_max has to be specified.
        if has_range and (min_amount is None or max_amount is None):
            return Response(new_error(1038), status.HTTP_400_BAD_REQUEST)
        elif not has_range and amount is None:
            return Response(new_error(1039), status.HTTP_400_BAD_REQUEST)

        if len(Currency.objects.all()) == 0:
            cache_market()

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
            expires_at=timezone.now() + timedelta(seconds=EXP_MAKER_BOND_INVOICE),
            maker=request.user,
            public_duration=public_duration,
            escrow_duration=escrow_duration,
            bond_size=bond_size,
            latitude=latitude,
            longitude=longitude,
            password=password,
            description=description,
        )

        order.last_satoshis = order.t0_satoshis = Logics.satoshis_now(order)

        valid, context = Logics.validate_order_size(order)
        if not valid:
            return Response(context, status.HTTP_400_BAD_REQUEST)

        valid, context = Logics.validate_location(order)
        if not valid:
            return Response(context, status.HTTP_400_BAD_REQUEST)

        order.save()
        order.log(
            f"Order({order.id},{order}) created by Robot({request.user.robot.id},{request.user})"
        )
        return Response(ListOrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderView(viewsets.ViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = UpdateOrderSerializer
    lookup_url_kwarg = "order_id"

    @extend_schema(**OrderViewSchema.get)
    def get(self, request, format=None):
        """
        Full trade pipeline takes place while looking/refreshing the order page.
        """
        order_id = request.GET.get(self.lookup_url_kwarg)

        if not request.user.is_authenticated:
            return Response(new_error(1040), status=status.HTTP_400_BAD_REQUEST)

        if order_id is None:
            return Response(new_error(1041), status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.filter(id=order_id)

        # check if exactly one order is found in the db
        if len(order) != 1:
            return Response(new_error(1042), status.HTTP_404_NOT_FOUND)

        # This is our order.
        order = order[0]

        data = ListOrderSerializer(order).data
        take_order = TakeOrder.objects.filter(
            taker=request.user, order=order, expires_at__gt=timezone.now()
        )

        # Add booleans if user is maker, taker, partipant, buyer or seller
        data["is_maker"] = order.maker == request.user
        data["is_taker"] = order.taker == request.user or take_order.exists()
        data["is_participant"] = data["is_maker"] or data["is_taker"]
        data["has_password"] = order.password is not None

        # 2) If order has been cancelled
        if order.status == Order.Status.UCA or order.status == Order.Status.CCA:
            return Response(new_error(1043), status.HTTP_400_BAD_REQUEST)

        data["total_secs_exp"] = order.t_to_expire(order.status)

        # if user is under a limit (penalty), inform him.
        is_penalized, time_out = Logics.is_penalized(request.user)
        if is_penalized:
            data["penalty"] = request.user.robot.penalty_expiration

        # 3.a) If not a participant and order is not public, forbid.
        if (
            order.maker != request.user
            and order.taker != request.user
            and order.status != Order.Status.PUB
        ):
            return Response(new_error(1044), status.HTTP_403_FORBIDDEN)

        data["maker_nick"] = str(order.maker)
        data["maker_hash_id"] = str(order.maker.robot.hash_id)
        data["maker_nostr_pubkey"] = str(order.maker.robot.nostr_pubkey)
        data["description"] = order.description

        # Add activity status of participants based on last_seen
        data["maker_status"] = Logics.user_activity_status(order.maker.last_login)
        if order.taker is not None:
            data["taker_status"] = Logics.user_activity_status(order.taker.last_login)

        # 3.b) Non participants can view details (but only if PUB)
        if not data["is_participant"] and order.status == Order.Status.PUB:
            data["price_now"], data["premium_now"] = Logics.price_and_premium_now(order)
            data["satoshis_now"] = Logics.satoshis_now(order)
            return Response(data, status=status.HTTP_200_OK)

        # 4) If order is between public and WF2
        if order.status >= Order.Status.PUB and order.status < Order.Status.WF2:
            data["price_now"], data["premium_now"] = Logics.price_and_premium_now(order)
            if take_order.exists():
                data["satoshis_now"] = Logics.satoshis_now(
                    order, take_order.first().amount
                )
            else:
                data["satoshis_now"] = Logics.satoshis_now(order)

        # For participants add positions, nicks and status as a message and hold invoices status
        data["is_buyer"] = Logics.is_buyer(order, request.user)
        data["is_seller"] = Logics.is_seller(order, request.user)
        data["taker_nick"] = str(order.taker)
        if order.taker:
            data["taker_hash_id"] = str(order.taker.robot.hash_id)
            data["taker_nostr_pubkey"] = str(order.taker.robot.nostr_pubkey)
        data["status_message"] = Order.Status(order.status).label
        data["is_fiat_sent"] = order.is_fiat_sent
        data["latitude"] = order.latitude
        data["longitude"] = order.longitude
        data["is_disputed"] = order.is_disputed
        data["ur_nick"] = request.user.username
        data["satoshis_now"] = order.last_satoshis

        # Add whether hold invoices are LOCKED (ACCEPTED)
        # Is there a maker bond? If so, True if locked, False otherwise
        if order.maker_bond:
            data["maker_locked"] = order.maker_bond.status == LNPayment.Status.LOCKED
        else:
            data["maker_locked"] = False

        # Is there a taker bond? If so, True if locked, False otherwise
        if order.taker_bond:
            data["taker_locked"] = order.taker_bond.status == LNPayment.Status.LOCKED
        else:
            data["taker_locked"] = False

        # Is there an escrow? If so, True if locked, False otherwise
        if order.trade_escrow:
            data["escrow_locked"] = order.trade_escrow.status == LNPayment.Status.LOCKED
        else:
            data["escrow_locked"] = False

        # If both bonds are locked, participants can see the final trade amount in sats.
        if order.status in [
            Order.Status.WF2,
            Order.Status.WFI,
            Order.Status.WFE,
            Order.Status.CCA,
            Order.Status.FSE,
            Order.Status.DIS,
            Order.Status.PAY,
            Order.Status.SUC,
            Order.Status.FAI,
        ]:
            if (
                order.maker_bond.status
                == order.taker_bond.status
                == LNPayment.Status.LOCKED
            ):
                # Seller sees the amount he sends
                if data["is_seller"]:
                    data["trade_satoshis"] = Logics.escrow_amount(order, request.user)[
                        1
                    ]["escrow_amount"]
                # Buyer sees the amount he receives
                elif data["is_buyer"]:
                    data["trade_satoshis"] = Logics.payout_amount(order, request.user)[
                        1
                    ]["invoice_amount"]

        # 5) If status is 'waiting for maker bond' and user is MAKER, reply with a MAKER hold invoice.
        if order.status == Order.Status.WFB and data["is_maker"]:
            valid, context = Logics.gen_maker_hold_invoice(order, request.user)
            if valid:
                data = {**data, **context}
            else:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 6)  If status is 'Public' and user is PRETAKER, reply with a TAKER hold invoice.
        elif (
            order.status == Order.Status.PUB
            and take_order.exists()
            and order.taker != request.user
        ):
            data["status"] = Order.Status.TAK
            data["total_secs_exp"] = order.t_to_expire(Order.Status.TAK)
            data["amount"] = str(take_order.first().amount)

            valid, context = Logics.gen_taker_hold_invoice(order, request.user)

            if valid:
                data = {**data, **context}
            else:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 7 a. ) If seller and status is 'WF2' or 'WFE'
        elif data["is_seller"] and (
            order.status == Order.Status.WF2 or order.status == Order.Status.WFE
        ):
            # If the two bonds are locked, reply with an ESCROW hold invoice.
            if (
                order.maker_bond.status
                == order.taker_bond.status
                == LNPayment.Status.LOCKED
            ):
                valid, context = Logics.gen_escrow_hold_invoice(order, request.user)
                if valid:
                    data = {**data, **context}
                else:
                    return Response(context, status.HTTP_400_BAD_REQUEST)

        # 7.b) If user is Buyer and status is 'WF2' or 'WFI'
        elif data["is_buyer"] and (
            order.status == Order.Status.WF2 or order.status == Order.Status.WFI
        ):
            # If the two bonds are locked, reply with an AMOUNT and onchain swap cost so he can send the buyer invoice/address.
            if (
                order.maker_bond.status
                == order.taker_bond.status
                == LNPayment.Status.LOCKED
            ):
                valid, context = Logics.payout_amount(order, request.user)
                if valid:
                    data = {**data, **context}
                else:
                    return Response(context, status.HTTP_400_BAD_REQUEST)

        # 8) If status is 'CHA' or 'FSE' and all HTLCS are in LOCKED
        elif order.status in [Order.Status.WFI, Order.Status.CHA, Order.Status.FSE]:
            # If all bonds are locked.
            if (
                order.maker_bond.status
                == order.taker_bond.status
                == order.trade_escrow.status
                == LNPayment.Status.LOCKED
            ):
                # add whether a collaborative cancel is pending or has been asked
                if (data["is_maker"] and order.taker_asked_cancel) or (
                    data["is_taker"] and order.maker_asked_cancel
                ):
                    data["pending_cancel"] = True
                elif (data["is_maker"] and order.maker_asked_cancel) or (
                    data["is_taker"] and order.taker_asked_cancel
                ):
                    data["asked_for_cancel"] = True
                else:
                    data["asked_for_cancel"] = False

            # Add index of last chat message. To be used by client on Chat endpoint to fetch latest messages
            messages = Message.objects.filter(order=order)
            if len(messages) == 0:
                data["chat_last_index"] = 0
            else:
                data["chat_last_index"] = messages.latest().index

        # 9) If status is 'DIS' and all HTLCS are in LOCKED
        elif order.status == Order.Status.DIS:
            # add whether the dispute statement has been received
            if data["is_maker"]:
                data["statement_submitted"] = (
                    order.maker_statement is not None and order.maker_statement != ""
                )
            elif data["is_taker"]:
                data["statement_submitted"] = (
                    order.taker_statement is not None and order.taker_statement != ""
                )

        # 9) If status is 'Failed routing', reply with retry amounts, time of next retry and ask for invoice at third.
        elif (
            order.status == Order.Status.FAI and order.payout.receiver == request.user
        ):  # might not be the buyer if after a dispute where winner wins
            data["retries"] = order.payout.routing_attempts
            data["next_retry_time"] = order.payout.last_routing_time + timedelta(
                minutes=RETRY_TIME
            )
            if order.payout.failure_reason:
                data["failure_reason"] = LNPayment.FailureReason(
                    order.payout.failure_reason
                ).label

            if order.payout.status == LNPayment.Status.EXPIRE:
                data["invoice_expired"] = True
                # Add invoice amount once again if invoice was expired.
                data["trade_satoshis"] = Logics.payout_amount(order, request.user)[1][
                    "invoice_amount"
                ]

        # 10) If status is 'Expired', "Sending", "Finished" or "failed routing", add info for renewal:
        elif order.status in [
            Order.Status.EXP,
            Order.Status.SUC,
            Order.Status.PAY,
            Order.Status.FAI,
        ]:
            data["public_duration"] = order.public_duration
            data["bond_size"] = str(order.bond_size)

            # Adds trade summary
            if order.status in [Order.Status.SUC, Order.Status.PAY, Order.Status.FAI]:
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
                if Logics.is_buyer(order, request.user):
                    if order.is_swap:
                        data["num_satoshis"] = order.payout_tx.num_satoshis
                        data["sent_satoshis"] = order.payout_tx.sent_satoshis
                        data["network"] = str(config("NETWORK"))
                        if order.payout_tx.status in [
                            OnchainPayment.Status.MEMPO,
                            OnchainPayment.Status.CONFI,
                        ]:
                            data["txid"] = order.payout_tx.txid
                        elif order.payout_tx.status == OnchainPayment.Status.QUEUE:
                            data["tx_queued"] = True
                            data["address"] = order.payout_tx.address

        return Response(data, status.HTTP_200_OK)

    @extend_schema(**OrderViewSchema.take_update_confirm_dispute_cancel)
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

        # action is either 1)'take', 2)'confirm', 2.b)'undo_confirm', 3)'cancel', 4)'dispute' , 5)'update_invoice'
        # 5.b)'update_address' 6)'submit_statement' (in dispute), 7)'rate_user' , 8)'rate_platform'
        action = serializer.data.get("action")
        pgp_invoice = serializer.data.get("invoice")
        routing_budget_ppm = serializer.data.get("routing_budget_ppm", 0)
        pgp_address = serializer.data.get("address")
        mining_fee_rate = serializer.data.get("mining_fee_rate")
        statement = serializer.data.get("statement")
        rating = serializer.data.get("rating")
        cancel_status = serializer.data.get("cancel_status")
        password = serializer.data.get("password")

        # 1) If action is take, it is a taker request!
        if action == "take":
            if order.status == Order.Status.PUB:
                valid, context, _ = Logics.validate_already_maker_or_taker(request.user)
                if not valid:
                    return Response(context, status=status.HTTP_409_CONFLICT)

                if order.password is not None:
                    if password is None or not compare_digest(order.password, password):
                        return Response(
                            new_error(1045), status=status.HTTP_403_FORBIDDEN
                        )

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
                Response(new_error(1046), status.HTTP_400_BAD_REQUEST)

        # 2) If action is cancel
        elif action == "cancel":
            valid, context = Logics.cancel_order(order, request.user, cancel_status)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

            order.refresh_from_db()
            if order.status in [Order.Status.UCA, Order.Status.CCA]:
                return Response(
                    {
                        "id": order.id,
                        "status": order.status,
                        "bad_request": "This order has been cancelled",
                    },
                    status.HTTP_200_OK,
                )

        # Any other action is only allowed if the user is a participant
        elif not (order.maker == request.user or order.taker == request.user):
            return Response(new_error(1047), status.HTTP_403_FORBIDDEN)

        # 3) If action is 'update invoice'
        elif action == "update_invoice":
            valid_signature, invoice = verify_signed_message(
                request.user.robot.public_key, pgp_invoice
            )

            if not valid_signature:
                return Response(new_error(1048), status.HTTP_400_BAD_REQUEST)

            valid, context = Logics.update_invoice(
                order, request.user, invoice, routing_budget_ppm
            )
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 3.b) If action is 'update address'
        elif action == "update_address":
            valid_signature, address = verify_signed_message(
                request.user.robot.public_key, pgp_address
            )

            if not valid_signature:
                return Response(new_error(1048), status.HTTP_400_BAD_REQUEST)

            valid, context = Logics.update_address(
                order, request.user, address, mining_fee_rate
            )
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 5) If action is confirm
        elif action == "confirm":
            valid, context = Logics.confirm_fiat(order, request.user)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 5.b) If action is confirm
        elif action == "undo_confirm":
            valid, context = Logics.undo_confirm_fiat_sent(order, request.user)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 6) If action is dispute
        elif action == "dispute":
            valid, context = Logics.open_dispute(order, request.user)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        elif action == "submit_statement":
            valid, context = Logics.dispute_statement(order, request.user, statement)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 7) If action is rate_user
        elif action == "rate_user" and rating:
            """No user rating"""
            pass

        # 8) If action is rate_platform
        elif action == "rate_platform" and rating:
            valid, context = Logics.rate_platform(request.user, rating)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # 9) If action is pause
        elif action == "pause":
            valid, context = Logics.pause_unpause_public_order(order, request.user)
            if not valid:
                return Response(context, status.HTTP_400_BAD_REQUEST)

        # If nothing of the above... something else is going on. Probably not allowed!
        else:
            return Response(new_error(1049), status.HTTP_501_NOT_IMPLEMENTED)

        return self.get(request)


class RobotView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(**RobotViewSchema.get)
    def get(self, request, format=None):
        """
        Respond with Nickname, pubKey, privKey.
        """
        user = request.user
        context = {}
        context["nickname"] = user.username
        context["hash_id"] = user.robot.hash_id
        context["public_key"] = user.robot.public_key
        context["encrypted_private_key"] = user.robot.encrypted_private_key
        context["earned_rewards"] = user.robot.earned_rewards
        context["wants_stealth"] = user.robot.wants_stealth
        context["nostr_pubkey"] = user.robot.nostr_pubkey
        context["last_login"] = user.last_login

        # Adds/generate telegram token and whether it is enabled
        context = {**context, **Notifications.get_context(user)}

        # return active order or last made order if any
        has_no_active_order, _, order = Logics.validate_already_maker_or_taker(
            request.user
        )
        if not has_no_active_order:
            context["active_order_id"] = order.id
        else:
            last_order = Order.objects.filter(
                Q(maker=request.user) | Q(taker=request.user)
            ).last()
            if last_order:
                context["last_order_id"] = last_order.id

        # Robot was found, only if created +5 mins ago
        if user.date_joined < (timezone.now() - timedelta(minutes=5)):
            context["found"] = True

        return Response(context, status=status.HTTP_200_OK)


class BookView(ListAPIView):
    serializer_class = OrderPublicSerializer
    queryset = Order.objects.filter(status=Order.Status.PUB)

    @extend_schema(**BookViewSchema.get)
    def get(self, request, format=None):
        currency = request.GET.get("currency", 0)
        type = request.GET.get("type", 2)

        queryset = Order.objects.filter(status=Order.Status.PUB, password=None)

        # Currency 0 and type 2 are special cases treated as "ANY". (These are not really possible choices)
        if int(currency) == 0 and int(type) != 2:
            queryset = Order.objects.filter(type=type, status=Order.Status.PUB)
        elif int(type) == 2 and int(currency) != 0:
            queryset = Order.objects.filter(currency=currency, status=Order.Status.PUB)
        elif not (int(currency) == 0 and int(type) == 2):
            queryset = Order.objects.filter(
                currency=currency, type=type, status=Order.Status.PUB
            )

        if len(queryset) == 0:
            return Response(
                {"not_found": "No orders found, be the first to make one"},
                status=status.HTTP_404_NOT_FOUND,
            )

        book_data = []
        for order in queryset:
            data = ListOrderSerializer(order).data
            data["maker_nick"] = str(order.maker)
            data["maker_hash_id"] = str(order.maker.robot.hash_id)

            data["satoshis_now"] = Logics.satoshis_now(order)
            # Compute current premium for those orders that are explicitly priced.
            price, premium = Logics.price_and_premium_now(order)
            data["price"], data["premium"] = price, str(premium)
            data["maker_status"] = Logics.user_activity_status(order.maker.last_login)
            for key in (
                "status",
                "taker",
            ):  # Non participants should not see the status or who is the taker
                del data[key]

            book_data.append(data)

        return Response(book_data, status=status.HTTP_200_OK)


class NotificationsView(ListAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ListNotificationSerializer

    @extend_schema(**NotificationSchema.get)
    def get(self, request, format=None):
        robot = request.user.robot
        queryset = Notification.objects.filter(robot=robot).order_by("-created_at")
        created_at = request.GET.get("created_at")

        if created_at:
            created_at = parse_datetime(created_at)
            if not created_at:
                return HttpResponseBadRequest("Invalid date format")
            queryset = queryset.filter(created_at__gte=created_at)

        notification_data = []
        for notification in queryset:
            data = self.serializer_class(notification).data
            data["order_id"] = notification.order.id
            notification_data.append(data)

        return Response(notification_data, status=status.HTTP_200_OK)


class InfoView(viewsets.ViewSet):
    serializer_class = InfoSerializer

    @extend_schema(**InfoViewSchema.get)
    def get(self, request):
        context = {}

        context["num_public_buy_orders"] = len(
            Order.objects.filter(type=Order.Types.BUY, status=Order.Status.PUB)
        )
        context["num_public_sell_orders"] = len(
            Order.objects.filter(type=Order.Types.SELL, status=Order.Status.PUB)
        )
        context["book_liquidity"] = Order.objects.filter(
            status=Order.Status.PUB
        ).aggregate(Sum("last_satoshis"))["last_satoshis__sum"]
        context["book_liquidity"] = (
            0 if context["book_liquidity"] is None else context["book_liquidity"]
        )

        # Number of active users (logged in in last 30 minutes)
        today = datetime.today()
        context["active_robots_today"] = len(
            User.objects.filter(last_login__day=today.day)
        )

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
                volume_contracted.append(tick.volume if tick.volume else 0)
            lifetime_volume = sum(volume_contracted)
        else:
            lifetime_volume = 0

        context["last_day_nonkyc_btc_premium"] = round(avg_premium, 2)
        context["last_day_volume"] = round(total_volume, 8)
        context["lifetime_volume"] = round(lifetime_volume, 8)
        context["lnd_version"] = get_lnd_version()
        context["cln_version"] = get_cln_version()
        context["robosats_running_commit_hash"] = get_robosats_commit()
        context["version"] = settings.VERSION
        context["alternative_site"] = config("ALTERNATIVE_SITE")
        context["alternative_name"] = config("ALTERNATIVE_NAME")
        context["node_alias"] = config("NODE_ALIAS")
        context["node_id"] = config("NODE_ID")
        context["network"] = config("NETWORK", cast=str, default="mainnet")
        context["maker_fee"] = float(config("FEE")) * float(config("MAKER_FEE_SPLIT"))
        context["taker_fee"] = float(config("FEE")) * (
            1 - float(config("MAKER_FEE_SPLIT"))
        )
        context["bond_size"] = settings.DEFAULT_BOND_SIZE
        context["market_price_apis"] = config(
            "MARKET_PRICE_APIS", cast=str, default="none"
        )
        context["notice_severity"] = config("NOTICE_SEVERITY", cast=str, default="none")
        context["notice_message"] = config("NOTICE_MESSAGE", cast=str, default="")
        context["min_order_size"] = config("MIN_ORDER_SIZE", cast=int, default=20000)
        context["max_order_size"] = config("MAX_ORDER_SIZE", cast=int, default=250000)
        context["swap_enabled"] = not config("DISABLE_ONCHAIN", cast=bool, default=True)
        context["max_swap"] = config("MAX_SWAP_AMOUNT", cast=int, default=0)

        try:
            context["current_swap_fee_rate"] = Logics.compute_swap_fee_rate(
                BalanceLog.objects.latest("time")
            )
        except BalanceLog.DoesNotExist:
            context["current_swap_fee_rate"] = 0

        return Response(context, status.HTTP_200_OK)


class RewardView(CreateAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    serializer_class = ClaimRewardSerializer

    @extend_schema(**RewardViewSchema.post)
    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST)

        pgp_invoice = serializer.data.get("invoice")
        routing_budget_ppm = serializer.data.get("routing_budget_ppm", None)

        valid_signature, invoice = verify_signed_message(
            request.user.robot.public_key, pgp_invoice
        )

        if not valid_signature:
            return Response(new_error(1048), status.HTTP_400_BAD_REQUEST)

        valid, context = Logics.withdraw_rewards(
            request.user, invoice, routing_budget_ppm
        )

        if not valid:
            context["successful_withdrawal"] = False
            return Response(context, status.HTTP_400_BAD_REQUEST)

        return Response({"successful_withdrawal": True}, status.HTTP_200_OK)


class PriceView(ListAPIView):
    serializer_class = PriceSerializer

    @extend_schema(**PriceViewSchema.get)
    def get(self, request):
        payload = {}
        queryset = Currency.objects.all().order_by("currency")

        for currency in queryset:
            code = Currency.currency_dict[str(currency.currency)]
            try:
                last_tick = MarketTick.objects.filter(currency=currency).latest(
                    "timestamp"
                )
                payload[code] = {
                    "price": last_tick.price,
                    "volume": last_tick.volume,
                    "premium": last_tick.premium,
                    "timestamp": last_tick.timestamp,
                }
            except Exception:
                payload[code] = None

        return Response(payload, status.HTTP_200_OK)


class TickView(ListAPIView):
    queryset = MarketTick.objects.all()
    serializer_class = TickSerializer

    @extend_schema(**TickViewSchema.get)
    def get(self, request):
        start_date_str = request.query_params.get("start")
        end_date_str = request.query_params.get("end")

        # Perform the query with date range filtering
        try:
            if start_date_str:
                naive_start_date = datetime.strptime(start_date_str, "%d-%m-%Y")
                aware_start_date = timezone.make_aware(
                    naive_start_date, timezone=timezone.get_current_timezone()
                )
                self.queryset = self.queryset.filter(timestamp__gte=aware_start_date)
            if end_date_str:
                naive_end_date = datetime.strptime(end_date_str, "%d-%m-%Y")
                aware_end_date = timezone.make_aware(
                    naive_end_date, timezone=timezone.get_current_timezone()
                )
                self.queryset = self.queryset.filter(timestamp__lte=aware_end_date)
        except ValueError:
            return Response(new_error(1050), status=status.HTTP_400_BAD_REQUEST)

        # Check if the number of ticks exceeds the limit
        if self.queryset.count() > 5000:
            return Response(new_error(1051), status=status.HTTP_400_BAD_REQUEST)

        data = self.serializer_class(self.queryset, many=True, read_only=True).data
        return Response(data, status=status.HTTP_200_OK)


class LimitView(ListAPIView):
    @extend_schema(**LimitViewSchema.get)
    def get(self, request):
        # Trade limits as BTC
        min_trade = config("MIN_ORDER_SIZE", cast=int, default=20_000) / 100_000_000
        max_trade = config("MAX_ORDER_SIZE", cast=int, default=500_000) / 100_000_000

        payload = {}
        queryset = Currency.objects.all().order_by("currency")

        for currency in queryset:
            code = Currency.currency_dict[str(currency.currency)]
            exchange_rate = float(currency.exchange_rate)
            payload[currency.currency] = {
                "code": code,
                "price": exchange_rate,
                "min_amount": min_trade * exchange_rate,
                "max_amount": max_trade * exchange_rate,
            }

        return Response(payload, status.HTTP_200_OK)


class HistoricalView(ListAPIView):
    @extend_schema(**HistoricalViewSchema.get)
    def get(self, request):
        payload = {}
        queryset = AccountingDay.objects.all().order_by("day")

        for accounting_day in queryset:
            payload[str(accounting_day.day)] = {
                "volume": accounting_day.contracted,
                "num_contracts": accounting_day.num_contracts,
            }

        return Response(payload, status.HTTP_200_OK)


class StealthView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    serializer_class = StealthSerializer

    @extend_schema(**StealthViewSchema.post)
    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST)

        stealth = serializer.data.get("wantsStealth")

        request.user.robot.wants_stealth = stealth
        request.user.robot.save(update_fields=["wants_stealth"])

        return Response({"wantsStealth": stealth})


class ReviewView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    serializer_class = ReviewSerializer

    @extend_schema(**ReviewViewSchema.post)
    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST)

        pubkey = serializer.data.get("pubkey")
        last_order = Order.objects.filter(
            Q(maker=request.user) | Q(taker=request.user)
        ).last()

        if not last_order or last_order.status not in [
            Order.Status.SUC,
            Order.Status.MLD,
            Order.Status.TLD,
        ]:
            return Response(new_error(1052), status.HTTP_400_BAD_REQUEST)
        if not request.user.robot.nostr_pubkey:
            request.user.robot.nostr_pubkey = pubkey
            request.user.robot.save(update_fields=["nostr_pubkey"])

        if request.user.robot.nostr_pubkey != pubkey:
            return Response(new_error(1052), status.HTTP_400_BAD_REQUEST)

        token = Nostr.sign_message(f"{pubkey}{last_order.id}")

        return Response({"pubkey": pubkey, "token": token}, status.HTTP_200_OK)

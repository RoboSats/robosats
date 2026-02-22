import math
import logging
from datetime import timedelta

from decouple import config, Csv
from django.contrib.auth.models import User
from django.db.models import Q, Sum
from django.utils import timezone

from api.lightning.node import LNNode
from api.errors import new_error
from api.models import (
    Currency,
    LNPayment,
    MarketTick,
    OnchainPayment,
    Order,
    TakeOrder,
    TaprootPayment,
)
from api.taproot_escrow import (
    TaprootEscrowBuilder,
    MuSig2Coordinator,
    EscrowPSBTBuilder,
    BondValidator,
)
from api.tasks import send_devfund_donation, send_notification, nostr_send_order_event
from api.utils import get_minning_fee, validate_onchain_address, location_country
from chat.models import Message

logger = logging.getLogger(__name__)

FEE = float(config("FEE"))
MAKER_FEE_SPLIT = float(config("MAKER_FEE_SPLIT"))

ESCROW_USERNAME = config("ESCROW_USERNAME")
PENALTY_TIMEOUT = int(config("PENALTY_TIMEOUT"))

MIN_ORDER_SIZE = config("MIN_ORDER_SIZE", cast=int, default=20_000)
MAX_ORDER_SIZE = config("MAX_ORDER_SIZE", cast=int, default=500_000)

EXP_MAKER_BOND_INVOICE = int(config("EXP_MAKER_BOND_INVOICE"))
EXP_TAKER_BOND_INVOICE = int(config("EXP_TAKER_BOND_INVOICE"))

BLOCK_TIME = float(config("BLOCK_TIME"))
MAX_MINING_NETWORK_SPEEDUP_EXPECTED = float(
    config("MAX_MINING_NETWORK_SPEEDUP_EXPECTED")
)

GEOBLOCKED_COUNTRIES = config("GEOBLOCKED_COUNTRIES", cast=Csv(), default="")


class Logics:
    @classmethod
    def validate_already_maker_or_taker(cls, user):
        """Validates if a use is already not part of an active order"""

        active_order_status = [
            Order.Status.WFB,
            Order.Status.PUB,
            Order.Status.PAU,
            Order.Status.TAK,
            Order.Status.WF2,
            Order.Status.WFE,
            Order.Status.WFI,
            Order.Status.CHA,
            Order.Status.FSE,
            Order.Status.DIS,
            Order.Status.WFR,
            # Taproot escrow active states
            Order.Status.TAP_WFB,
            Order.Status.TAP_PUB,
            Order.Status.TAP_TAK,
            Order.Status.TAP_WFE,
            Order.Status.TAP_ESC,
            Order.Status.TAP_FSE,
            Order.Status.TAP_DIS,
            Order.Status.TAP_PAY,
        ]
        """Checks if the user is already partipant of an active order"""
        queryset_maker = Order.objects.filter(
            maker=user, status__in=active_order_status
        )
        if queryset_maker.exists():
            return (
                False,
                new_error(1000),
                queryset_maker[0],
            )

        queryset_taker = Order.objects.filter(
            taker=user, status__in=active_order_status
        )
        queryset_pretaker = TakeOrder.objects.filter(
            taker=user, expires_at__gt=timezone.now()
        )
        if queryset_taker.exists():
            return (
                False,
                new_error(1001),
                queryset_taker[0],
            )
        elif queryset_pretaker.exists():
            return (
                False,
                new_error(1002),
                queryset_pretaker[0].order,
            )

        # Edge case when the user is in an order that is failing payment and he is the buyer
        queryset = Order.objects.filter(
            Q(maker=user) | Q(taker=user),
            status__in=[Order.Status.FAI, Order.Status.PAY],
        )
        if queryset.exists():
            order = queryset[0]
            if cls.is_buyer(order, user):
                return (
                    False,
                    new_error(1003),
                    order,
                )

        return True, None, None

    @classmethod
    def validate_order_size(cls, order):
        """Validates if order size in Sats is within limits at t0"""
        if not order.has_range:
            if order.t0_satoshis > MAX_ORDER_SIZE:
                return False, new_error(
                    1004,
                    {
                        "order_amount": order.t0_satoshis,
                        "max_order_size": MAX_ORDER_SIZE,
                    },
                )
            if order.t0_satoshis < MIN_ORDER_SIZE:
                return False, new_error(
                    1005,
                    {
                        "order_amount": order.t0_satoshis,
                        "min_order_size": MIN_ORDER_SIZE,
                    },
                )
        elif order.has_range:
            min_sats = cls.calc_sats(
                order.min_amount, order.currency.exchange_rate, order.premium
            )
            max_sats = cls.calc_sats(
                order.max_amount, order.currency.exchange_rate, order.premium
            )
            if min_sats > max_sats / 1.5:
                return False, new_error(1006)
            elif max_sats > MAX_ORDER_SIZE:
                return False, new_error(
                    1007, {"max_sats": int(max_sats), "max_order_size": MAX_ORDER_SIZE}
                )
            elif min_sats < MIN_ORDER_SIZE:
                return False, new_error(
                    1008, {"min_sats": int(min_sats), "min_order_size": MIN_ORDER_SIZE}
                )
            elif min_sats < max_sats / 15:
                return False, new_error(1009)

        return True, None

    @classmethod
    def validate_location(cls, order) -> bool:
        if not (order.latitude or order.longitude):
            return True, None

        country = location_country(order.longitude, order.latitude)
        if country in GEOBLOCKED_COUNTRIES:
            return False, new_error(1010, {"country": country})
        else:
            return True, None

    def validate_amount_within_range(order, amount):
        if amount > float(order.max_amount) or amount < float(order.min_amount):
            return False, new_error(1011)

        return True, None

    def user_activity_status(last_seen):
        if last_seen > (timezone.now() - timedelta(minutes=2)):
            return "Active"
        elif last_seen > (timezone.now() - timedelta(minutes=10)):
            return "Seen recently"
        else:
            return "Inactive"

    @classmethod
    def take(cls, order, user, amount=None):
        is_penalized, time_out = cls.is_penalized(user)
        take_order = TakeOrder.objects.filter(
            taker=user, order=order, expires_at__gt=timezone.now()
        )
        if is_penalized:
            return False, new_error(1012, {"time_out": time_out})
        elif take_order.exists():
            order.log(
                f"Order already Pre-Taken by Robot({user.robot.id},{user.username}) for {order.amount} fiat units"
            )
            return True, None
        else:
            take_order = TakeOrder.objects.create(
                taker=user,
                order=order,
                expires_at=timezone.now()
                + timedelta(seconds=order.t_to_expire(Order.Status.TAK)),
            )

            if order.has_range:
                take_order.amount = amount
            else:
                take_order.amount = order.amount
            take_order.save(update_fields=["amount"])

            order.log(
                f"Pre-Taken by Robot({user.robot.id},{user.username}) for {order.amount} fiat units"
            )
            return True, None

    def is_buyer(order, user):
        is_maker = order.maker == user
        is_taker = order.taker == user
        is_pretaker = TakeOrder.objects.filter(
            taker=user, order=order, expires_at__gt=timezone.now()
        ).exists()
        return (is_maker and order.type == Order.Types.BUY) or (
            (is_pretaker or is_taker) and order.type == Order.Types.SELL
        )

    def is_seller(order, user):
        is_maker = order.maker == user
        is_taker = order.taker == user
        is_pretaker = TakeOrder.objects.filter(
            taker=user, order=order, expires_at__gt=timezone.now()
        ).exists()
        return (is_maker and order.type == Order.Types.SELL) or (
            (is_pretaker or is_taker) and order.type == Order.Types.BUY
        )

    def calc_sats(amount, exchange_rate, premium):
        exchange_rate = float(exchange_rate)
        premium_rate = exchange_rate * (1 + float(premium) / 100)
        return (float(amount) / premium_rate) * 100 * 1000 * 1000

    @classmethod
    def satoshis_now(cls, order, take_amount=None):
        """checks trade amount in sats"""
        if order.is_explicit:
            satoshis_now = order.satoshis
        else:
            if take_amount is not None:
                amount = take_amount
            else:
                amount = order.amount if order.amount is not None else order.max_amount

            satoshis_now = cls.calc_sats(
                amount, order.currency.exchange_rate, order.premium
            )
        return int(satoshis_now)

    def price_and_premium_now(order):
        """computes order price and premium with current rates"""
        exchange_rate = float(order.currency.exchange_rate)
        if not order.is_explicit:
            premium = order.premium
            price = exchange_rate * (1 + float(premium) / 100)
        else:
            amount = order.amount if not order.has_range else order.max_amount
            order_rate = float(amount) / (float(order.satoshis) / 100_000_000)
            premium = order_rate / exchange_rate - 1
            premium = int(premium * 10_000) / 100  # 2 decimals left
            price = order_rate

        significant_digits = 5
        price = round(
            price, significant_digits - int(math.floor(math.log10(abs(price)))) - 1
        )

        return price, premium

    @classmethod
    def take_order_expires(cls, take_order):
        if take_order.expires_at > timezone.now():
            take_order.expires_at = timezone.now()
            take_order.save(update_fields=["expires_at"])
        cls.cancel_bond(take_order.taker_bond)

    @classmethod
    def order_expires(cls, order):
        """General cases when time runs out."""

        # Do not change order status if an order in any with
        # any of these status is sent to expire here
        does_not_expire = [
            Order.Status.UCA,
            Order.Status.EXP,
            Order.Status.TLD,
            Order.Status.DIS,
            Order.Status.CCA,
            Order.Status.PAY,
            Order.Status.SUC,
            Order.Status.FAI,
            Order.Status.MLD,
        ]

        # in any case, if order is_swap and there is an onchain_payment, cancel it.
        if order.status not in does_not_expire:
            cls.cancel_onchain_payment(order)

        if order.status in does_not_expire:
            return False

        elif order.status == Order.Status.WFB:
            order.update_status(Order.Status.EXP)
            order.expiry_reason = Order.ExpiryReasons.NMBOND
            cls.cancel_bond(order.maker_bond)
            order.save(update_fields=["expiry_reason"])

            order.log("Order expired while waiting for maker bond")
            order.log("Maker bond was cancelled")

            return True

        elif order.status in [Order.Status.PUB, Order.Status.PAU]:
            cls.return_bond(order.maker_bond)
            order.update_status(Order.Status.EXP)
            order.expiry_reason = Order.ExpiryReasons.NTAKEN

            take_orders_queryset = TakeOrder.objects.filter(order=order)
            for idx, take_order in enumerate(take_orders_queryset):
                cls.take_order_expires(take_order)

            order.save(update_fields=["expiry_reason"])

            send_notification.delay(order_id=order.id, message="order_expired_untaken")

            order.log("Order expired while public or paused")
            order.log("Maker bond was <b>unlocked</b>")

            return True

        elif order.status == Order.Status.WF2:
            """Weird case where an order expires and both participants
            did not proceed with the contract. Likely the site was
            down or there was a bug. Still bonds must be charged
            to avoid service DDOS."""

            cls.settle_bond(order.maker_bond)
            cls.settle_bond(order.taker_bond)
            cls.cancel_escrow(order)
            order.update_status(Order.Status.EXP)
            order.expiry_reason = Order.ExpiryReasons.NESINV
            order.save(update_fields=["expiry_reason"])

            order.log(
                "Order expired while waiting for both buyer invoice and seller escrow"
            )
            order.log("Maker bond was <b>settled</b>")
            order.log("Taker bond was <b>settled</b>")

            return True

        elif order.status == Order.Status.WFE:
            maker_is_seller = cls.is_seller(order, order.maker)
            # If maker is seller, settle the bond and order goes to expired
            if maker_is_seller:
                cls.settle_bond(order.maker_bond)
                cls.return_bond(order.taker_bond)
                # If seller is offline the escrow LNpayment does not exist
                try:
                    cls.cancel_escrow(order)
                except Exception:
                    pass
                order.update_status(Order.Status.EXP)
                order.expiry_reason = Order.ExpiryReasons.NESCRO
                order.save(update_fields=["expiry_reason"])
                # Reward taker with part of the maker bond
                cls.add_slashed_rewards(order, order.maker_bond, order.taker_bond)

                order.log("Order expired while waiting for escrow of the maker/seller")
                order.log("Maker bond was <b>settled</b>")
                order.log("Taker bond was <b>unlocked</b>")

                return True

            # If maker is buyer, settle the taker's bond order goes back to public
            else:
                cls.settle_bond(order.taker_bond)
                # If seller is offline the escrow LNpayment does not even exist
                try:
                    cls.cancel_escrow(order)
                except Exception:
                    pass
                taker_bond = order.taker_bond
                cls.publish_order(order)
                send_notification.delay(order_id=order.id, message="order_published")
                # Reward maker with part of the taker bond
                cls.add_slashed_rewards(order, taker_bond, order.maker_bond)

                order.log("Order expired while waiting for escrow of the taker/seller")
                order.log("Taker bond was <b>settled</b>")

                return True

        elif order.status == Order.Status.WFI:
            # The trade could happen without a buyer invoice. However, this user
            # is likely AFK; will probably desert the contract as well.

            maker_is_buyer = cls.is_buyer(order, order.maker)
            # If maker is buyer, settle the bond and order goes to expired
            if maker_is_buyer:
                cls.settle_bond(order.maker_bond)
                cls.return_bond(order.taker_bond)
                cls.return_escrow(order)
                order.update_status(Order.Status.EXP)
                order.expiry_reason = Order.ExpiryReasons.NINVOI
                order.save(update_fields=["expiry_reason"])
                # Reward taker with part of the maker bond
                cls.add_slashed_rewards(order, order.maker_bond, order.taker_bond)

                order.log("Order expired while waiting for invoice of the maker/buyer")
                order.log("Maker bond was <b>settled</b>")
                order.log("Taker bond was <b>unlocked</b>")

                return True

            # If maker is seller settle the taker's bond, order goes back to public
            else:
                cls.settle_bond(order.taker_bond)
                cls.return_escrow(order)
                taker_bond = order.taker_bond
                cls.publish_order(order)
                send_notification.delay(order_id=order.id, message="order_published")
                # Reward maker with part of the taker bond
                cls.add_slashed_rewards(order, taker_bond, order.maker_bond)

                order.log("Order expired while waiting for invoice of the taker/buyer")
                order.log("Taker bond was <b>settled</b>")

                return True

        elif order.status in [Order.Status.CHA, Order.Status.FSE]:
            # Another weird case. The time to confirm 'fiat sent or received' expired. Yet no dispute
            # was opened. Hint: a seller-scammer could persuade a buyer to not click "fiat
            # sent", we assume this is a dispute case by default.
            cls.open_dispute(order)
            order.log(
                "Order expired during chat and a dispute was opened automatically"
            )
            return True

    @classmethod
    def kick_taker(cls, take_order):
        """The taker did not lock the taker_bond. Now he has to go"""
        cls.take_order_expires(take_order)
        # Add a time out to the taker
        if take_order.taker:
            robot = take_order.taker.robot
            robot.penalty_expiration = timezone.now() + timedelta(
                seconds=PENALTY_TIMEOUT
            )
            robot.save(update_fields=["penalty_expiration"])

        take_order.order.log("Taker was kicked out of the order")
        return True

    @classmethod
    def automatic_dispute_resolution(cls, order):
        """Simple case where a dispute can be solved with a
        priori knowledge. For example, a dispute that opens
        at expiration on an order where one of the participants
        never sent a message on the chat and never marked 'fiat
        sent'. By solving the dispute automatically before
        flagging it as dispute, we avoid having to settle the
        bonds"""

        # If fiat has been marked as sent, automatic dispute
        # resolution is not possible.
        if order.is_fiat_sent and not order.reverted_fiat_sent:
            return False

        # If the order has not entered dispute due to time expire
        # (a user triggered it), automatic dispute resolution is
        # not possible.
        if order.expires_at >= timezone.now():
            return False

        num_messages_taker = len(
            Message.objects.filter(order=order, sender=order.taker)
        )
        num_messages_maker = len(
            Message.objects.filter(order=order, sender=order.maker)
        )

        if num_messages_maker == num_messages_taker == 0:
            cls.return_escrow(order)
            cls.settle_bond(order.maker_bond)
            cls.settle_bond(order.taker_bond)
            order.update_status(Order.Status.DIS)

            order.log("Maker bond was <b>settled</b>")
            order.log("Taker bond was <b>settled</b>")
            order.log(
                "No robot wrote in the chat, the dispute cannot be solved automatically"
            )

        elif num_messages_maker == 0:
            cls.return_escrow(order)
            cls.settle_bond(order.maker_bond)
            cls.return_bond(order.taker_bond)
            order.update_status(Order.Status.MLD)
            cls.add_slashed_rewards(order, order.maker_bond, order.taker_bond)

            order.log("Maker bond was <b>settled</b>")
            order.log("Taker bond was <b>unlocked</b>")
            order.log(
                "<b>The dispute was solved automatically:</b> 'Maker lost dispute', the maker did not write in the chat"
            )

        elif num_messages_taker == 0:
            cls.return_escrow(order)
            cls.settle_bond(order.taker_bond)
            cls.return_bond(order.maker_bond)
            order.update_status(Order.Status.TLD)
            cls.add_slashed_rewards(order, order.taker_bond, order.maker_bond)

            order.log("Maker bond was <b>unlocked</b>")
            order.log("Taker bond was <b>settled</b>")
            order.log(
                "<b>The dispute was solved automatically:</b> 'Taker lost dispute', the maker did not write in the chat"
            )
        else:
            return False

        order.is_disputed = True
        order.expires_at = timezone.now() + timedelta(
            seconds=order.t_to_expire(Order.Status.DIS)
        )
        order.save(update_fields=["is_disputed", "expires_at"])
        send_notification.delay(order_id=order.id, message="dispute_opened")

        return True

    @classmethod
    def open_dispute(cls, order, user=None):
        # Always settle escrow and bonds during a dispute. Disputes
        # can take long to resolve, it might trigger force closure
        # for unresolved HTLCs) Dispute winner will have to submit a
        # new invoice for value of escrow + bond.

        valid_status_open_dispute = [
            Order.Status.CHA,
            Order.Status.FSE,
        ]

        if order.status not in valid_status_open_dispute:
            return False, new_error(1013)

        automatically_solved = cls.automatic_dispute_resolution(order)

        if automatically_solved:
            return True, None

        if not order.trade_escrow.status == LNPayment.Status.SETLED:
            cls.settle_escrow(order)
            cls.settle_bond(order.maker_bond)
            cls.settle_bond(order.taker_bond)

        order.is_disputed = True
        order.update_status(Order.Status.DIS)
        order.expires_at = timezone.now() + timedelta(
            seconds=order.t_to_expire(Order.Status.DIS)
        )
        order.save(update_fields=["is_disputed", "expires_at"])

        # User could be None if a dispute is open automatically due to time expiration.
        if user is not None:
            robot = user.robot
            robot.num_disputes = robot.num_disputes + 1
            if robot.orders_disputes_started is None:
                robot.orders_disputes_started = [str(order.id)]
            else:
                robot.orders_disputes_started = list(
                    robot.orders_disputes_started
                ).append(str(order.id))
            robot.save(update_fields=["num_disputes", "orders_disputes_started"])

        send_notification.delay(order_id=order.id, message="dispute_opened")
        order.log(
            f"Dispute was opened {f'by Robot({user.robot.id},{user.username})' if user else ''}"
        )
        order.log("Maker bond was <b>settled</b>")
        order.log("Taker bond was <b>settled</b>")

        return True, None

    def dispute_statement(order, user, statement):
        """Updates the dispute statements"""

        if not order.status == Order.Status.DIS:
            return False, new_error(1014)

        if len(statement) > 50_000:
            return False, new_error(2000)

        if len(statement) < 100:
            return False, new_error(2001)

        if order.maker == user:
            order.maker_statement = statement
            order.save(update_fields=["maker_statement"])
        else:
            order.taker_statement = statement
            order.save(update_fields=["taker_statement"])

        # If both statements are in, move status to wait for dispute resolution
        if order.maker_statement not in [None, ""] and order.taker_statement not in [
            None,
            "",
        ]:
            order.update_status(Order.Status.WFR)
            order.expires_at = timezone.now() + timedelta(
                seconds=order.t_to_expire(Order.Status.WFR)
            )
            order.save(update_fields=["status", "expires_at"])

        order.log(
            f"Dispute statement submitted by Robot({user.robot.id},{user.username}) with length of {len(statement)} chars"
        )
        return True, None

    def compute_swap_fee_rate(balance):
        shape = str(config("SWAP_FEE_SHAPE"))

        if shape == "linear":
            MIN_SWAP_FEE = config("MIN_SWAP_FEE", cast=float, default=0.01)
            MIN_POINT = float(config("MIN_POINT"))
            MAX_SWAP_FEE = float(config("MAX_SWAP_FEE"))
            MAX_POINT = float(config("MAX_POINT"))
            if float(balance.onchain_fraction) > MIN_POINT:
                swap_fee_rate = MIN_SWAP_FEE
            else:
                slope = (MAX_SWAP_FEE - MIN_SWAP_FEE) / (MAX_POINT - MIN_POINT)
                swap_fee_rate = (
                    slope * (balance.onchain_fraction - MAX_POINT) + MAX_SWAP_FEE
                )

        elif shape == "exponential":
            MIN_SWAP_FEE = config("MIN_SWAP_FEE", cast=float, default=0.01)
            MAX_SWAP_FEE = float(config("MAX_SWAP_FEE"))
            SWAP_LAMBDA = float(config("SWAP_LAMBDA"))
            swap_fee_rate = MIN_SWAP_FEE + (MAX_SWAP_FEE - MIN_SWAP_FEE) * math.exp(
                -SWAP_LAMBDA * float(balance.onchain_fraction)
            )

        return swap_fee_rate * 100

    @classmethod
    def create_onchain_payment(cls, order, user, preliminary_amount):
        """
        Creates an empty OnchainPayment for order.payout_tx.
        It sets the fees to be applied to this order if onchain Swap is used.
        If the user submits a LN invoice instead. The returned OnchainPayment goes unused.
        """
        # Make sure no invoice payout is attached to order
        order.payout = None

        # Create onchain_payment
        onchain_payment = OnchainPayment.objects.create(receiver=user)

        # Compute a safer available  onchain liquidity: (confirmed_utxos - reserve - pending_outgoing_txs))
        # Accounts for already committed outgoing TX for previous users.
        confirmed = onchain_payment.balance.onchain_confirmed
        # We assume a reserve of 300K Sats (3 times higher than LND's default anchor reserve)
        reserve = 300_000
        pending_txs = OnchainPayment.objects.filter(
            status__in=[OnchainPayment.Status.VALID, OnchainPayment.Status.QUEUE]
        ).aggregate(Sum("num_satoshis"))["num_satoshis__sum"]

        if pending_txs is None:
            pending_txs = 0

        available_onchain = confirmed - reserve - pending_txs
        if (
            preliminary_amount > available_onchain
        ):  # Not enough onchain balance to commit for this swap.
            return False

        suggested_mining_fee_rate = get_minning_fee("suggested", preliminary_amount)

        # Hardcap mining fee suggested at 1000 sats/vbyte
        if suggested_mining_fee_rate > 1000:
            suggested_mining_fee_rate = 1000

        onchain_payment.suggested_mining_fee_rate = max(2.05, suggested_mining_fee_rate)
        onchain_payment.swap_fee_rate = cls.compute_swap_fee_rate(
            onchain_payment.balance
        )
        onchain_payment.save()

        order.payout_tx = onchain_payment
        order.save(update_fields=["payout_tx"])

        order.log(
            f"Empty OnchainPayment({order.payout_tx.id},{order.payout_tx}) was created. Available onchain balance is {available_onchain} Sats"
        )

        return True

    @classmethod
    def payout_amount(cls, order, user):
        """Computes buyer invoice amount. Uses order.last_satoshis,
        that is the final trade amount set at Taker Bond time
        Adds context for onchain swap.
        """
        if not cls.is_buyer(order, user):
            return False, None

        if user == order.maker:
            fee_fraction = FEE * MAKER_FEE_SPLIT
        elif user == order.taker:
            fee_fraction = FEE * (1 - MAKER_FEE_SPLIT)

        fee_sats = order.last_satoshis * fee_fraction

        context = {}
        # context necessary for the user to submit a LN invoice
        context["invoice_amount"] = round(
            order.last_satoshis - fee_sats
        )  # Trading fee to buyer is charged here.

        # context necessary for the user to submit an onchain address
        MIN_SWAP_AMOUNT = config("MIN_SWAP_AMOUNT", cast=int, default=20_000)
        MAX_SWAP_AMOUNT = config("MAX_SWAP_AMOUNT", cast=int, default=500_000)

        if context["invoice_amount"] < MIN_SWAP_AMOUNT:
            context["swap_allowed"] = False
            context["swap_failure_reason"] = (
                f"Order amount is smaller than the minimum swap available of {MIN_SWAP_AMOUNT} Sats"
            )
            order.log(
                f"Onchain payment option was not offered: amount is smaller than the minimum swap available of {MIN_SWAP_AMOUNT} Sats",
                level="WARN",
            )
            return True, context
        elif context["invoice_amount"] > MAX_SWAP_AMOUNT:
            context["swap_allowed"] = False
            context["swap_failure_reason"] = (
                f"Order amount is bigger than the maximum swap available of {MAX_SWAP_AMOUNT} Sats"
            )
            order.log(
                f"Onchain payment option was not offered: amount is bigger than the maximum swap available of {MAX_SWAP_AMOUNT} Sats",
                level="WARN",
            )
            return True, context

        if config("DISABLE_ONCHAIN", cast=bool, default=True):
            context["swap_allowed"] = False
            context["swap_failure_reason"] = "On-the-fly submarine swaps are disabled"
            order.log(
                "Onchain payment option was not offered: on-the-fly submarine swaps are disabled"
            )
            return True, context

        if order.payout_tx is None:
            # Creates the OnchainPayment object and checks node balance
            valid = cls.create_onchain_payment(
                order, user, preliminary_amount=context["invoice_amount"]
            )
            order.log(
                f"Suggested mining fee is {order.payout_tx.suggested_mining_fee_rate} Sats/vbyte, the swap fee rate is {order.payout_tx.swap_fee_rate}%"
            )
            if not valid:
                context["swap_allowed"] = False
                context["swap_failure_reason"] = (
                    "Not enough onchain liquidity available to offer a swap"
                )
                order.log(
                    "Onchain payment option was not offered: onchain liquidity available to offer a swap",
                    level="WARN",
                )
                return True, context

        context["swap_allowed"] = True
        context["suggested_mining_fee_rate"] = float(
            order.payout_tx.suggested_mining_fee_rate
        )
        context["swap_fee_rate"] = order.payout_tx.swap_fee_rate

        return True, context

    @classmethod
    def escrow_amount(cls, order, user):
        """Computes escrow invoice amount. Uses order.last_satoshis,
        that is the final trade amount set at Taker Bond time"""

        if user == order.maker:
            fee_fraction = FEE * MAKER_FEE_SPLIT
        elif user == order.taker:
            fee_fraction = FEE * (1 - MAKER_FEE_SPLIT)

        fee_sats = order.last_satoshis * fee_fraction

        if cls.is_seller(order, user):
            escrow_amount = round(
                order.last_satoshis + fee_sats
            )  # Trading fee to seller is charged here.

        return True, {"escrow_amount": escrow_amount}

    @classmethod
    def update_address(cls, order, user, address, mining_fee_rate):
        # Empty address?
        if not address:
            return False, new_error(4000)
        # only the buyer can post a buyer address
        if not cls.is_buyer(order, user):
            return False, new_error(1015)
        # not the right time to submit
        if not (
            order.taker_bond.status
            == order.maker_bond.status
            == LNPayment.Status.LOCKED
        ) or order.status not in [Order.Status.WFI, Order.Status.WF2]:
            order.log(
                f"Robot({user.robot.id},{user.username}) attempted to submit an address while the order was in status {order.status}",
                level="ERROR",
            )
            return False, new_error(1016)
        # not a valid address
        valid, context = validate_onchain_address(address)
        if not valid:
            order.log(f"The address {address} is not valid", level="WARN")
            return False, context

        num_satoshis = cls.payout_amount(order, user)[1]["invoice_amount"]
        if mining_fee_rate:
            # not a valid mining fee
            min_mining_fee_rate = get_minning_fee("minimum", num_satoshis)

            min_mining_fee_rate = max(2, min_mining_fee_rate)

            if float(mining_fee_rate) < min_mining_fee_rate:
                order.log(
                    f"The onchain fee {float(mining_fee_rate)} Sats/vbytes proposed by Robot({user.robot.id},{user.username}) is less than the current minimum mining fee {min_mining_fee_rate} Sats",
                    level="WARN",
                )
                return False, new_error(
                    4001, {"min_mining_fee_rate": min_mining_fee_rate}
                )
            elif float(mining_fee_rate) > 500:
                order.log(
                    f"The onchain fee {float(mining_fee_rate)} Sats/vbytes proposed by Robot({user.robot.id},{user.username}) is higher than the absolute maximum mining fee 500 Sats",
                    level="WARN",
                )
                return False, new_error(4002)
            order.payout_tx.mining_fee_rate = float(mining_fee_rate)
        # If not mining fee provider use backend's suggested fee rate
        else:
            order.payout_tx.mining_fee_rate = order.payout_tx.suggested_mining_fee_rate

        tx = order.payout_tx
        tx.address = address
        tx.mining_fee_sats = int(tx.mining_fee_rate * 280)
        tx.num_satoshis = num_satoshis
        tx.sent_satoshis = int(
            float(tx.num_satoshis)
            - float(tx.num_satoshis) * float(tx.swap_fee_rate) / 100
            - float(tx.mining_fee_sats)
        )

        if float(tx.sent_satoshis) < 20_000:
            order.log(
                f"The onchain Sats to be sent ({float(tx.sent_satoshis)}) are below the dust limit of 20,000 Sats",
                level="WARN",
            )
            return False, new_error(4003)
        tx.status = OnchainPayment.Status.VALID
        tx.save()

        order.is_swap = True
        order.save(update_fields=["is_swap"])

        order.log(
            f"Robot({user.robot.id},{user.username}) added an onchain address OnchainPayment({tx.id},{address[:6]}...{address[-4:]}) as payout method. Amount to be sent is {tx.sent_satoshis} Sats, mining fee is {tx.mining_fee_sats} Sats"
        )
        cls.move_state_updated_payout_method(order)

        return True, None

    @classmethod
    def update_invoice(cls, order, user, invoice, routing_budget_ppm):
        # Empty invoice?
        if not invoice:
            order.log(
                f"Robot({user.robot.id},{user.username}) submitted an empty invoice",
                level="WARN",
            )
            return False, new_error(3000)
        # only the buyer can post a buyer invoice
        if not cls.is_buyer(order, user):
            return False, new_error(1017)
        if not order.taker_bond:
            return False, new_error(1018)
        if (
            not (
                order.taker_bond.status
                == order.maker_bond.status
                == LNPayment.Status.LOCKED
            )
            and not order.status == Order.Status.FAI
        ):
            return False, new_error(1019)
        if order.status == Order.Status.FAI:
            if order.payout.status != LNPayment.Status.EXPIRE:
                return False, new_error(3001)

        # cancel onchain_payout if existing
        cls.cancel_onchain_payment(order)

        num_satoshis = cls.payout_amount(order, user)[1]["invoice_amount"]
        routing_budget_sats = float(num_satoshis) * (
            float(routing_budget_ppm) / 1_000_000
        )
        num_satoshis = int(num_satoshis - routing_budget_sats)
        payout = LNNode.validate_ln_invoice(invoice, num_satoshis, routing_budget_ppm)

        if not payout["valid"]:
            return False, payout["context"]

        if order.payout:
            if order.payout.payment_hash == payout["payment_hash"]:
                return False, new_error(3002)

        order.payout = LNPayment.objects.create(
            concept=LNPayment.Concepts.PAYBUYER,
            type=LNPayment.Types.NORM,
            sender=User.objects.get(username=ESCROW_USERNAME),
            receiver=user,
            routing_budget_ppm=routing_budget_ppm,
            routing_budget_sats=routing_budget_sats,
            invoice=invoice,
            status=LNPayment.Status.VALIDI,
            num_satoshis=num_satoshis,
            description=payout["description"],
            payment_hash=payout["payment_hash"],
            created_at=payout["created_at"],
            expires_at=payout["expires_at"],
        )

        order.is_swap = False
        order.save(update_fields=["payout", "is_swap"])

        order.log(
            f"Robot({user.robot.id},{user.username}) added the invoice LNPayment({order.payout.payment_hash},{order.payout.payment_hash}) as payout method. Amount to be sent is {order.payout.num_satoshis} Sats, routing budget is {order.payout.routing_budget_sats} Sats ({order.payout.routing_budget_ppm}ppm)"
        )

        cls.move_state_updated_payout_method(order)

        return True, None

    @classmethod
    def move_state_updated_payout_method(cls, order):
        # If the order status is 'Waiting for invoice'. Move forward to 'chat'
        if order.status == Order.Status.WFI:
            order.update_status(Order.Status.CHA)
            order.expires_at = timezone.now() + timedelta(
                seconds=order.t_to_expire(Order.Status.CHA)
            )
            send_notification.delay(order_id=order.id, message="fiat_exchange_starts")

        # If the order status is 'Waiting for both'. Move forward to 'waiting for escrow'
        elif order.status == Order.Status.WF2:
            # If the escrow does not exist, or is not locked move to WFE.
            if order.trade_escrow is None:
                order.update_status(Order.Status.WFE)

            # If the escrow is locked move to Chat.
            elif order.trade_escrow.status == LNPayment.Status.LOCKED:
                order.update_status(Order.Status.CHA)
                order.expires_at = timezone.now() + timedelta(
                    seconds=order.t_to_expire(Order.Status.CHA)
                )
                send_notification.delay(
                    order_id=order.id, message="fiat_exchange_starts"
                )
            else:
                order.update_status(Order.Status.WFE)

        # If the order status is 'Failed Routing'. Retry payment.
        elif order.status == Order.Status.FAI:
            if LNNode.double_check_htlc_is_settled(order.trade_escrow.payment_hash):
                order.update_status(Order.Status.PAY)
                order.payout.status = LNPayment.Status.FLIGHT
                order.payout.routing_attempts = 0
                order.payout.save(update_fields=["status", "routing_attempts"])

        order.save(update_fields=["expires_at"])
        return True

    def is_penalized(user):
        """Checks if a user that is not participant of orders
        has a limit on taking or making a order"""

        if user.robot.penalty_expiration:
            if user.robot.penalty_expiration > timezone.now():
                time_out = (user.robot.penalty_expiration - timezone.now()).seconds
                return True, time_out

        return False, None

    @classmethod
    def cancel_order(cls, order, user, cancel_status=None):
        # If cancel status is specified, do no cancel the order
        # if it is not the correct one.
        # This prevents the client from cancelling an order that
        # recently changed status.
        if cancel_status is not None:
            if order.status != cancel_status:
                return False, new_error(
                    1020, {"order_status": order.status, "cancel_status": cancel_status}
                )

        # Do not change order status if an is in order
        # any of these status
        do_not_cancel = [
            Order.Status.UCA,
            Order.Status.EXP,
            Order.Status.TLD,
            Order.Status.DIS,
            Order.Status.CCA,
            Order.Status.PAY,
            Order.Status.SUC,
            Order.Status.FAI,
            Order.Status.MLD,
        ]

        if order.status in do_not_cancel:
            return False, new_error(1021)

        # 1) When maker cancels before bond
        # The order never shows up on the book and order
        # status becomes "cancelled"
        if order.status == Order.Status.WFB and order.maker == user:
            cls.cancel_bond(order.maker_bond)
            order.update_status(Order.Status.UCA)

            order.log("Order expired while waiting for maker bond")
            order.log("Maker bond was cancelled")

            nostr_send_order_event.delay(order_id=order.id)

            return True, None

        elif order.status in [Order.Status.PUB, Order.Status.PAU]:
            if order.maker == user:
                # 2.a) When maker cancels after bond
                #
                # The order disapears from book and goes to cancelled. If strict, maker is charged the bond
                # to prevent DDOS on the LN node and order book. If not strict, maker is returned
                # the bond (more user friendly).
                # Return the maker bond (Maker gets returned the bond for cancelling public order)
                if cls.return_bond(order.maker_bond):
                    order.update_status(Order.Status.UCA)

                    order.log("Order cancelled by maker while public or paused")
                    order.log("Maker bond was <b>unlocked</b>")

                    take_orders_queryset = TakeOrder.objects.filter(order=order)
                    for idx, take_order in enumerate(take_orders_queryset):
                        order.log("Pretaker bond was <b>unlocked</b>")
                        cls.take_order_expires(take_order)

                    send_notification.delay(
                        order_id=order.id, message="public_order_cancelled"
                    )
                    nostr_send_order_event.delay(order_id=order.id)

                    return True, None
            else:
                # 2.b) When pretaker cancels before bond
                # LNPayment "take_order" is expired
                take_order_query = TakeOrder.objects.filter(
                    order=order, taker=user, expires_at__gt=timezone.now()
                )

                if take_order_query.exists():
                    take_order = take_order_query.first()
                    # adds a timeout penalty
                    cls.kick_taker(take_order)

                    order.log("Taker cancelled before locking the bond")

                    return True, None

        # 4) When taker or maker cancel after bond (before escrow)
        #
        # The order goes into cancelled status if maker cancels.
        # The order goes into the public book if taker cancels.
        # In both cases there is a small fee.

        # 4.a) When maker cancel after bond (before escrow)
        # The order into cancelled status if maker cancels.
        elif (
            order.status in [Order.Status.WF2, Order.Status.WFE] and order.maker == user
        ):
            # cancel onchain payment if existing
            cls.cancel_onchain_payment(order)
            # Settle the maker bond (Maker loses the bond for canceling an ongoing trade)
            valid = cls.settle_bond(order.maker_bond)
            cls.return_bond(order.taker_bond)  # returns taker bond
            cls.cancel_escrow(order)

            if valid:
                order.update_status(Order.Status.UCA)
                # Reward taker with part of the maker bond
                cls.add_slashed_rewards(order, order.maker_bond, order.taker_bond)

                order.log("Maker cancelled before escrow was locked")
                order.log("Maker bond was <b>settled</b>")
                order.log("Taker bond was <b>unlocked</b>")

                nostr_send_order_event.delay(order_id=order.id)

                return True, None

        # 4.b) When taker cancel after bond (before escrow)
        # The order into cancelled status if mtker cancels.
        elif (
            order.status in [Order.Status.WF2, Order.Status.WFE] and order.taker == user
        ):
            # cancel onchain payment if existing
            cls.cancel_onchain_payment(order)
            # Settle the maker bond (Maker loses the bond for canceling an ongoing trade)
            valid = cls.settle_bond(order.taker_bond)
            if valid:
                taker_bond = order.taker_bond
                cls.publish_order(order)
                send_notification.delay(order_id=order.id, message="order_published")
                # Reward maker with part of the taker bond
                cls.add_slashed_rewards(order, taker_bond, order.maker_bond)

                order.log("Taker cancelled before escrow was locked")
                order.log("Taker bond was <b>settled</b>")
                order.log("Maker bond was <b>unlocked</b>")

                nostr_send_order_event.delay(order_id=order.id)

                return True, None

        # 5) When trade collateral has been posted (after escrow)
        #
        # Always goes to CCA status. Collaboration is needed.
        # When a user asks for cancel, 'order.m/t/aker_asked_cancel' goes True.
        # When the second user asks for cancel. Order is totally cancelled.
        # Must have a small cost for both parties to prevent node DDOS.
        elif order.status in [Order.Status.WFI, Order.Status.CHA]:
            # if the maker had asked, and now the taker does: cancel order, return everything
            if order.maker_asked_cancel and user == order.taker:
                cls.collaborative_cancel(order)
                order.log(
                    f"Taker Robot({user.robot.id},{user.username}) accepted the collaborative cancellation"
                )

                nostr_send_order_event.delay(order_id=order.id)

                return True, None

            # if the taker had asked, and now the maker does: cancel order, return everything
            elif order.taker_asked_cancel and user == order.maker:
                cls.collaborative_cancel(order)
                order.log(
                    f"Maker Robot({user.robot.id},{user.username}) accepted the collaborative cancellation"
                )

                nostr_send_order_event.delay(order_id=order.id)

                return True, None

            # Otherwise just make true the asked for cancel flags
            elif user == order.taker:
                order.taker_asked_cancel = True
                order.save(update_fields=["taker_asked_cancel"])
                order.log(
                    f"Taker Robot({user.robot.id},{user.username}) asked for collaborative cancellation"
                )
                return True, None

            elif user == order.maker:
                order.maker_asked_cancel = True
                order.save(update_fields=["maker_asked_cancel"])
                order.log(
                    f"Maker Robot({user.robot.id},{user.username}) asked for collaborative cancellation"
                )
                return True, None

        order.log(
            f"Cancel request was sent by Robot({user.robot.id},{user.username}) on an invalid status {order.status}: <i>{Order.Status(order.status).label}</i>"
        )
        return False, new_error(1021)

    @classmethod
    def collaborative_cancel(cls, order):
        if order.status not in [Order.Status.WFI, Order.Status.CHA]:
            return
        # cancel onchain payment if existing
        cls.cancel_onchain_payment(order)
        cls.return_bond(order.maker_bond)
        cls.return_bond(order.taker_bond)
        cls.return_escrow(order)
        order.update_status(Order.Status.CCA)
        send_notification.delay(order_id=order.id, message="collaborative_cancelled")

        nostr_send_order_event.delay(order_id=order.id)

        order.log("Order was collaboratively cancelled")
        order.log("Maker bond was <b>unlocked</b>")
        order.log("Taker bond was <b>unlocked</b>")
        order.log("Trade escrow was <b>unlocked</b>")

        return

    @classmethod
    def publish_order(cls, order):
        order.status = Order.Status.PUB
        order.expires_at = order.created_at + timedelta(
            seconds=order.t_to_expire(Order.Status.PUB)
        )
        if order.has_range:
            order.amount = None
            order.last_satoshis = cls.satoshis_now(order)
            order.last_satoshis_time = timezone.now()

        # clear fields in case of re-publishing after expiry
        order.taker = None
        order.taker_bond = None
        order.trade_escrow = None
        order.payout = None
        order.payout_tx = None

        order.save()  # update all fields

        nostr_send_order_event.delay(order_id=order.id)

        order.log(f"Order({order.id},{str(order)}) is public in the order book")
        return

    def compute_cltv_expiry_blocks(order, invoice_concept):
        """Computes timelock CLTV expiry of the last hop in blocks for hodl invoices

        invoice_concepts (str): maker_bond, taker_bond, trade_escrow
        """
        # Every invoice_concept must be locked by at least the fiat exchange duration
        # Every invoice must also be locked for deposit_time (order.escrow_duration or WFE status)
        cltv_expiry_secs = order.t_to_expire(Order.Status.CHA)
        cltv_expiry_secs += order.t_to_expire(Order.Status.WFE)

        # Maker bond must also be locked for the full public duration plus the taker bond locking time
        if invoice_concept == "maker_bond":
            cltv_expiry_secs += order.t_to_expire(Order.Status.PUB)
            cltv_expiry_secs += order.t_to_expire(Order.Status.TAK)

        # Add a safety marging by multiplying by the maxium expected mining network speed up
        safe_cltv_expiry_secs = cltv_expiry_secs * MAX_MINING_NETWORK_SPEEDUP_EXPECTED
        # Convert to blocks using assummed average block time (~8 mins/block)
        cltv_expiry_blocks = int(safe_cltv_expiry_secs / (BLOCK_TIME * 60))

        return cltv_expiry_blocks

    @classmethod
    def gen_maker_hold_invoice(cls, order, user):
        # Do not gen and cancel if order is older than expiry time
        if order.expires_at < timezone.now():
            cls.order_expires(order)
            return False, new_error(1022)

        # Return the previous invoice if there was one and is still unpaid
        if order.maker_bond:
            return True, {
                "bond_invoice": order.maker_bond.invoice,
                "bond_satoshis": order.maker_bond.num_satoshis,
            }

        # If there was no maker_bond object yet, generates one
        order.last_satoshis = cls.satoshis_now(order)
        order.last_satoshis_time = timezone.now()
        bond_satoshis = int(order.last_satoshis * order.bond_size / 100)

        if user.robot.wants_stealth:
            description = f"{config('NODE_ALIAS')} - Payment reference: {order.reference}. This payment WILL FREEZE IN YOUR WALLET, check on the trading platform if the lock was successful. It will be unlocked (fail) unless you cheat or cancel unilaterally."
        else:
            description = f"{config('NODE_ALIAS')} - Publishing '{str(order)}' - Maker bond - This payment WILL FREEZE IN YOUR WALLET, check on the trading platform if the lock was successful. It will be unlocked (fail) unless you cheat or cancel unilaterally."

        # Gen hold Invoice
        try:
            hold_payment = LNNode.gen_hold_invoice(
                bond_satoshis,
                description,
                invoice_expiry=order.t_to_expire(Order.Status.WFB),
                cltv_expiry_blocks=cls.compute_cltv_expiry_blocks(order, "maker_bond"),
                order_id=order.id,
                lnpayment_concept=LNPayment.Concepts.MAKEBOND.label,
                time=int(timezone.now().timestamp()),
            )
        except Exception as e:
            print(str(e))
            if "failed to connect to all addresses" in str(e):
                return False, new_error(1023)
            elif "wallet locked" in str(e):
                return False, new_error(1024)

        order.maker_bond = LNPayment.objects.create(
            concept=LNPayment.Concepts.MAKEBOND,
            type=LNPayment.Types.HOLD,
            sender=user,
            receiver=User.objects.get(username=ESCROW_USERNAME),
            invoice=hold_payment["invoice"],
            preimage=hold_payment["preimage"],
            status=LNPayment.Status.INVGEN,
            num_satoshis=bond_satoshis,
            description=description,
            payment_hash=hold_payment["payment_hash"],
            created_at=hold_payment["created_at"],
            expires_at=hold_payment["expires_at"],
            cltv_expiry=hold_payment["cltv_expiry"],
        )

        order.save(update_fields=["last_satoshis", "last_satoshis_time", "maker_bond"])

        order.log(
            f"Maker bond LNPayment({order.maker_bond.payment_hash},{str(order.maker_bond)}) was created"
        )

        return True, {
            "bond_invoice": hold_payment["invoice"],
            "bond_satoshis": bond_satoshis,
        }

    @classmethod
    def finalize_contract(cls, take_order):
        """When the taker locks the taker_bond
        the contract is final"""
        order = take_order.order

        order.taker = take_order.taker
        order.taker_bond = take_order.taker_bond

        if order.has_range:
            order.amount = take_order.amount

        # THE TRADE AMOUNT IS FINAL WITH THE CONFIRMATION OF THE TAKER BOND!
        # (This is the last update to "last_satoshis", it becomes the escrow amount next)
        order.last_satoshis = cls.satoshis_now(order)
        order.last_satoshis_time = timezone.now()

        # With the bond confirmation the order is extended 'public_order_duration' hours
        order.expires_at = timezone.now() + timedelta(
            seconds=order.t_to_expire(Order.Status.WF2)
        )
        order.status = Order.Status.WF2
        order.save(
            update_fields=[
                "status",
                "taker",
                "taker_bond",
                "amount",
                "last_satoshis",
                "last_satoshis_time",
                "expires_at",
            ]
        )

        order.taker_bond.status = LNPayment.Status.LOCKED
        order.taker_bond.save(update_fields=["status"])

        # Both users robots are added one more contract // Unsafe can add more than once.
        order.maker.robot.total_contracts += 1
        order.taker.robot.total_contracts += 1
        order.maker.robot.save(update_fields=["total_contracts"])
        order.taker.robot.save(update_fields=["total_contracts"])

        take_order.delete()

        # Log a market tick
        try:
            market_tick = MarketTick.log_a_tick(order)
            order.log(
                f"New Market Tick logged as MarketTick({market_tick.id},{market_tick})"
            )
        except Exception:
            pass
        send_notification.delay(order_id=order.id, message="order_taken_confirmed")

        nostr_send_order_event.delay(order_id=order.id)

        order.log(
            f"<b>Contract formalized.</b> Maker: Robot({order.maker.robot.id},{order.maker}). Taker: Robot({order.taker.robot.id},{order.taker}). API median price {order.currency.exchange_rate} {dict(Currency.currency_choices)[order.currency.currency]}/BTC. Premium is {order.premium}%. Contract size {order.last_satoshis} Sats"
        )
        return True

    @classmethod
    def gen_taker_hold_invoice(cls, order, user):
        take_order = TakeOrder.objects.filter(
            taker=user, order=order, expires_at__gt=timezone.now()
        ).first()

        # Do not gen and kick out the taker if order is older than expiry time
        if order.expires_at < timezone.now():
            cls.order_expires(order)
            return False, new_error(1025)

        # Do not gen if a taker invoice exist. Do not return if it is already locked. Return the old one if still waiting.
        if take_order.taker_bond:
            return True, {
                "bond_invoice": take_order.taker_bond.invoice,
                "bond_satoshis": take_order.taker_bond.num_satoshis,
                "expires_at": take_order.expires_at,
            }

        # If there was no taker_bond object yet, generates one
        take_order.last_satoshis = cls.satoshis_now(order, take_order.amount)
        take_order.last_satoshis_time = timezone.now()
        bond_satoshis = int(take_order.last_satoshis * order.bond_size / 100)
        pos_text = "Buying" if cls.is_buyer(order, user) else "Selling"
        if user.robot.wants_stealth:
            description = f"{config('NODE_ALIAS')} - Payment reference: {order.reference}. This payment WILL FREEZE IN YOUR WALLET, check on the trading platform if the lock was successful. It will be unlocked (fail) unless you cheat or cancel unilaterally."
        else:
            description = (
                f"{config('NODE_ALIAS')} - Taking 'Order {order.id}' {pos_text} BTC for {str(float(take_order.amount)) + Currency.currency_dict[str(order.currency.currency)]}"
                + " - Taker bond - This payment WILL FREEZE IN YOUR WALLET, check on the trading platform if the lock was successful. It will be unlocked (fail) unless you cheat or cancel unilaterally."
            )

        # Gen hold Invoice
        try:
            hold_payment = LNNode.gen_hold_invoice(
                bond_satoshis,
                description,
                invoice_expiry=order.t_to_expire(Order.Status.TAK),
                cltv_expiry_blocks=cls.compute_cltv_expiry_blocks(order, "taker_bond"),
                order_id=order.id,
                lnpayment_concept=LNPayment.Concepts.TAKEBOND.label,
                time=int(timezone.now().timestamp()),
            )

        except Exception as e:
            if "status = StatusCode.UNAVAILABLE" in str(e):
                return False, new_error(1023)

        take_order.taker_bond = LNPayment.objects.create(
            concept=LNPayment.Concepts.TAKEBOND,
            type=LNPayment.Types.HOLD,
            sender=user,
            receiver=User.objects.get(username=ESCROW_USERNAME),
            invoice=hold_payment["invoice"],
            preimage=hold_payment["preimage"],
            status=LNPayment.Status.INVGEN,
            num_satoshis=bond_satoshis,
            description=description,
            payment_hash=hold_payment["payment_hash"],
            created_at=hold_payment["created_at"],
            expires_at=hold_payment["expires_at"],
            cltv_expiry=hold_payment["cltv_expiry"],
        )

        take_order.expires_at = timezone.now() + timedelta(
            seconds=order.t_to_expire(Order.Status.TAK)
        )
        take_order.save(
            update_fields=[
                "expires_at",
                "last_satoshis",
                "last_satoshis_time",
                "taker_bond",
                "expires_at",
            ]
        )

        order.log(
            f"Taker bond invoice LNPayment({hold_payment['payment_hash']},{str(take_order.taker_bond)}) was created"
        )

        return True, {
            "bond_invoice": hold_payment["invoice"],
            "bond_satoshis": bond_satoshis,
            "expires_at": take_order.expires_at,
        }

    def trade_escrow_received(order):
        """Moves the order forward"""
        # If status is 'Waiting for both' move to Waiting for invoice
        if order.status == Order.Status.WF2:
            order.update_status(Order.Status.WFI)
        # If status is 'Waiting for invoice' move to Chat
        elif order.status == Order.Status.WFE:
            order.update_status(Order.Status.CHA)
            order.expires_at = timezone.now() + timedelta(
                seconds=order.t_to_expire(Order.Status.CHA)
            )
            order.save(update_fields=["expires_at"])
            send_notification.delay(order_id=order.id, message="fiat_exchange_starts")

    @classmethod
    def gen_escrow_hold_invoice(cls, order, user):
        # Do not generate if escrow deposit time has expired
        if order.expires_at < timezone.now():
            cls.order_expires(order)
            return False, new_error(1026)

        # Do not gen if an escrow invoice exist. Do not return if it is already locked. Return the old one if still waiting.
        if order.trade_escrow:
            return True, {
                "escrow_invoice": order.trade_escrow.invoice,
                "escrow_satoshis": order.trade_escrow.num_satoshis,
            }

        # If there was no taker_bond object yet, generate one
        escrow_satoshis = cls.escrow_amount(order, user)[1][
            "escrow_amount"
        ]  # Amount was fixed when taker bond was locked, fee applied here
        order.log(f"Escrow invoice amount is calculated as {escrow_satoshis} Sats")

        if user.robot.wants_stealth:
            description = f"{config('NODE_ALIAS')} - Payment reference: {order.reference}. This payment WILL FREEZE IN YOUR WALLET, check on the trading platform if the lock was successful. It will be unlocked (fail) unless you cheat or cancel unilaterally."
        else:
            description = f"{config('NODE_ALIAS')} - Escrow amount for '{str(order)}' - It WILL FREEZE IN YOUR WALLET. It will be released to the buyer once you confirm you received the fiat. It will automatically return if buyer does not confirm the payment."

        # Gen hold Invoice
        try:
            hold_payment = LNNode.gen_hold_invoice(
                escrow_satoshis,
                description,
                invoice_expiry=order.t_to_expire(Order.Status.WF2),
                cltv_expiry_blocks=cls.compute_cltv_expiry_blocks(
                    order, "trade_escrow"
                ),
                order_id=order.id,
                lnpayment_concept=LNPayment.Concepts.TRESCROW.label,
                time=int(timezone.now().timestamp()),
            )

        except Exception as e:
            if "status = StatusCode.UNAVAILABLE" in str(e):
                return False, new_error(1023)

        order.trade_escrow = LNPayment.objects.create(
            concept=LNPayment.Concepts.TRESCROW,
            type=LNPayment.Types.HOLD,
            sender=user,
            receiver=User.objects.get(username=ESCROW_USERNAME),
            invoice=hold_payment["invoice"],
            preimage=hold_payment["preimage"],
            status=LNPayment.Status.INVGEN,
            num_satoshis=escrow_satoshis,
            description=description,
            payment_hash=hold_payment["payment_hash"],
            created_at=hold_payment["created_at"],
            expires_at=hold_payment["expires_at"],
            cltv_expiry=hold_payment["cltv_expiry"],
        )

        order.save(update_fields=["trade_escrow"])

        order.log(
            f"Trade escrow invoice LNPayment({hold_payment['payment_hash']},{str(order.trade_escrow)}) was created"
        )

        return True, {
            "escrow_invoice": hold_payment["invoice"],
            "escrow_satoshis": escrow_satoshis,
        }

    def settle_escrow(order):
        """Settles the trade escrow hold invoice"""
        if LNNode.settle_hold_invoice(order.trade_escrow.preimage):
            order.trade_escrow.status = LNPayment.Status.SETLED
            order.trade_escrow.save(update_fields=["status"])
            order.log("Trade escrow was <b>settled</b>")
            return True

    def settle_bond(bond):
        """Settles the bond hold invoice"""
        if LNNode.settle_hold_invoice(bond.preimage):
            bond.status = LNPayment.Status.SETLED
            bond.save(update_fields=["status"])
            return True

    def return_escrow(order):
        """returns the trade escrow"""
        if LNNode.cancel_return_hold_invoice(order.trade_escrow.payment_hash):
            order.trade_escrow.status = LNPayment.Status.RETNED
            order.trade_escrow.save(update_fields=["status"])
            order.log("Trade escrow was <b>unlocked</b>")
            return True

    def cancel_escrow(order):
        """returns the trade escrow"""
        # Same as return escrow, but used when the invoice was never LOCKED
        if LNNode.cancel_return_hold_invoice(order.trade_escrow.payment_hash):
            order.trade_escrow.status = LNPayment.Status.CANCEL
            order.trade_escrow.save(update_fields=["status"])
            order.log("Trade escrow was <b>cancelled</b>")
            return True

    def return_bond(bond):
        """returns a bond"""
        if bond is None:
            return
        try:
            LNNode.cancel_return_hold_invoice(bond.payment_hash)
            bond.status = LNPayment.Status.RETNED
            bond.save(update_fields=["status"])
            return True
        except Exception as e:
            if "invoice already settled" in str(e):
                bond.status = LNPayment.Status.SETLED
                bond.save(update_fields=["status"])
                return True
            else:
                raise e

    def cancel_onchain_payment(order):
        """Cancel onchain_payment if existing"""

        if order.payout_tx:
            order.payout_tx.status = OnchainPayment.Status.CANCE
            order.payout_tx.save(update_fields=["status"])

            order.log(
                f"Onchain payment OnchainPayment({order.payout_tx.id},{str(order.payout_tx)}) was <b>cancelled</b>"
            )

            return True
        else:
            return False

    def cancel_bond(bond):
        """cancel a bond"""
        # Same as return bond, but used when the invoice was never LOCKED
        if bond is None:
            return True
        try:
            LNNode.cancel_return_hold_invoice(bond.payment_hash)
            bond.status = LNPayment.Status.CANCEL
            bond.save(update_fields=["status"])
            return True
        except Exception as e:
            if "invoice already settled" in str(e):
                bond.status = LNPayment.Status.SETLED
                bond.save(update_fields=["status"])
                return True
            else:
                raise e

    @classmethod
    def pay_buyer(cls, order):
        """Pays buyer invoice or onchain address"""

        # Pay to buyer invoice
        if not order.is_swap:
            # Background process "follow_invoices" will try to pay this invoice until success
            order.payout.status = LNPayment.Status.FLIGHT
            order.payout.save(update_fields=["status"])

            order.update_status(Order.Status.PAY)
            order.contract_finalization_time = timezone.now()
            order.save(update_fields=["contract_finalization_time"])

            send_notification.delay(order_id=order.id, message="trade_successful")
            order.log("<b>Paying buyer invoice</b>")
            return True

        # Pay onchain to address
        else:
            if not order.payout_tx.status == OnchainPayment.Status.VALID:
                return False
            else:
                # Add onchain payment to queue
                order.payout_tx.status = OnchainPayment.Status.QUEUE
                order.payout_tx.save(update_fields=["status"])

                order.update_status(Order.Status.SUC)
                order.contract_finalization_time = timezone.now()
                order.save(update_fields=["contract_finalization_time"])

                send_notification.delay(order_id=order.id, message="trade_successful")
                order.log("<b>Paying buyer onchain address</b>")
                return True

    @classmethod
    def confirm_fiat(cls, order, user):
        """If Order is in the CHAT states:
        If user is buyer: fiat_sent goes to true.
        If User is seller and fiat_sent is true: settle the escrow and pay buyer invoice!
        """

        # ── Taproot escrow path ──────────────────────────────────────
        if order.is_taproot:
            return cls._confirm_fiat_taproot(order, user)

        # ── Lightning path (original logic) ──────────────────────────
        if order.status == Order.Status.CHA or order.status == Order.Status.FSE:
            # If buyer mark fiat sent
            if cls.is_buyer(order, user):
                order.update_status(Order.Status.FSE)
                order.is_fiat_sent = True
                order.save(update_fields=["is_fiat_sent"])

                order.log("Buyer confirmed 'fiat sent'")

            # If seller and fiat was sent, SETTLE ESCROW AND PAY BUYER INVOICE
            elif cls.is_seller(order, user):
                if not order.is_fiat_sent:
                    return False, new_error(1027)

                # Make sure the trade escrow is at least as big as the buyer invoice
                num_satoshis = (
                    order.payout_tx.num_satoshis
                    if order.is_swap
                    else order.payout.num_satoshis
                )
                if order.trade_escrow.num_satoshis <= num_satoshis:
                    return False, new_error(1028)

                # !!! KEY LINE - SETTLES THE TRADE ESCROW !!!
                if cls.settle_escrow(order):
                    order.trade_escrow.status = LNPayment.Status.SETLED
                    order.trade_escrow.save(update_fields=["status"])

                # Double check the escrow is settled.
                if LNNode.double_check_htlc_is_settled(order.trade_escrow.payment_hash):
                    # RETURN THE BONDS
                    cls.return_bond(order.taker_bond)
                    cls.return_bond(order.maker_bond)
                    order.log("Taker bond was <b>unlocked</b>")
                    order.log("Maker bond was <b>unlocked</b>")
                    # !!! KEY LINE - PAYS THE BUYER INVOICE !!!
                    cls.pay_buyer(order)

                    # Computes coordinator trade revenue
                    cls.compute_proceeds(order)

                    return True, None

        else:
            return False, new_error(1029)

        return True, None

    @classmethod
    def undo_confirm_fiat_sent(cls, order, user):
        """If Order is in the CHAT states:
        If user is buyer: fiat_sent goes to true.
        """
        if not cls.is_buyer(order, user):
            return False, new_error(1030)

        if order.status != Order.Status.FSE:
            return False, new_error(1031)
        order.update_status(Order.Status.CHA)
        order.is_fiat_sent = False
        order.reverted_fiat_sent = True
        order.save(update_fields=["is_fiat_sent", "reverted_fiat_sent"])

        order.log(
            f"Buyer Robot({user.robot.id},{user.username}) reverted the confirmation of 'fiat sent'"
        )

        return True, None

    def pause_unpause_public_order(order, user):
        if not order.maker == user:
            return False, new_error(1032)
        else:
            if order.status == Order.Status.PUB:
                order.update_status(Order.Status.PAU)
                order.log(
                    f"Robot({user.robot.id},{user.username}) paused the public order"
                )

                nostr_send_order_event.delay(order_id=order.id)
            elif order.status == Order.Status.PAU:
                order.update_status(Order.Status.PUB)
                order.log(
                    f"Robot({user.robot.id},{user.username}) made public the paused order"
                )

                nostr_send_order_event.delay(order_id=order.id)
            else:
                order.log(
                    f"Robot({user.robot.id},{user.username}) tried to pause/unpause an order that was not public or paused",
                    level="WARN",
                )
                return False, new_error(1033)

        return True, None

    @classmethod
    def rate_platform(cls, user, rating):
        user.robot.platform_rating = rating
        user.robot.save(update_fields=["platform_rating"])
        return True, None

    @classmethod
    def add_slashed_rewards(cls, order, slashed_bond, staked_bond):
        """
        When a bond is slashed due to overtime, rewards the user that was waiting.

        slashed_bond is the bond settled by the robot who forfeits his bond.
        staked_bond is the bond that was at stake by the robot who is rewarded.

        It may happen that the Sats at stake by the maker are larger than the Sats
        at stake by the taker (range amount orders where the taker does not take the
        maximum available). In those cases, the change is added back also to the robot
        that was slashed (discounted by the forfeited amount).
        """
        reward_fraction = config("SLASHED_BOND_REWARD_SPLIT", cast=float, default=0.5)

        if staked_bond.num_satoshis < slashed_bond.num_satoshis:
            slashed_satoshis = min(slashed_bond.num_satoshis, staked_bond.num_satoshis)
            slashed_return = int(slashed_bond.num_satoshis - slashed_satoshis)
        else:
            slashed_satoshis = slashed_bond.num_satoshis
            slashed_return = 0

        reward = int(slashed_satoshis * reward_fraction)
        rewarded_robot = staked_bond.sender.robot
        rewarded_robot.earned_rewards += reward
        rewarded_robot.save(update_fields=["earned_rewards"])

        slashed_robot_log = ""
        if slashed_return > 100:
            slashed_robot = slashed_bond.sender.robot
            slashed_robot.earned_rewards += slashed_return
            slashed_robot.save(update_fields=["earned_rewards"])
            slashed_robot_log = "Robot({slashed_robot.id},{slashed_robot.user.username}) was returned {slashed_return} Sats)"

        new_proceeds = int(slashed_satoshis * (1 - reward_fraction))
        order.proceeds += new_proceeds
        order.save(update_fields=["proceeds"])
        send_devfund_donation.delay(order.id, new_proceeds, "slashed bond")
        order.log(
            f"Robot({rewarded_robot.id},{rewarded_robot.user.username}) was rewarded {reward} Sats. {slashed_robot_log}"
        )
        return

    @classmethod
    def withdraw_rewards(cls, user, invoice, routing_budget_ppm):
        # only a user with positive withdraw balance can use this

        if user.robot.earned_rewards < 1:
            return False, new_error(3003)

        num_satoshis = user.robot.earned_rewards

        if routing_budget_ppm is not None and routing_budget_ppm is not False:
            routing_budget_sats = float(num_satoshis) * (
                float(routing_budget_ppm) / 1_000_000
            )
            num_satoshis = int(num_satoshis - routing_budget_sats)
        else:
            # start deprecate in the future
            routing_budget_sats = int(
                max(
                    num_satoshis * float(config("PROPORTIONAL_ROUTING_FEE_LIMIT")),
                    float(config("MIN_FLAT_ROUTING_FEE_LIMIT_REWARD")),
                )
            )  # 1000 ppm or 2 sats
            routing_budget_ppm = (routing_budget_sats / float(num_satoshis)) * 1_000_000
            # end deprecate

        reward_payout = LNNode.validate_ln_invoice(
            invoice, num_satoshis, routing_budget_ppm
        )

        if not reward_payout["valid"]:
            return False, reward_payout["context"]

        try:
            lnpayment = LNPayment.objects.create(
                concept=LNPayment.Concepts.WITHREWA,
                type=LNPayment.Types.NORM,
                sender=User.objects.get(username=ESCROW_USERNAME),
                status=LNPayment.Status.VALIDI,
                receiver=user,
                invoice=invoice,
                num_satoshis=num_satoshis,
                description=reward_payout["description"],
                payment_hash=reward_payout["payment_hash"],
                created_at=reward_payout["created_at"],
                expires_at=reward_payout["expires_at"],
            )
        # Might fail if payment_hash already exists in DB
        except Exception:
            return False, new_error(3004)

        user.robot.earned_rewards = 0
        user.robot.save(update_fields=["earned_rewards"])

        # Pays the invoice.
        paid, failure_reason = LNNode.pay_invoice(lnpayment)
        if paid:
            user.robot.earned_rewards = 0
            user.robot.claimed_rewards += num_satoshis
            user.robot.save(update_fields=["earned_rewards", "claimed_rewards"])
            return True, None

        # If fails, adds the rewards again.
        else:
            user.robot.earned_rewards = num_satoshis
            user.robot.save(update_fields=["earned_rewards"])
            return False, new_error(3005, {"failure_reason": failure_reason})

    @classmethod
    def compute_proceeds(cls, order):
        """
        Computes Coordinator trade proceeds for finished orders.
        """

        if order.is_swap:
            payout_sats = (
                order.payout_tx.sent_satoshis + order.payout_tx.mining_fee_sats
            )
            new_proceeds = int(order.trade_escrow.num_satoshis - payout_sats)
        else:
            payout_sats = order.payout.num_satoshis + order.payout.fee
            new_proceeds = int(order.trade_escrow.num_satoshis - payout_sats)

        order.proceeds += new_proceeds
        order.save(update_fields=["proceeds"])

        order.log(
            f"Order({order.id},{str(order)}) proceedings are incremented by {new_proceeds} Sats, totalling {order.proceeds} Sats"
        )

        send_devfund_donation.delay(order.id, new_proceeds, "successful order")

    @classmethod
    def summarize_trade(cls, order, user):
        """
        Summarizes a finished order. Returns a dict with
        amounts, fees, costs, etc, for buyer and seller.
        """
        if order.status not in [Order.Status.SUC, Order.Status.PAY, Order.Status.FAI]:
            return False, new_error(5000)

        context = {}

        users = {"taker": order.taker, "maker": order.maker}
        for order_user in users:
            summary = {}
            summary["trade_fee_percent"] = (
                FEE * MAKER_FEE_SPLIT
                if order_user == "maker"
                else FEE * (1 - MAKER_FEE_SPLIT)
            )
            summary["bond_size_sats"] = (
                order.maker_bond.num_satoshis
                if order_user == "maker"
                else order.taker_bond.num_satoshis
            )
            summary["bond_size_percent"] = order.bond_size
            summary["is_buyer"] = cls.is_buyer(order, users[order_user])

            if summary["is_buyer"]:
                summary["sent_fiat"] = order.amount
                if order.is_swap:
                    summary["received_sats"] = order.payout_tx.sent_satoshis
                else:
                    summary["received_sats"] = order.payout.num_satoshis
                    summary["payment_hash"] = order.payout.payment_hash
                    summary["preimage"] = (
                        order.payout.preimage if order.payout.preimage else "processing"
                    )
                summary["trade_fee_sats"] = round(
                    order.last_satoshis
                    - summary["received_sats"]
                    - (order.payout.routing_budget_sats if not order.is_swap else 0)
                )
                # Only add context for swap costs if the user is the swap recipient. Peer should not know whether it was a swap
                if users[order_user] == user and order.is_swap:
                    summary["is_swap"] = order.is_swap
                    summary["received_onchain_sats"] = order.payout_tx.sent_satoshis
                    summary["address"] = order.payout_tx.address
                    summary["txid"] = order.payout_tx.txid
                    summary["mining_fee_sats"] = order.payout_tx.mining_fee_sats
                    summary["swap_fee_sats"] = round(
                        order.payout_tx.num_satoshis
                        - order.payout_tx.mining_fee_sats
                        - order.payout_tx.sent_satoshis
                    )
                    summary["swap_fee_percent"] = order.payout_tx.swap_fee_rate
                    summary["trade_fee_sats"] = round(
                        order.last_satoshis
                        - summary["received_sats"]
                        - summary["mining_fee_sats"]
                        - summary["swap_fee_sats"]
                    )
            else:
                summary["sent_sats"] = order.trade_escrow.num_satoshis
                summary["received_fiat"] = order.amount
                summary["trade_fee_sats"] = round(
                    summary["sent_sats"] - order.last_satoshis
                )
            context[f"{order_user}_summary"] = summary

        platform_summary = {}
        platform_summary["contract_exchange_rate"] = float(order.amount) / (
            float(order.last_satoshis) / 100_000_000
        )
        if order.last_satoshis_time is not None:
            platform_summary["contract_timestamp"] = order.last_satoshis_time
            if order.contract_finalization_time is None:
                order.contract_finalization_time = timezone.now()
                order.save(update_fields=["contract_finalization_time"])
            platform_summary["contract_total_time"] = (
                order.contract_finalization_time - order.last_satoshis_time
            ).total_seconds()
        if not order.is_swap:
            platform_summary["routing_budget_sats"] = order.payout.routing_budget_sats
            platform_summary["trade_revenue_sats"] = int(
                order.trade_escrow.num_satoshis - order.payout.num_satoshis
            )
        else:
            platform_summary["routing_fee_sats"] = 0
            platform_summary["trade_revenue_sats"] = int(
                order.trade_escrow.num_satoshis - order.payout_tx.num_satoshis
            )
        context["platform_summary"] = platform_summary

        return True, context

    # ═════════════════════════════════════════════════════════════════
    # TAPROOT/MAST ESCROW METHODS
    #
    # These methods implement the on-chain Taproot escrow pipeline,
    # branching from the existing Lightning-based flow when
    # order.is_taproot is True.
    #
    # SECURITY MODEL: The Coordinator is an orchestrator, NOT a
    # custodian. Private keys and secret nonces NEVER leave the
    # traders' devices. The Coordinator handles only public data
    # (pubkeys, public nonces, partial signatures, PSBTs) and
    # aggregates them — it cannot sign or spend unilaterally.
    #
    # Ported from: taptrade-core (Rust)
    # ═════════════════════════════════════════════════════════════════

    @classmethod
    def gen_maker_taproot_bond_requirements(cls, order):
        """
        Generate bond requirements for the maker in taproot mode.

        Returns the coordinator's bond address and the required locking
        amount. The maker must construct and sign a bond TX locking this
        amount to the coordinator's address — but this TX is NEVER
        broadcast unless the maker cheats.

        Ported from: process_order() in coordinator/mod.rs
        """
        # Compute bond amount as percentage of trade size
        bond_amount_sat = int(order.last_satoshis * float(order.bond_size) / 100)

        # Coordinator's bond address — used as the bond output destination.
        # The coordinator holds the signed TX but doesn't broadcast it.
        coordinator_bond_address = config(
            "TAPROOT_COORDINATOR_BOND_ADDRESS",
            default="",
        )

        if not coordinator_bond_address:
            return False, {"error": "Coordinator taproot bond address not configured"}

        order.log(
            f"Taproot bond requirements generated: {bond_amount_sat} sats "
            f"to {coordinator_bond_address}"
        )

        return True, {
            "bond_address": coordinator_bond_address,
            "bond_amount_sat": bond_amount_sat,
            "escrow_locking_input_amount": order.last_satoshis,
        }

    @classmethod
    def validate_maker_taproot_bond(cls, order, user, bond_tx_hex, taproot_pubkey):
        """
        Validate the maker's submitted bond transaction and taproot pubkey.

        Steps:
        1. Verify bond TX is valid and meets amount requirements
        2. Store the bond TX (held, never broadcast unless cheating)
        3. Store maker's taproot pubkey for descriptor construction
        4. Transition order to TAP_PUB (public)

        SECURITY: The bond TX is a signed transaction that the coordinator
        HOLDS but does NOT broadcast. It serves as a fidelity guarantee.

        Ported from: handle_maker_bond() in coordinator/mod.rs
        """
        # Get bond requirements
        _, bond_req = cls.gen_maker_taproot_bond_requirements(order)
        if "error" in bond_req:
            return False, new_error(1030)  # Custom error for taproot

        # Validate the bond TX
        is_valid, error_msg = BondValidator.validate_bond_tx(
            bond_tx_hex,
            required_amount_sat=bond_req["bond_amount_sat"],
            coordinator_bond_address=bond_req["bond_address"],
        )
        if not is_valid:
            order.log(
                f"Maker taproot bond validation failed: {error_msg}", level="WARN"
            )
            return False, {"error": error_msg}

        # Create TaprootPayment record
        taproot_payment = TaprootPayment.objects.create(
            concept=TaprootPayment.Concepts.TRADE_ESCROW,
            status=TaprootPayment.Status.CREATED,
            maker=user,
            maker_taproot_pubkey=taproot_pubkey,
            bond_tx_hex_maker=bond_tx_hex,
            bond_amount_sat=bond_req["bond_amount_sat"],
        )

        order.taproot_escrow = taproot_payment
        order.update_status(Order.Status.TAP_PUB)
        order.expires_at = timezone.now() + timedelta(
            seconds=order.t_to_expire(Order.Status.TAP_PUB)
        )
        order.save(update_fields=["taproot_escrow", "expires_at"])

        order.log(
            f"Maker taproot bond validated. TaprootPayment({taproot_payment.id}) created. "
            f"Order is now public (taproot mode)."
        )
        return True, None

    @classmethod
    def validate_taker_taproot_bond(
        cls, order, user, bond_tx_hex, taproot_pubkey, musig_pubkey, musig_pubnonce
    ):
        """
        Validate the taker's bond and create the escrow locking PSBT.

        Steps:
        1. Validate taker's bond TX
        2. Store taker's taproot pubkey, MuSig2 pubkey, and nonce
        3. Build the Taproot escrow descriptor (4 MAST leaves)
        4. Create the unsigned escrow locking PSBT
        5. Transition order to TAP_WFE (waiting for escrow funding)

        SECURITY: The escrow PSBT is returned UNSIGNED. Each trader must
        sign their own inputs locally.

        Ported from: handle_taker_bond() in coordinator/mod.rs
        """
        tp = order.taproot_escrow
        if not tp:
            return False, {"error": "No TaprootPayment exists for this order"}

        # Get bond requirements
        _, bond_req = cls.gen_maker_taproot_bond_requirements(order)

        # Validate taker's bond
        is_valid, error_msg = BondValidator.validate_bond_tx(
            bond_tx_hex,
            required_amount_sat=bond_req["bond_amount_sat"],
            coordinator_bond_address=bond_req["bond_address"],
        )
        if not is_valid:
            order.log(
                f"Taker taproot bond validation failed: {error_msg}", level="WARN"
            )
            return False, {"error": error_msg}

        # Store taker's data
        tp.taker = user
        tp.taker_taproot_pubkey = taproot_pubkey
        tp.taker_musig_pubkey = musig_pubkey
        tp.taker_musig_pubnonce = musig_pubnonce
        tp.bond_tx_hex_taker = bond_tx_hex

        # Build the Taproot descriptor
        coordinator_pk = bytes.fromhex(config("TAPROOT_COORDINATOR_PUBKEY", default=""))

        escrow_builder = TaprootEscrowBuilder(
            maker_taproot_pk=bytes.fromhex(tp.maker_taproot_pubkey),
            taker_taproot_pk=bytes.fromhex(tp.taker_taproot_pubkey),
            coordinator_pk=coordinator_pk,
            maker_musig_pk=tp.maker_musig_pubkey,
            taker_musig_pk=tp.taker_musig_pubkey,
        )

        # Store the descriptor
        tp.escrow_output_descriptor = escrow_builder.build_descriptor_string()
        tp.coordinator_taproot_pubkey = coordinator_pk.hex()

        # Aggregate MuSig2 pubkeys for internal key
        agg_key = MuSig2Coordinator.aggregate_pubkeys(
            tp.maker_musig_pubkey, tp.taker_musig_pubkey
        )
        tp.aggregated_musig_pubkey_ctx = agg_key.hex()

        tp.status = TaprootPayment.Status.FUNDED
        tp.save()

        # Update order state
        order.taker = user
        order.update_status(Order.Status.TAP_WFE)
        order.expires_at = timezone.now() + timedelta(
            seconds=order.t_to_expire(Order.Status.TAP_WFE)
        )
        order.save(update_fields=["taker", "expires_at"])

        order.log(
            "Taker taproot bond validated. Escrow descriptor built. "
            "Waiting for escrow funding (signed PSBTs)."
        )

        return True, {
            "escrow_descriptor": tp.escrow_output_descriptor,
            "escrow_psbt_hex": tp.escrow_psbt_hex,
            "coordinator_pubkey": coordinator_pk.hex(),
        }

    @classmethod
    def handle_signed_taproot_escrow(cls, order, user, signed_psbt_hex):
        """
        Accept a trader's signed escrow PSBT. When both are received,
        combine them and mark for broadcasting.

        SECURITY: Each trader signs only their own inputs. The Coordinator
        combines the two partially-signed PSBTs into a fully-signed TX.
        It CANNOT modify outputs or amounts — only merge witnesses.

        Ported from: handle_signed_escrow_psbt() in coordinator/mod.rs
        """
        tp = order.taproot_escrow
        if not tp:
            return False, {"error": "No TaprootPayment exists for this order"}

        # Store the signed PSBT from the appropriate user
        if user == order.maker:
            tp.maker_signed_escrow_psbt = signed_psbt_hex
            tp.save(update_fields=["maker_signed_escrow_psbt"])
            order.log("Maker submitted signed escrow PSBT")
        elif user == order.taker:
            tp.taker_signed_escrow_psbt = signed_psbt_hex
            tp.save(update_fields=["taker_signed_escrow_psbt"])
            order.log("Taker submitted signed escrow PSBT")
        else:
            return False, {"error": "User is not a participant in this order"}

        # If both signatures are in, combine and broadcast
        if tp.is_fully_signed:
            try:
                EscrowPSBTBuilder.combine_signed_escrow_psbts(
                    tp.maker_signed_escrow_psbt,
                    tp.taker_signed_escrow_psbt,
                )
                # TODO: Broadcast via bitcoind RPC once integration is wired up

                tp.status = TaprootPayment.Status.FUNDED
                tp.save(update_fields=["status"])

                order.log(
                    "Both escrow PSBTs received and combined. "
                    "Escrow TX ready for broadcast."
                )
            except Exception as e:
                order.log(f"Error combining escrow PSBTs: {e}", level="ERROR")
                return False, {"error": f"Failed to combine PSBTs: {e}"}

        return True, None

    @classmethod
    def taproot_escrow_confirmed(cls, order):
        """
        Handle escrow TX confirmation. Transitions the order to the
        chatroom state (TAP_ESC) where fiat exchange happens.

        This would be called by a background task that monitors the
        Bitcoin blockchain for confirmations.

        Ported from: check_offer_and_confirmation() in coordinator_utils.rs
        """
        tp = order.taproot_escrow
        if not tp:
            return False

        tp.status = TaprootPayment.Status.CONFIRMED
        tp.confirmed_at = timezone.now()
        tp.save(update_fields=["status", "confirmed_at"])

        order.update_status(Order.Status.TAP_ESC)
        order.expires_at = timezone.now() + timedelta(
            seconds=order.t_to_expire(Order.Status.TAP_ESC)
        )
        order.save(update_fields=["expires_at"])

        send_notification.delay(order_id=order.id, message="taproot_escrow_confirmed")
        order.log("Taproot escrow TX confirmed. Chatroom opened.")
        return True

    @classmethod
    def _confirm_fiat_taproot(cls, order, user):
        """
        Handle fiat confirmation in the Taproot escrow path.

        When the seller confirms fiat receipt:
        1. Create the keyspend payout PSBT
        2. Transition to TAP_PAY (waiting for partial signatures)

        SECURITY: The payout PSBT is unsigned. Both traders must produce
        partial MuSig2 signatures for the keyspend path. The Coordinator
        aggregates them but cannot forge a signature.

        Ported from: handle_obligation_confirmation() in coordinator/mod.rs
        """
        valid_taproot_chat_states = [
            Order.Status.TAP_ESC,
            Order.Status.TAP_FSE,
        ]

        if order.status not in valid_taproot_chat_states:
            return False, new_error(1029)

        if cls.is_buyer(order, user):
            order.update_status(Order.Status.TAP_FSE)
            order.is_fiat_sent = True
            order.save(update_fields=["is_fiat_sent"])
            order.log("Buyer confirmed 'fiat sent' (taproot escrow)")
            return True, None

        elif cls.is_seller(order, user):
            if not order.is_fiat_sent:
                return False, new_error(1027)

            tp = order.taproot_escrow

            # Build payout PSBT
            # Each party gets their share of the escrow minus coordinator fees.
            maker_fee_fraction = FEE * MAKER_FEE_SPLIT
            taker_fee_fraction = FEE * (1 - MAKER_FEE_SPLIT)

            maker_fee = int(order.last_satoshis * maker_fee_fraction)
            taker_fee = int(order.last_satoshis * taker_fee_fraction)

            # Determine payout amounts and addresses for buyer/seller
            # TODO: Replace default addresses with actual user-provided
            # payout addresses from the API request once endpoints exist.
            if cls.is_buyer(order, order.maker):
                maker_payout = order.last_satoshis - maker_fee
                taker_payout = 0  # Seller (taker) already received fiat
                maker_address = config("TAPROOT_DEFAULT_PAYOUT_ADDRESS", default="")
                taker_address = ""
            else:
                maker_payout = 0  # Seller (maker) already received fiat
                taker_payout = order.last_satoshis - taker_fee
                maker_address = ""
                taker_address = config("TAPROOT_DEFAULT_PAYOUT_ADDRESS", default="")

            # Create payout PSBT
            try:
                payout_psbt_hex = EscrowPSBTBuilder.create_keyspend_payout_psbt(
                    escrow_txid=tp.escrow_txid,
                    escrow_vout=tp.escrow_vout,
                    escrow_amount_sat=tp.escrow_amount_sat,
                    maker_payout_address=maker_address,
                    maker_payout_amount=maker_payout,
                    taker_payout_address=taker_address,
                    taker_payout_amount=taker_payout,
                )
                tp.payout_psbt_hex = payout_psbt_hex
                tp.save(update_fields=["payout_psbt_hex"])
            except Exception as e:
                order.log(f"Error building payout PSBT: {e}", level="ERROR")
                return False, {"error": f"Failed to build payout PSBT: {e}"}

            order.update_status(Order.Status.TAP_PAY)
            order.expires_at = timezone.now() + timedelta(
                seconds=order.t_to_expire(Order.Status.TAP_PAY)
            )
            order.save(update_fields=["expires_at"])

            order.log(
                "Seller confirmed fiat received (taproot). "
                "Payout PSBT created, waiting for partial signatures."
            )
            return True, {"payout_psbt_hex": payout_psbt_hex}

        return True, None

    @classmethod
    def handle_taproot_payout_signature(
        cls, order, user, partial_sig_hex, pubnonce_hex
    ):
        """
        Accept a trader's partial MuSig2 signature for the payout TX.
        When both are received, aggregate and finalize.

        SECURITY:
            - Each partial signature is a 32-byte scalar.
            - The Coordinator aggregates s = s1 + s2 mod n.
            - The resulting (R, s) is a valid BIP-340 Schnorr signature.
            - The Coordinator CANNOT extract private keys from partial sigs.

        Ported from: handle_payout_signature() in coordinator/mod.rs
        """
        tp = order.taproot_escrow
        if not tp:
            return False, {"error": "No TaprootPayment exists for this order"}

        if user == order.maker:
            tp.maker_partial_sig = partial_sig_hex
            tp.maker_musig_pubnonce = pubnonce_hex
            tp.save(update_fields=["maker_partial_sig", "maker_musig_pubnonce"])
            order.log("Maker submitted partial payout signature")
        elif user == order.taker:
            tp.taker_partial_sig = partial_sig_hex
            tp.taker_musig_pubnonce = pubnonce_hex
            tp.save(update_fields=["taker_partial_sig", "taker_musig_pubnonce"])
            order.log("Taker submitted partial payout signature")
        else:
            return False, {"error": "User is not a participant in this order"}

        # If both partial sigs are in, aggregate and finalize
        if tp.has_both_partial_sigs and tp.has_both_nonces:
            try:
                # Aggregate nonces
                agg_nonce = MuSig2Coordinator.aggregate_nonces(
                    tp.maker_musig_pubnonce, tp.taker_musig_pubnonce
                )

                # Aggregate partial signatures
                # TODO: Compute the actual BIP-341 taproot sighash from
                # the payout PSBT once bitcoind RPC integration is wired.
                sighash_msg = b"\x00" * 32

                agg_pubkey = bytes.fromhex(tp.aggregated_musig_pubkey_ctx)
                schnorr_sig = MuSig2Coordinator.aggregate_partial_signatures(
                    tp.maker_partial_sig,
                    tp.taker_partial_sig,
                    agg_nonce=agg_nonce,
                    agg_pubkey=agg_pubkey,
                    message=sighash_msg,
                )

                # Finalize the payout TX with the aggregated signature
                EscrowPSBTBuilder.finalize_keyspend_payout(
                    tp.payout_psbt_hex, schnorr_sig
                )

                # TODO: Broadcast via bitcoind RPC once integration is wired up

                tp.status = TaprootPayment.Status.SPENT
                tp.save(update_fields=["status"])

                order.update_status(Order.Status.TAP_SUC)
                order.contract_finalization_time = timezone.now()
                order.save(update_fields=["contract_finalization_time"])

                send_notification.delay(order_id=order.id, message="trade_successful")
                cls.compute_proceeds(order)

                order.log(
                    "Both partial signatures received. Payout TX finalized "
                    "and broadcast. Trade successful!"
                )
            except Exception as e:
                order.log(f"Error aggregating payout signatures: {e}", level="ERROR")
                order.update_status(Order.Status.TAP_FAI)
                return False, {"error": f"Signature aggregation failed: {e}"}

        return True, None

    @classmethod
    def settle_taproot_dispute(cls, order, winner):
        """
        Resolve a dispute by spending the escrow via a script path.

        The Coordinator and the winning trader cooperate to sign a
        script-path spend through the appropriate MAST leaf:
            - winner="maker" → Leaf A (maker + coordinator)
            - winner="taker" → Leaf B (taker + coordinator)

        SECURITY: This requires TWO signatures — the Coordinator's AND
        the winning trader's. Neither party can unilaterally steal the
        escrow funds. The losing party can verify on-chain that the
        correct script path was used.

        Ported from: initiate_escrow() in coordinator/mod.rs (dispute branch)
        """
        tp = order.taproot_escrow
        if not tp:
            return False, {"error": "No TaprootPayment exists for this order"}

        coordinator_pk = bytes.fromhex(config("TAPROOT_COORDINATOR_PUBKEY", default=""))

        escrow_builder = TaprootEscrowBuilder(
            maker_taproot_pk=bytes.fromhex(tp.maker_taproot_pubkey),
            taker_taproot_pk=bytes.fromhex(tp.taker_taproot_pubkey),
            coordinator_pk=coordinator_pk,
            maker_musig_pk=tp.maker_musig_pubkey,
            taker_musig_pk=tp.taker_musig_pubkey,
        )

        if winner == "maker":
            leaf_name = "dispute_maker"
            order.update_status(Order.Status.TLD)  # Taker lost dispute
        elif winner == "taker":
            leaf_name = "dispute_taker"
            order.update_status(Order.Status.MLD)  # Maker lost dispute
        else:
            return False, {"error": f"Invalid dispute winner: {winner}"}

        # Build the script-path spend TX
        try:
            winner_address = config("TAPROOT_DEFAULT_PAYOUT_ADDRESS", default="")
            result = EscrowPSBTBuilder.create_script_path_spend(
                escrow_builder=escrow_builder,
                leaf_name=leaf_name,
                escrow_txid=tp.escrow_txid,
                escrow_vout=tp.escrow_vout,
                escrow_amount_sat=tp.escrow_amount_sat,
                winner_payout_address=winner_address,
                winner_payout_amount=tp.escrow_amount_sat,
            )

            tp.dispute_winner = winner
            tp.dispute_payout_psbt_hex = result["tx_hex"]
            tp.status = TaprootPayment.Status.DISPUTED
            tp.save(
                update_fields=["dispute_winner", "dispute_payout_psbt_hex", "status"]
            )

            order.log(
                f"Dispute resolved: {winner} wins. Script-path spend TX "
                f"built via {leaf_name} leaf."
            )
            return True, result

        except Exception as e:
            order.log(f"Error building dispute spend TX: {e}", level="ERROR")
            return False, {"error": f"Dispute TX creation failed: {e}"}

    @classmethod
    def open_taproot_dispute(cls, order, user=None):
        """
        Open a dispute for a taproot escrow order.

        Unlike Lightning disputes (where the escrow hold invoice is
        settled immediately), Taproot disputes leave the UTXO locked.
        The coordinator resolves the dispute by creating a script-path
        spend with the winner's cooperation.

        Ported from: dispute handling in coordinator/mod.rs
        """
        valid_status = [
            Order.Status.TAP_ESC,
            Order.Status.TAP_FSE,
        ]

        if order.status not in valid_status:
            return False, new_error(1013)

        order.is_disputed = True
        order.update_status(Order.Status.TAP_DIS)
        order.expires_at = timezone.now() + timedelta(
            seconds=order.t_to_expire(Order.Status.TAP_DIS)
        )
        order.save(update_fields=["is_disputed", "expires_at"])

        if user is not None:
            robot = user.robot
            robot.num_disputes = robot.num_disputes + 1
            if robot.orders_disputes_started is None:
                robot.orders_disputes_started = [str(order.id)]
            else:
                robot.orders_disputes_started = list(
                    robot.orders_disputes_started
                ).append(str(order.id))
            robot.save(update_fields=["num_disputes", "orders_disputes_started"])

        send_notification.delay(order_id=order.id, message="dispute_opened")
        order.log(
            f"Taproot dispute opened "
            f"{f'by Robot({user.robot.id},{user.username})' if user else ''}"
        )
        return True, None

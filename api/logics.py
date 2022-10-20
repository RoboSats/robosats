from datetime import timedelta
from django.utils import timezone
from api.lightning.node import LNNode
from django.db.models import Q, Sum

from api.models import OnchainPayment, Order, LNPayment, MarketTick, User, Currency
from api.tasks import send_message
from decouple import config
from api.utils import validate_onchain_address

import gnupg

import math
import ast

FEE = float(config("FEE"))
MAKER_FEE_SPLIT = float(config("MAKER_FEE_SPLIT"))

ESCROW_USERNAME = config("ESCROW_USERNAME")
PENALTY_TIMEOUT = int(config("PENALTY_TIMEOUT"))

MIN_TRADE = int(config("MIN_TRADE"))
MAX_TRADE = int(config("MAX_TRADE"))

EXP_MAKER_BOND_INVOICE = int(config("EXP_MAKER_BOND_INVOICE"))
EXP_TAKER_BOND_INVOICE = int(config("EXP_TAKER_BOND_INVOICE"))

BLOCK_TIME = float(config("BLOCK_TIME"))
MAX_MINING_NETWORK_SPEEDUP_EXPECTED = float(
    config("MAX_MINING_NETWORK_SPEEDUP_EXPECTED")
)

INVOICE_AND_ESCROW_DURATION = int(config("INVOICE_AND_ESCROW_DURATION"))
FIAT_EXCHANGE_DURATION = int(config("FIAT_EXCHANGE_DURATION"))


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
        ]
        """Checks if the user is already partipant of an active order"""
        queryset = Order.objects.filter(maker=user, status__in=active_order_status)
        if queryset.exists():
            return (
                False,
                {"bad_request": "You are already maker of an active order"},
                queryset[0],
            )

        queryset = Order.objects.filter(taker=user, status__in=active_order_status)
        if queryset.exists():
            return (
                False,
                {"bad_request": "You are already taker of an active order"},
                queryset[0],
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
                    {
                        "bad_request": "You are still pending a payment from a recent order"
                    },
                    order,
                )

        return True, None, None

    def validate_pgp_keys(pub_key, enc_priv_key):
        """Validates PGP valid keys. Formats them in a way understandable by the frontend"""
        gpg = gnupg.GPG()

        # Standarize format with linux linebreaks '\n'. Windows users submitting their own keys have '\r\n' breaking communication.
        enc_priv_key = enc_priv_key.replace("\r\n", "\n")
        pub_key = pub_key.replace("\r\n", "\n")

        # Try to import the public key
        import_pub_result = gpg.import_keys(pub_key)
        if not import_pub_result.imported == 1:
            return (
                False,
                {
                    "bad_request": f"Your PGP public key does not seem valid.\n"
                    + f"Stderr: {str(import_pub_result.stderr)}\n"
                    + f"ReturnCode: {str(import_pub_result.returncode)}\n"
                    + f"Summary: {str(import_pub_result.summary)}\n"
                    + f"Results: {str(import_pub_result.results)}\n"
                    + f"Imported: {str(import_pub_result.imported)}\n"
                },
                None,
                None,
            )
        # Exports the public key again for uniform formatting.
        pub_key = gpg.export_keys(import_pub_result.fingerprints[0])

        # Try to import the encrypted private key (without passphrase)
        import_priv_result = gpg.import_keys(enc_priv_key)
        if not import_priv_result.sec_imported == 1:
            return (
                False,
                {
                    "bad_request": f"Your PGP encrypted private key does not seem valid.\n"
                    + f"Stderr: {str(import_priv_result.stderr)}\n"
                    + f"ReturnCode: {str(import_priv_result.returncode)}\n"
                    + f"Summary: {str(import_priv_result.summary)}\n"
                    + f"Results: {str(import_priv_result.results)}\n"
                    + f"Sec Imported: {str(import_priv_result.sec_imported)}\n"
                },
                None,
                None,
            )

        return True, None, pub_key, enc_priv_key

    @classmethod
    def validate_order_size(cls, order):
        """Validates if order size in Sats is within limits at t0"""
        if not order.has_range:
            if order.t0_satoshis > MAX_TRADE:
                return False, {
                    "bad_request": "Your order is too big. It is worth "
                    + "{:,}".format(order.t0_satoshis)
                    + " Sats now, but the limit is "
                    + "{:,}".format(MAX_TRADE)
                    + " Sats"
                }
            if order.t0_satoshis < MIN_TRADE:
                return False, {
                    "bad_request": "Your order is too small. It is worth "
                    + "{:,}".format(order.t0_satoshis)
                    + " Sats now, but the limit is "
                    + "{:,}".format(MIN_TRADE)
                    + " Sats"
                }
        elif order.has_range:
            min_sats = cls.calc_sats(
                order.min_amount, order.currency.exchange_rate, order.premium
            )
            max_sats = cls.calc_sats(
                order.max_amount, order.currency.exchange_rate, order.premium
            )
            if min_sats > max_sats / 1.5:
                return False, {
                    "bad_request": "Maximum range amount must be at least 50 percent higher than the minimum amount"
                }
            elif max_sats > MAX_TRADE:
                return False, {
                    "bad_request": "Your order maximum amount is too big. It is worth "
                    + "{:,}".format(int(max_sats))
                    + " Sats now, but the limit is "
                    + "{:,}".format(MAX_TRADE)
                    + " Sats"
                }
            elif min_sats < MIN_TRADE:
                return False, {
                    "bad_request": "Your order minimum amount is too small. It is worth "
                    + "{:,}".format(int(min_sats))
                    + " Sats now, but the limit is "
                    + "{:,}".format(MIN_TRADE)
                    + " Sats"
                }
            elif min_sats < max_sats / 8:
                return False, {
                    "bad_request": f"Your order amount range is too large. Max amount can only be 8 times bigger than min amount"
                }

        return True, None

    def validate_amount_within_range(order, amount):
        if amount > float(order.max_amount) or amount < float(order.min_amount):
            return False, {
                "bad_request": "The amount specified is outside the range specified by the maker"
            }

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
        if is_penalized:
            return False, {
                "bad_request",
                f"You need to wait {time_out} seconds to take an order",
            }
        else:
            if order.has_range:
                order.amount = amount
            order.taker = user
            order.status = Order.Status.TAK
            order.expires_at = timezone.now() + timedelta(
                seconds=order.t_to_expire(Order.Status.TAK)
            )
            order.save()
            return True, None

    def is_buyer(order, user):
        is_maker = order.maker == user
        is_taker = order.taker == user
        return (is_maker and order.type == Order.Types.BUY) or (
            is_taker and order.type == Order.Types.SELL
        )

    def is_seller(order, user):
        is_maker = order.maker == user
        is_taker = order.taker == user
        return (is_maker and order.type == Order.Types.SELL) or (
            is_taker and order.type == Order.Types.BUY
        )

    def calc_sats(amount, exchange_rate, premium):
        exchange_rate = float(exchange_rate)
        premium_rate = exchange_rate * (1 + float(premium) / 100)
        return (float(amount) / premium_rate) * 100 * 1000 * 1000

    @classmethod
    def satoshis_now(cls, order):
        """checks trade amount in sats"""
        if order.is_explicit:
            satoshis_now = order.satoshis
        else:
            amount = order.amount if order.amount != None else order.max_amount
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
            order_rate = float(amount) / (float(order.satoshis) / 100000000)
            premium = order_rate / exchange_rate - 1
            premium = int(premium * 10000) / 100  # 2 decimals left
            price = order_rate

        significant_digits = 5
        price = round(
            price, significant_digits - int(math.floor(math.log10(abs(price)))) - 1
        )

        return price, premium

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
        if not order.status in does_not_expire:
            cls.cancel_onchain_payment(order)

        if order.status in does_not_expire:
            return False

        elif order.status == Order.Status.WFB:
            order.status = Order.Status.EXP
            order.expiry_reason = Order.ExpiryReasons.NMBOND
            cls.cancel_bond(order.maker_bond)
            order.save()
            return True

        elif order.status in [Order.Status.PUB, Order.Status.PAU]:
            cls.return_bond(order.maker_bond)
            order.status = Order.Status.EXP
            order.expiry_reason = Order.ExpiryReasons.NTAKEN
            order.save()
            send_message.delay(order.id, "order_expired_untaken")
            return True

        elif order.status == Order.Status.TAK:
            cls.cancel_bond(order.taker_bond)
            cls.kick_taker(order)
            return True

        elif order.status == Order.Status.WF2:
            """Weird case where an order expires and both participants
            did not proceed with the contract. Likely the site was
            down or there was a bug. Still bonds must be charged
            to avoid service DDOS."""

            cls.settle_bond(order.maker_bond)
            cls.settle_bond(order.taker_bond)
            cls.cancel_escrow(order)
            order.status = Order.Status.EXP
            order.expiry_reason = Order.ExpiryReasons.NESINV
            order.save()
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
                except:
                    pass
                order.status = Order.Status.EXP
                order.expiry_reason = Order.ExpiryReasons.NESCRO
                order.save()
                # Reward taker with part of the maker bond
                cls.add_slashed_rewards(order.maker_bond, order.taker.profile)
                return True

            # If maker is buyer, settle the taker's bond order goes back to public
            else:
                cls.settle_bond(order.taker_bond)
                # If seller is offline the escrow LNpayment does not even exist
                try:
                    cls.cancel_escrow(order)
                except:
                    pass
                taker_bond = order.taker_bond
                order.taker = None
                order.taker_bond = None
                order.trade_escrow = None
                order.payout = None
                cls.publish_order(order)
                send_message.delay(order.id, "order_published")
                # Reward maker with part of the taker bond
                cls.add_slashed_rewards(taker_bond, order.maker.profile)
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
                order.status = Order.Status.EXP
                order.expiry_reason = Order.ExpiryReasons.NINVOI
                order.save()
                # Reward taker with part of the maker bond
                cls.add_slashed_rewards(order.maker_bond, order.taker.profile)
                return True

            # If maker is seller settle the taker's bond, order goes back to public
            else:
                cls.settle_bond(order.taker_bond)
                cls.return_escrow(order)
                taker_bond = order.taker_bond
                order.taker = None
                order.taker_bond = None
                order.trade_escrow = None
                cls.publish_order(order)
                send_message.delay(order.id, "order_published")
                # Reward maker with part of the taker bond
                cls.add_slashed_rewards(taker_bond, order.maker.profile)
                return True

        elif order.status in [Order.Status.CHA, Order.Status.FSE]:
            # Another weird case. The time to confirm 'fiat sent or received' expired. Yet no dispute
            # was opened. Hint: a seller-scammer could persuade a buyer to not click "fiat
            # sent", we assume this is a dispute case by default.
            cls.open_dispute(order)
            return True

    @classmethod
    def kick_taker(cls, order):
        """The taker did not lock the taker_bond. Now he has to go"""
        # Add a time out to the taker
        if order.taker:
            profile = order.taker.profile
            profile.penalty_expiration = timezone.now() + timedelta(
                seconds=PENALTY_TIMEOUT
            )
            profile.save()

        # Make order public again
        order.taker = None
        order.taker_bond = None
        cls.publish_order(order)
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
            return False, {
                "bad_request": "You cannot open a dispute of this order at this stage"
            }

        if not order.trade_escrow.status == LNPayment.Status.SETLED:
            cls.settle_escrow(order)
            cls.settle_bond(order.maker_bond)
            cls.settle_bond(order.taker_bond)

        order.is_disputed = True
        order.status = Order.Status.DIS
        order.expires_at = timezone.now() + timedelta(
            seconds=order.t_to_expire(Order.Status.DIS)
        )
        order.save()

        # User could be None if a dispute is open automatically due to weird expiration.
        if not user == None:
            profile = user.profile
            profile.num_disputes = profile.num_disputes + 1
            if profile.orders_disputes_started == None:
                profile.orders_disputes_started = [str(order.id)]
            else:
                profile.orders_disputes_started = list(
                    profile.orders_disputes_started
                ).append(str(order.id))
            profile.save()

        send_message.delay(order.id, "dispute_opened")
        return True, None

    def dispute_statement(order, user, statement):
        """Updates the dispute statements"""

        if not order.status == Order.Status.DIS:
            return False, {
                "bad_request": "Only orders in dispute accept dispute statements"
            }

        if len(statement) > 5000:
            return False, {
                "bad_statement": "The statement is longer than 5000 characters"
            }

        if len(statement) < 100:
            return False, {
                "bad_statement": "The statement is too short. Make sure to be thorough."
            }

        if order.maker == user:
            order.maker_statement = statement
        else:
            order.taker_statement = statement

        # If both statements are in, move status to wait for dispute resolution
        if order.maker_statement not in [None, ""] and order.taker_statement not in [
            None,
            "",
        ]:
            order.status = Order.Status.WFR
            order.expires_at = timezone.now() + timedelta(
                seconds=order.t_to_expire(Order.Status.WFR)
            )

        order.save()
        return True, None

    def compute_swap_fee_rate(balance):

        shape = str(config("SWAP_FEE_SHAPE"))

        if shape == "linear":
            MIN_SWAP_FEE = float(config("MIN_SWAP_FEE"))
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
            MIN_SWAP_FEE = float(config("MIN_SWAP_FEE"))
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
        reserve = 0.01 * onchain_payment.balance.total  # We assume a reserve of 1%
        pending_txs = OnchainPayment.objects.filter(
            status=OnchainPayment.Status.VALID
        ).aggregate(Sum("num_satoshis"))["num_satoshis__sum"]

        if pending_txs == None:
            pending_txs = 0

        available_onchain = confirmed - reserve - pending_txs
        if (
            preliminary_amount > available_onchain
        ):  # Not enough onchain balance to commit for this swap.
            return False

        suggested_mining_fee_rate = LNNode.estimate_fee(amount_sats=preliminary_amount)[
            "mining_fee_rate"
        ]

        # Hardcap mining fee suggested at 50 sats/vbyte
        if suggested_mining_fee_rate > 50:
            suggested_mining_fee_rate = 50

        onchain_payment.suggested_mining_fee_rate = max(
            1.05, LNNode.estimate_fee(amount_sats=preliminary_amount)["mining_fee_rate"]
        )
        onchain_payment.swap_fee_rate = cls.compute_swap_fee_rate(
            onchain_payment.balance
        )
        onchain_payment.save()

        order.payout_tx = onchain_payment
        order.save()
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

        reward_tip = int(config("REWARD_TIP")) if user.profile.is_referred else 0

        context = {}
        # context necessary for the user to submit a LN invoice
        context["invoice_amount"] = round(
            order.last_satoshis - fee_sats - reward_tip
        )  # Trading fee to buyer is charged here.

        # context necessary for the user to submit an onchain address
        MIN_SWAP_AMOUNT = int(config("MIN_SWAP_AMOUNT"))

        if context["invoice_amount"] < MIN_SWAP_AMOUNT:
            context["swap_allowed"] = False
            context[
                "swap_failure_reason"
            ] = "Order amount is too small to be eligible for a swap"
            return True, context

        if config("DISABLE_ONCHAIN", cast=bool):
            context["swap_allowed"] = False
            context["swap_failure_reason"] = "On-the-fly submarine swaps are dissabled"
            return True, context

        if order.payout_tx == None:
            # Creates the OnchainPayment object and checks node balance
            valid = cls.create_onchain_payment(
                order, user, preliminary_amount=context["invoice_amount"]
            )
            if not valid:
                context["swap_allowed"] = False
                context[
                    "swap_failure_reason"
                ] = "Not enough onchain liquidity available to offer a swap"
                return True, context

        context["swap_allowed"] = True
        context["suggested_mining_fee_rate"] = order.payout_tx.suggested_mining_fee_rate
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

        reward_tip = int(config("REWARD_TIP")) if user.profile.is_referred else 0

        if cls.is_seller(order, user):
            escrow_amount = round(
                order.last_satoshis + fee_sats + reward_tip
            )  # Trading fee to seller is charged here.

        return True, {"escrow_amount": escrow_amount}

    @classmethod
    def update_address(cls, order, user, address, mining_fee_rate):

        # Empty address?
        if not address:
            return False, {"bad_address": "You submitted an empty invoice"}
        # only the buyer can post a buyer address
        if not cls.is_buyer(order, user):
            return False, {
                "bad_request": "Only the buyer of this order can provide a payout address."
            }
        # not the right time to submit
        if (
            not (
                order.taker_bond.status
                == order.maker_bond.status
                == LNPayment.Status.LOCKED
            )
            and not order.status == Order.Status.FAI
        ):
            return False, {"bad_request": "You cannot submit an adress are not locked."}
        # not a valid address (does not accept Taproot as of now)
        valid, context = validate_onchain_address(address)
        if not valid:
            return False, context

        if mining_fee_rate:
            # not a valid mining fee
            if float(mining_fee_rate) < 1:
                return False, {
                    "bad_address": "The mining fee is too low, must be higher than 1 Sat/vbyte"
                }
            elif float(mining_fee_rate) > 50:
                return False, {
                    "bad_address": "The mining fee is too high, must be less than 50 Sats/vbyte"
                }
            order.payout_tx.mining_fee_rate = float(mining_fee_rate)
        # If not mining ee provider use backend's suggested fee rate
        else:
            order.payout_tx.mining_fee_rate = order.payout_tx.suggested_mining_fee_rate

        tx = order.payout_tx
        tx.address = address
        tx.mining_fee_sats = int(tx.mining_fee_rate * 141)
        tx.num_satoshis = cls.payout_amount(order, user)[1]["invoice_amount"]
        tx.sent_satoshis = int(
            float(tx.num_satoshis)
            - float(tx.num_satoshis) * float(tx.swap_fee_rate) / 100
            - float(tx.mining_fee_sats)
        )
        tx.status = OnchainPayment.Status.VALID
        tx.save()

        order.is_swap = True
        order.save()

        cls.move_state_updated_payout_method(order)

        return True, None

    @classmethod
    def update_invoice(cls, order, user, invoice):

        # Empty invoice?
        if not invoice:
            return False, {"bad_invoice": "You submitted an empty invoice"}
        # only the buyer can post a buyer invoice
        if not cls.is_buyer(order, user):
            return False, {
                "bad_request": "Only the buyer of this order can provide a buyer invoice."
            }
        if not order.taker_bond:
            return False, {"bad_request": "Wait for your order to be taken."}
        if (
            not (
                order.taker_bond.status
                == order.maker_bond.status
                == LNPayment.Status.LOCKED
            )
            and not order.status == Order.Status.FAI
        ):
            return False, {
                "bad_request": "You cannot submit a invoice while bonds are not locked."
            }
        if order.status == Order.Status.FAI:
            if order.payout.status != LNPayment.Status.EXPIRE:
                return False, {
                    "bad_request": "You cannot submit an invoice only after expiration or 3 failed attempts"
                }

        # cancel onchain_payout if existing
        cls.cancel_onchain_payment(order)

        num_satoshis = cls.payout_amount(order, user)[1]["invoice_amount"]
        payout = LNNode.validate_ln_invoice(invoice, num_satoshis)

        if not payout["valid"]:
            return False, payout["context"]

        order.payout, _ = LNPayment.objects.update_or_create(
            concept=LNPayment.Concepts.PAYBUYER,
            type=LNPayment.Types.NORM,
            sender=User.objects.get(username=ESCROW_USERNAME),
            order_paid_LN=order,  # In case this user has other payouts, update the one related to this order.
            receiver=user,
            # if there is a LNPayment matching these above, it updates that one with defaults below.
            defaults={
                "invoice": invoice,
                "status": LNPayment.Status.VALIDI,
                "num_satoshis": num_satoshis,
                "description": payout["description"],
                "payment_hash": payout["payment_hash"],
                "created_at": payout["created_at"],
                "expires_at": payout["expires_at"],
            },
        )

        order.is_swap = False
        order.save()

        cls.move_state_updated_payout_method(order)

        return True, None

    @classmethod
    def move_state_updated_payout_method(cls, order):
        # If the order status is 'Waiting for invoice'. Move forward to 'chat'
        if order.status == Order.Status.WFI:
            order.status = Order.Status.CHA
            order.expires_at = timezone.now() + timedelta(
                seconds=order.t_to_expire(Order.Status.CHA)
            )
            send_message.delay(order.id, "fiat_exchange_starts")

        # If the order status is 'Waiting for both'. Move forward to 'waiting for escrow'
        elif order.status == Order.Status.WF2:
            # If the escrow does not exist, or is not locked move to WFE.
            if order.trade_escrow == None:
                order.status = Order.Status.WFE
            # If the escrow is locked move to Chat.
            elif order.trade_escrow.status == LNPayment.Status.LOCKED:
                order.status = Order.Status.CHA
                order.expires_at = timezone.now() + timedelta(
                    seconds=order.t_to_expire(Order.Status.CHA)
                )
                send_message.delay(order.id, "fiat_exchange_starts")
            else:
                order.status = Order.Status.WFE

        # If the order status is 'Failed Routing'. Retry payment.
        elif order.status == Order.Status.FAI:
            if LNNode.double_check_htlc_is_settled(order.trade_escrow.payment_hash):
                order.status = Order.Status.PAY
                order.payout.status = LNPayment.Status.FLIGHT
                order.payout.routing_attempts = 0
                order.payout.save()

        order.save()
        return True

    def add_profile_rating(profile, rating):
        """adds a new rating to a user profile"""

        # TODO Unsafe, does not update ratings, it adds more ratings everytime a new rating is clicked.
        profile.total_ratings += 1
        latest_ratings = profile.latest_ratings
        if latest_ratings == None:
            profile.latest_ratings = [rating]
            profile.avg_rating = rating

        else:
            latest_ratings = ast.literal_eval(latest_ratings)
            latest_ratings.append(rating)
            profile.latest_ratings = latest_ratings
            profile.avg_rating = sum(list(map(int, latest_ratings))) / len(
                latest_ratings
            )  # Just an average, but it is a list of strings. Has to be converted to int.

        profile.save()

    def is_penalized(user):
        """Checks if a user that is not participant of orders
        has a limit on taking or making a order"""

        if user.profile.penalty_expiration:
            if user.profile.penalty_expiration > timezone.now():
                time_out = (user.profile.penalty_expiration - timezone.now()).seconds
                return True, time_out

        return False, None

    @classmethod
    def cancel_order(cls, order, user, state=None):

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
            return False, {"bad_request": "You cannot cancel this order"}

        # 1) When maker cancels before bond
        """The order never shows up on the book and order 
        status becomes "cancelled" """
        if order.status == Order.Status.WFB and order.maker == user:
            cls.cancel_bond(order.maker_bond)
            order.status = Order.Status.UCA
            order.save()
            return True, None

            # 2.a) When maker cancels after bond
            """The order dissapears from book and goes to cancelled. If strict, maker is charged the bond 
            to prevent DDOS on the LN node and order book. If not strict, maker is returned
            the bond (more user friendly)."""
        elif (
            order.status in [Order.Status.PUB, Order.Status.PAU] and order.maker == user
        ):
            # Return the maker bond (Maker gets returned the bond for cancelling public order)
            if cls.return_bond(order.maker_bond):
                order.status = Order.Status.UCA
                order.save()
                send_message.delay(order.id, "public_order_cancelled")
                return True, None

            # 2.b) When maker cancels after bond and before taker bond is locked
            """The order dissapears from book and goes to cancelled.
            The bond maker bond is returned."""
        elif order.status == Order.Status.TAK and order.maker == user:
            # Return the maker bond (Maker gets returned the bond for cancelling public order)
            if cls.return_bond(order.maker_bond):
                cls.cancel_bond(order.taker_bond)
                order.status = Order.Status.UCA
                order.save()
                send_message.delay(order.id, "public_order_cancelled")
                return True, None

            # 3) When taker cancels before bond
            """ The order goes back to the book as public.
            LNPayment "order.taker_bond" is deleted() """
        elif order.status == Order.Status.TAK and order.taker == user:
            # adds a timeout penalty
            cls.cancel_bond(order.taker_bond)
            cls.kick_taker(order)
            return True, None

            # 4) When taker or maker cancel after bond (before escrow)
            """The order goes into cancelled status if maker cancels.
            The order goes into the public book if taker cancels.
            In both cases there is a small fee."""

            # 4.a) When maker cancel after bond (before escrow)
            """The order into cancelled status if maker cancels."""
        elif (
            order.status in [Order.Status.WF2, Order.Status.WFE] and order.maker == user
        ):
            # cancel onchain payment if existing
            cls.cancel_onchain_payment(order)
            # Settle the maker bond (Maker loses the bond for canceling an ongoing trade)
            valid = cls.settle_bond(order.maker_bond)
            cls.return_bond(order.taker_bond)  # returns taker bond

            if valid:
                order.status = Order.Status.UCA
                order.save()
                # Reward taker with part of the maker bond
                cls.add_slashed_rewards(order.maker_bond, order.taker.profile)
                return True, None

            # 4.b) When taker cancel after bond (before escrow)
            """The order into cancelled status if mtker cancels."""
        elif (
            order.status in [Order.Status.WF2, Order.Status.WFE] and order.taker == user
        ):
            # cancel onchain payment if existing
            cls.cancel_onchain_payment(order)
            # Settle the maker bond (Maker loses the bond for canceling an ongoing trade)
            valid = cls.settle_bond(order.taker_bond)
            if valid:
                order.taker = None
                order.payout = None
                order.trade_escrow = None
                cls.publish_order(order)
                send_message.delay(order.id, "order_published")
                # Reward maker with part of the taker bond
                cls.add_slashed_rewards(order.taker_bond, order.maker.profile)
                return True, None

            # 5) When trade collateral has been posted (after escrow)
            """Always goes to CCA status. Collaboration is needed.
            When a user asks for cancel, 'order.m/t/aker_asked_cancel' goes True.
            When the second user asks for cancel. Order is totally cancelled.
            Must have a small cost for both parties to prevent node DDOS."""
        elif order.status in [Order.Status.WFI, Order.Status.CHA]:

            # if the maker had asked, and now the taker does: cancel order, return everything
            if order.maker_asked_cancel and user == order.taker:
                cls.collaborative_cancel(order)
                return True, None

            # if the taker had asked, and now the maker does: cancel order, return everything
            elif order.taker_asked_cancel and user == order.maker:
                cls.collaborative_cancel(order)
                return True, None

            # Otherwise just make true the asked for cancel flags
            elif user == order.taker:
                order.taker_asked_cancel = True
                order.save()
                return True, None

            elif user == order.maker:
                order.maker_asked_cancel = True
                order.save()
                return True, None

        else:
            return False, {"bad_request": "You cannot cancel this order"}

    @classmethod
    def collaborative_cancel(cls, order):
        if not order.status in [Order.Status.WFI, Order.Status.CHA]:
            return
        # cancel onchain payment if existing
        cls.cancel_onchain_payment(order)
        cls.return_bond(order.maker_bond)
        cls.return_bond(order.taker_bond)
        cls.return_escrow(order)
        order.status = Order.Status.CCA
        order.save()
        send_message.delay(order.id, "collaborative_cancelled")
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
        order.save()
        # send_message.delay(order.id,'order_published') # too spammy
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
        print(
            invoice_concept,
            " cltv_expiry_hours:",
            cltv_expiry_secs / 3600,
            " cltv_expiry_blocks:",
            cltv_expiry_blocks,
        )

        return cltv_expiry_blocks

    @classmethod
    def is_maker_bond_locked(cls, order):
        if order.maker_bond.status == LNPayment.Status.LOCKED:
            return True
        elif LNNode.validate_hold_invoice_locked(order.maker_bond):
            cls.publish_order(order)
            send_message.delay(order.id, "order_published")
            return True
        return False

    @classmethod
    def gen_maker_hold_invoice(cls, order, user):

        # Do not gen and cancel if order is older than expiry time
        if order.expires_at < timezone.now():
            cls.order_expires(order)
            return False, {
                "bad_request": "Invoice expired. You did not confirm publishing the order in time. Make a new order."
            }

        # Return the previous invoice if there was one and is still unpaid
        if order.maker_bond:
            if cls.is_maker_bond_locked(order):
                return False, None
            elif order.maker_bond.status == LNPayment.Status.INVGEN:
                return True, {
                    "bond_invoice": order.maker_bond.invoice,
                    "bond_satoshis": order.maker_bond.num_satoshis,
                }

        # If there was no maker_bond object yet, generates one
        order.last_satoshis = cls.satoshis_now(order)
        order.last_satoshis_time = timezone.now()
        bond_satoshis = int(order.last_satoshis * order.bond_size / 100)

        if user.profile.wants_stealth:
            description = f"This payment WILL FREEZE IN YOUR WALLET, check on the website if it was successful. It will automatically return unless you cheat or cancel unilaterally. Payment reference: {order.reference}"
        else:
            description = f"RoboSats - Publishing '{str(order)}' - Maker bond - This payment WILL FREEZE IN YOUR WALLET, check on the website if it was successful. It will automatically return unless you cheat or cancel unilaterally."

        # Gen hold Invoice
        try:
            hold_payment = LNNode.gen_hold_invoice(
                bond_satoshis,
                description,
                invoice_expiry=order.t_to_expire(Order.Status.WFB),
                cltv_expiry_blocks=cls.compute_cltv_expiry_blocks(order, "maker_bond"),
            )
        except Exception as e:
            print(str(e))
            if "failed to connect to all addresses" in str(e):
                return False, {
                    "bad_request": "The Lightning Network Daemon (LND) is down. Write in the Telegram group to make sure the staff is aware."
                }
            elif "wallet locked" in str(e):
                return False, {
                    "bad_request": "This is weird, RoboSats' lightning wallet is locked. Check in the Telegram group, maybe the staff has died."
                }

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

        order.save()
        return True, {
            "bond_invoice": hold_payment["invoice"],
            "bond_satoshis": bond_satoshis,
        }

    @classmethod
    def finalize_contract(cls, order):
        """When the taker locks the taker_bond
        the contract is final"""

        # THE TRADE AMOUNT IS FINAL WITH THE CONFIRMATION OF THE TAKER BOND!
        # (This is the last update to "last_satoshis", it becomes the escrow amount next)
        order.last_satoshis = cls.satoshis_now(order)
        order.last_satoshis_time = timezone.now()
        order.taker_bond.status = LNPayment.Status.LOCKED
        order.taker_bond.save()

        # With the bond confirmation the order is extended 'public_order_duration' hours
        order.expires_at = timezone.now() + timedelta(
            seconds=order.t_to_expire(Order.Status.WF2)
        )
        order.status = Order.Status.WF2
        order.save()

        # Both users profiles are added one more contract // Unsafe can add more than once.
        order.maker.profile.total_contracts += 1
        order.taker.profile.total_contracts += 1
        order.maker.profile.save()
        order.taker.profile.save()

        # Log a market tick
        try:
            MarketTick.log_a_tick(order)
        except:
            pass
        send_message.delay(order.id, "order_taken_confirmed")
        return True

    @classmethod
    def is_taker_bond_locked(cls, order):
        if order.taker_bond.status == LNPayment.Status.LOCKED:
            return True
        elif LNNode.validate_hold_invoice_locked(order.taker_bond):
            cls.finalize_contract(order)
            return True
        return False

    @classmethod
    def gen_taker_hold_invoice(cls, order, user):

        # Do not gen and kick out the taker if order is older than expiry time
        if order.expires_at < timezone.now():
            cls.order_expires(order)
            return False, {
                "bad_request": "Invoice expired. You did not confirm taking the order in time."
            }

        # Do not gen if a taker invoice exist. Do not return if it is already locked. Return the old one if still waiting.
        if order.taker_bond:
            if cls.is_taker_bond_locked(order):
                return False, None
            elif order.taker_bond.status == LNPayment.Status.INVGEN:
                return True, {
                    "bond_invoice": order.taker_bond.invoice,
                    "bond_satoshis": order.taker_bond.num_satoshis,
                }

        # If there was no taker_bond object yet, generates one
        order.last_satoshis = cls.satoshis_now(order)
        order.last_satoshis_time = timezone.now()
        bond_satoshis = int(order.last_satoshis * order.bond_size / 100)
        pos_text = "Buying" if cls.is_buyer(order, user) else "Selling"
        if user.profile.wants_stealth:
            description = f"This payment WILL FREEZE IN YOUR WALLET, check on the website if it was successful. It will automatically return unless you cheat or cancel unilaterally. Payment reference: {order.reference}"
        else:
            description = (
                f"RoboSats - Taking 'Order {order.id}' {pos_text} BTC for {str(float(order.amount)) + Currency.currency_dict[str(order.currency.currency)]}"
                + " - Taker bond - This payment WILL FREEZE IN YOUR WALLET, check on the website if it was successful. It will automatically return unless you cheat or cancel unilaterally."
            )

        # Gen hold Invoice
        try:
            hold_payment = LNNode.gen_hold_invoice(
                bond_satoshis,
                description,
                invoice_expiry=order.t_to_expire(Order.Status.TAK),
                cltv_expiry_blocks=cls.compute_cltv_expiry_blocks(order, "taker_bond"),
            )

        except Exception as e:
            if "status = StatusCode.UNAVAILABLE" in str(e):
                return False, {
                    "bad_request": "The Lightning Network Daemon (LND) is down. Write in the Telegram group to make sure the staff is aware."
                }

        order.taker_bond = LNPayment.objects.create(
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

        order.expires_at = timezone.now() + timedelta(
            seconds=order.t_to_expire(Order.Status.TAK)
        )
        order.save()
        return True, {
            "bond_invoice": hold_payment["invoice"],
            "bond_satoshis": bond_satoshis,
        }

    def trade_escrow_received(order):
        """Moves the order forward"""
        # If status is 'Waiting for both' move to Waiting for invoice
        if order.status == Order.Status.WF2:
            order.status = Order.Status.WFI
        # If status is 'Waiting for invoice' move to Chat
        elif order.status == Order.Status.WFE:
            order.status = Order.Status.CHA
            order.expires_at = timezone.now() + timedelta(
                seconds=order.t_to_expire(Order.Status.CHA)
            )
            send_message.delay(order.id, "fiat_exchange_starts")
        order.save()

    @classmethod
    def is_trade_escrow_locked(cls, order):
        if order.trade_escrow.status == LNPayment.Status.LOCKED:
            cls.trade_escrow_received(order)
            return True
        elif LNNode.validate_hold_invoice_locked(order.trade_escrow):
            cls.trade_escrow_received(order)
            return True
        return False

    @classmethod
    def gen_escrow_hold_invoice(cls, order, user):

        # Do not generate if escrow deposit time has expired
        if order.expires_at < timezone.now():
            cls.order_expires(order)
            return False, {
                "bad_request": "Invoice expired. You did not send the escrow in time."
            }

        # Do not gen if an escrow invoice exist. Do not return if it is already locked. Return the old one if still waiting.
        if order.trade_escrow:
            # Check if status is INVGEN and still not expired
            if cls.is_trade_escrow_locked(order):
                return False, None
            elif order.trade_escrow.status == LNPayment.Status.INVGEN:
                return True, {
                    "escrow_invoice": order.trade_escrow.invoice,
                    "escrow_satoshis": order.trade_escrow.num_satoshis,
                }

        # If there was no taker_bond object yet, generate one
        escrow_satoshis = cls.escrow_amount(order, user)[1][
            "escrow_amount"
        ]  # Amount was fixed when taker bond was locked, fee applied here
        if user.profile.wants_stealth:
            description = f"This payment WILL FREEZE IN YOUR WALLET, check on the website if it was successful. It will automatically return unless you cheat or cancel unilaterally. Payment reference: {order.reference}"
        else:
            description = f"RoboSats - Escrow amount for '{str(order)}' - It WILL FREEZE IN YOUR WALLET. It will be released to the buyer once you confirm you received the fiat. It will automatically return if buyer does not confirm the payment."

        # Gen hold Invoice
        try:
            hold_payment = LNNode.gen_hold_invoice(
                escrow_satoshis,
                description,
                invoice_expiry=order.t_to_expire(Order.Status.WF2),
                cltv_expiry_blocks=cls.compute_cltv_expiry_blocks(
                    order, "trade_escrow"
                ),
            )

        except Exception as e:
            if "status = StatusCode.UNAVAILABLE" in str(e):
                return False, {
                    "bad_request": "The Lightning Network Daemon (LND) is down. Write in the Telegram group to make sure the staff is aware."
                }

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

        order.save()
        return True, {
            "escrow_invoice": hold_payment["invoice"],
            "escrow_satoshis": escrow_satoshis,
        }

    def settle_escrow(order):
        """Settles the trade escrow hold invoice"""
        if LNNode.settle_hold_invoice(order.trade_escrow.preimage):
            order.trade_escrow.status = LNPayment.Status.SETLED
            order.trade_escrow.save()
            return True

    def settle_bond(bond):
        """Settles the bond hold invoice"""
        if LNNode.settle_hold_invoice(bond.preimage):
            bond.status = LNPayment.Status.SETLED
            bond.save()
            return True

    def return_escrow(order):
        """returns the trade escrow"""
        if LNNode.cancel_return_hold_invoice(order.trade_escrow.payment_hash):
            order.trade_escrow.status = LNPayment.Status.RETNED
            order.trade_escrow.save()
            return True

    def cancel_escrow(order):
        """returns the trade escrow"""
        # Same as return escrow, but used when the invoice was never LOCKED
        if LNNode.cancel_return_hold_invoice(order.trade_escrow.payment_hash):
            order.trade_escrow.status = LNPayment.Status.CANCEL
            order.trade_escrow.save()
            return True

    def return_bond(bond):
        """returns a bond"""
        if bond == None:
            return
        try:
            LNNode.cancel_return_hold_invoice(bond.payment_hash)
            bond.status = LNPayment.Status.RETNED
            bond.save()
            return True
        except Exception as e:
            if "invoice already settled" in str(e):
                bond.status = LNPayment.Status.SETLED
                bond.save()
                return True
            else:
                raise e

    def cancel_onchain_payment(order):
        """Cancel onchain_payment if existing"""

        if order.payout_tx:
            order.payout_tx.status = OnchainPayment.Status.CANCE
            order.payout_tx.save()
            return True
        else:
            return False

    def cancel_bond(bond):
        """cancel a bond"""
        # Same as return bond, but used when the invoice was never LOCKED
        if bond == None:
            return True
        try:
            LNNode.cancel_return_hold_invoice(bond.payment_hash)
            bond.status = LNPayment.Status.CANCEL
            bond.save()
            return True
        except Exception as e:
            if "invoice already settled" in str(e):
                bond.status = LNPayment.Status.SETLED
                bond.save()
                return True
            else:
                raise e

    @classmethod
    def pay_buyer(cls, order):
        """Pays buyer invoice or onchain address"""

        # Pay to buyer invoice
        if not order.is_swap:
            ##### Background process "follow_invoices" will try to pay this invoice until success
            order.status = Order.Status.PAY
            order.payout.status = LNPayment.Status.FLIGHT
            order.payout.save()
            order.save()
            send_message.delay(order.id, "trade_successful")
            order.contract_finalization_time = timezone.now()
            order.save()
            return True

        # Pay onchain to address
        else:
            if not order.payout_tx.status == OnchainPayment.Status.VALID:
                return False

            valid = LNNode.pay_onchain(order.payout_tx)
            if valid:
                order.payout_tx.status = OnchainPayment.Status.MEMPO
                order.payout_tx.save()
                order.status = Order.Status.SUC
                order.save()
                send_message.delay(order.id, "trade_successful")
                order.contract_finalization_time = timezone.now()
                order.save()
                return True
            return False

    @classmethod
    def confirm_fiat(cls, order, user):
        """If Order is in the CHAT states:
        If user is buyer: fiat_sent goes to true.
        If User is seller and fiat_sent is true: settle the escrow and pay buyer invoice!"""

        if order.status == Order.Status.CHA or order.status == Order.Status.FSE:

            # If buyer, settle escrow and mark fiat sent
            if cls.is_buyer(order, user):
                order.status = Order.Status.FSE
                order.is_fiat_sent = True

            # If seller and fiat was sent, SETTLE ESCROW AND PAY BUYER INVOICE
            elif cls.is_seller(order, user):
                if not order.is_fiat_sent:
                    return False, {
                        "bad_request": "You cannot confirm to have received the fiat before it is confirmed to be sent by the buyer."
                    }

                # Make sure the trade escrow is at least as big as the buyer invoice
                num_satoshis = (
                    order.payout_tx.num_satoshis
                    if order.is_swap
                    else order.payout.num_satoshis
                )
                if order.trade_escrow.num_satoshis <= num_satoshis:
                    return False, {
                        "bad_request": "Woah, something broke badly. Report in the public channels, or open a Github Issue."
                    }

                # !!! KEY LINE - SETTLES THE TRADE ESCROW !!!
                if cls.settle_escrow(order):
                    order.trade_escrow.status = LNPayment.Status.SETLED

                # Double check the escrow is settled.
                if LNNode.double_check_htlc_is_settled(order.trade_escrow.payment_hash):
                    # RETURN THE BONDS
                    cls.return_bond(order.taker_bond)
                    cls.return_bond(order.maker_bond)
                    ##### !!! KEY LINE - PAYS THE BUYER INVOICE !!!
                    cls.pay_buyer(order)

                    # Add referral rewards (safe)
                    try:
                        cls.add_rewards(order)
                    except:
                        pass

                    return True, None

        else:
            return False, {
                "bad_request": "You cannot confirm the fiat payment at this stage"
            }

        order.save()
        return True, None

    def pause_unpause_public_order(order, user):
        if not order.maker == user:
            return False, {
                "bad_request": "You cannot pause or unpause an order you did not make"
            }
        else:
            if order.status == Order.Status.PUB:
                order.status = Order.Status.PAU
            elif order.status == Order.Status.PAU:
                order.status = Order.Status.PUB
            else:
                return False, {
                    "bad_request": "You can only pause/unpause an order that is either public or paused"
                }
        order.save()
        return True, None

    @classmethod
    def rate_counterparty(cls, order, user, rating):
        """
        Not in use
        """

        rating_allowed_status = [
            Order.Status.PAY,
            Order.Status.SUC,
            Order.Status.FAI,
            Order.Status.MLD,
            Order.Status.TLD,
        ]

        # If the trade is finished
        if order.status in rating_allowed_status:
            # if maker, rates taker
            if order.maker == user and order.maker_rated == False:
                cls.add_profile_rating(order.taker.profile, rating)
                order.maker_rated = True
                order.save()
            # if taker, rates maker
            if order.taker == user and order.taker_rated == False:
                cls.add_profile_rating(order.maker.profile, rating)
                order.taker_rated = True
                order.save()
        else:
            return False, {"bad_request": "You cannot rate your counterparty yet."}

        return True, None

    @classmethod
    def rate_platform(cls, user, rating):
        user.profile.platform_rating = rating
        user.profile.save()
        return True, None

    @classmethod
    def add_rewards(cls, order):
        """
        This function is called when a trade is finished.
        If participants of the order were referred, the reward is given to the referees.
        """

        if order.maker.profile.is_referred:
            profile = order.maker.profile.referred_by
            profile.pending_rewards += int(config("REWARD_TIP"))
            profile.save()

        if order.taker.profile.is_referred:
            profile = order.taker.profile.referred_by
            profile.pending_rewards += int(config("REWARD_TIP"))
            profile.save()

        return

    @classmethod
    def add_slashed_rewards(cls, bond, profile):
        """
        When a bond is slashed due to overtime, rewards the user that was waiting.
        If participants of the order were referred, the reward is given to the referees.
        """
        reward_fraction = float(config("SLASHED_BOND_REWARD_SPLIT"))
        reward = int(bond.num_satoshis * reward_fraction)
        profile.earned_rewards += reward
        profile.save()

        return

    @classmethod
    def withdraw_rewards(cls, user, invoice):

        # only a user with positive withdraw balance can use this

        if user.profile.earned_rewards < 1:
            return False, {"bad_invoice": "You have not earned rewards"}

        num_satoshis = user.profile.earned_rewards

        reward_payout = LNNode.validate_ln_invoice(invoice, num_satoshis)

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
        except:
            return False, {"bad_invoice": "Give me a new invoice"}

        user.profile.earned_rewards = 0
        user.profile.save()

        # Pays the invoice.
        paid, failure_reason = LNNode.pay_invoice(lnpayment)
        if paid:
            user.profile.earned_rewards = 0
            user.profile.claimed_rewards += num_satoshis
            user.profile.save()
            return True, None

        # If fails, adds the rewards again.
        else:
            user.profile.earned_rewards = num_satoshis
            user.profile.save()
            context = {}
            context["bad_invoice"] = failure_reason
            return False, context

    @classmethod
    def summarize_trade(cls, order, user):
        """
        Summarizes a finished order. Returns a dict with
        amounts, fees, costs, etc, for buyer and seller.
        """
        if not order.status in [Order.Status.SUC, Order.Status.PAY, Order.Status.FAI]:
            return False, {"bad_summary": "Order has not finished yet"}

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
                summary["trade_fee_sats"] = round(
                    order.last_satoshis - summary["received_sats"]
                )
                # Only add context for swap costs if the user is the swap recipient. Peer should not know whether it was a swap
                if users[order_user] == user and order.is_swap:
                    summary["is_swap"] = order.is_swap
                    summary["received_onchain_sats"] = order.payout_tx.sent_satoshis
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
            float(order.last_satoshis) / 100000000
        )
        if order.last_satoshis_time != None:
            platform_summary["contract_timestamp"] = order.last_satoshis_time
            platform_summary["contract_total_time"] = (
                order.contract_finalization_time - order.last_satoshis_time
            )
        if not order.is_swap:
            platform_summary["routing_fee_sats"] = order.payout.fee
            platform_summary["trade_revenue_sats"] = int(
                order.trade_escrow.num_satoshis
                - order.payout.num_satoshis
                - order.payout.fee
            )
        else:
            platform_summary["routing_fee_sats"] = 0
            platform_summary["trade_revenue_sats"] = int(
                order.trade_escrow.num_satoshis - order.payout_tx.num_satoshis
            )
        context["platform_summary"] = platform_summary

        return True, context

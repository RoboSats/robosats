from celery import shared_task


@shared_task(name="users_cleansing")
def users_cleansing():
    """
    Deletes users never used 12 hours after creation
    """
    from datetime import timedelta

    from django.contrib.auth.models import User
    from django.db.models import Q
    from django.utils import timezone

    from api.logics import Logics

    # Users who's last login has not been in the last 6 hours
    active_time_range = (timezone.now() - timedelta(hours=6), timezone.now())
    queryset = User.objects.filter(~Q(last_login__range=active_time_range))
    queryset = queryset.filter(is_staff=False)  # Do not delete staff users

    # And do not have an active trade, any past contract or any reward.
    deleted_users = []
    for user in queryset:
        # Try an except, due to unknown cause for users lacking profiles.
        try:
            if (
                user.profile.pending_rewards > 0
                or user.profile.earned_rewards > 0
                or user.profile.claimed_rewards > 0
            ):
                continue
            if not user.profile.total_contracts == 0:
                continue
            valid, _, _ = Logics.validate_already_maker_or_taker(user)
            if valid:
                deleted_users.append(str(user))
                user.delete()
        except Exception:
            pass

    results = {
        "num_deleted": len(deleted_users),
        "deleted_users": deleted_users,
    }
    return results


@shared_task(name="give_rewards")
def give_rewards():
    """
    Referral rewards go from pending to earned.
    Happens asynchronously so the referral program cannot be easily used to spy.
    """
    from api.models import Profile

    # Users who's last login has not been in the last 6 hours
    queryset = Profile.objects.filter(pending_rewards__gt=0)

    # And do not have an active trade, any past contract or any reward.
    results = {}
    for profile in queryset:
        given_reward = profile.pending_rewards
        profile.earned_rewards += given_reward
        profile.pending_rewards = 0
        profile.save()

        results[profile.user.username] = {
            "given_reward": given_reward,
            "earned_rewards": profile.earned_rewards,
        }

    return results


@shared_task(name="follow_send_payment")
def follow_send_payment(hash):
    """Sends sats to buyer, continuous update"""

    from datetime import timedelta

    from decouple import config
    from django.utils import timezone

    from api.lightning.node import MACAROON, LNNode
    from api.models import LNPayment, Order

    lnpayment = LNPayment.objects.get(payment_hash=hash)
    lnpayment.last_routing_time = timezone.now()
    lnpayment.save()

    # Default is 0ppm. Set by the user over API. Client's default is 1000 ppm.
    fee_limit_sat = int(
        float(lnpayment.num_satoshis) * float(lnpayment.routing_budget_ppm) / 1000000
    )
    timeout_seconds = int(config("PAYOUT_TIMEOUT_SECONDS"))

    request = LNNode.routerrpc.SendPaymentRequest(
        payment_request=lnpayment.invoice,
        fee_limit_sat=fee_limit_sat,
        timeout_seconds=timeout_seconds,
        allow_self_payment=True,
    )

    order = lnpayment.order_paid_LN
    if order.trade_escrow.num_satoshis < lnpayment.num_satoshis:
        print(f"Order: {order.id} Payout is larger than collateral !?")
        return

    def handle_response(response):
        lnpayment.status = LNPayment.Status.FLIGHT
        lnpayment.in_flight = True
        lnpayment.save()
        order.status = Order.Status.PAY
        order.save()

        if response.status == 0:  # Status 0 'UNKNOWN'
            # Not sure when this status happens
            print(f"Order: {order.id} UNKNOWN. Hash {hash}")
            lnpayment.in_flight = False
            lnpayment.save()

        if response.status == 1:  # Status 1 'IN_FLIGHT'
            print(f"Order: {order.id} IN_FLIGHT. Hash {hash}")

        if response.status == 3:  # Status 3 'FAILED'
            lnpayment.status = LNPayment.Status.FAILRO
            lnpayment.last_routing_time = timezone.now()
            lnpayment.routing_attempts += 1
            lnpayment.failure_reason = response.failure_reason
            lnpayment.in_flight = False
            if lnpayment.routing_attempts > 2:
                lnpayment.status = LNPayment.Status.EXPIRE
                lnpayment.routing_attempts = 0
            lnpayment.save()

            order.status = Order.Status.FAI
            order.expires_at = timezone.now() + timedelta(
                seconds=order.t_to_expire(Order.Status.FAI)
            )
            order.save()
            print(
                f"Order: {order.id} FAILED. Hash: {hash} Reason: {LNNode.payment_failure_context[response.failure_reason]}"
            )
            return {
                "succeded": False,
                "context": f"payment failure reason: {LNNode.payment_failure_context[response.failure_reason]}",
            }

        if response.status == 2:  # Status 2 'SUCCEEDED'
            print(f"SUCCEEDED. Order: {order.id}. Hash: {hash}")
            lnpayment.status = LNPayment.Status.SUCCED
            lnpayment.fee = float(response.fee_msat) / 1000
            lnpayment.preimage = response.payment_preimage
            lnpayment.save()
            order.status = Order.Status.SUC
            order.expires_at = timezone.now() + timedelta(
                seconds=order.t_to_expire(Order.Status.SUC)
            )
            order.save()
            results = {"succeded": True}
            return results

    try:
        for response in LNNode.routerstub.SendPaymentV2(
            request, metadata=[("macaroon", MACAROON.hex())]
        ):

            handle_response(response)

    except Exception as e:

        if "invoice expired" in str(e):
            print(f"Order: {order.id}. INVOICE EXPIRED. Hash: {hash}")
            lnpayment.status = LNPayment.Status.EXPIRE
            lnpayment.last_routing_time = timezone.now()
            lnpayment.in_flight = False
            lnpayment.save()
            order.status = Order.Status.FAI
            order.expires_at = timezone.now() + timedelta(
                seconds=order.t_to_expire(Order.Status.FAI)
            )
            order.save()
            results = {"succeded": False, "context": "The payout invoice has expired"}
            return results

        if "payment is in transition" in str(e):
            print(f"Order: {order.id}. ALREADY IN TRANSITION. Hash: {hash}.")

            request = LNNode.routerrpc.TrackPaymentRequest(
                payment_hash=bytes.fromhex(hash)
            )

            for response in LNNode.routerstub.TrackPaymentV2(
                request, metadata=[("macaroon", MACAROON.hex())]
            ):
                handle_response(response)


@shared_task(name="payments_cleansing")
def payments_cleansing():
    """
    Deletes cancelled payments (hodl invoices never locked) that
    belong to orders expired more than 3 days ago.
    Deletes 'cancelled' or 'create' onchain_payments
    """

    from datetime import timedelta

    from django.db.models import Q
    from django.utils import timezone

    from api.models import LNPayment, OnchainPayment

    # Orders that have expired more than -3 days ago
    # Usually expiry is 1 day for every finished order. So ~4 days until
    # a never locked hodl invoice is removed.
    finished_time = timezone.now() - timedelta(days=3)
    queryset = LNPayment.objects.filter(
        Q(status=LNPayment.Status.CANCEL),
        Q(order_made__expires_at__lt=finished_time)
        | Q(order_taken__expires_at__lt=finished_time),
    )

    # And do not have an active trade, any past contract or any reward.
    deleted_lnpayments = []
    for lnpayment in queryset:
        # Try and except. In case some payment is already missing.
        try:
            name = str(lnpayment)
            lnpayment.delete()
            deleted_lnpayments.append(name)
        except Exception:
            pass

    # same for onchain payments
    queryset = OnchainPayment.objects.filter(
        Q(status__in=[OnchainPayment.Status.CANCE, OnchainPayment.Status.CREAT]),
        Q(order_paid_TX__expires_at__lt=finished_time) | Q(order_paid_TX__isnull=True),
    )

    # And do not have an active trade, any past contract or any reward.
    deleted_onchainpayments = []
    for onchainpayment in queryset:
        # Try and except. In case some payment is already missing.
        try:
            name = str(onchainpayment)
            onchainpayment.delete()
            deleted_onchainpayments.append(name)
        except Exception:
            pass

    results = {
        "num_lnpayments_deleted": len(deleted_lnpayments),
        "deleted_lnpayments": deleted_lnpayments,
        "num_onchainpayments_deleted": len(deleted_onchainpayments),
        "deleted_onchainpayments": deleted_onchainpayments,
    }
    return results


@shared_task(name="cache_external_market_prices", ignore_result=True)
def cache_market():

    from django.utils import timezone

    from .models import Currency
    from .utils import get_exchange_rates

    currency_codes = list(Currency.currency_dict.values())
    exchange_rates = get_exchange_rates(currency_codes)

    results = {}
    for i in range(
        len(Currency.currency_dict.values())
    ):  # currencies are indexed starting at 1 (USD)

        rate = exchange_rates[i]
        results[i] = {currency_codes[i], rate}

        # Do not update if no new rate was found
        if str(rate) == "nan":
            continue

        # Create / Update database cached prices
        currency_key = list(Currency.currency_dict.keys())[i]
        Currency.objects.update_or_create(
            id=int(currency_key),
            currency=int(currency_key),
            # if there is a Cached market prices matching that id, it updates it with defaults below
            defaults={
                "exchange_rate": float(rate),
                "timestamp": timezone.now(),
            },
        )

    return results


@shared_task(name="send_message", ignore_result=True)
def send_message(order_id, message):

    from api.models import Order

    order = Order.objects.get(id=order_id)
    taker_enabled = (
        False if order.taker is None else order.taker.profile.telegram_enabled
    )
    if not (order.maker.profile.telegram_enabled or taker_enabled):
        return

    from api.messages import Telegram

    telegram = Telegram()

    if message == "welcome":
        telegram.welcome(order)

    elif message == "order_expired_untaken":
        telegram.order_expired_untaken(order)

    elif message == "trade_successful":
        telegram.trade_successful(order)

    elif message == "public_order_cancelled":
        telegram.public_order_cancelled(order)

    elif message == "taker_expired_b4bond":
        telegram.taker_expired_b4bond(order)

    elif message == "order_published":
        telegram.order_published(order)

    elif message == "order_taken_confirmed":
        telegram.order_taken_confirmed(order)

    elif message == "fiat_exchange_starts":
        telegram.fiat_exchange_starts(order)

    elif message == "dispute_opened":
        telegram.dispute_opened(order)

    elif message == "collaborative_cancelled":
        telegram.collaborative_cancelled(order)

    return

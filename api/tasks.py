from celery import shared_task


@shared_task(name="users_cleansing")
def users_cleansing():
    """
    Deletes users never used 12 hours after creation
    """
    from django.contrib.auth.models import User
    from django.db.models import Q
    from api.logics import Logics
    from datetime import timedelta
    from django.utils import timezone

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
        except:
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

    from decouple import config
    from django.utils import timezone
    from datetime import timedelta

    from api.lightning.node import LNNode, MACAROON
    from api.models import LNPayment, Order

    lnpayment = LNPayment.objects.get(payment_hash=hash)
    fee_limit_sat = int(
        max(
            lnpayment.num_satoshis * float(config("PROPORTIONAL_ROUTING_FEE_LIMIT")),
            float(config("MIN_FLAT_ROUTING_FEE_LIMIT")),
        )
    )  # 1000 ppm or 10 sats
    timeout_seconds = int(config("PAYOUT_TIMEOUT_SECONDS"))

    request = LNNode.routerrpc.SendPaymentRequest(
        payment_request=lnpayment.invoice,
        fee_limit_sat=fee_limit_sat,
        timeout_seconds=timeout_seconds,
    )

    order = lnpayment.order_paid_LN
    try:
        for response in LNNode.routerstub.SendPaymentV2(
            request, metadata=[("macaroon", MACAROON.hex())]
        ):

            lnpayment.in_flight = True
            lnpayment.save()

            if response.status == 0:  # Status 0 'UNKNOWN'
                # Not sure when this status happens
                lnpayment.in_flight = False
                lnpayment.save()

            if response.status == 1:  # Status 1 'IN_FLIGHT'
                print("IN_FLIGHT")
                lnpayment.status = LNPayment.Status.FLIGHT
                lnpayment.in_flight = True
                lnpayment.save()
                order.status = Order.Status.PAY
                order.save()

            if response.status == 3:  # Status 3 'FAILED'
                print("FAILED")
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
                context = {
                    "routing_failed": LNNode.payment_failure_context[
                        response.failure_reason
                    ],
                    "IN_FLIGHT": False,
                }
                print(context)

                # If failed due to not route, reset mission control. (This won't scale well, just a temporary fix)
                # ResetMC deactivate temporary for tests
                # if response.failure_reason==2:
                #    LNNode.resetmc()

                return False, context

            if response.status == 2:  # Status 2 'SUCCEEDED'
                print("SUCCEEDED")
                lnpayment.status = LNPayment.Status.SUCCED
                lnpayment.fee = float(response.fee_msat) / 1000
                lnpayment.preimage = response.payment_preimage
                lnpayment.save()
                order.status = Order.Status.SUC
                order.expires_at = timezone.now() + timedelta(
                    seconds=order.t_to_expire(Order.Status.SUC)
                )
                order.save()
                return True, None

    except Exception as e:
        if "invoice expired" in str(e):
            print("INVOICE EXPIRED")
            lnpayment.status = LNPayment.Status.EXPIRE
            lnpayment.last_routing_time = timezone.now()
            lnpayment.in_flight = False
            lnpayment.save()
            order.status = Order.Status.FAI
            order.expires_at = timezone.now() + timedelta(
                seconds=order.t_to_expire(Order.Status.FAI)
            )
            order.save()
            context = {"routing_failed": "The payout invoice has expired"}
            return False, context


@shared_task(name="payments_cleansing")
def payments_cleansing():
    """
    Deletes cancelled payments (hodl invoices never locked) that
    belong to orders expired more than 3 days ago.
    Deletes 'cancelled' or 'create' onchain_payments
    """

    from django.db.models import Q
    from api.models import LNPayment
    from api.models import OnchainPayment
    from datetime import timedelta
    from django.utils import timezone

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
        except:
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
        except:
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

    from .models import Currency
    from .utils import get_exchange_rates

    from django.utils import timezone

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
    if not order.maker.profile.telegram_enabled:
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

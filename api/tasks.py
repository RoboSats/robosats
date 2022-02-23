from celery import shared_task


@shared_task(name="users_cleansing")
def users_cleansing():
    """
    Deletes users never used 12 hours after creation
    """
    from django.contrib.auth.models import User
    from django.db.models import Q
    from .logics import Logics
    from datetime import timedelta
    from django.utils import timezone

    # Users who's last login has not been in the last 6 hours
    active_time_range = (timezone.now() - timedelta(hours=6), timezone.now())
    queryset = User.objects.filter(~Q(last_login__range=active_time_range))
    queryset = queryset.filter(is_staff=False)  # Do not delete staff users

    # And do not have an active trade or any past contract.
    deleted_users = []
    for user in queryset:
        if not user.profile.total_contracts == 0:
            continue
        valid, _, _ = Logics.validate_already_maker_or_taker(user)
        if valid:
            deleted_users.append(str(user))
            user.delete()

    results = {
        "num_deleted": len(deleted_users),
        "deleted_users": deleted_users,
    }
    return results


@shared_task(name="follow_send_payment")
def follow_send_payment(lnpayment):
    """Sends sats to buyer, continuous update"""

    from decouple import config
    from base64 import b64decode
    from django.utils import timezone
    from datetime import timedelta

    from api.lightning.node import LNNode, MACAROON
    from api.models import LNPayment, Order

    fee_limit_sat = int(
        max(
            lnpayment.num_satoshis *
            float(config("PROPORTIONAL_ROUTING_FEE_LIMIT")),
            float(config("MIN_FLAT_ROUTING_FEE_LIMIT")),
        ))  # 200 ppm or 10 sats
    request = LNNode.routerrpc.SendPaymentRequest(
        payment_request=lnpayment.invoice,
        fee_limit_sat=fee_limit_sat,
        timeout_seconds=60,
    )  # time out payment in 60 seconds

    order = lnpayment.order_paid
    try:
        for response in LNNode.routerstub.SendPaymentV2(request,
                                                        metadata=[
                                                            ("macaroon",
                                                             MACAROON.hex())
                                                        ]):
            if response.status == 0:  # Status 0 'UNKNOWN'
                # Not sure when this status happens
                pass

            if response.status == 1:  # Status 1 'IN_FLIGHT'
                print("IN_FLIGHT")
                lnpayment.status = LNPayment.Status.FLIGHT
                lnpayment.save()
                order.status = Order.Status.PAY
                order.save()

            if response.status == 3:  # Status 3 'FAILED'
                print("FAILED")
                lnpayment.status = LNPayment.Status.FAILRO
                lnpayment.last_routing_time = timezone.now()
                lnpayment.routing_attempts += 1
                lnpayment.save()
                order.status = Order.Status.FAI
                order.expires_at = timezone.now() + timedelta(
                    seconds=Order.t_to_expire[Order.Status.FAI])
                order.save()
                context = {
                    "routing_failed":
                    LNNode.payment_failure_context[response.failure_reason]
                }
                print(context)
                return False, context

            if response.status == 2:  # Status 2 'SUCCEEDED'
                print("SUCCEEDED")
                lnpayment.status = LNPayment.Status.SUCCED
                lnpayment.save()
                order.status = Order.Status.SUC
                order.expires_at = timezone.now() + timedelta(
                    seconds=Order.t_to_expire[Order.Status.SUC])
                order.save()
                return True, None

    except Exception as e:
        if "invoice expired" in str(e):
            print("INVOICE EXPIRED")
            lnpayment.status = LNPayment.Status.EXPIRE
            lnpayment.last_routing_time = timezone.now()
            lnpayment.save()
            order.status = Order.Status.FAI
            order.expires_at = timezone.now() + timedelta(
                seconds=Order.t_to_expire[Order.Status.FAI])
            order.save()
            context = {"routing_failed": "The payout invoice has expired"}
            return False, context


@shared_task(name="cache_external_market_prices", ignore_result=True)
def cache_market():

    from .models import Currency
    from .utils import get_exchange_rates

    from django.utils import timezone

    currency_codes = list(Currency.currency_dict.values())
    exchange_rates = get_exchange_rates(currency_codes)

    results = {}
    for i in range(len(Currency.currency_dict.values())
                   ):  # currecies are indexed starting at 1 (USD)

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

    if message == 'order_taken':
        telegram.order_taken(order)
        
    elif message == 'order_expired_untaken':
        telegram.order_expired_untaken(order)

    elif message == 'trade_successful':
        telegram.trade_successful(order)

    elif message == 'public_order_cancelled':
        telegram.public_order_cancelled(order)

    elif message == 'taker_expired_b4bond':
        telegram.taker_expired_b4bond(order)

    elif message == 'taker_canceled_b4bond':
        telegram.taker_canceled_b4bond(order)
        
    return
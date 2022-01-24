from celery import shared_task

@shared_task(name="users_cleansing")
def users_cleansing():
    '''
    Deletes users never used 12 hours after creation
    '''
    from django.contrib.auth.models import User
    from django.db.models import Q
    from .logics import Logics
    from datetime import timedelta
    from django.utils import timezone

    # Users who's last login has not been in the last 6 hours
    active_time_range = (timezone.now() - timedelta(hours=6), timezone.now())
    queryset = User.objects.filter(~Q(last_login__range=active_time_range))
    queryset = queryset.filter(is_staff=False) # Do not delete staff users
    
    # And do not have an active trade or any past contract.
    deleted_users = []
    for user in queryset:
        if not user.profile.total_contracts == 0:
            continue
        valid, _ = Logics.validate_already_maker_or_taker(user)
        if valid:
            deleted_users.append(str(user))
            user.delete()

    results = {
        'num_deleted': len(deleted_users),
        'deleted_users': deleted_users,
    }
    return results

@shared_task(name='follow_send_payment')
def follow_send_payment(lnpayment):
    '''Sends sats to buyer, continuous update'''

    from decouple import config
    from base64 import b64decode
    from django.utils import timezone
    from datetime import timedelta

    from api.lightning.node import LNNode
    from api.models import LNPayment, Order

    MACAROON = b64decode(config('LND_MACAROON_BASE64'))

    fee_limit_sat = max(lnpayment.num_satoshis * 0.0002, 10) # 200 ppm or 10 sats max
    request = LNNode.routerrpc.SendPaymentRequest(
        payment_request=lnpayment.invoice,
        fee_limit_sat=fee_limit_sat,
        timeout_seconds=60) # time out payment in 60 seconds

    order = lnpayment.order_paid
    try:
        for response in LNNode.routerstub.SendPaymentV2(request, metadata=[('macaroon', MACAROON.hex())]):
            if response.status == 0 :               # Status 0 'UNKNOWN'
                # Not sure when this status happens
                pass 

            if response.status == 1 :               # Status 1 'IN_FLIGHT'
                print('IN_FLIGHT')
                lnpayment.status = LNPayment.Status.FLIGHT
                lnpayment.save()
                order.status = Order.Status.PAY
                order.save()

            if response.status == 3 :               # Status 3 'FAILED'
                print('FAILED')
                lnpayment.status = LNPayment.Status.FAILRO
                lnpayment.last_routing_time = timezone.now()
                lnpayment.routing_attempts += 1
                lnpayment.save()
                order.status = Order.Status.FAI
                order.expires_at = timezone.now() + timedelta(seconds=Order.t_to_expire[Order.Status.FAI])
                order.save()
                context = {'routing_failed': LNNode.payment_failure_context[response.failure_reason]}
                print(context)
                # Call a retry in 5 mins here?
                return False, context

            if response.status == 2 :               # Status 2 'SUCCEEDED'
                print('SUCCEEDED')
                lnpayment.status = LNPayment.Status.SUCCED
                lnpayment.save()
                order.status = Order.Status.SUC
                order.expires_at = timezone.now() + timedelta(seconds=Order.t_to_expire[Order.Status.SUC])
                order.save()
                return True, None

    except Exception as e:
        if "invoice expired" in str(e):
            print('INVOICE EXPIRED')
            lnpayment.status = LNPayment.Status.EXPIRE
            lnpayment.last_routing_time = timezone.now()
            lnpayment.save()
            order.status = Order.Status.FAI
            order.expires_at = timezone.now() + timedelta(seconds=Order.t_to_expire[Order.Status.FAI])
            order.save()
            context = {'routing_failed':'The payout invoice has expired'}
            return False, context

@shared_task(name="cache_external_market_prices", ignore_result=True)
def cache_market():

    from .models import Currency
    from .utils import get_exchange_rates

    from django.utils import timezone

    exchange_rates = get_exchange_rates(list(Currency.currency_dict.values()))
    results = {}
    for val in Currency.currency_dict:
        rate = exchange_rates[int(val)-1] # currecies are indexed starting at 1 (USD)
        results[val] = {Currency.currency_dict[val], rate}
        if str(rate) == 'nan': continue # Do not update if no new rate was found

        # Create / Update database cached prices
        Currency.objects.update_or_create(
            id = int(val),
            currency = int(val),
            # if there is a Cached market prices matching that id, it updates it with defaults below
            defaults = {
                'exchange_rate': float(rate),
                'timestamp': timezone.now(),
            })

    return results
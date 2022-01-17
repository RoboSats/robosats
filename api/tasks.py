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

    # Users who's last login has not been in the last 12 hours
    active_time_range = (timezone.now() - timedelta(hours=12), timezone.now())
    queryset = User.objects.filter(~Q(last_login__range=active_time_range))
    queryset = queryset.filter(is_staff=False) # Do not delete staff users
    
    # And do not have an active trade or any pass finished trade.
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


@shared_task(name="orders_expire")
def orders_expire(rest_secs):
    '''
    Continuously checks order expiration times for 1 hour. If order
    has expires, it calls the logics module for expiration handling.
    '''
    import time
    from .models import Order
    from .logics import Logics
    from datetime import timedelta
    from django.utils import timezone

    now = timezone.now()
    end_time = now + timedelta(minutes=60)
    context = []

    while now < end_time:
        queryset = Order.objects.exclude(status=Order.Status.EXP).exclude(status=Order.Status.UCA).exclude(status= Order.Status.CCA)
        queryset = queryset.filter(expires_at__lt=now) # expires at lower than now        

        for order in queryset:
            try:    # TODO Fix, it might fail if returning an already returned bond.
                info = str(order)+ " was "+ Order.Status(order.status).label
                if Logics.order_expires(order): # Order send to expire here
                    context.append(info)
            except:
                pass

        # Allow for some thread rest.
        time.sleep(rest_secs)

        # Update 'now' for a new loop
        now = timezone.now()

    results = {
        'num_expired': len(context),
        'expired_orders_context': context,
        'rest_param': rest_secs,
    }

    return results

@shared_task(name='follow_send_payment')
def follow_send_payment(lnpayment):
    '''Sends sats to buyer, continuous update'''

    from decouple import config
    from base64 import b64decode

    from api.lightning.node import LNNode
    from api.models import LNPayment

    MACAROON = b64decode(config('LND_MACAROON_BASE64'))

    fee_limit_sat = max(lnpayment.num_satoshis * 0.0002, 10) # 200 ppm or 10 sats max
    request = LNNode.routerrpc.SendPaymentRequest(
        payment_request=lnpayment.invoice,
        fee_limit_sat=fee_limit_sat,
        timeout_seconds=60)

    for response in LNNode.routerstub.SendPaymentV2(request, metadata=[('macaroon', MACAROON.hex())]):
        if response.status == 0 :               # Status 0 'UNKNOWN'
            pass 

        if response.status == 1 :               # Status 1 'IN_FLIGHT'
            lnpayment.status = LNPayment.Status.FLIGHT
            lnpayment.save()

        if response.status == 3 :               # Status 3 'FAILED'
            lnpayment.status = LNPayment.Status.FAILRO
            lnpayment.save()
            context = LNNode.payment_failure_context[response.failure_reason]
            return False, context

        if response.status == 2 :               # Status 2 'SUCCEEDED'
            lnpayment.status = LNPayment.Status.SUCCED
            lnpayment.save()
            return True, None

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
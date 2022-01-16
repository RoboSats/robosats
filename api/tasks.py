from celery import shared_task

from .lightning.node import LNNode
from django.contrib.auth.models import User
from .models import LNPayment, Order, Currency
from .logics import Logics
from .utils import get_exchange_rates

from django.db.models import Q
from datetime import timedelta
from django.utils import timezone

import time

@shared_task(name="users_cleansing")
def users_cleansing():
    '''
    Deletes users never used 12 hours after creation
    '''
    # Users who's last login has not been in the last 12 hours
    active_time_range = (timezone.now() - timedelta(hours=12), timezone.now())
    queryset = User.objects.filter(~Q(last_login__range=active_time_range))
    queryset = queryset(is_staff=False) # Do not delete staff users
    
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
    now = timezone.now()
    end_time = now + timedelta(hours=1)
    context = []

    while now < end_time:
        queryset = Order.objects.exclude(status=Order.Status.EXP).exclude(status=Order.Status.UCA).exclude(status= Order.Status.CCA)
        queryset = queryset.filter(expires_at__lt=now) # expires at lower than now        

        for order in queryset:
            if Logics.order_expires(order): # Order send to expire here
                context.append(str(order)+ " was "+ Order.Status(order.status).label)

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

@shared_task
def follow_lnd_payment():
    ''' Makes a payment and follows it.
    Updates the LNpayment object, and retries
    until payment is done'''

    pass

@shared_task
def follow_lnd_hold_invoice():
    ''' Follows and updates LNpayment object
    until settled or canceled'''

    pass

@shared_task(name="cache_external_market_prices", ignore_result=True)
def cache_market():
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
from celery import shared_task

from .lightning.node import LNNode
from django.contrib.auth.models import User
from .models import LNPayment, Order, CachedExchangeRate
from .logics import Logics
from .utils import get_exchange_rates

from django.db.models import Q
from datetime import timedelta
from django.utils import timezone

from decouple import config

@shared_task(name="users_cleansing")
def users_cleansing():
    '''
    Deletes users never used 12 hours after creation
    '''
    # Users who's last login has not been in the last 12 hours
    active_time_range = (timezone.now() - timedelta(hours=12), timezone.now())
    queryset = User.objects.filter(~Q(last_login__range=active_time_range))
    
    # And do not have an active trade or any pass finished trade.
    deleted_users = []
    for user in queryset:
        if user.username == str(config('ESCROW_USERNAME')): # Do not delete admin user by mistake
            continue
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
def orders_expire():
    pass

@shared_task
def follow_lnd_payment():
    pass

@shared_task
def query_all_lnd_invoices():
    pass

@shared_task(name="cache_market", ignore_result=True)
def cache_market():
    exchange_rates = get_exchange_rates(list(Order.currency_dict.values()))
    results = {}
    for val in Order.currency_dict:
        rate = exchange_rates[int(val)-1] # currecies are indexed starting at 1 (USD)
        results[val] = {Order.currency_dict[val], rate}

        # Create / Update database cached prices
        CachedExchangeRate.objects.update_or_create(
            currency = int(val),
            # if there is a Cached Exchange rate matching that value, it updates it with defaults below
            defaults = {
                'exchange_rate': rate,
                'timestamp': timezone.now(),
            })

    return results
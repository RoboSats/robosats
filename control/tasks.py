from celery import shared_task
from api.models import Order, LNPayment, Profile, MarketTick
from control.models import AccountingDay, AccountingMonth
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum

@shared_task(name="do_accounting")
def do_accounting():
    '''
    Does all accounting from the beginning of time
    '''

    all_payments = LNPayment.objects.all()
    all_ticks = MarketTick.objects.all()
    today = timezone.now().date()

    try:
        last_accounted_day = AccountingDay.objects.latest('day').day.date()
    except:
        last_accounted_day = None

    if last_accounted_day == today:
        return {'message':'no days to account for'}
    elif last_accounted_day != None:
        initial_day = last_accounted_day + timedelta(days=1)
    elif last_accounted_day == None:
        initial_day = all_payments.earliest('created_at').created_at.date()

    
    day = initial_day
    result = {}
    accounted_yesterday = None
    while day <= today:
        day_payments = all_payments.filter(created_at__gte=day,created_at__lte=day+timedelta(days=1))
        day_ticks = all_ticks.filter(timestamp__gte=day,timestamp__lte=day+timedelta(days=1))

        contracted = day_ticks.aggregate(Sum('volume'))['volume__sum']
        num_contracts = day_ticks.count()
        inflow = day_payments.filter(type=LNPayment.Types.HOLD,status=LNPayment.Status.SETLED).aggregate(Sum('num_satoshis'))['num_satoshis__sum']
        outflow = day_payments.filter(type=LNPayment.Types.NORM,status=LNPayment.Status.SUCCED).aggregate(Sum('num_satoshis'))['num_satoshis__sum']
        routing_fees = day_payments.filter(type=LNPayment.Types.NORM,status=LNPayment.Status.SUCCED).aggregate(Sum('fee'))['fee__sum']
        rewards_claimed = day_payments.filter(type=LNPayment.Types.NORM,concept=LNPayment.Concepts.WITHREWA,status=LNPayment.Status.SUCCED).aggregate(Sum('num_satoshis'))['num_satoshis__sum']

        contracted = 0 if contracted == None else contracted
        inflow = 0 if inflow == None else inflow
        outflow = 0 if outflow == None else outflow
        routing_fees  = 0 if routing_fees == None else routing_fees
        rewards_claimed = 0 if rewards_claimed == None else rewards_claimed

        accounted_day = AccountingDay.objects.create(
            day = day,
            contracted = contracted,
            num_contracts = num_contracts,
            net_settled = 0,
            net_paid = 0,
            net_balance = 0,
            inflow = inflow, 
            outflow = outflow,
            routing_fees = routing_fees,
            cashflow = inflow - outflow - routing_fees,
            rewards_claimed = rewards_claimed,
            )
        
        if day == today:
            pending_disputes = Order.objects.filter(status__in=[Order.Status.DIS,Order.Status.WFR])
            if len(pending_disputes) > 0:
                outstanding_pending_disputes = 0
                for order in pending_disputes:
                    outstanding_pending_disputes += order.payout.num_satoshis

            accounted_day.outstanding_earned_rewards = Profile.objects.all().aggregate(Sum('earned_rewards'))['earned_rewards__sum']
            accounted_day.outstanding_pending_disputes = outstanding_pending_disputes
            accounted_day.lifetime_rewards_claimed = Profile.objects.all().aggregate(Sum('claimed_rewards'))['claimed_rewards__sum']
            if accounted_yesterday != None:
                accounted_day.earned_rewards = accounted_day.outstanding_earned_rewards - accounted_yesterday.outstanding_earned_rewards
                accounted_day.pending_disputes = outstanding_pending_disputes - accounted_yesterday.outstanding_earned_rewards 

        accounted_day.save()
        accounted_yesterday = accounted_day
        result[str(day)]={'contracted':contracted,'inflow':inflow,'outflow':outflow}
        day = day + timedelta(days=1)

        

    return result

@shared_task(name="account_day")
def account_day():
    '''
    Does daily accounting since last accounted day.
    To be run daily.
    '''

    return
from celery import shared_task

@shared_task(name="do_accounting")
def do_accounting():
    '''
    Does all accounting from the beginning of time
    '''

    from api.models import Order, LNPayment, OnchainPayment, Profile, MarketTick
    from control.models import AccountingDay
    from django.utils import timezone
    from datetime import timedelta
    from django.db.models import Sum
    from decouple import config

    all_payments = LNPayment.objects.all()
    all_ticks = MarketTick.objects.all()
    today = timezone.now().date()

    try:
        last_accounted_day = AccountingDay.objects.latest('day').day.date()
        accounted_yesterday = AccountingDay.objects.latest('day')
    except:
        last_accounted_day = None
        accounted_yesterday = None

    if last_accounted_day == today:
        return {'message':'no days to account for'}
    elif last_accounted_day != None:
        initial_day = last_accounted_day + timedelta(days=1)
    elif last_accounted_day == None:
        initial_day = all_payments.earliest('created_at').created_at.date()

    
    day = initial_day
    result = {}
    while day <= today:
        day_payments = all_payments.filter(created_at__gte=day,created_at__lte=day+timedelta(days=1))
        day_onchain_payments = OnchainPayment.objects.filter(created_at__gte=day,created_at__lte=day+timedelta(days=1))
        day_ticks = all_ticks.filter(timestamp__gte=day,timestamp__lte=day+timedelta(days=1))

        # Coarse accounting based on LNpayment and OnchainPayment objects
        contracted = day_ticks.aggregate(Sum('volume'))['volume__sum']
        num_contracts = day_ticks.count()
        inflow = day_payments.filter(type=LNPayment.Types.HOLD,status=LNPayment.Status.SETLED).aggregate(Sum('num_satoshis'))['num_satoshis__sum']
        outflow = day_payments.filter(type=LNPayment.Types.NORM,status=LNPayment.Status.SUCCED).aggregate(Sum('num_satoshis'))['num_satoshis__sum'] + day_onchain_payments.filter(status__in=[OnchainPayment.Status.MEMPO,OnchainPayment.Status.CONFI]).aggregate(Sum('sent_satoshis'))['sent_satoshis__sum']
        routing_fees = day_payments.filter(type=LNPayment.Types.NORM,status=LNPayment.Status.SUCCED).aggregate(Sum('fee'))['fee__sum']
        mining_fees = day_onchain_payments.filter(status__in=[OnchainPayment.Status.MEMPO,OnchainPayment.Status.CONFI]).aggregate(Sum('mining_fee_sats'))['mining_fee_sats__sum']
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
            inflow = inflow, 
            outflow = outflow,
            routing_fees = routing_fees,
            mining_fees = mining_fees,
            cashflow = inflow - outflow - routing_fees,
            rewards_claimed = rewards_claimed,
            )
        
        # Fine Net Daily accounting based on orders
        # Only account for orders where everything worked out right
        payouts = day_payments.filter(type=LNPayment.Types.NORM,concept=LNPayment.Concepts.PAYBUYER, status=LNPayment.Status.SUCCED)
        escrows_settled = 0
        payouts_paid = 0
        routing_cost = 0
        for payout in payouts:
            escrows_settled += payout.order_paid_LN.trade_escrow.num_satoshis
            payouts_paid += payout.num_satoshis
            routing_cost += payout.fee
        
        # Same for orders that use onchain payments.
        payouts_tx = day_onchain_payments.filter(status__in=[OnchainPayment.Status.MEMPO,OnchainPayment.Status.CONFI])
        escrows_settled = 0
        payouts_tx_paid = 0
        mining_cost = 0
        for payout_tx in payouts_tx:
            escrows_settled += payout_tx.order_paid_TX.trade_escrow.num_satoshis
            payouts_tx_paid += payout_tx.sent_satoshis
            mining_cost += payout_tx.fee


        # account for those orders where bonds were lost
        # + Settled bonds / bond_split
        bonds_settled = day_payments.filter(type=LNPayment.Types.HOLD,concept__in=[LNPayment.Concepts.TAKEBOND,LNPayment.Concepts.MAKEBOND], status=LNPayment.Status.SETLED)

        if len(bonds_settled) > 0:
            collected_slashed_bonds = (bonds_settled.aggregate(Sum('num_satoshis'))['num_satoshis__sum'])* float(config('SLASHED_BOND_REWARD_SPLIT'))
        else:
            collected_slashed_bonds = 0
        
        accounted_day.net_settled = escrows_settled + collected_slashed_bonds
        accounted_day.net_paid = payouts_paid + routing_cost
        accounted_day.net_balance = float(accounted_day.net_settled) - float(accounted_day.net_paid)

        # Differential accounting based on change of outstanding states and disputes unreslved
        if day == today:
            pending_disputes = Order.objects.filter(status__in=[Order.Status.DIS,Order.Status.WFR])
            if len(pending_disputes) > 0:
                outstanding_pending_disputes = 0
                for order in pending_disputes:
                    outstanding_pending_disputes += order.payout.num_satoshis
            else:
                outstanding_pending_disputes = 0

            accounted_day.outstanding_earned_rewards = Profile.objects.all().aggregate(Sum('earned_rewards'))['earned_rewards__sum']
            accounted_day.outstanding_pending_disputes = outstanding_pending_disputes
            accounted_day.lifetime_rewards_claimed = Profile.objects.all().aggregate(Sum('claimed_rewards'))['claimed_rewards__sum']
            if accounted_yesterday != None:
                accounted_day.earned_rewards = accounted_day.outstanding_earned_rewards - accounted_yesterday.outstanding_earned_rewards
                accounted_day.disputes = outstanding_pending_disputes - accounted_yesterday.outstanding_earned_rewards 

        # Close the loop
        accounted_day.save()
        accounted_yesterday = accounted_day
        result[str(day)]={'contracted':contracted,'inflow':inflow,'outflow':outflow}
        day = day + timedelta(days=1)

    return result

@shared_task(name="compute_node_balance", ignore_result=True)
def compute_node_balance():
    '''
    Queries LND for channel and wallet balance
    '''

    from control.models import BalanceLog
    BalanceLog.objects.create()
    
    return
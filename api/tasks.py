from asgiref.sync import async_to_sync
from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded


@shared_task(name="users_cleansing", time_limit=600)
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
        # Try an except, due to unknown cause for users lacking robots.
        try:
            if (
                user.robot.earned_rewards > 0
                or user.robot.claimed_rewards > 0
                or user.robot.telegram_enabled is True
            ):
                continue
            if not user.robot.total_contracts == 0:
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


@shared_task(name="follow_send_payment", time_limit=180, soft_time_limit=175)
def follow_send_payment(hash):
    """Sends sats to buyer, continuous update"""

    from datetime import timedelta

    from decouple import config
    from django.utils import timezone

    from api.lightning.node import LNNode
    from api.models import LNPayment

    if config("DEBUG_PERMISSIONED_PAYOUTS", cast=bool, default=False):
        return

    lnpayment = LNPayment.objects.get(payment_hash=hash)
    lnpayment.last_routing_time = timezone.now()
    lnpayment.save(update_fields=["last_routing_time"])

    # Default is 0ppm. Set by the user over API. Client's default is 1000 ppm.
    fee_limit_sat = int(
        float(lnpayment.num_satoshis) * float(lnpayment.routing_budget_ppm) / 1_000_000
    )
    timeout_seconds = config("PAYOUT_TIMEOUT_SECONDS", cast=int, default=90)
    try:
        results = LNNode.follow_send_payment(lnpayment, fee_limit_sat, timeout_seconds)

    except SoftTimeLimitExceeded:
        # If the 175 seconds have been consumed without follow_send_payment()
        # returning, we set the last routing time as 'in 10 minutes'
        # so the next check happens in 10 minutes, instead of right now.
        lnpayment.last_routing_time = timezone.now() + timedelta(minutes=10)
        lnpayment.save(update_fields=["last_routing_time"])
        print(
            f"Order: {lnpayment.order_paid_LN.id} SOFT TIME LIMIT REACHED. Hash: {hash}"
        )
        results = {}

    return results


@shared_task(name="send_devfund_donation", time_limit=300, soft_time_limit=295)
def send_devfund_donation(order_id, proceeds, reason):
    """Sends a fraction of order.proceeds via keysend as
    donation to the RoboSats Open Source project devfund.
    """
    from decouple import config
    from django.contrib.auth.models import User

    from api.lightning.node import LNNode
    from api.models import LNPayment, Order
    from api.utils import get_devfund_pubkey

    target_pubkey = get_devfund_pubkey(config("NETWORK", cast=str))

    order = Order.objects.get(id=order_id)
    coordinator_alias = config("COORDINATOR_ALIAS", cast=str, default="NoAlias")
    donation_fraction = min(1.0, max(0.00, config("DEVFUND", cast=float, default=0.2)))
    message = f"Devfund donation; {coordinator_alias}; {order}; {donation_fraction}; {reason};"
    num_satoshis = int(proceeds * donation_fraction)
    routing_budget_sats = int(max(5, num_satoshis * 0.000_1))
    timeout = 280
    sign = False

    valid, keysend_payment = LNNode.send_keysend(
        target_pubkey, message, num_satoshis, routing_budget_sats, timeout, sign
    )
    if not valid:
        return False

    lnpayment = LNPayment.objects.create(
        concept=LNPayment.Concepts.DEVDONAT,
        type=LNPayment.Types.KEYS,
        sender=User.objects.get(
            username=config("ESCROW_USERNAME", cast=str, default="admin")
        ),
        invoice=f"Target pubkey: {target_pubkey}; At: {keysend_payment['created_at']}",
        routing_budget_sats=routing_budget_sats,
        description=message,
        num_satoshis=num_satoshis,
        order_donated=order,
        **keysend_payment,
    )

    order.log(
        f"Development fund donation LNPayment({lnpayment.payment_hash},{str(lnpayment)}) was made via keysend for {num_satoshis} Sats"
    )
    return True


@shared_task(name="payments_cleansing", time_limit=600)
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


@shared_task(
    name="cache_external_market_prices",
    ignore_result=True,
    time_limit=120,
    soft_time_limit=115,
)
def cache_market():
    import math

    from django.utils import timezone

    from .models import Currency
    from .utils import get_exchange_rates

    currency_codes = list(Currency.currency_dict.values())

    try:
        exchange_rates = get_exchange_rates(currency_codes)

        if not exchange_rates:
            return

        results = {}
        for i in range(
            len(Currency.currency_dict.values())
        ):  # currencies are indexed starting at 1 (USD)
            rate = exchange_rates[i]
            results[i] = {currency_codes[i], rate}

            # Do not update if no new rate was found
            if math.isnan(rate):
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

    except SoftTimeLimitExceeded:
        print("SOFT LIMIT REACHED. Could not fetch current external market prices.")
        return

@shared_task(name="", ignore_result=True, time_limit=120)
def nostr_send_order_event(order_id=None):
    if order_id:
        from api.models import Order
        from api.nostr import Nostr

        order = Order.objects.get(id=order_id)

        nostr = Nostr()
        async_to_sync(nostr.send_order_event)(order)

    return

@shared_task(name="send_chat_notification", ignore_result=True, time_limit=120)
def send_chat_notification(message_id=None, order_id=None):
    if message_id and order_id:
        from api.models import Order
        from chat.models import Message
        from api.notifications import Notifications

        order = Order.objects.get(id=order_id)
        chat_message = Message.objects.get(id=message_id)
        notifications = Notifications()

        notifications.new_chat_message(order, chat_message)


@shared_task(name="send_telegram_notification", ignore_result=True, time_limit=120)
def send_telegram_notification(chat_id=None, message=None):
    if chat_id:
        from api.notifications import Notifications

        notifications = Notifications()

        notifications.send_telegram_message(chat_id, message)


@shared_task(name="send_status_notification", ignore_result=True, time_limit=120)
def send_status_notification(order_id=None, status=None):
    if order_id:
        from api.models import Order
        from api.notifications import Notifications

        order = Order.objects.get(id=order_id)
        notifications = Notifications()

        if status == Order.Status.EXP:
            notifications.order_expired_untaken(order)

        elif status == Order.Status.PAY or status == Order.Status.SUC:
            notifications.trade_successful(order)

        elif status == Order.Status.UCA:
            notifications.public_order_cancelled(order)

        elif status == Order.Status.PUB:
            notifications.order_published(order)

        elif status == Order.Status.WF2:
            notifications.order_taken_confirmed(order)

        elif status == Order.Status.CHA:
            notifications.fiat_exchange_starts(order)

        elif status == Order.Status.DIS:
            notifications.dispute_opened(order)

        elif status == Order.Status.CCA:
            notifications.collaborative_cancelled(order)

        elif status == Order.Status.TLD or status == Order.Status.MLD:
            notifications.dispute_closed(order)

        elif status == Order.Status.FAI:
            notifications.lightning_failed(order)

        else:
            notifications.status_change(order)

    return

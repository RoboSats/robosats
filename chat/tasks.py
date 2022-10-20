from celery import shared_task


@shared_task(name="chatrooms_cleansing")
def chatrooms_cleansing():
    """
    Deletes chatrooms and encrypted messages of orders
    that have completely finished more than 3 days ago.
    """

    from api.models import Order
    from chat.models import ChatRoom
    from datetime import timedelta
    from django.utils import timezone

    finished_states = [
        Order.Status.SUC,
        Order.Status.TLD,
        Order.Status.MLD,
        Order.Status.CCA,
        Order.Status.UCA,
    ]

    # Orders that have expired more than 3 days ago
    # Usually expiry takes place 1 day after a finished order. So, ~4 days
    # until encrypted messages are deleted.
    finished_time = timezone.now() - timedelta(days=3)
    queryset = Order.objects.filter(
        status__in=finished_states, expires_at__lt=finished_time
    )

    # And do not have an active trade, any past contract or any reward.
    deleted_chatrooms = []
    for order in queryset:
        # Try an except. In case some chatroom is already missing.
        try:
            chatroom = ChatRoom.objects.get(id=order.id)
            deleted_chatrooms.append(str(chatroom))
            chatroom.delete()
        except:
            pass

    results = {
        "num_deleted": len(deleted_chatrooms),
        "deleted_chatrooms": deleted_chatrooms,
    }
    return results

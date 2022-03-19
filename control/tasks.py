from celery import shared_task
from api.models import Order, LNPayment, Profile

@shared_task(name="do_accounting")
def do_accounting():
    return
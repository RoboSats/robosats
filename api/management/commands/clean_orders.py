import time

from django.core.management.base import BaseCommand
from django.utils import timezone

from api.logics import Logics
from api.models import Order


class Command(BaseCommand):
    help = "Follows all active orders and make them expire if needed."

    do_nothing = [
        Order.Status.UCA,
        Order.Status.EXP,
        Order.Status.DIS,
        Order.Status.CCA,
        Order.Status.PAY,
        Order.Status.SUC,
        Order.Status.FAI,
        Order.Status.MLD,
        Order.Status.TLD,
        Order.Status.WFR,
    ]

    def clean_orders(self):
        """Continuously checks order expiration times. If order
        has expires, it calls the logics module for expiration handling."""

        queryset = Order.objects.exclude(status__in=self.do_nothing)
        queryset = queryset.filter(
            expires_at__lt=timezone.now()
        )  # expires at lower than now

        debug = {}
        debug["num_expired_orders"] = len(queryset)
        debug["expired_orders"] = []
        debug["failed_order_expiry"] = []
        debug["reason_failure"] = []

        for idx, order in enumerate(queryset):
            context = str(order) + " was " + Order.Status(order.status).label
            try:
                if Logics.order_expires(order):  # Order send to expire here
                    debug["expired_orders"].append({idx: context})

            # It should not happen, but if it cannot locate the hold invoice
            # it probably was cancelled by another thread, make it expire anyway.
            except Exception as e:
                debug["failed_order_expiry"].append({idx: context})
                debug["reason_failure"].append({idx: str(e)})

                if "unable to locate invoice" in str(e):
                    self.stdout.write(str(e))
                    order.update_status(Order.Status.EXP)
                    debug["expired_orders"].append({idx: context})

        if debug["num_expired_orders"] > 0:
            self.stdout.write(str(timezone.now()))
            self.stdout.write(str(debug))

    def handle(self, *args, **options):
        """Never mind database locked error, keep going, print them out.
        Not an issue with PostgresQL"""
        try:
            while True:
                self.clean_orders()
                time.sleep(5)

        except Exception as e:
            if "database is locked" in str(e):
                self.stdout.write("database is locked")

            self.stdout.write(str(e))

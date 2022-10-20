from django.core.management.base import BaseCommand, CommandError

import time
from api.models import Order
from api.logics import Logics
from django.utils import timezone


class Command(BaseCommand):
    help = "Follows all active hold invoices"

    # def add_arguments(self, parser):
    #     parser.add_argument('debug', nargs='+', type=boolean)

    def clean_orders(self, *args, **options):
        """Continuously checks order expiration times for 1 hour. If order
        has expires, it calls the logics module for expiration handling."""

        # TODO handle 'database is locked'

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

        while True:
            time.sleep(5)

            queryset = Order.objects.exclude(status__in=do_nothing)
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
                        order.status = Order.Status.EXP
                        order.save()
                        debug["expired_orders"].append({idx: context})

            if debug["num_expired_orders"] > 0:
                self.stdout.write(str(timezone.now()))
                self.stdout.write(str(debug))

    def handle(self, *args, **options):
        """Never mind database locked error, keep going, print them out"""
        try:
            self.clean_orders()
        except Exception as e:
            if "database is locked" in str(e):
                self.stdout.write("database is locked")

            self.stdout.write(str(e))

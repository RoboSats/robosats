import time
from datetime import timedelta

from decouple import config
from django.core.management.base import BaseCommand
from django.utils import timezone

from api.lightning.node import LNNode
from api.logics import Logics
from api.models import LNPayment, OnchainPayment, Order
from api.tasks import follow_send_payment, send_notification


def is_same_status(a: LNPayment.Status, b: LNPayment.Status) -> bool:
    """
    Returns whether the state of two lnpayments is the same.
    LNpayment status can be either Cancelled or Returned. For LND these two are the same (Cancelled).
    """
    cancel = LNPayment.Status.CANCEL
    retned = LNPayment.Status.RETNED
    return a == b or cancel in (a, b) and retned in (a, b)


class Command(BaseCommand):
    help = "Follows all active hold invoices, sends out payments"
    rest = 5  # seconds between consecutive checks for invoice updates

    def handle(self, *args, **options):
        """Infinite loop to check invoices and retry payments.
        ever mind database locked error, keep going, print out"""

        while True:
            time.sleep(self.rest)

            try:
                self.follow_hold_invoices()
            except Exception as e:
                self.stderr.write(str(e))
            try:
                self.send_payments()
            except Exception as e:
                self.stderr.write(str(e))

    def is_same_status(a: LNPayment.Status, b: LNPayment.Status) -> bool:
        """
        Returns whether the state of two lnpayments is the same.
        LNpayment status can be either Cancelled or Returned. For LND these two are the same (Cancelled).
        """
        cancel = LNPayment.Status.CANCEL
        retned = LNPayment.Status.RETNED
        return a == b or cancel in (a, b) and retned in (a, b)

    def follow_hold_invoices(self):
        """Follows and updates LNpayment objects
        until settled or canceled

        LND Background: SubscribeInvoices stub iterator would be great to use here.
        However, it only sends updates when the invoice is OPEN (new) or SETTLED.
        We are very interested on the other two states (CANCELLED and ACCEPTED).
        Therefore, this thread (follow_invoices) will iterate over all LNpayments in
        INVGEN / LOCKED status and do InvoiceLookupV2 every X seconds to update their status.
        """

        # time it for debugging
        t0 = time.time()

        queryset = LNPayment.objects.filter(
            type=LNPayment.Types.HOLD,
            status__in=[LNPayment.Status.INVGEN, LNPayment.Status.LOCKED],
        )

        generated_invoices = queryset.filter(
            status=LNPayment.Status.INVGEN,
        )

        old_locked_invoices = queryset.filter(
            status=LNPayment.Status.LOCKED,
            created_at__lt=timezone.now() - timedelta(hours=48),
        )

        invoices_to_lookup = generated_invoices | old_locked_invoices

        debug = {}
        debug["num_active_invoices"] = len(invoices_to_lookup)
        debug["invoices"] = []
        at_least_one_changed = False

        for idx, hold_lnpayment in enumerate(invoices_to_lookup):
            old_status = hold_lnpayment.status

            new_status, expiry_height = LNNode.lookup_invoice_status(hold_lnpayment)

            # Only save the hold_payments that change (otherwise this function does not scale)
            changed = not old_status == new_status

            if changed:
                # there might be a few miliseconds to a full second delay when looping over many
                # invoices. We make sure the lnpayment status has not been changed already by re-reading
                # from DB.
                lnpayment = LNPayment.objects.get(
                    payment_hash=hold_lnpayment.payment_hash
                )  # re-read
                if is_same_status(lnpayment.status, new_status):
                    continue

                # if these are still different, we update the lnpayment with its new status.
                lnpayment.status = new_status
                lnpayment.expiry_height = expiry_height
                self.update_order_status(lnpayment)
                lnpayment.save(update_fields=["status", "expiry_height"])

                # Report for debugging
                old = LNPayment.Status(old_status).label
                new = LNPayment.Status(lnpayment.status).label
                debug["invoices"].append(
                    {
                        idx: {
                            "payment_hash": str(lnpayment.payment_hash),
                            "old_status": old,
                            "new_status": new,
                        }
                    }
                )

            at_least_one_changed = at_least_one_changed or changed

        debug["time"] = time.time() - t0

        if at_least_one_changed:
            self.stdout.write(str(timezone.now()))
            self.stdout.write(str(debug))

    def send_payments(self):
        """
        Checks for invoices and onchain payments that are due to be paid.
        Sends the payments.
        """
        self.send_ln_payments()
        self.send_onchain_payments()

    def send_ln_payments(self):
        """
        Checks for invoices that are due to pay; i.e., INFLIGHT status and 0 routing_attempts.
        Checks if any payment is due for retry, and tries to pay it.
        """

        queryset = LNPayment.objects.filter(
            type=LNPayment.Types.NORM,
            status__in=[LNPayment.Status.FAILRO, LNPayment.Status.FLIGHT],
        )

        new_invoices_to_pay = queryset.filter(
            status=LNPayment.Status.FLIGHT,
            in_flight=False,
            routing_attempts=0,
        )

        retry_invoices = queryset.filter(
            status=LNPayment.Status.FAILRO,
            in_flight=False,
            routing_attempts__in=[1, 2],
            last_routing_time__lt=(
                timezone.now() - timedelta(minutes=int(config("RETRY_TIME")))
            ),
        )

        # Payments that still have the in_flight flag whose last payment attempt was +3 min ago
        # are probably stuck. We retry them. The follow_send_invoice() task can also do TrackPaymentV2 if the
        # previous attempt is still ongoing
        stuck_invoices = queryset.filter(
            in_flight=True,
            last_routing_time__lt=(timezone.now() - timedelta(minutes=3)),
        )

        invoices_to_pay = stuck_invoices | retry_invoices | new_invoices_to_pay

        for lnpayment in invoices_to_pay:
            # Checks that this onchain payment is part of an order with a settled escrow
            if not hasattr(lnpayment, "order_paid_LN"):
                self.stderr.write(f"Ln payment {str(lnpayment)} has no parent order!")
                return
            order = lnpayment.order_paid_LN
            if (
                order.trade_escrow.status == LNPayment.Status.SETLED
                and order.is_swap is False
            ):
                follow_send_payment.delay(lnpayment.payment_hash)

    def send_onchain_payments(self):
        queryset = OnchainPayment.objects.filter(
            status=OnchainPayment.Status.QUEUE,
            broadcasted=False,
        )

        for onchainpayment in queryset:
            # Checks that this onchain payment is part of an order with a settled escrow
            if not hasattr(onchainpayment, "order_paid_TX"):
                self.stderr.write(
                    f"Onchain payment {str(onchainpayment)} has no parent order!"
                )
                return
            order = onchainpayment.order_paid_TX
            if (
                order.trade_escrow.status == LNPayment.Status.SETLED
                and order.trade_escrow.num_satoshis >= onchainpayment.num_satoshis
                and order.is_swap is True
            ):
                # Sends out onchainpayment
                LNNode.pay_onchain(
                    onchainpayment,
                    OnchainPayment.Status.QUEUE,
                    OnchainPayment.Status.MEMPO,
                )

            else:
                self.stderr.write(
                    f"Onchain payment {str(onchainpayment)} for order {str(order)} escrow is not settled!"
                )

    def update_order_status(self, lnpayment):
        """Background process following LND hold invoices
        can catch LNpayments changing status. If they do,
        the order status might have to change too."""

        # If the LNPayment goes to LOCKED (ACCEPTED)
        if lnpayment.status == LNPayment.Status.LOCKED:
            try:
                # It is a maker bond => Publish order.
                if hasattr(lnpayment, "order_made"):
                    self.stderr.write("Updating order with new Locked bond from maker")
                    lnpayment.order_made.log("Maker bond <b>locked</b>")
                    Logics.publish_order(lnpayment.order_made)
                    send_notification.delay(
                        order_id=lnpayment.order_made.id, message="order_published"
                    )
                    return

                # It is a taker bond
                elif hasattr(lnpayment, "take_order"):
                    if lnpayment.take_order.order.status == Order.Status.PUB:
                        # It there was no other taker already locked => close contract.
                        self.stderr.write(
                            "Updating order with new Locked bond from taker"
                        )
                        lnpayment.take_order.order.log("Taker bond <b>locked</b>")
                        Logics.finalize_contract(lnpayment.take_order)
                    else:
                        # It there was another taker already locked => cancel bond.
                        self.stderr.write(
                            "Expiring take_order because order was already taken"
                        )
                        lnpayment.take_order.order.log(
                            "Another taker bond is already locked, <b>Cancelling</b>"
                        )
                        Logics.take_order_expires(lnpayment.take_order)

                    return

                # It is a trade escrow => move foward order status.
                elif hasattr(lnpayment, "order_escrow"):
                    self.stderr.write("Updating order with new Locked escrow")
                    lnpayment.order_escrow.log("Trade escrow <b>locked</b>")
                    Logics.trade_escrow_received(lnpayment.order_escrow)
                    return

                # A locked invoice that has no order attached is an inconsistency (must be due to internal error).
                # This has been rarely observed in the experimental coordinator, but the invoice must be cancelled otherwise
                # it will take until CLTV expiry height to unlock (risking force closure).
                else:
                    self.stderr.write(
                        f"Weird! bond with hash {lnpayment.payment_hash} was locked, yet it is not related to any order. It will be instantly cancelled."
                    )
                    if LNNode.cancel_return_hold_invoice(lnpayment.payment_hash):
                        lnpayment.status = LNPayment.Status.RETNED
                        lnpayment.save(update_fields=["status"])
                    return

            except Exception as e:
                self.stderr.write(
                    f"Exception when handling newly LOCKED invoice with hash {lnpayment.payment_hash}: {str(e)}"
                )

        # If the LNPayment goes to CANCEL from INVGEN, the invoice had expired
        # If it goes to CANCEL from LOCKED the bond was unlocked. Order had expired in both cases.
        # Testing needed for end of time trades!
        elif lnpayment.status == LNPayment.Status.CANCEL:
            if hasattr(lnpayment, "order_made"):
                self.stderr.write("Expiting order with cancelled payent from maker")
                Logics.order_expires(lnpayment.order_made)
                return

            elif hasattr(lnpayment, "take_order"):
                self.stderr.write(
                    "Expiting order and take orders with cancelled payent from taker"
                )
                Logics.take_order_expires(lnpayment.take_order)
                return

            elif hasattr(lnpayment, "order_escrow"):
                self.stderr.write("Expiting order with cancelled escrow")
                Logics.order_expires(lnpayment.order_escrow)
                return

            elif hasattr(lnpayment, "order_taken"):
                self.stderr.write("Expiting order with cancelled escrow")
                Logics.order_expires(lnpayment.order_taken)
                return

        # TODO If a lnpayment goes from LOCKED to INVGEN. Totally weird
        # halt the order
        elif lnpayment.status == LNPayment.Status.INVGEN:
            pass

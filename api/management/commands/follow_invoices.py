import time
from base64 import b64decode
from datetime import timedelta

from decouple import config
from django.core.management.base import BaseCommand
from django.utils import timezone

from api.lightning.node import LNNode
from api.logics import Logics
from api.models import LNPayment, OnchainPayment, Order
from api.tasks import follow_send_payment, send_notification

MACAROON = b64decode(config("LND_MACAROON_BASE64"))


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
                self.stdout.write(str(e))
            try:
                self.send_payments()
            except Exception as e:
                self.stdout.write(str(e))

    def follow_hold_invoices(self):
        """Follows and updates LNpayment objects
        until settled or canceled

        Background: SubscribeInvoices stub iterator would be great to use here.
        However, it only sends updates when the invoice is OPEN (new) or SETTLED.
        We are very interested on the other two states (CANCELLED and ACCEPTED).
        Therefore, this thread (follow_invoices) will iterate over all LNpayment
        objects and do InvoiceLookupV2 every X seconds to update their state 'live'
        """

        lnd_state_to_lnpayment_status = {
            0: LNPayment.Status.INVGEN,  # OPEN
            1: LNPayment.Status.SETLED,  # SETTLED
            2: LNPayment.Status.CANCEL,  # CANCELLED
            3: LNPayment.Status.LOCKED,  # ACCEPTED
        }

        stub = LNNode.invoicesstub

        # time it for debugging
        t0 = time.time()
        queryset = LNPayment.objects.filter(
            type=LNPayment.Types.HOLD,
            status__in=[LNPayment.Status.INVGEN, LNPayment.Status.LOCKED],
        )

        debug = {}
        debug["num_active_invoices"] = len(queryset)
        debug["invoices"] = []
        at_least_one_changed = False

        for idx, hold_lnpayment in enumerate(queryset):
            old_status = LNPayment.Status(hold_lnpayment.status).label
            try:
                # this is similar to LNNnode.validate_hold_invoice_locked
                request = LNNode.invoicesrpc.LookupInvoiceMsg(
                    payment_hash=bytes.fromhex(hold_lnpayment.payment_hash)
                )
                response = stub.LookupInvoiceV2(
                    request, metadata=[("macaroon", MACAROON.hex())]
                )
                hold_lnpayment.status = lnd_state_to_lnpayment_status[response.state]

                # try saving expiry height
                if hasattr(response, "htlcs"):
                    try:
                        hold_lnpayment.expiry_height = response.htlcs[0].expiry_height
                    except Exception:
                        pass

            except Exception as e:
                # If it fails at finding the invoice: it has been canceled.
                # In RoboSats DB we make a distinction between cancelled and returned (LND does not)
                if "unable to locate invoice" in str(e):
                    self.stdout.write(str(e))
                    hold_lnpayment.status = LNPayment.Status.CANCEL

                # LND restarted.
                if "wallet locked, unlock it" in str(e):
                    self.stdout.write(str(timezone.now()) + " :: Wallet Locked")
                # Other write to logs
                else:
                    self.stdout.write(str(e))

            new_status = LNPayment.Status(hold_lnpayment.status).label

            # Only save the hold_payments that change (otherwise this function does not scale)
            changed = not old_status == new_status
            if changed:
                # self.handle_status_change(hold_lnpayment, old_status)
                self.update_order_status(hold_lnpayment)
                hold_lnpayment.save()

                # Report for debugging
                new_status = LNPayment.Status(hold_lnpayment.status).label
                debug["invoices"].append(
                    {
                        idx: {
                            "payment_hash": str(hold_lnpayment.payment_hash),
                            "old_status": old_status,
                            "new_status": new_status,
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
            status=LNPayment.Status.FLIGHT,
            in_flight=False,
            routing_attempts=0,
        )

        queryset_retries = LNPayment.objects.filter(
            type=LNPayment.Types.NORM,
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
        queryset_stuck = LNPayment.objects.filter(
            type=LNPayment.Types.NORM,
            status__in=[LNPayment.Status.FAILRO, LNPayment.Status.FLIGHT],
            in_flight=True,
            last_routing_time__lt=(timezone.now() - timedelta(minutes=3)),
        )

        queryset = queryset.union(queryset_retries).union(queryset_stuck)

        for lnpayment in queryset:
            # Checks that this onchain payment is part of an order with a settled escrow
            if not hasattr(lnpayment, "order_paid_LN"):
                self.stdout.write(f"Ln payment {str(lnpayment)} has no parent order!")
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
                self.stdout.write(
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
                onchainpayment.save()

            else:
                self.stdout.write(
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
                    Logics.publish_order(lnpayment.order_made)
                    send_notification.delay(
                        order_id=lnpayment.order_made.id, message="order_published"
                    )
                    return

                # It is a taker bond => close contract.
                elif hasattr(lnpayment, "order_taken"):
                    if lnpayment.order_taken.status == Order.Status.TAK:
                        Logics.finalize_contract(lnpayment.order_taken)
                        return

                # It is a trade escrow => move foward order status.
                elif hasattr(lnpayment, "order_escrow"):
                    Logics.trade_escrow_received(lnpayment.order_escrow)
                    return

            except Exception as e:
                self.stdout.write(str(e))

        # If the LNPayment goes to CANCEL from INVGEN, the invoice had expired
        # If it goes to CANCEL from LOCKED the bond was unlocked. Order had expired in both cases.
        # Testing needed for end of time trades!
        if lnpayment.status == LNPayment.Status.CANCEL:
            if hasattr(lnpayment, "order_made"):
                Logics.order_expires(lnpayment.order_made)
                return

            elif hasattr(lnpayment, "order_taken"):
                Logics.order_expires(lnpayment.order_taken)
                return

            elif hasattr(lnpayment, "order_escrow"):
                Logics.order_expires(lnpayment.order_escrow)
                return

        # TODO If a lnpayment goes from LOCKED to INVGEN. Totally weird
        # halt the order
        if lnpayment.status == LNPayment.Status.INVGEN:
            pass

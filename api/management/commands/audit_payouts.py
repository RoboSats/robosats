import re
from collections import defaultdict

from django.core.management.base import BaseCommand
from django.db.models import Sum

from api.lightning.node import LNNode
from api.models import LNPayment, Order, Robot

REWARDED = re.compile(r"Robot\((\d+),[^)]*\) was rewarded (\d+) Sats")
RETURNED = re.compile(r"Robot\((\d+),[^)]*\) was returned (\d+) Sats")


class Command(BaseCommand):
    help = (
        "Read-only audit of past rewards and payouts against the payout safety rules: "
        "rewards credited more than once per order, rewards whose slashed bond LND does "
        "not show as settled, robots that withdrew more than they were ever credited, "
        "and buyer payouts not covered by a settled escrow. Changes nothing."
    )

    def add_arguments(self, parser):
        parser.add_argument("--no-lnd", action="store_true", help="skip the LND lookups")

    def handle(self, *args, **options):
        lnd = not options["no_lnd"]
        problems = 0
        credited = defaultdict(int)

        def report(text):
            nonlocal problems
            problems += 1
            self.stdout.write(f"  - {text}")

        self.stdout.write("Rewards credited from slashed bonds:")
        for order in Order.objects.filter(logs__contains="was rewarded").order_by("id"):
            rewards = REWARDED.findall(order.logs)
            if len(rewards) > 1:
                total = sum(int(s) for _, s in rewards)
                report(f"order {order.id}: rewarded {len(rewards)} times ({total} sats in all)")
            # Only the first credit per order counts as legitimate.
            robot, sats = rewards[0]
            credited[int(robot)] += int(sats)
            returned = RETURNED.findall(order.logs)
            if returned:
                credited[int(returned[0][0])] += int(returned[0][1])
            if lnd:
                for bond in (order.maker_bond, order.taker_bond):
                    if bond is None or bond.status != LNPayment.Status.SETLED:
                        continue
                    try:
                        ok = LNNode.double_check_htlc_is_settled(bond.payment_hash)
                    except Exception as e:
                        ok = None
                        report(f"order {order.id}: could not look up bond {bond.payment_hash} ({e})")
                    if ok is False:
                        report(f"order {order.id}: bond {bond.payment_hash} is SETTLED in the database but not in LND")

        self.stdout.write("Reward withdrawals against what was credited (admin credits are not in the logs: check those by hand):")
        withdrawn = (
            LNPayment.objects.filter(concept=LNPayment.Concepts.WITHREWA, status=LNPayment.Status.SUCCED)
            .values("receiver__robot")
            .annotate(sats=Sum("num_satoshis"))
        )
        for row in withdrawn:
            rid = row["receiver__robot"]
            robot = Robot.objects.filter(pk=rid).first()
            balance = robot.earned_rewards if robot else 0
            if row["sats"] + balance > credited[rid] + 100:
                name = robot.user.username if robot else "?"
                report(
                    f"robot {rid} ({name}): withdrew {row['sats']} + holds {balance}, "
                    f"but was credited {credited[rid]} by slashed bonds"
                )

        self.stdout.write("Buyer payouts:")
        for payout in LNPayment.objects.filter(concept=LNPayment.Concepts.PAYBUYER, status=LNPayment.Status.SUCCED):
            order = Order.objects.filter(payout=payout).first()
            if order is None:
                report(f"payout {payout.payment_hash}: paid but no order has it")
                continue
            escrow = order.trade_escrow
            if escrow is None or escrow.status != LNPayment.Status.SETLED:
                report(f"order {order.id}: buyer paid {payout.num_satoshis} without a settled escrow")
            elif escrow.num_satoshis < payout.num_satoshis:
                report(f"order {order.id}: buyer paid {payout.num_satoshis} > escrow {escrow.num_satoshis}")
            elif lnd:
                try:
                    if not LNNode.double_check_htlc_is_settled(escrow.payment_hash):
                        report(f"order {order.id}: escrow is SETTLED in the database but not in LND")
                except Exception as e:
                    report(f"order {order.id}: could not look up the escrow ({e})")

        self.stdout.write(f"{problems} finding(s).")

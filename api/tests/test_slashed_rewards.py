"""
Regression tests for the double-credit exploit patched in the payout-safety branch.

Background
----------
Before the fix, `add_slashed_rewards()` used a plain read-modify-write on
`earned_rewards` with no idempotency guard.  Because `settle_hold_invoice()`
is idempotent on LND/CLN, two concurrent cancel requests both passed through
the slashing path and each credited the full reward, letting an attacker drain
the coordinator via inflated reward withdrawals.

The fix adds a `rewarded_at` timestamp field to `LNPayment` and uses a
conditional ``UPDATE … WHERE rewarded_at IS NULL`` as the credit gate.
Only the first writer wins; subsequent calls are silently ignored.

These tests exercise:

 1. The exact race interleaving from the report (maker cancel WF2, range order).
 2. The taker-cancel mirror path (taker bond slashed, order back to PUB).
 3. Direct double-call of add_slashed_rewards().
 4. Every reward-source-gate rejection path (bond not settled in DB, not settled
    in node, lookup error, wrong bond pair, same-robot bonds, reward > bonds).
 5. Exact reward/slashed_return/proceeds arithmetic.
 6. Concurrent-thread stress test (Postgres row-locking; skipped on SQLite).
"""

import threading
import uuid
from unittest.mock import patch

from django.contrib.auth.models import User
from django.db import connection
from django.test import TestCase, TransactionTestCase
from django.utils import timezone

from api.logics import Logics
from api.models import LNPayment, Order


NOOP_LN = "api.logics.LNNode"
NOOP_DEVFUND = "api.logics.send_devfund_donation"
NOOP_NOSTR = "api.logics.nostr_send_order_event"
NOOP_NOTIFY = "api.logics.send_notification"
NOOP_NOTIFY_MODEL = "api.models.order.send_notification"


# ---------------------------------------------------------------------------
# Shared factory helpers
# ---------------------------------------------------------------------------


def _lnpayment(concept, sender_user, sats, payment_hash=None):
    """Create a minimal LNPayment hold invoice row in the database."""
    now = timezone.now()
    return LNPayment.objects.create(
        type=LNPayment.Types.HOLD,
        concept=concept,
        status=LNPayment.Status.LOCKED,
        payment_hash=payment_hash or uuid.uuid4().hex,
        preimage=uuid.uuid4().hex,
        num_satoshis=sats,
        created_at=now,
        expires_at=now + timezone.timedelta(hours=1),
        sender=sender_user,
    )


def _settle_bond_in_db(bond):
    """Mark a bond as settled in the DB without touching LND."""
    bond.status = LNPayment.Status.SETLED
    bond.save(update_fields=["status"])


def _make_users_with_robots(n):
    """Return n User objects; Robot is auto-created by post_save signal."""
    users = []
    for _ in range(n):
        u = User.objects.create_user(
            username=f"robot_{uuid.uuid4().hex[:8]}", password="x"
        )
        users.append(u)
    return users


def _make_escrow_payment(maker_user):
    """Create a dummy trade-escrow LNPayment so cancel_escrow() doesn't crash."""
    now = timezone.now()
    return LNPayment.objects.create(
        type=LNPayment.Types.HOLD,
        concept=LNPayment.Concepts.TRESCROW,
        status=LNPayment.Status.INVGEN,
        payment_hash=uuid.uuid4().hex,
        preimage=uuid.uuid4().hex,
        num_satoshis=100_000,
        created_at=now,
        expires_at=now + timezone.timedelta(hours=1),
        sender=maker_user,
    )


def _make_order(maker, taker, maker_bond, taker_bond, status=Order.Status.WF2):
    """Create a minimal Order in the given status with bonds attached.

    amount is set explicitly (non-range) so that Order.__str__ never tries
    float(None) inside publish_order's order.log() call.
    trade_escrow is a real row so cancel_escrow() can access .payment_hash.
    """
    now = timezone.now()
    escrow = _make_escrow_payment(maker)
    return Order.objects.create(
        type=Order.Types.BUY,
        status=status,
        created_at=now,
        expires_at=now + timezone.timedelta(hours=2),
        has_range=False,
        amount=100,
        satoshis=100_000,
        t0_satoshis=100_000,
        last_satoshis=100_000,
        maker=maker,
        taker=taker,
        maker_bond=maker_bond,
        taker_bond=taker_bond,
        trade_escrow=escrow,
        bond_size=3,
    )


def _ln_mocks(double_check_settled=True, double_check_raises=False):
    """
    Return side-effect functions for the three LNNode methods used inside
    settle_bond / add_slashed_rewards.

    settle_hold_invoice returns True every call (LND idempotency).
    cancel_return_hold_invoice returns True (return_bond path).
    double_check_htlc_is_settled is controlled by the flags.
    """

    def _settle(_preimage):
        return True

    def _cancel_return(_payment_hash):
        return True

    if double_check_raises:

        def _double_check(_payment_hash):
            raise RuntimeError("node unreachable")

    elif double_check_settled:

        def _double_check(_payment_hash):
            return True

    else:

        def _double_check(_payment_hash):
            return False

    return {
        "settle_hold_invoice": _settle,
        "cancel_return_hold_invoice": _cancel_return,
        "double_check_htlc_is_settled": _double_check,
    }


def _start_full_ln_patches(
    test_case, double_check_settled=True, double_check_raises=False
):
    """Patch all external calls and register cleanup on test_case."""
    mocks = _ln_mocks(double_check_settled, double_check_raises)
    patches = [
        patch(
            f"{NOOP_LN}.settle_hold_invoice", side_effect=mocks["settle_hold_invoice"]
        ),
        patch(
            f"{NOOP_LN}.cancel_return_hold_invoice",
            side_effect=mocks["cancel_return_hold_invoice"],
        ),
        patch(
            f"{NOOP_LN}.double_check_htlc_is_settled",
            side_effect=mocks["double_check_htlc_is_settled"],
        ),
        patch(f"{NOOP_DEVFUND}.delay", return_value=None),
        patch(f"{NOOP_NOSTR}.delay", return_value=None),
        patch(f"{NOOP_NOTIFY}.delay", return_value=None),
        patch(f"{NOOP_NOTIFY_MODEL}.delay", return_value=None),
    ]
    for p in patches:
        p.start()
    test_case.addCleanup(lambda ps=patches: [p.stop() for p in ps])


# ---------------------------------------------------------------------------
# Core exploit regression
# ---------------------------------------------------------------------------


class AddSlashedRewardsIdempotencyTest(TestCase):
    """
    The critical property: no matter how many times add_slashed_rewards is
    called for the same slashed bond, the credit is applied exactly once.
    """

    def test_repeated_maker_cancel_credits_reward_once(self):
        """
        Exploit scenario (range order): maker cancels a WF2 order twice.

        maker_bond = 21 000 sats (range-order maximum bond)
        taker_bond =  6 000 sats (taker took at the minimum)

        First call settles the maker bond and credits the taker.
        Second call arrives with a stale order object still showing WF2 —
        settle_hold_invoice returns True (idempotent LND), but rewarded_at is
        now set, so no second credit is applied.
        """
        maker, taker = _make_users_with_robots(2)
        maker_bond = _lnpayment(LNPayment.Concepts.MAKEBOND, maker, 21_000)
        taker_bond = _lnpayment(LNPayment.Concepts.TAKEBOND, taker, 6_000)
        order = _make_order(maker, taker, maker_bond, taker_bond)

        _start_full_ln_patches(self)

        valid1, _ = Logics.cancel_order(order, maker)
        self.assertTrue(valid1, "First cancel must succeed")

        taker.robot.refresh_from_db()
        reward_after_first = taker.robot.earned_rewards

        order_stale = Order.objects.get(pk=order.pk)
        order_stale.status = Order.Status.WF2

        Logics.cancel_order(order_stale, maker)

        taker.robot.refresh_from_db()
        maker.robot.refresh_from_db()
        maker_bond.refresh_from_db()
        order.refresh_from_db()

        self.assertEqual(
            taker.robot.earned_rewards,
            reward_after_first,
            "earned_rewards must not increase on the second cancel",
        )
        slashed_effective = min(21_000, 6_000)
        self.assertEqual(taker.robot.earned_rewards, int(slashed_effective * 0.5))
        self.assertEqual(maker.robot.earned_rewards, 21_000 - slashed_effective)
        self.assertEqual(order.proceeds, int(slashed_effective * 0.5))
        self.assertIsNotNone(
            maker_bond.rewarded_at, "rewarded_at must be set after first credit"
        )

    def test_repeated_taker_cancel_credits_reward_once(self):
        """
        Mirror: taker cancels a WF2 order twice.
        Taker bond is slashed, maker is rewarded.
        Second cancel must not credit a second reward.

        The stale object simulates a second HTTP request that read the order
        before publish_order() cleared taker/taker_bond on the DB row.  We
        therefore set both fields explicitly on the stale instance so that
        the cancel_order branch condition (order.taker == user) is still
        satisfied, which is the exact race interleaving being tested.
        """
        maker, taker = _make_users_with_robots(2)
        maker_bond = _lnpayment(LNPayment.Concepts.MAKEBOND, maker, 10_000)
        taker_bond = _lnpayment(LNPayment.Concepts.TAKEBOND, taker, 8_000)
        order = _make_order(maker, taker, maker_bond, taker_bond)

        _start_full_ln_patches(self)

        valid1, _ = Logics.cancel_order(order, taker)
        self.assertTrue(valid1)

        maker.robot.refresh_from_db()
        reward_after_first = maker.robot.earned_rewards

        order_stale = Order.objects.get(pk=order.pk)
        order_stale.status = Order.Status.WF2
        order_stale.taker = taker
        order_stale.taker_bond = taker_bond

        Logics.cancel_order(order_stale, taker)

        maker.robot.refresh_from_db()
        taker_bond.refresh_from_db()
        order.refresh_from_db()

        self.assertEqual(maker.robot.earned_rewards, reward_after_first)
        slashed_effective = min(10_000, 8_000)
        self.assertEqual(maker.robot.earned_rewards, int(slashed_effective * 0.5))
        self.assertIsNotNone(taker_bond.rewarded_at)

    def test_add_slashed_rewards_direct_double_call_credits_once(self):
        """
        Direct double-call of add_slashed_rewards: the second call is a no-op.
        """
        maker, taker = _make_users_with_robots(2)
        maker_bond = _lnpayment(LNPayment.Concepts.MAKEBOND, maker, 20_000)
        taker_bond = _lnpayment(LNPayment.Concepts.TAKEBOND, taker, 10_000)
        order = _make_order(maker, taker, maker_bond, taker_bond)
        _settle_bond_in_db(maker_bond)

        _start_full_ln_patches(self)

        Logics.add_slashed_rewards(order, maker_bond, taker_bond)
        Logics.add_slashed_rewards(order, maker_bond, taker_bond)

        taker.robot.refresh_from_db()
        maker.robot.refresh_from_db()
        maker_bond.refresh_from_db()
        order.refresh_from_db()

        slashed_effective = min(20_000, 10_000)
        self.assertEqual(taker.robot.earned_rewards, int(slashed_effective * 0.5))
        self.assertIsNotNone(maker_bond.rewarded_at)


# ---------------------------------------------------------------------------
# Reward source gate (reward_source_problem blocks credit)
# ---------------------------------------------------------------------------


class RewardSourceGateTest(TestCase):
    """
    Every path through reward_source_problem must prevent add_slashed_rewards
    from crediting anything.  rewarded_at must also remain NULL so that a
    legitimate future call can still credit (the gate logs a WARN, not an
    error that permanently marks the bond as rewarded).
    """

    def setUp(self):
        self.maker, self.taker = _make_users_with_robots(2)
        self.maker_bond = _lnpayment(LNPayment.Concepts.MAKEBOND, self.maker, 15_000)
        self.taker_bond = _lnpayment(LNPayment.Concepts.TAKEBOND, self.taker, 10_000)
        self.order = _make_order(
            self.maker, self.taker, self.maker_bond, self.taker_bond
        )
        _settle_bond_in_db(self.maker_bond)

    def _run(
        self,
        slashed=None,
        staked=None,
        double_check_settled=True,
        double_check_raises=False,
    ):
        slashed = slashed if slashed is not None else self.maker_bond
        staked = staked if staked is not None else self.taker_bond
        mocks = _ln_mocks(double_check_settled, double_check_raises)
        with (
            patch(
                f"{NOOP_LN}.double_check_htlc_is_settled",
                side_effect=mocks["double_check_htlc_is_settled"],
            ),
            patch(f"{NOOP_DEVFUND}.delay", return_value=None),
            patch(f"{NOOP_NOSTR}.delay", return_value=None),
            patch(f"{NOOP_NOTIFY}.delay", return_value=None),
            patch(f"{NOOP_NOTIFY_MODEL}.delay", return_value=None),
        ):
            Logics.add_slashed_rewards(self.order, slashed, staked)

    def _assert_no_credit(self):
        self.taker.robot.refresh_from_db()
        self.maker.robot.refresh_from_db()
        self.maker_bond.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(
            self.taker.robot.earned_rewards, 0, "no reward must be credited"
        )
        self.assertEqual(
            self.maker.robot.earned_rewards, 0, "no slashed return must be credited"
        )
        self.assertEqual(self.order.proceeds, 0, "no proceeds must be added")
        self.assertIsNone(
            self.maker_bond.rewarded_at,
            "rewarded_at must stay NULL so a future legitimate call can still credit",
        )

    def test_bond_not_settled_in_db_blocks_credit(self):
        self.maker_bond.status = LNPayment.Status.LOCKED
        self.maker_bond.save(update_fields=["status"])
        self._run()
        self._assert_no_credit()

    def test_node_says_not_settled_blocks_credit(self):
        self._run(double_check_settled=False)
        self._assert_no_credit()

    def test_node_lookup_raises_blocks_credit(self):
        self._run(double_check_raises=True)
        self._assert_no_credit()

    def test_wrong_bond_pair_blocks_credit(self):
        outsider1, outsider2 = _make_users_with_robots(2)
        rogue_bond = _lnpayment(LNPayment.Concepts.MAKEBOND, outsider1, 15_000)
        rogue_staked = _lnpayment(LNPayment.Concepts.TAKEBOND, outsider2, 10_000)
        _settle_bond_in_db(rogue_bond)
        self._run(slashed=rogue_bond, staked=rogue_staked)
        self._assert_no_credit()

    def test_same_robot_both_bonds_blocks_credit(self):
        same_user_bond = _lnpayment(LNPayment.Concepts.TAKEBOND, self.maker, 10_000)
        _settle_bond_in_db(same_user_bond)
        self._run(slashed=self.maker_bond, staked=same_user_bond)
        self._assert_no_credit()

    def test_reward_larger_than_smaller_bond_blocks_credit(self):
        """
        Patch SLASHED_BOND_REWARD_SPLIT to 2.0 (200 %) so reward > bonds.
        The gate must detect this and block the credit.
        """
        mocks = _ln_mocks(True)
        with (
            patch(
                "api.logics.config",
                side_effect=lambda key, **kw: (
                    2.0 if key == "SLASHED_BOND_REWARD_SPLIT" else kw.get("default")
                ),
            ),
            patch(
                f"{NOOP_LN}.double_check_htlc_is_settled",
                side_effect=mocks["double_check_htlc_is_settled"],
            ),
            patch(f"{NOOP_DEVFUND}.delay", return_value=None),
            patch(f"{NOOP_NOSTR}.delay", return_value=None),
            patch(f"{NOOP_NOTIFY}.delay", return_value=None),
            patch(f"{NOOP_NOTIFY_MODEL}.delay", return_value=None),
        ):
            Logics.add_slashed_rewards(self.order, self.maker_bond, self.taker_bond)

        self._assert_no_credit()


# ---------------------------------------------------------------------------
# Reward-math arithmetic
# ---------------------------------------------------------------------------


class RewardMathTest(TestCase):
    """
    Exact reward / slashed_return / proceeds amounts with the default split of
    SLASHED_BOND_REWARD_SPLIT = 0.5.
    """

    def _run_add_rewards(self, slashed_sats, staked_sats):
        maker, taker = _make_users_with_robots(2)
        maker_bond = _lnpayment(LNPayment.Concepts.MAKEBOND, maker, slashed_sats)
        taker_bond = _lnpayment(LNPayment.Concepts.TAKEBOND, taker, staked_sats)
        order = _make_order(maker, taker, maker_bond, taker_bond)
        _settle_bond_in_db(maker_bond)

        _start_full_ln_patches(self)
        Logics.add_slashed_rewards(order, maker_bond, taker_bond)

        taker.robot.refresh_from_db()
        maker.robot.refresh_from_db()
        order.refresh_from_db()
        return taker.robot.earned_rewards, maker.robot.earned_rewards, order.proceeds

    def test_equal_bonds(self):
        reward, slashed_return, proceeds = self._run_add_rewards(10_000, 10_000)
        self.assertEqual(reward, 5_000)
        self.assertEqual(slashed_return, 0)
        self.assertEqual(proceeds, 5_000)

    def test_maker_bond_larger_than_taker_bond(self):
        """Range order: maker bond 21 000, taker bond 6 000 (took minimum)."""
        reward, slashed_return, proceeds = self._run_add_rewards(21_000, 6_000)
        slashed_effective = min(21_000, 6_000)
        self.assertEqual(reward, int(slashed_effective * 0.5))
        self.assertEqual(slashed_return, 21_000 - slashed_effective)
        self.assertEqual(proceeds, int(slashed_effective * 0.5))
        self.assertEqual(reward + slashed_return + proceeds, 21_000)

    def test_taker_bond_larger_than_maker_bond(self):
        reward, slashed_return, proceeds = self._run_add_rewards(8_000, 20_000)
        slashed_effective = min(8_000, 20_000)
        self.assertEqual(reward, int(slashed_effective * 0.5))
        self.assertEqual(slashed_return, 0)
        self.assertEqual(proceeds, int(slashed_effective * 0.5))


# ---------------------------------------------------------------------------
# Concurrent-cancel stress test
# ---------------------------------------------------------------------------


class ConcurrentCancelCreditOnceTest(TransactionTestCase):
    """
    NUM_THREADS threads each fetch the order afresh (simulating distinct HTTP
    workers), forcibly reset its in-memory status to WF2 (the stale-view race
    window), then call cancel_order simultaneously via a barrier.

    Exactly one reward credit must land regardless of interleaving.

    Postgres serializes the conditional UPDATE on rewarded_at at the row level.
    SQLite has no true row-locking so this test is skipped there.
    """

    NUM_THREADS = 6

    def test_concurrent_cancels_credit_once(self):
        if connection.vendor != "postgresql":
            self.skipTest("Row-locking semantics require PostgreSQL")

        maker, taker = _make_users_with_robots(2)
        maker_bond = _lnpayment(LNPayment.Concepts.MAKEBOND, maker, 20_000)
        taker_bond = _lnpayment(LNPayment.Concepts.TAKEBOND, taker, 10_000)
        order = _make_order(maker, taker, maker_bond, taker_bond)

        mocks = _ln_mocks()
        barrier = threading.Barrier(self.NUM_THREADS)
        errors = []

        def _worker():
            try:
                local_order = Order.objects.get(pk=order.pk)
                local_order.status = Order.Status.WF2
                barrier.wait()
                with (
                    patch(
                        f"{NOOP_LN}.settle_hold_invoice",
                        side_effect=mocks["settle_hold_invoice"],
                    ),
                    patch(
                        f"{NOOP_LN}.cancel_return_hold_invoice",
                        side_effect=mocks["cancel_return_hold_invoice"],
                    ),
                    patch(
                        f"{NOOP_LN}.double_check_htlc_is_settled",
                        side_effect=mocks["double_check_htlc_is_settled"],
                    ),
                    patch(f"{NOOP_DEVFUND}.delay", return_value=None),
                    patch(f"{NOOP_NOSTR}.delay", return_value=None),
                    patch(f"{NOOP_NOTIFY}.delay", return_value=None),
                    patch(f"{NOOP_NOTIFY_MODEL}.delay", return_value=None),
                ):
                    Logics.cancel_order(local_order, maker)
            except Exception as exc:
                errors.append(exc)
            finally:
                connection.close()

        threads = [threading.Thread(target=_worker) for _ in range(self.NUM_THREADS)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertFalse(errors, f"Thread errors: {errors}")

        taker.robot.refresh_from_db()
        maker.robot.refresh_from_db()
        maker_bond.refresh_from_db()
        order.refresh_from_db()

        slashed_effective = min(20_000, 10_000)
        self.assertEqual(taker.robot.earned_rewards, int(slashed_effective * 0.5))
        self.assertEqual(maker.robot.earned_rewards, 20_000 - slashed_effective)
        self.assertEqual(order.proceeds, int(slashed_effective * 0.5))
        self.assertIsNotNone(maker_bond.rewarded_at)

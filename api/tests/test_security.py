"""
Unit tests for Tier 1 security fixes.

Covers:
  F1  - taker_wins admin action uses correct (taker) bond amount
  F2  - automatic_dispute_resolution blocks when reverted_fiat_sent=True
  F3  - middleware IntegrityError on nickname collision returns 409
  F4  - is_valid_onion_url rejects non-http schemes and malformed hostnames
  F7  - open_dispute does not set orders_disputes_started to None
"""

from unittest.mock import MagicMock, patch, PropertyMock

from django.test import TestCase, RequestFactory

from api.models.robot import Robot


# ---------------------------------------------------------------------------
# F4 — Robot.is_valid_onion_url (pure function, no DB)
# ---------------------------------------------------------------------------
class TestIsValidOnionUrl(TestCase):
    """Tests for Robot.is_valid_onion_url after the scheme-enforcement fix."""

    # --- VALID URLs ---
    def test_valid_http_onion(self):
        url = "http://exampleonionaddressxxx.onion/webhook"
        self.assertTrue(Robot.is_valid_onion_url(url))

    def test_valid_http_onion_no_path(self):
        url = "http://exampleonionaddressxxx.onion"
        self.assertTrue(Robot.is_valid_onion_url(url))

    def test_valid_http_onion_with_port(self):
        url = "http://exampleonionaddressxxx.onion:8080/webhook"
        self.assertTrue(Robot.is_valid_onion_url(url))

    # --- INVALID: wrong scheme ---
    def test_rejects_https_scheme(self):
        """https is not a valid Tor hidden-service callback scheme."""
        url = "https://exampleonionaddressxxx.onion/webhook"
        self.assertFalse(Robot.is_valid_onion_url(url))

    def test_rejects_ftp_scheme(self):
        url = "ftp://exampleonionaddressxxx.onion/webhook"
        self.assertFalse(Robot.is_valid_onion_url(url))

    def test_rejects_file_scheme(self):
        """file:// scheme could be used for local file reads."""
        url = "file:///etc/passwd.onion"
        self.assertFalse(Robot.is_valid_onion_url(url))

    def test_rejects_ssh_scheme(self):
        url = "ssh://exampleonionaddressxxx.onion"
        self.assertFalse(Robot.is_valid_onion_url(url))

    # --- INVALID: bad hostname ---
    def test_rejects_empty_string(self):
        self.assertFalse(Robot.is_valid_onion_url(""))

    def test_rejects_none(self):
        self.assertFalse(Robot.is_valid_onion_url(None))

    def test_rejects_clearnet_domain(self):
        url = "http://example.com/webhook"
        self.assertFalse(Robot.is_valid_onion_url(url))

    def test_rejects_bare_onion_suffix_only(self):
        """A hostname that is exactly '.onion' (length == len('.onion')) is rejected."""
        url = "http://.onion/webhook"
        self.assertFalse(Robot.is_valid_onion_url(url))

    def test_rejects_double_dot_onion(self):
        """Double-dot tricks like '..onion' are rejected."""
        url = "http://example..onion/webhook"
        self.assertFalse(Robot.is_valid_onion_url(url))

    def test_rejects_non_onion_ending(self):
        url = "http://fakonion.onionx/webhook"
        self.assertFalse(Robot.is_valid_onion_url(url))


# ---------------------------------------------------------------------------
# F2 — automatic_dispute_resolution blocks when reverted_fiat_sent=True
# ---------------------------------------------------------------------------
class TestAutomaticDisputeResolutionRevertedFiat(TestCase):
    """
    Regression test for F2: automatic_dispute_resolution must return False
    when reverted_fiat_sent=True, even if is_fiat_sent=False.

    Before the fix the guard was:
        if order.is_fiat_sent and not order.reverted_fiat_sent: return False
    After the fix:
        if order.is_fiat_sent or order.reverted_fiat_sent: return False
    """

    def _make_order(self, is_fiat_sent, reverted_fiat_sent, expires_at_past=True):
        from django.utils import timezone
        from datetime import timedelta

        order = MagicMock()
        order.is_fiat_sent = is_fiat_sent
        order.reverted_fiat_sent = reverted_fiat_sent
        # expires_at in the past → dispute was time-triggered
        if expires_at_past:
            order.expires_at = timezone.now() - timedelta(seconds=1)
        else:
            order.expires_at = timezone.now() + timedelta(hours=1)
        return order

    def test_blocks_when_fiat_sent_true(self):
        """Standard guard: is_fiat_sent=True → auto-resolution blocked."""
        from api.logics import Logics

        order = self._make_order(is_fiat_sent=True, reverted_fiat_sent=False)
        result = Logics.automatic_dispute_resolution(order)
        self.assertFalse(result)

    def test_blocks_when_reverted_fiat_sent_true(self):
        """
        F2 regression: after undo_confirm, is_fiat_sent=False but
        reverted_fiat_sent=True. Resolution must still be blocked.
        """
        from api.logics import Logics

        order = self._make_order(is_fiat_sent=False, reverted_fiat_sent=True)
        result = Logics.automatic_dispute_resolution(order)
        self.assertFalse(result)

    def test_blocks_when_both_true(self):
        """Both flags True → still blocked."""
        from api.logics import Logics

        order = self._make_order(is_fiat_sent=True, reverted_fiat_sent=True)
        result = Logics.automatic_dispute_resolution(order)
        self.assertFalse(result)

    def test_blocks_when_not_expired(self):
        """User-triggered dispute (not expired) → auto-resolution blocked."""
        from api.logics import Logics

        order = self._make_order(
            is_fiat_sent=False, reverted_fiat_sent=False, expires_at_past=False
        )
        result = Logics.automatic_dispute_resolution(order)
        self.assertFalse(result)


# ---------------------------------------------------------------------------
# F7 — open_dispute: orders_disputes_started must not become None
# ---------------------------------------------------------------------------
class TestOpenDisputeDisputesStarted(TestCase):
    """
    Regression test for F7: the list().append() bug that set
    orders_disputes_started to None on the second dispute.
    """

    def _make_robot(self, existing_disputes=None):
        """Build a minimal mock robot."""
        robot = MagicMock()
        robot.num_disputes = 0
        robot.orders_disputes_started = existing_disputes
        return robot

    def _make_user(self, robot):
        user = MagicMock()
        user.robot = robot
        user.username = "TestRobot"
        return user

    def _make_order(self, order_id=42):
        from django.utils import timezone
        from datetime import timedelta
        from api.models import Order, LNPayment

        order = MagicMock()
        order.id = order_id
        order.status = Order.Status.CHA
        order.trade_escrow = MagicMock()
        order.trade_escrow.status = LNPayment.Status.SETLED
        order.expires_at = timezone.now() + timedelta(hours=1)
        return order

    @patch("api.logics.Logics.automatic_dispute_resolution", return_value=False)
    @patch("api.logics.Logics.settle_escrow")
    @patch("api.logics.Logics.settle_bond")
    @patch("api.logics.send_notification")
    def test_first_dispute_sets_list(
        self, mock_notif, mock_settle_bond, mock_settle_escrow, mock_auto
    ):
        """First dispute: orders_disputes_started initialised as [order_id]."""
        from api.logics import Logics

        robot = self._make_robot(existing_disputes=None)
        user = self._make_user(robot)
        order = self._make_order(order_id=1)

        Logics.open_dispute(order, user)

        self.assertEqual(robot.orders_disputes_started, ["1"])

    @patch("api.logics.Logics.automatic_dispute_resolution", return_value=False)
    @patch("api.logics.Logics.settle_escrow")
    @patch("api.logics.Logics.settle_bond")
    @patch("api.logics.send_notification")
    def test_second_dispute_appends_not_none(
        self, mock_notif, mock_settle_bond, mock_settle_escrow, mock_auto
    ):
        """
        F7 regression: second dispute must append to the existing list,
        not set the field to None.
        """
        from api.logics import Logics

        # Simulate robot already having one dispute
        robot = self._make_robot(existing_disputes=["1"])
        user = self._make_user(robot)
        order = self._make_order(order_id=2)

        Logics.open_dispute(order, user)

        self.assertIsNotNone(robot.orders_disputes_started)
        self.assertIsInstance(robot.orders_disputes_started, list)
        self.assertIn("2", robot.orders_disputes_started)
        self.assertIn("1", robot.orders_disputes_started)

    @patch("api.logics.Logics.automatic_dispute_resolution", return_value=False)
    @patch("api.logics.Logics.settle_escrow")
    @patch("api.logics.Logics.settle_bond")
    @patch("api.logics.send_notification")
    def test_num_disputes_incremented(
        self, mock_notif, mock_settle_bond, mock_settle_escrow, mock_auto
    ):
        """num_disputes must always be incremented."""
        from api.logics import Logics

        robot = self._make_robot(existing_disputes=None)
        robot.num_disputes = 3
        user = self._make_user(robot)
        order = self._make_order(order_id=5)

        Logics.open_dispute(order, user)

        self.assertEqual(robot.num_disputes, 4)


# ---------------------------------------------------------------------------
# F3 — Middleware IntegrityError on nickname collision → 409
# ---------------------------------------------------------------------------
class TestMiddlewareNicknameCollision(TestCase):
    """
    Regression test for F3: when User.objects.create_user raises IntegrityError
    (nickname collision), the middleware must return HTTP 409 instead of a 500.
    """

    def setUp(self):
        self.factory = RequestFactory()

    def _make_request(self, token="validtokenb91ab91ab91ab91ab91ab91ab91ab91"):
        """Create a minimal fake request with auth header parts set."""
        request = self.factory.get("/api/robot/")
        request.META["HTTP_AUTHORIZATION"] = f"Token {token}"
        request.META["PUBLIC_KEY"] = "Public fakepublickey"
        request.META["ENCRYPTED_PRIVATE_KEY"] = "Private fakeencryptedprivatekey"
        request.META["NOSTR_PUBKEY"] = "a" * 64  # 64-char hex
        return request

    @patch("robosats.middleware.is_valid_token", return_value=True)
    @patch("robosats.middleware.Token.objects.get")
    @patch("robosats.middleware.validate_pgp_keys")
    @patch("robosats.middleware.base91_to_hex", return_value="aa" * 32)
    @patch("robosats.middleware.NickGen")
    @patch("robosats.middleware.User.objects.create_user")
    def test_integrity_error_returns_409(
        self,
        mock_create_user,
        mock_nickgen,
        mock_b91,
        mock_validate_pgp,
        mock_token_get,
        mock_valid_token,
    ):
        from django.db import IntegrityError
        from rest_framework import status as drf_status
        from robosats.middleware import RobotTokenSHA256AuthenticationMiddleWare

        # Token doesn't exist yet → goes to creation path
        mock_token_get.side_effect = Exception("DoesNotExist")

        # PGP keys are valid
        mock_validate_pgp.return_value = (True, None, "pub_key", "enc_priv_key")

        # NickGen returns a nickname
        mock_nickgen.short_from_SHA256.return_value = ("CoolRobot123", None)

        # create_user raises IntegrityError (duplicate username)
        mock_create_user.side_effect = IntegrityError("duplicate key value")

        def dummy_get_response(req):
            from django.http import HttpResponse
            return HttpResponse("ok")

        middleware = RobotTokenSHA256AuthenticationMiddleWare(dummy_get_response)
        request = self._make_request()

        # Patch Token.DoesNotExist lookup specifically
        with patch(
            "robosats.middleware.Token.objects.get",
            side_effect=__import__(
                "rest_framework.authtoken.models", fromlist=["Token"]
            ).Token.DoesNotExist,
        ):
            response = middleware(request)

        self.assertEqual(response.status_code, drf_status.HTTP_409_CONFLICT)


# ---------------------------------------------------------------------------
# F1 — taker_wins admin action: taker_bond used for own_bond_sats
# ---------------------------------------------------------------------------
class TestTakerWinsAdminAction(TestCase):
    """
    Regression test for F1: taker_wins must credit the taker robot
    with taker_bond.num_satoshis, not maker_bond.num_satoshis.
    """

    def _make_order(self, maker_bond_sats, taker_bond_sats, trade_sats):
        from api.models import Order, LNPayment

        order = MagicMock()
        order.status = Order.Status.DIS
        order.is_disputed = True
        order.is_swap = False

        # Bonds
        order.maker_bond = MagicMock()
        order.maker_bond.num_satoshis = maker_bond_sats

        order.taker_bond = MagicMock()
        order.taker_bond.num_satoshis = taker_bond_sats

        # Payout (buyer invoice)
        order.payout = MagicMock()
        order.payout.num_satoshis = trade_sats

        # Robot stubs
        order.taker = MagicMock()
        order.taker.robot = MagicMock()
        order.taker.robot.earned_rewards = 0

        order.maker = MagicMock()
        order.maker.robot = MagicMock()
        order.maker.robot.earned_rewards = 0

        return order

    @patch("api.admin.send_notification")
    @patch("api.admin.Logics.is_buyer", return_value=True)
    def test_taker_wins_credits_taker_bond_amount(self, mock_is_buyer, mock_notif):
        """
        The taker robot should be credited taker_bond + trade_sats,
        NOT maker_bond + trade_sats.
        """
        from api.admin import OrderAdmin

        MAKER_BOND = 3000
        TAKER_BOND = 1500  # different — exposes the bug if not fixed
        TRADE_SATS = 50000

        order = self._make_order(MAKER_BOND, TAKER_BOND, TRADE_SATS)

        admin_instance = OrderAdmin.__new__(OrderAdmin)

        # message_user is a Django admin method — mock it
        admin_instance.message_user = MagicMock()

        admin_instance.taker_wins(request=MagicMock(), queryset=[order])

        expected_rewards = TAKER_BOND + TRADE_SATS
        self.assertEqual(
            order.taker.robot.earned_rewards,
            expected_rewards,
            f"Taker should be credited taker_bond ({TAKER_BOND}) + trade ({TRADE_SATS}) "
            f"= {expected_rewards}, not maker_bond ({MAKER_BOND}) + trade = {MAKER_BOND + TRADE_SATS}",
        )

    @patch("api.admin.send_notification")
    @patch("api.admin.Logics.is_buyer", return_value=True)
    def test_maker_wins_still_credits_maker_bond(self, mock_is_buyer, mock_notif):
        """
        Sanity check: maker_wins must still use maker_bond (unchanged code path).
        """
        from api.admin import OrderAdmin
        from api.models import Order

        MAKER_BOND = 3000
        TAKER_BOND = 1500
        TRADE_SATS = 50000

        order = self._make_order(MAKER_BOND, TAKER_BOND, TRADE_SATS)
        order.status = Order.Status.DIS

        admin_instance = OrderAdmin.__new__(OrderAdmin)
        admin_instance.message_user = MagicMock()

        admin_instance.maker_wins(request=MagicMock(), queryset=[order])

        expected_rewards = MAKER_BOND + TRADE_SATS
        self.assertEqual(order.maker.robot.earned_rewards, expected_rewards)

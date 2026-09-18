"""
Tests for the community donation split: DEVFUND_COMMUNITY + DEVFUND_COMMUNITY_ADDRESS.

Covers:
  - api.utils.resolve_lightning_address  (LNURL-pay flow)
  - api.tasks.send_devfund_donation      (split math + community task dispatch)
  - api.tasks.send_community_donation    (happy-path + failure branches)
"""

from unittest.mock import MagicMock, patch

from django.test import TestCase


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _lnurlp_metadata(
    min_msat=1_000,
    max_msat=100_000_000,
    callback="https://pay.example.com/callback",
    comment_allowed=100,
):
    return {
        "tag": "payRequest",
        "callback": callback,
        "minSendable": min_msat,
        "maxSendable": max_msat,
        "commentAllowed": comment_allowed,
        "metadata": "[]",
    }


def _mock_session(metadata, invoice_data):
    """Session whose .get() returns metadata on the first call, invoice on the second."""
    meta_resp = MagicMock()
    meta_resp.json.return_value = metadata
    meta_resp.raise_for_status = MagicMock()

    inv_resp = MagicMock()
    inv_resp.json.return_value = invoice_data
    inv_resp.raise_for_status = MagicMock()

    session = MagicMock()
    session.get.side_effect = [meta_resp, inv_resp]
    return session


def _fake_config(env):
    def _inner(option, *args, **kwargs):
        if option in env:
            return env[option]
        return kwargs.get("default", "")

    return _inner


# ---------------------------------------------------------------------------
# resolve_lightning_address
# ---------------------------------------------------------------------------


class TestResolveLightningAddress(TestCase):
    @patch("api.utils.get_session")
    @patch("api.utils.LNNode")
    def test_happy_path(self, mock_lnnode, mock_get_session):
        from api.utils import resolve_lightning_address

        bolt11 = "lnbc1000nfake"
        mock_get_session.return_value = _mock_session(
            _lnurlp_metadata(), {"pr": bolt11}
        )
        decoded = MagicMock()
        decoded.num_satoshis = 1_000
        mock_lnnode.decode_payreq.return_value = decoded
        self.assertEqual(
            resolve_lightning_address("alice@example.com", 1_000, "hi"), bolt11
        )

    def test_invalid_format_no_at(self):
        from api.utils import resolve_lightning_address

        with self.assertRaises(ValueError):
            resolve_lightning_address("invaliddomain", 1000)

    def test_invalid_format_multiple_at(self):
        from api.utils import resolve_lightning_address

        with self.assertRaises(ValueError):
            resolve_lightning_address("a@b@c.com", 1000)

    def test_invalid_format_no_domain_dot(self):
        from api.utils import resolve_lightning_address

        with self.assertRaises(ValueError):
            resolve_lightning_address("alice@nodot", 1000)

    @patch("api.utils.get_session")
    def test_lnurlp_fetch_failure(self, mock_get_session):
        from api.utils import resolve_lightning_address

        session = MagicMock()
        session.get.side_effect = Exception("Network error")
        mock_get_session.return_value = session
        with self.assertRaises(ValueError):
            resolve_lightning_address("alice@example.com", 1000)

    @patch("api.utils.get_session")
    def test_wrong_tag(self, mock_get_session):
        from api.utils import resolve_lightning_address

        meta = _lnurlp_metadata()
        meta["tag"] = "withdrawRequest"
        resp = MagicMock()
        resp.json.return_value = meta
        resp.raise_for_status = MagicMock()
        session = MagicMock()
        session.get.return_value = resp
        mock_get_session.return_value = session
        with self.assertRaises(ValueError):
            resolve_lightning_address("alice@example.com", 1000)

    @patch("api.utils.get_session")
    def test_amount_below_min_sendable(self, mock_get_session):
        from api.utils import resolve_lightning_address

        meta = _lnurlp_metadata(min_msat=10_000)
        resp = MagicMock()
        resp.json.return_value = meta
        resp.raise_for_status = MagicMock()
        session = MagicMock()
        session.get.return_value = resp
        mock_get_session.return_value = session
        with self.assertRaises(ValueError):
            resolve_lightning_address("alice@example.com", 1)  # 1 sat < 10 sat

    @patch("api.utils.get_session")
    def test_amount_above_max_sendable(self, mock_get_session):
        from api.utils import resolve_lightning_address

        meta = _lnurlp_metadata(min_msat=1, max_msat=1_000)
        resp = MagicMock()
        resp.json.return_value = meta
        resp.raise_for_status = MagicMock()
        session = MagicMock()
        session.get.return_value = resp
        mock_get_session.return_value = session
        with self.assertRaises(ValueError):
            resolve_lightning_address("alice@example.com", 1000)  # 1000 sat > 1 sat

    @patch("api.utils.get_session")
    @patch("api.utils.LNNode")
    def test_invoice_amount_mismatch(self, mock_lnnode, mock_get_session):
        from api.utils import resolve_lightning_address

        mock_get_session.return_value = _mock_session(
            _lnurlp_metadata(), {"pr": "lnbc_bad"}
        )
        decoded = MagicMock()
        decoded.num_satoshis = 500  # mismatch; we asked for 1000
        mock_lnnode.decode_payreq.return_value = decoded
        with self.assertRaises(ValueError):
            resolve_lightning_address("alice@example.com", 1000)

    @patch("api.utils.get_session")
    @patch("api.utils.LNNode")
    def test_comment_included_when_allowed(self, mock_lnnode, mock_get_session):
        from api.utils import resolve_lightning_address

        comment = "hello"
        session = _mock_session(
            _lnurlp_metadata(comment_allowed=100), {"pr": "lnbc500"}
        )
        mock_get_session.return_value = session
        decoded = MagicMock()
        decoded.num_satoshis = 500
        mock_lnnode.decode_payreq.return_value = decoded
        resolve_lightning_address("alice@example.com", 500, comment)
        callback_call = session.get.call_args_list[1]
        params = callback_call[1].get(
            "params", callback_call[0][1] if len(callback_call[0]) > 1 else {}
        )
        self.assertEqual(params.get("comment"), comment)

    @patch("api.utils.get_session")
    @patch("api.utils.LNNode")
    def test_comment_excluded_when_too_long(self, mock_lnnode, mock_get_session):
        from api.utils import resolve_lightning_address

        comment = "x" * 200
        session = _mock_session(_lnurlp_metadata(comment_allowed=10), {"pr": "lnbc500"})
        mock_get_session.return_value = session
        decoded = MagicMock()
        decoded.num_satoshis = 500
        mock_lnnode.decode_payreq.return_value = decoded
        resolve_lightning_address("alice@example.com", 500, comment)
        callback_call = session.get.call_args_list[1]
        params = callback_call[1].get(
            "params", callback_call[0][1] if len(callback_call[0]) > 1 else {}
        )
        self.assertNotIn("comment", params)


# ---------------------------------------------------------------------------
# send_devfund_donation – split math
# ---------------------------------------------------------------------------

_BASE_ENV = {
    "NETWORK": "testnet",
    "COORDINATOR_ALIAS": "test",
    "ESCROW_USERNAME": "admin",
}

_KEYSEND_RESULT = {
    "created_at": "2024-01-01",
    "payment_hash": "a" * 64,
    "preimage": "b" * 64,
    "status": 8,
    "fee": 0,
}


def _run_devfund_task(env_extra, proceeds=10_000, reason="test"):
    from api.tasks import send_devfund_donation

    env = {**_BASE_ENV, **env_extra}
    order_mock = MagicMock()
    order_mock.id = 1

    with (
        patch("api.tasks.config", side_effect=_fake_config(env)),
        patch("api.tasks.get_devfund_pubkey", return_value="02" + "00" * 32),
        patch("api.tasks.Order") as mock_order_cls,
        patch("api.tasks.User") as mock_user_cls,
        patch("api.tasks.LNNode") as mock_lnnode,
        patch("api.tasks.LNPayment") as mock_lnpayment_cls,
        patch("api.tasks.send_community_donation") as mock_comm_task,
    ):
        mock_order_cls.objects.get.return_value = order_mock
        mock_user_cls.objects.get.return_value = MagicMock()
        mock_lnnode.send_keysend.return_value = (True, _KEYSEND_RESULT)
        mock_lnpayment_cls.Concepts.DEVDONAT = 5
        mock_lnpayment_cls.Types.KEYS = 2
        mock_lnpayment_cls.objects.create.return_value = MagicMock(
            payment_hash="a" * 64
        )

        send_devfund_donation(order_id=1, proceeds=proceeds, reason=reason)

        return (
            mock_comm_task.delay.call_args_list,
            mock_lnnode.send_keysend.call_args_list,
        )


class TestSendDevfundDonationSplit(TestCase):
    def test_no_community_by_default(self):
        comm_calls, keysend_calls = _run_devfund_task(
            {"DEVFUND": 0.2, "DEVFUND_COMMUNITY": 0.0, "DEVFUND_COMMUNITY_ADDRESS": ""}
        )
        self.assertEqual(len(comm_calls), 0)
        self.assertEqual(keysend_calls[0][0][2], 2_000)

    def test_community_split_25_percent(self):
        comm_calls, keysend_calls = _run_devfund_task(
            {
                "DEVFUND": 0.2,
                "DEVFUND_COMMUNITY": 0.25,
                "DEVFUND_COMMUNITY_ADDRESS": "community@example.com",
            }
        )
        self.assertEqual(len(comm_calls), 1)
        self.assertEqual(comm_calls[0][0][1], 500)
        self.assertEqual(keysend_calls[0][0][2], 1_500)

    def test_community_fraction_clamped_to_one(self):
        comm_calls, keysend_calls = _run_devfund_task(
            {
                "DEVFUND": 0.2,
                "DEVFUND_COMMUNITY": 1.5,
                "DEVFUND_COMMUNITY_ADDRESS": "community@example.com",
            }
        )
        self.assertEqual(comm_calls[0][0][1], 2_000)
        self.assertEqual(len(keysend_calls), 0)

    def test_community_skipped_when_address_missing(self):
        comm_calls, keysend_calls = _run_devfund_task(
            {"DEVFUND": 0.2, "DEVFUND_COMMUNITY": 0.5, "DEVFUND_COMMUNITY_ADDRESS": ""}
        )
        self.assertEqual(len(comm_calls), 0)
        self.assertEqual(keysend_calls[0][0][2], 2_000)


# ---------------------------------------------------------------------------
# send_community_donation – happy path + failure branches
# ---------------------------------------------------------------------------

_COMM_BASE_ENV = {
    "DEVFUND_COMMUNITY_ADDRESS": "community@example.com",
    "COORDINATOR_ALIAS": "test",
    "ESCROW_USERNAME": "admin",
    "PROPORTIONAL_ROUTING_FEE_LIMIT": 0.001,
    "MIN_FLAT_ROUTING_FEE_LIMIT_REWARD": 2,
}


def _run_comm_task(
    env_extra=None,
    invoice_side_effect=None,
    pay_result=(True, None),
    num_satoshis=1_000,
):
    from api.tasks import send_community_donation

    env = {**_COMM_BASE_ENV, **(env_extra or {})}
    order_mock = MagicMock()
    order_mock.id = 1

    resolve_side = invoice_side_effect  # None → return_value used; Exception → raised

    with (
        patch("api.tasks.config", side_effect=_fake_config(env)),
        patch("api.tasks.Order") as mock_order_cls,
        patch("api.tasks.User") as mock_user_cls,
        patch("api.tasks.LNNode") as mock_lnnode,
        patch("api.tasks.LNPayment") as mock_lnpayment_cls,
        patch(
            "api.tasks.resolve_lightning_address",
            side_effect=resolve_side,
            return_value=None if resolve_side else "lnbc1000fake",
        ),
    ):
        mock_order_cls.objects.get.return_value = order_mock
        mock_user_cls.objects.get.return_value = MagicMock()

        decoded = MagicMock()
        decoded.payment_hash = "c" * 64
        decoded.expiry = 3600
        mock_lnnode.decode_payreq.return_value = decoded
        mock_lnnode.pay_invoice.return_value = pay_result

        mock_lnpayment_cls.Concepts.COMDONAT = 6
        mock_lnpayment_cls.Types.NORM = 0
        mock_lnpayment_cls.objects.create.return_value = MagicMock(
            payment_hash="c" * 64
        )

        result = send_community_donation(1, num_satoshis, "test")
        return result, order_mock


class TestSendCommunityDonation(TestCase):
    def test_happy_path_returns_true(self):
        result, _ = _run_comm_task()
        self.assertTrue(result)

    def test_no_address_returns_false(self):
        from api.tasks import send_community_donation

        order_mock = MagicMock()
        with (
            patch(
                "api.tasks.config",
                side_effect=_fake_config({"DEVFUND_COMMUNITY_ADDRESS": ""}),
            ),
            patch("api.tasks.Order") as mock_order_cls,
        ):
            mock_order_cls.objects.get.return_value = order_mock
            result = send_community_donation(1, 1_000, "test")
        self.assertFalse(result)
        self.assertIn("not set", order_mock.log.call_args[0][0])

    def test_lnurl_resolution_error_returns_false(self):
        result, order_mock = _run_comm_task(
            invoice_side_effect=ValueError("bad address")
        )
        self.assertFalse(result)
        log_msg = order_mock.log.call_args[0][0]
        self.assertIn("LNURL resolution error", log_msg)

    def test_payment_failure_returns_false(self):
        result, order_mock = _run_comm_task(pay_result=(False, "No route found"))
        self.assertFalse(result)
        log_messages = [c[0][0] for c in order_mock.log.call_args_list]
        self.assertTrue(any("failed" in m for m in log_messages))

    def test_zero_sats_returns_false(self):
        from api.tasks import send_community_donation

        order_mock = MagicMock()
        with (
            patch("api.tasks.config", side_effect=_fake_config(_COMM_BASE_ENV)),
            patch("api.tasks.Order") as mock_order_cls,
        ):
            mock_order_cls.objects.get.return_value = order_mock
            result = send_community_donation(1, 0, "test")
        self.assertFalse(result)
        self.assertIn("non-positive", order_mock.log.call_args[0][0])

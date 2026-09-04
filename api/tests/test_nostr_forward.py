from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from asgiref.sync import async_to_sync
from django.test import SimpleTestCase
from nostr_sdk import RelayUrl

from api.models import Robot
from api.nostr import Nostr
from api.notifications import Notifications
from api.tasks import users_cleansing

TEST_NSEC = "nsec1w72q58pyng0fa8czqeyr4qvw5v58vegxeremqclshlncqns83cpsd2nmk9"
TEST_NPUB = "npub16sfzpqkjrunmweeu4tj9z83pv4cwweqcnc5kyxctzdgpelng73zqms3kqr"
TEST_RELAY = "ws://relayexample.onion"


def make_robot(**overrides):
    values = {
        "id": 7,
        "nostr_pubkey": TEST_NPUB,
        "nostr_forward_pubkey": TEST_NPUB,
        "nostr_forward_relay": TEST_RELAY,
        "nostr_forward_enabled": True,
        "telegram_enabled": False,
        "webhook_enabled": False,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def config_value(key, **kwargs):
    return {
        "NOSTR_NSEC": TEST_NSEC,
        "COORDINATOR_ALIAS": "TestCoord",
    }.get(key, kwargs.get("default", ""))


class TestNostrForwardValidation(SimpleTestCase):
    def test_webhook_and_relay_schemes_are_independent(self):
        self.assertTrue(Robot.is_valid_onion_url("http://x.onion"))
        self.assertFalse(Robot.is_valid_onion_url(TEST_RELAY))
        self.assertTrue(Robot.is_valid_onion_relay_url(TEST_RELAY))
        self.assertTrue(Robot.is_valid_onion_relay_url("wss://relayexample.onion/path"))
        self.assertFalse(Robot.is_valid_onion_relay_url("http://relayexample.onion"))

    def test_relay_rejects_unsafe_hosts_and_ports(self):
        for relay in (
            "ws://relay.example.com",
            "ws://.onion",
            "ws://relay..onion",
            "ws://relay..example.onion",
            "ws://relay.onion:bad",
            "ws://relay.onion:99999",
            r"ws://evil.example\@relayexample.onion",
            r"ws://127.0.0.1\relay.onion",
        ):
            with self.subTest(relay=relay):
                self.assertFalse(Robot.is_valid_onion_relay_url(relay))


class TestNostrForwardFanout(SimpleTestCase):
    @patch.object(Notifications, "save_message")
    @patch("api.notifications.nostr_send_forward_notification_event.delay")
    @patch("api.notifications.nostr_send_notification_event.delay")
    def test_local_and_forward_dms_are_queued_separately(
        self, local_delay, forward_delay, save_message
    ):
        order = SimpleNamespace(id=42)
        robot = make_robot()

        Notifications().send_message(order, robot, "Order updated")

        save_message.assert_called_once()
        local_delay.assert_called_once_with(
            robot_id=robot.id, order_id=order.id, text="Order updated"
        )
        forward_delay.assert_called_once_with(
            robot_id=robot.id, order_id=order.id, text="Order updated"
        )

    @patch("api.tasks.config", return_value=None)
    @patch("gnupg.GPG")
    @patch("django.contrib.auth.models.User.objects.filter")
    def test_cleansing_preserves_forward_enabled_robot(
        self, user_filter, mock_gpg, mock_config
    ):
        user = MagicMock()
        user.robot = make_robot(
            earned_rewards=0,
            claimed_rewards=0,
            total_contracts=0,
        )
        user_filter.return_value.filter.return_value = [user]

        with patch(
            "api.logics.Logics.validate_already_maker_or_taker",
            return_value=(True, None, None),
        ):
            users_cleansing.run()

        user.delete.assert_not_called()

    @patch.object(Notifications, "save_message")
    @patch("api.notifications.nostr_send_forward_notification_event.delay")
    @patch("api.notifications.nostr_send_notification_event.delay")
    def test_forward_does_not_require_a_local_dm_target(
        self, local_delay, forward_delay, save_message
    ):
        order = SimpleNamespace(id=42)
        robot = make_robot(nostr_pubkey=None)

        Notifications().send_message(order, robot, "Order updated")

        local_delay.assert_not_called()
        forward_delay.assert_called_once_with(
            robot_id=robot.id, order_id=order.id, text="Order updated"
        )


class TestNostrForwardSender(SimpleTestCase):
    def setUp(self):
        self.nostr = Nostr()
        self.robot = make_robot()
        self.order = SimpleNamespace(id=42, status=3)

    def make_client(self):
        client = MagicMock()
        client.add_relay = AsyncMock()
        client.connect = AsyncMock()
        client.send_event = AsyncMock()
        client.disconnect = AsyncMock()
        return client

    def test_queued_notification_stops_after_forwarding_is_disabled(self):
        robot = make_robot(nostr_forward_enabled=False)

        with patch.object(
            self.nostr, "send_forward_event", new=AsyncMock()
        ) as send_forward_event:
            sent = async_to_sync(self.nostr.send_forward_notification_event)(
                robot, self.order, "Order updated"
            )

        self.assertFalse(sent)
        send_forward_event.assert_not_awaited()

    @patch("api.nostr.Robot.is_valid_onion_relay_url", return_value=True)
    @patch("api.nostr.config", side_effect=config_value)
    def test_sender_uses_current_sdk_calls(self, mock_config, mock_validator):
        client = self.make_client()
        keys = MagicMock()
        recipient = MagicMock()
        relay = RelayUrl.parse(TEST_RELAY)
        gift_wrap = MagicMock()
        output = SimpleNamespace(success=[RelayUrl.parse(TEST_RELAY)], failed={})
        client.send_event.return_value = output

        with (
            patch.object(self.nostr, "initialize_forward_client", return_value=client),
            patch("api.nostr.Keys.parse", return_value=keys),
            patch("api.nostr.PublicKey.parse", return_value=recipient) as parse_pubkey,
            patch("api.nostr.RelayUrl.parse", return_value=relay) as parse_relay,
            patch("api.nostr.uniffi_set_event_loop") as set_event_loop,
            patch(
                "api.nostr.nip17_make_private_msg_async",
                new=AsyncMock(return_value=gift_wrap),
            ) as make_private_msg,
        ):
            sent = async_to_sync(self.nostr.send_forward_notification_event)(
                self.robot, self.order, "Order updated"
            )

        self.assertTrue(sent)
        parse_relay.assert_called_once_with(TEST_RELAY)
        parse_pubkey.assert_called_once_with(TEST_NPUB)
        client.add_relay.assert_awaited_once_with(relay)
        client.connect.assert_awaited_once_with()
        client.send_event.assert_awaited_once_with(
            gift_wrap, ok_timeout=timedelta(seconds=30)
        )
        client.disconnect.assert_awaited_once_with()
        self.assertIsNotNone(set_event_loop.call_args_list[0].args[0])
        self.assertEqual(set_event_loop.call_args_list[1].args, (None,))

        args = make_private_msg.await_args.args
        tags = make_private_msg.await_args.kwargs["rumor_extra_tags"]
        self.assertEqual(args, (keys, recipient, "Order updated"))
        self.assertEqual(tags[0].to_vec(), ["order_id", "testcoord/42"])
        self.assertEqual(tags[1].to_vec(), ["status", "3"])

    @patch("api.nostr.Robot.is_valid_onion_relay_url", return_value=True)
    @patch("api.nostr.config", side_effect=config_value)
    @patch("api.nostr.logger")
    def test_send_failure_is_redacted_and_disconnects(
        self, logger, mock_config, mock_validator
    ):
        client = self.make_client()
        client.send_event.side_effect = RuntimeError(f"failed at {TEST_RELAY}")

        with (
            patch.object(self.nostr, "initialize_forward_client", return_value=client),
            patch("api.nostr.Keys.parse", return_value=MagicMock()),
            patch("api.nostr.PublicKey.parse", return_value=MagicMock()),
            patch("api.nostr.RelayUrl.parse", return_value=MagicMock()),
            patch(
                "api.nostr.nip17_make_private_msg_async",
                new=AsyncMock(return_value=MagicMock()),
            ),
        ):
            sent = async_to_sync(self.nostr.send_forward_event)(
                self.robot, "Order updated", []
            )

        self.assertFalse(sent)
        client.disconnect.assert_awaited_once_with()
        self.assertNotIn(TEST_RELAY, str(logger.error.call_args_list))

    @patch("api.nostr.config", side_effect=config_value)
    def test_sender_rejects_clearnet_relay_before_initializing_client(
        self, mock_config
    ):
        robot = make_robot(nostr_forward_relay="wss://relay.example.com")

        with patch.object(self.nostr, "initialize_forward_client") as initialize_client:
            sent = async_to_sync(self.nostr.send_forward_event)(
                robot, "Order updated", []
            )

        self.assertFalse(sent)
        initialize_client.assert_not_called()

    @patch("api.nostr.Robot.is_valid_onion_relay_url", return_value=True)
    @patch("api.nostr.config", side_effect=config_value)
    @patch("api.nostr.logger")
    def test_relay_rejection_is_not_reported_as_sent(
        self, logger, mock_config, mock_validator
    ):
        client = self.make_client()
        client.send_event.return_value = SimpleNamespace(
            success=[], failed={TEST_RELAY: "rejected"}
        )

        with (
            patch.object(self.nostr, "initialize_forward_client", return_value=client),
            patch("api.nostr.Keys.parse", return_value=MagicMock()),
            patch("api.nostr.PublicKey.parse", return_value=MagicMock()),
            patch("api.nostr.RelayUrl.parse", return_value=MagicMock()),
            patch(
                "api.nostr.nip17_make_private_msg_async",
                new=AsyncMock(return_value=MagicMock()),
            ),
        ):
            sent = async_to_sync(self.nostr.send_forward_event)(
                self.robot, "Order updated", []
            )

        self.assertFalse(sent)
        client.disconnect.assert_awaited_once_with()
        self.assertNotIn(TEST_RELAY, str(logger.error.call_args_list))

    @patch("api.nostr.Robot.is_valid_onion_relay_url", return_value=True)
    @patch("api.nostr.config", side_effect=config_value)
    @patch("api.nostr.logger")
    def test_disconnect_failure_is_redacted(self, logger, mock_config, mock_validator):
        client = self.make_client()
        relay = MagicMock()
        client.send_event.return_value = SimpleNamespace(success=[relay], failed={})
        client.disconnect.side_effect = RuntimeError(f"failed at {TEST_RELAY}")

        with (
            patch.object(self.nostr, "initialize_forward_client", return_value=client),
            patch("api.nostr.Keys.parse", return_value=MagicMock()),
            patch("api.nostr.PublicKey.parse", return_value=MagicMock()),
            patch("api.nostr.RelayUrl.parse", return_value=relay),
            patch(
                "api.nostr.nip17_make_private_msg_async",
                new=AsyncMock(return_value=MagicMock()),
            ),
        ):
            sent = async_to_sync(self.nostr.send_forward_event)(
                self.robot, "Order updated", []
            )

        self.assertTrue(sent)
        self.assertNotIn(TEST_RELAY, str(logger.error.call_args_list))

    def test_forward_client_uses_authenticator_and_tor_proxy(self):
        keys = MagicMock()
        client = MagicMock()
        builder = MagicMock()
        authenticated_builder = MagicMock()
        proxied_builder = MagicMock()
        authenticated_builder.proxy.return_value = proxied_builder
        proxied_builder.build.return_value = client

        with (
            patch("api.nostr.ClientBuilder", return_value=builder),
            patch("api.nostr.SignerAuthenticator", return_value=MagicMock()) as auth,
            patch("api.nostr.Proxy") as proxy,
            patch("api.nostr.USE_TOR", True),
            patch("api.nostr.TOR_PROXY", "127.0.0.1:9050"),
        ):
            builder.authenticator.return_value = authenticated_builder
            result = self.nostr.initialize_forward_client(keys)

        authenticator = auth.return_value
        onion_proxy = proxy.onion.return_value
        auth.assert_called_once_with(keys)
        builder.authenticator.assert_called_once_with(authenticator)
        proxy.onion.assert_called_once_with("127.0.0.1:9050")
        authenticated_builder.proxy.assert_called_once_with(onion_proxy)
        self.assertIs(result, client)

    def test_forward_client_skips_proxy_when_tor_is_disabled(self):
        builder = MagicMock()
        authenticated_builder = MagicMock()

        with (
            patch("api.nostr.ClientBuilder", return_value=builder),
            patch("api.nostr.SignerAuthenticator", return_value=MagicMock()),
            patch("api.nostr.Proxy") as proxy,
            patch("api.nostr.USE_TOR", False),
        ):
            builder.authenticator.return_value = authenticated_builder
            self.nostr.initialize_forward_client(MagicMock())

        proxy.onion.assert_not_called()
        authenticated_builder.proxy.assert_not_called()
        authenticated_builder.build.assert_called_once_with()

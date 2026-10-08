"""
Tests for Robot Webhook API endpoints.
Tests the webhook configuration functionality:
- GET /api/robot/ returns webhook fields
- PUT /api/robot/ updates webhook settings
- Validation: webhook_url must be .onion
"""

from unittest.mock import patch

from django.urls import reverse

from tests.test_api import BaseAPITestCase

TEST_NPUB = "npub16sfzpqkjrunmweeu4tj9z83pv4cwweqcnc5kyxctzdgpelng73zqms3kqr"


def read_file(file_path):
    """Read a file and return its content."""
    with open(file_path, "r") as file:
        return file.read()


class RobotWebhookAPITest(BaseAPITestCase):
    """Test webhook configuration via Robot API endpoints."""

    robot_index = 1  # Use pre-generated test robot

    def get_robot_auth(self):
        """
        Create an AUTH header using pre-generated test robot credentials.
        """
        b91_token = read_file(f"tests/robots/{self.robot_index}/b91_token")
        pub_key = read_file(f"tests/robots/{self.robot_index}/pub_key")
        enc_priv_key = read_file(f"tests/robots/{self.robot_index}/enc_priv_key")
        nostr_pubkey = read_file(f"tests/robots/{self.robot_index}/nostr_pubkey")

        return {
            "HTTP_AUTHORIZATION": f"Token {b91_token} | Public {pub_key} | Private {enc_priv_key} | Nostr {nostr_pubkey}"
        }

    def test_robot_get_includes_webhook_fields(self):
        """Test that GET /api/robot/ returns webhook configuration fields."""
        path = reverse("robot")
        headers = self.get_robot_auth()

        response = self.client.get(path, **headers)
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

        # Verify webhook fields are present in response
        self.assertIn("webhook_url", data)
        self.assertIn("webhook_enabled", data)
        self.assertIn("webhook_api_key", data)

    def test_robot_get_includes_nostr_forward_fields(self):
        path = reverse("robot")
        response = self.client.get(path, **self.get_robot_auth())
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)
        self.assertIn("nostr_forward_pubkey", data)
        self.assertIn("nostr_forward_relay", data)
        self.assertIn("nostr_forward_enabled", data)

    @patch("api.notifications.Notifications.send_webhook_test")
    def test_robot_put_update_webhook_settings(self, mock_send_test):
        """Test that PUT /api/robot/ updates webhook settings."""
        mock_send_test.return_value = True

        path = reverse("robot")
        headers = self.get_robot_auth()

        update_data = {
            "webhook_url": "http://test123abc.onion/webhook",
            "webhook_api_key": "my-secret-key",
        }

        response = self.client.put(
            path, data=update_data, content_type="application/json", **headers
        )
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

        self.assertEqual(data["webhook_url"], "http://test123abc.onion/webhook")
        self.assertEqual(data["webhook_api_key"], "my-secret-key")

    def test_robot_put_partial_update(self):
        """Test that PUT /api/robot/ allows partial updates (api_key only)."""
        path = reverse("robot")
        headers = self.get_robot_auth()

        update_data = {"webhook_api_key": "test-key"}

        response = self.client.put(
            path, data=update_data, content_type="application/json", **headers
        )

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)
        self.assertEqual(response.json()["webhook_api_key"], "test-key")

    def test_robot_put_rejects_non_onion_url(self):
        """Test that PUT /api/robot/ rejects non-.onion URLs."""
        path = reverse("robot")
        headers = self.get_robot_auth()

        update_data = {"webhook_url": "https://example.com/webhook"}

        response = self.client.put(
            path, data=update_data, content_type="application/json", **headers
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("webhook_url", response.json())

    @patch("api.notifications.Notifications.send_webhook_test")
    def test_robot_put_accepts_valid_onion_url(self, mock_send_test):
        """Test that PUT /api/robot/ accepts valid .onion URLs."""
        mock_send_test.return_value = True

        path = reverse("robot")
        headers = self.get_robot_auth()

        test_url = "http://testwebhook.onion/notify"
        update_data = {"webhook_url": test_url}

        response = self.client.put(
            path, data=update_data, content_type="application/json", **headers
        )

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

    def test_robot_put_requires_complete_nostr_forward_config(self):
        path = reverse("robot")
        response = self.client.put(
            path,
            data={"nostr_forward_enabled": True},
            content_type="application/json",
            **self.get_robot_auth(),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            set(response.json()),
            {"nostr_forward_pubkey", "nostr_forward_relay"},
        )

    def test_robot_put_rejects_invalid_nostr_forward_fields(self):
        path = reverse("robot")
        response = self.client.put(
            path,
            data={
                "nostr_forward_pubkey": f"nPUB{TEST_NPUB[4:]}",
                "nostr_forward_relay": "wss://relay.example.com",
            },
            content_type="application/json",
            **self.get_robot_auth(),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            set(response.json()),
            {"nostr_forward_pubkey", "nostr_forward_relay"},
        )

    def test_robot_put_rejects_off_curve_nostr_forward_pubkey(self):
        path = reverse("robot")
        response = self.client.put(
            path,
            data={"nostr_forward_pubkey": "f" * 64},
            content_type="application/json",
            **self.get_robot_auth(),
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("nostr_forward_pubkey", response.json())

    def test_robot_put_normalizes_uppercase_nostr_forward_pubkey(self):
        path = reverse("robot")
        pubkey = TEST_NPUB.upper()
        update_data = {
            "nostr_forward_pubkey": pubkey,
            "nostr_forward_relay": "ws://testrelay.onion",
            "nostr_forward_enabled": True,
        }

        response = self.client.put(
            path,
            data=update_data,
            content_type="application/json",
            **self.get_robot_auth(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)
        self.assertEqual(response.json()["nostr_forward_pubkey"], TEST_NPUB)

    def test_robot_put_clears_disabled_nostr_forward_config(self):
        path = reverse("robot")
        pubkey = read_file(f"tests/robots/{self.robot_index}/nostr_pubkey").strip()
        response = self.client.put(
            path,
            data={
                "nostr_forward_pubkey": pubkey,
                "nostr_forward_relay": "ws://testrelay.onion",
                "nostr_forward_enabled": True,
            },
            content_type="application/json",
            **self.get_robot_auth(),
        )
        self.assertEqual(response.status_code, 200)

        response = self.client.put(
            path,
            data={
                "nostr_forward_pubkey": None,
                "nostr_forward_relay": None,
                "nostr_forward_enabled": False,
            },
            content_type="application/json",
            **self.get_robot_auth(),
        )
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)
        self.assertIsNone(data["nostr_forward_pubkey"])
        self.assertIsNone(data["nostr_forward_relay"])
        self.assertFalse(data["nostr_forward_enabled"])

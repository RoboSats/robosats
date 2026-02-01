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

"""
Tests for Robot Nostr Forward API endpoints.
Tests the Nostr forwarding configuration functionality:
- GET /api/robot/ returns nostr_forward fields
- PUT /api/robot/ updates nostr forward settings
- Validation: nostr_forward_relay must be .onion
"""

from unittest.mock import patch

from django.urls import reverse

from tests.test_api import BaseAPITestCase


def read_file(file_path):
    """Read a file and return its content."""
    with open(file_path, "r") as file:
        return file.read()


class RobotNostrForwardAPITest(BaseAPITestCase):
    """Test Nostr forwarding configuration via Robot API endpoints."""

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

    def test_robot_get_includes_nostr_forward_fields(self):
        """Test that GET /api/robot/ returns nostr forward configuration fields."""
        path = reverse("robot")
        headers = self.get_robot_auth()

        response = self.client.get(path, **headers)
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

        # Verify nostr forward fields are present in response
        self.assertIn("nostr_forward_pubkey", data)
        self.assertIn("nostr_forward_relay", data)
        self.assertIn("nostr_forward_enabled", data)

    @patch("api.notifications.Notifications.send_nostr_forward_test")
    def test_robot_put_update_nostr_forward_settings(self, mock_send_test):
        """Test that PUT /api/robot/ updates nostr forward settings."""
        mock_send_test.return_value = True

        path = reverse("robot")
        headers = self.get_robot_auth()

        update_data = {
            "nostr_forward_pubkey": "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234",
            "nostr_forward_relay": "ws://testrelay123abc.onion/",
            "nostr_forward_enabled": True,
        }

        response = self.client.put(
            path, data=update_data, content_type="application/json", **headers
        )
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

        self.assertEqual(
            data["nostr_forward_pubkey"],
            "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234",
        )
        self.assertEqual(data["nostr_forward_relay"], "ws://testrelay123abc.onion/")
        self.assertEqual(data["nostr_forward_enabled"], True)

    def test_robot_put_partial_update_nostr_forward(self):
        """Test that PUT /api/robot/ allows partial updates (pubkey only)."""
        path = reverse("robot")
        headers = self.get_robot_auth()

        update_data = {
            "nostr_forward_pubkey": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        }

        response = self.client.put(
            path, data=update_data, content_type="application/json", **headers
        )

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)
        self.assertEqual(
            response.json()["nostr_forward_pubkey"],
            "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        )

    def test_robot_put_rejects_non_onion_relay(self):
        """Test that PUT /api/robot/ rejects non-.onion relay URLs."""
        path = reverse("robot")
        headers = self.get_robot_auth()

        update_data = {"nostr_forward_relay": "wss://relay.damus.io"}

        response = self.client.put(
            path, data=update_data, content_type="application/json", **headers
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("nostr_forward_relay", response.json())

    @patch("api.notifications.Notifications.send_nostr_forward_test")
    def test_robot_put_accepts_valid_onion_relay(self, mock_send_test):
        """Test that PUT /api/robot/ accepts valid .onion relay URLs."""
        mock_send_test.return_value = True

        path = reverse("robot")
        headers = self.get_robot_auth()

        test_relay = "ws://testrelay.onion/"
        update_data = {
            "nostr_forward_relay": test_relay,
            "nostr_forward_enabled": True,
        }

        response = self.client.put(
            path, data=update_data, content_type="application/json", **headers
        )

        self.assertEqual(response.status_code, 200)
        self.assertResponse(response)

    def test_robot_put_toggle_nostr_forward_enabled(self):
        """Test that PUT /api/robot/ can toggle nostr_forward_enabled."""
        path = reverse("robot")
        headers = self.get_robot_auth()

        # Enable
        response = self.client.put(
            path,
            data={"nostr_forward_enabled": True},
            content_type="application/json",
            **headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["nostr_forward_enabled"], True)

        # Disable
        response = self.client.put(
            path,
            data={"nostr_forward_enabled": False},
            content_type="application/json",
            **headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["nostr_forward_enabled"], False)

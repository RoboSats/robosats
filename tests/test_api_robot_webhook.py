"""
Tests for Robot Webhook API endpoints.
Tests the webhook configuration functionality:
- GET /api/robot/ returns webhook fields
- PUT /api/robot/ updates webhook settings
- Validation: webhook_url must be .onion
"""

from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from django.urls import reverse

from api.models import Robot


class RobotWebhookAPITest(APITestCase):
    """Test webhook configuration via Robot API endpoints."""

    def setUp(self):
        """Create a test user with robot and token."""
        self.user = User.objects.create_user(
            username="TestRobot", password="testpassword123"
        )
        self.token = Token.objects.create(user=self.user)

        if not hasattr(self.user, "robot"):
            Robot.objects.create(user=self.user)

        self.client.credentials(HTTP_AUTHORIZATION="Token " + self.token.key)

    def test_robot_get_includes_webhook_fields(self):
        """Test that GET /api/robot/ returns webhook configuration fields."""
        path = reverse("robot")

        response = self.client.get(path)
        print(f"GET Response: {response.status_code} {response.content}")
        data = response.json()

        self.assertEqual(response.status_code, 200)

        self.assertIn("webhook_url", data)
        self.assertIn("webhook_enabled", data)
        self.assertIn("webhook_api_key", data)
        self.assertIn("webhook_timeout", data)
        self.assertIn("webhook_retries", data)

        self.assertIsNone(data["webhook_url"])
        self.assertFalse(data["webhook_enabled"])
        self.assertIsNone(data["webhook_api_key"])
        self.assertEqual(data["webhook_timeout"], 10)
        self.assertEqual(data["webhook_retries"], 3)

    def test_robot_put_update_webhook_settings(self):
        """Test that PUT /api/robot/ updates webhook settings."""
        path = reverse("robot")

        update_data = {
            "webhook_url": "http://test123abc.onion/webhook",
            "webhook_enabled": True,
            "webhook_api_key": "my-secret-key",
            "webhook_timeout": 15,
            "webhook_retries": 5,
        }

        response = self.client.put(
            path, data=update_data, content_type="application/json"
        )
        data = response.json()

        self.assertEqual(response.status_code, 200)

        self.assertEqual(data["webhook_url"], "http://test123abc.onion/webhook")
        self.assertTrue(data["webhook_enabled"])
        self.assertEqual(data["webhook_api_key"], "my-secret-key")
        self.assertEqual(data["webhook_timeout"], 15)
        self.assertEqual(data["webhook_retries"], 5)

        self.user.robot.refresh_from_db()
        self.assertEqual(self.user.robot.webhook_url, "http://test123abc.onion/webhook")
        self.assertTrue(self.user.robot.webhook_enabled)

    def test_robot_put_partial_update(self):
        """Test that PUT /api/robot/ allows partial updates."""
        path = reverse("robot")

        update_data = {"webhook_enabled": True}

        response = self.client.put(
            path, data=update_data, content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["webhook_enabled"])

    def test_robot_put_rejects_non_onion_url(self):
        """Test that PUT /api/robot/ rejects non-.onion URLs."""
        path = reverse("robot")

        update_data = {"webhook_url": "https://example.com/webhook"}

        response = self.client.put(
            path, data=update_data, content_type="application/json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("webhook_url", response.json())

    def test_robot_put_accepts_valid_onion_url(self):
        """Test that PUT /api/robot/ accepts valid .onion URLs."""
        path = reverse("robot")

        test_url = "http://testwebhook.onion/notify"

        update_data = {"webhook_url": test_url}
        response = self.client.put(
            path, data=update_data, content_type="application/json"
        )
        self.assertEqual(
            response.status_code,
            200,
            f"URL should be accepted: {test_url}. Response: {response.content}",
        )

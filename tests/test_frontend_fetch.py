from django.test import Client, TestCase
from django.urls import reverse


class FrontendFetchTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_basic_frontend_url_content(self):
        path = reverse("basic")
        response = self.client.get(path)
        self.assertContains(response, "<html>")
        self.assertContains(response, "RoboSats -")
        self.assertContains(response, "static/frontend/main.v")

    def test_pro_frontend_url_content(self):
        path = reverse("pro")
        response = self.client.get(path)
        self.assertContains(response, "<html>")
        self.assertContains(response, "static/frontend/main.v")

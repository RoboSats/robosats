import unittest
from decouple import config
from django.test import Client, TestCase
from django.urls import reverse


SKIP_FRONTEND_TESTS = config('SKIP_FRONTEND_TESTS', default=False, cast=bool)

@unittest.skipIf(SKIP_FRONTEND_TESTS, "Skipping frontend tests")
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

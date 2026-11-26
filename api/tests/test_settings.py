import importlib
import os
from unittest import mock

from django.test import SimpleTestCase

import robosats.settings


class CsrfTrustedOriginsSettingTest(SimpleTestCase):
    def reload_settings(self, value):
        with mock.patch.dict(os.environ, {"CSRF_TRUSTED_ORIGINS": value}):
            return importlib.reload(robosats.settings).CSRF_TRUSTED_ORIGINS

    def tearDown(self):
        importlib.reload(robosats.settings)

    def test_empty_value_gives_empty_list(self):
        self.assertEqual(self.reload_settings(""), [])

    def test_comma_separated_values_are_stripped(self):
        self.assertEqual(
            self.reload_settings("https://a.example, http://b.onion ,https://c.i2p"),
            ["https://a.example", "http://b.onion", "https://c.i2p"],
        )

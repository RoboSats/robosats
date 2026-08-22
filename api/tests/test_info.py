from unittest.mock import patch

from decouple import config as decouple_config
from django.test import RequestFactory, TestCase

from api.views import InfoView

_CONFIG_NO_DEFAULT = {
    "ALTERNATIVE_SITE": "",
    "ALTERNATIVE_NAME": "",
    "NODE_ALIAS": "testnode",
    "NODE_ID": "02" + "00" * 32,
    "FEE": 0.002,
    "MAKER_FEE_SPLIT": 0.125,
}


def _fake_config(devfund):
    def fake_config(option, *args, **kwargs):
        if option == "DEVFUND":
            return devfund
        if option in _CONFIG_NO_DEFAULT:
            return _CONFIG_NO_DEFAULT[option]
        return decouple_config(option, *args, **kwargs)

    return fake_config


class TestInfoView(TestCase):
    def _get_info(self, devfund):
        with (
            patch("api.views.get_robosats_commit", return_value="test-commit"),
            patch("api.views.config", side_effect=_fake_config(devfund)),
        ):
            request = RequestFactory().get("/api/info/")
            return InfoView().get(request).data

    def test_devfund_default(self):
        data = self._get_info(0.2)
        self.assertEqual(data["devfund"], 20.0)

    def test_devfund_low(self):
        data = self._get_info(0.05)
        self.assertEqual(data["devfund"], 5.0)

    def test_devfund_zero(self):
        data = self._get_info(0)
        self.assertEqual(data["devfund"], 0.0)

    def test_devfund_full(self):
        data = self._get_info(1)
        self.assertEqual(data["devfund"], 100.0)

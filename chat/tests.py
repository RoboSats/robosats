from django.test import TestCase

from chat.serializers import PostMessageSerializer


class PostMessageSerializerTest(TestCase):
    def _valid_base(self):
        return {
            "PGP_message": "-----BEGIN PGP MESSAGE-----\ntest\n-----END PGP MESSAGE-----",
            "order_id": 1,
        }

    def test_valid_data_is_accepted(self):
        data = {**self._valid_base(), "offset": 0}
        s = PostMessageSerializer(data=data)
        self.assertTrue(s.is_valid(), s.errors)

    def test_valid_data_without_offset_is_accepted(self):
        s = PostMessageSerializer(data=self._valid_base())
        self.assertTrue(s.is_valid(), s.errors)

    def test_float_offset_from_nostr_timestamp_is_rejected(self):
        data = {**self._valid_base(), "offset": 1746123456.0003}
        s = PostMessageSerializer(data=data)
        self.assertFalse(s.is_valid())

    def test_integer_offset_is_accepted(self):
        data = {**self._valid_base(), "offset": 1746123456}
        s = PostMessageSerializer(data=data)
        self.assertTrue(s.is_valid(), s.errors)

    def test_missing_pgp_message_is_rejected(self):
        data = {"order_id": 1, "offset": 0}
        s = PostMessageSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("PGP_message", s.errors)

    def test_missing_order_id_is_rejected(self):
        data = {
            "PGP_message": "-----BEGIN PGP MESSAGE-----\ntest\n-----END PGP MESSAGE-----",
            "offset": 0,
        }
        s = PostMessageSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("order_id", s.errors)

    def test_negative_offset_is_rejected(self):
        data = {**self._valid_base(), "offset": -1}
        s = PostMessageSerializer(data=data)
        self.assertFalse(s.is_valid())

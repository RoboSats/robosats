from django.contrib.auth.models import User
from django.test import TestCase

from api.models import Order
from chat.models import ChatRoom, Message


def _make_order(maker):
    return Order.objects.create(
        maker=maker,
        type=Order.Types.BUY,
        currency=1,
        amount=0,
        payment_method="SEPA",
        status=Order.Status.CHA,
        has_range=False,
        min_amount=None,
        max_amount=None,
        premium=0,
        satoshis=10000,
        is_explicit=True,
        t_to_expire=86400,
    )


class ChatGetOffsetHardeningTests(TestCase):
    def setUp(self):
        self.maker = User.objects.create_user(username="maker", password="pw")
        self.order = _make_order(self.maker)
        self.client.force_login(self.maker)

    def _get(self, offset):
        return self.client.get(
            f"/api/chat/?order_id={self.order.id}&offset={offset}",
        )

    def test_integer_offset_returns_200(self):
        resp = self._get(0)
        self.assertEqual(resp.status_code, 200)

    def test_float_offset_returns_200_not_500(self):
        resp = self._get("1761234567.0008736")
        self.assertEqual(resp.status_code, 200)

    def test_large_integer_offset_returns_empty_messages(self):
        resp = self._get(999999999)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("messages", []), [])

    def test_float_offset_treated_as_floor_integer(self):
        chatroom = ChatRoom.objects.create(
            id=self.order.id,
            order=self.order,
            maker=self.maker,
            room_group_name=f"chat_order_{self.order.id}",
        )
        Message.objects.create(
            index=1,
            PGP_message="msg1",
            order=self.order,
            chatroom=chatroom,
            sender=self.maker,
            receiver=self.maker,
        )
        Message.objects.create(
            index=2,
            PGP_message="msg2",
            order=self.order,
            chatroom=chatroom,
            sender=self.maker,
            receiver=self.maker,
        )
        resp = self._get("1.9")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        returned_indices = [m["index"] for m in data.get("messages", [])]
        self.assertIn(2, returned_indices)
        self.assertNotIn(1, returned_indices)

    def test_non_numeric_offset_returns_200_with_all_messages(self):
        resp = self._get("garbage_value")
        self.assertEqual(resp.status_code, 200)

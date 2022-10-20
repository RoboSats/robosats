from rest_framework import serializers
from chat.models import Message


class ChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = (
            "index",
            "sender",
            "PGP_message",
            "created_at",
        )
        depth = 0


class PostMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("PGP_message", "order", "offset")
        depth = 0

    offset = serializers.IntegerField(
        allow_null=True,
        default=None,
        required=False,
        min_value=0,
        help_text="Offset for message index to get as response",
    )

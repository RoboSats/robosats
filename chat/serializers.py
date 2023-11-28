from rest_framework import serializers

from chat.models import Message


class OutMessagesSerializer(serializers.ModelSerializer):
    time = serializers.DateTimeField(source="created_at")
    message = serializers.CharField(source="PGP_message")
    nick = serializers.CharField(source="sender")

    class Meta:
        model = Message
        fields = (
            "index",
            "time",
            "message",
            "nick",
        )
        depth = 0


class InMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = (
            "index",
            "created_at",
            "PGP_message",
            "sender",
        )
        depth = 0


class ChatSerializer(serializers.ModelSerializer):
    offset = serializers.IntegerField(
        allow_null=True,
        default=None,
        required=False,
        min_value=0,
        help_text="Offset for message index to get as response",
    )

    peer_pubkey = serializers.CharField(
        required=False,
        help_text="Your peer's public PGP key",
    )

    peer_connected = serializers.BooleanField(
        required=False,
        help_text="Whether your peer has connected recently to the chatroom",
    )

    messages = serializers.ListField(child=OutMessagesSerializer(), required=False)

    class Meta:
        model = Message
        fields = ("messages", "offset", "peer_connected", "peer_pubkey")
        depth = 0


class PostMessageSerializer(serializers.ModelSerializer):
    PGP_message = serializers.CharField(
        required=True,
        help_text="A new chat message",
    )

    order_id = serializers.IntegerField(
        required=True,
        min_value=0,
        help_text="Your peer's public key",
    )

    offset = serializers.IntegerField(
        allow_null=True,
        default=None,
        required=False,
        min_value=0,
        help_text="Offset for message index to get as response",
    )

    class Meta:
        model = Message
        fields = ("PGP_message", "order_id", "offset")
        depth = 0

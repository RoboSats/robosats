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
        fields = ("PGP_message","order")
        depth = 0
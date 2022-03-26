from rest_framework import serializers
from .models import Order


class ListOrderSerializer(serializers.ModelSerializer):

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "created_at",
            "expires_at",
            "type",
            "currency",
            "amount",
            "has_range",
            "min_amount",
            "max_amount",
            "payment_method",
            "is_explicit",
            "premium",
            "satoshis",
            "bondless_taker",
            "maker",
            "taker",
        )


class MakeOrderSerializer(serializers.ModelSerializer):

    class Meta:
        model = Order
        fields = (
            "type",
            "currency",
            "amount",
            "has_range",
            "min_amount",
            "max_amount",
            "payment_method",
            "is_explicit",
            "premium",
            "satoshis",
            "public_duration",
            "bond_size",
            "bondless_taker",
        )

class UpdateOrderSerializer(serializers.Serializer):
    invoice = serializers.CharField(max_length=2000,
                                    allow_null=True,
                                    allow_blank=True,
                                    default=None)
    statement = serializers.CharField(max_length=10000,
                                      allow_null=True,
                                      allow_blank=True,
                                      default=None)
    action = serializers.ChoiceField(
        choices=(
            "take",
            "update_invoice",
            "submit_statement",
            "dispute",
            "cancel",
            "confirm",
            "rate_user",
            "rate_platform",
        ),
        allow_null=False,
    )
    rating = serializers.ChoiceField(
        choices=("1", "2", "3", "4", "5"),
        allow_null=True,
        allow_blank=True,
        default=None,
    )
    amount = serializers.DecimalField(max_digits=18, decimal_places=8, allow_null=True, required=False, default=None)

class ClaimRewardSerializer(serializers.Serializer):
    invoice = serializers.CharField(max_length=2000,
                                    allow_null=True,
                                    allow_blank=True,
                                    default=None)

class PriceSerializer(serializers.Serializer):
    pass
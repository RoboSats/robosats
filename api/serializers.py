from rest_framework import serializers
from .models import MarketTick, Order


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
            "escrow_duration",
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
            "escrow_duration",
            "bond_size",
            "bondless_taker",
        )

class UpdateOrderSerializer(serializers.Serializer):
    invoice = serializers.CharField(max_length=2000,
                                    allow_null=True,
                                    allow_blank=True,
                                    default=None)
    address = serializers.CharField(max_length=100,
                                    allow_null=True,
                                    allow_blank=True,
                                    default=None)
    statement = serializers.CharField(max_length=10000,
                                      allow_null=True,
                                      allow_blank=True,
                                      default=None)
    action = serializers.ChoiceField(
        choices=(
            "pause",
            "take",
            "update_invoice",
            "update_address",
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
    mining_fee_rate = serializers.DecimalField(max_digits=6, decimal_places=3, allow_null=True, required=False, default=None)

class UserGenSerializer(serializers.Serializer):
    # Mandatory fields
    token_sha256 = serializers.CharField(
                                    min_length=64,
                                    max_length=64,
                                    allow_null=False,
                                    allow_blank=False,
                                    required=True,
                                    help_text="SHA256 of user secret")
    public_key = serializers.CharField(max_length=2000,
                                      allow_null=False,
                                      allow_blank=False,
                                      required=True,
                                      help_text="Armored ASCII PGP public key block")
    encrypted_private_key = serializers.CharField(max_length=2000,
                                      allow_null=False,
                                      allow_blank=False,
                                      required=True,
                                      help_text="Armored ASCII PGP encrypted private key block")

    # Optional fields
    ref_code = serializers.CharField(max_length=30,
                                      allow_null=True,
                                      allow_blank=True,
                                      required=False,
                                      default=None)
    counts = serializers.ListField(child=serializers.IntegerField(),
                                      allow_null=True,
                                      required=False,
                                      default=None)
    length = serializers.IntegerField(allow_null=True,
                                      default=None,
                                      required=False,
                                      min_value=1)
    unique_values = serializers.IntegerField(allow_null=True,
                                      default=None,
                                      required=False,
                                      min_value=1)

class ClaimRewardSerializer(serializers.Serializer):
    invoice = serializers.CharField(max_length=2000,
                                    allow_null=True,
                                    allow_blank=True,
                                    default=None)

class PriceSerializer(serializers.Serializer):
    pass

class TickSerializer(serializers.ModelSerializer):

    class Meta:
        model = MarketTick
        fields = (
            "timestamp",
            "currency",
            "volume",
            "price",
            "premium",
            "fee",
        )
        depth = 1

class StealthSerializer(serializers.Serializer):
    wantsStealth = serializers.BooleanField()

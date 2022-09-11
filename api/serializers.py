from rest_framework import serializers
from .models import MarketTick, Order

class InfoSerializer(serializers.Serializer):
    num_public_buy_orders = serializers.IntegerField()
    num_public_sell_orders = serializers.IntegerField()
    book_liquidity = serializers.IntegerField()
    active_robots_today = serializers.CharField()
    last_day_nonkyc_btc_premium = serializers.FloatField()
    last_day_volume = serializers.FloatField()
    lifetime_volume = serializers.FloatField()
    lnd_version = serializers.CharField()
    robosats_running_commit_hash = serializers.CharField()
    alternative_site = serializers.CharField()
    alternative_name = serializers.CharField()
    node_alias = serializers.CharField()
    node_id = serializers.CharField()
    network = serializers.CharField()
    maker_fee = serializers.FloatField()
    taker_fee = serializers.FloatField()
    bond_size = serializers.FloatField()
    current_swap_fee_rate = serializers.FloatField()
    nickname = serializers.CharField()
    referral_code = serializers.CharField()
    earned_rewards = serializers.IntegerField()


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


class OrderPublicSerializer(serializers.ModelSerializer):
    maker_nick = serializers.CharField(required=False)
    maker_status = serializers.CharField(help_text='Status of the nick - "Active" or "Inactive"', required=False)
    price = serializers.CharField(help_text="Price in order's fiat currency", required=False)

    class Meta:
        model = Order
        fields = (
            "id",
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
            "maker_nick",
            "maker_status",
            "price",
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

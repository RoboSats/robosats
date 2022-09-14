from django.template.defaultfilters import default
from rest_framework import serializers
from .models import MarketTick, Order

class InfoSerializer(serializers.Serializer):
    num_public_buy_orders = serializers.IntegerField()
    num_public_sell_orders = serializers.IntegerField()
    book_liquidity = serializers.IntegerField(help_text='Total amount of BTC in the order book')
    active_robots_today = serializers.CharField()
    last_day_nonkyc_btc_premium = serializers.FloatField(help_text='Average premium (weighted by volume) of the orders in the last 24h')
    last_day_volume = serializers.FloatField(help_text='Total volume in BTC in the last 24h')
    lifetime_volume = serializers.FloatField(help_text='Total volume in BTC since exchange\'s inception')
    lnd_version = serializers.CharField()
    robosats_running_commit_hash = serializers.CharField()
    alternative_site = serializers.CharField()
    alternative_name = serializers.CharField()
    node_alias = serializers.CharField()
    node_id = serializers.CharField()
    network = serializers.CharField()
    maker_fee = serializers.FloatField(help_text='Exchange\'s set maker fee')
    taker_fee = serializers.FloatField(help_text='Exchange\'s set taker fee ')
    bond_size = serializers.FloatField(help_text='Default bond size (percent)')
    current_swap_fee_rate = serializers.FloatField(help_text='Swap fees to perform on-chain transaction (percent)')
    nickname = serializers.CharField(help_text='Currenlty logged in Robot name')
    referral_code = serializers.CharField(help_text='Logged in users\'s referral code')
    earned_rewards = serializers.IntegerField(help_text='Logged in user\'s earned rewards in satoshis')


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
    price = serializers.IntegerField(help_text="Price in order's fiat currency", required=False)

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
    currency = serializers.IntegerField(
        help_text="Currency id. See [here](https://github.com/Reckless-Satoshi/robosats/blob/main/frontend/static/assets/currencies.json) for a list of all IDs"
    )
    payment_method = serializers.CharField(
        max_length=70,
        default="not specified",
        required=False
    )
    is_explicit = serializers.BooleanField(
        default=False,
        help_text='Whether the order is explicitly priced or not'
    )
    has_range = serializers.BooleanField(
        required=False,
        help_text='Whether the order specifies a range of amount or a fixed amount.\n\nIf `true`, then `min_amount` and `max_amount` fields are **required**.\n\n If `false` then `amount` is **required**',
        default=False,
    )
    bondless_taker = serializers.BooleanField(
        required=False,
        help_text='Whether bondless takers are allowed for this order or not',
        default=False,
    )
    satoshis = serializers.IntegerField(
        required=True,
        help_text='Satoshis to trade'
    )

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
                                      default=None,
                                      help_text="Referal code")
    counts = serializers.ListField(child=serializers.IntegerField(),
                                      allow_null=True,
                                      required=False,
                                      default=None,
                                      help_text="Counts of the unique characters in the token")
    length = serializers.IntegerField(allow_null=True,
                                      default=None,
                                      required=False,
                                      min_value=1,
                                      help_text="Length of the token")
    unique_values = serializers.IntegerField(allow_null=True,
                                      default=None,
                                      required=False,
                                      min_value=1,
                                      help_text="Number of unique values in the token")

class ClaimRewardSerializer(serializers.Serializer):
    invoice = serializers.CharField(max_length=2000,
                                    allow_null=True,
                                    allow_blank=True,
                                    default=None,
                                    help_text="A valid LN invoice with the reward amount to withdraw")

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

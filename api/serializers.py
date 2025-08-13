from decouple import config
from decimal import Decimal
from rest_framework import serializers

from .models import MarketTick, Order, Notification

RETRY_TIME = int(config("RETRY_TIME"))


class VersionSerializer(serializers.Serializer):
    major = serializers.IntegerField()
    minor = serializers.IntegerField()
    patch = serializers.IntegerField()


class InfoSerializer(serializers.Serializer):
    num_public_buy_orders = serializers.IntegerField()
    num_public_sell_orders = serializers.IntegerField()
    book_liquidity = serializers.IntegerField(
        help_text="Total amount of BTC in the order book"
    )
    active_robots_today = serializers.IntegerField()
    last_day_nonkyc_btc_premium = serializers.FloatField(
        help_text="Average premium (weighted by volume) of the orders in the last 24h"
    )
    last_day_volume = serializers.FloatField(
        help_text="Total volume in BTC in the last 24h"
    )
    lifetime_volume = serializers.FloatField(
        help_text="Total volume in BTC since exchange's inception"
    )
    lnd_version = serializers.CharField()
    cln_version = serializers.CharField()
    robosats_running_commit_hash = serializers.CharField()
    alternative_site = serializers.CharField()
    alternative_name = serializers.CharField()
    node_alias = serializers.CharField()
    node_id = serializers.CharField()
    network = serializers.CharField()
    min_order_size = serializers.IntegerField(help_text="Minimum order size in Sats")
    max_order_size = serializers.IntegerField(help_text="Maximum order size in Sats")
    swap_enabled = serializers.BooleanField(
        help_text="Whether the option for onchain swap payouts is available or not"
    )
    max_swap = serializers.IntegerField(
        help_text="Maximum size for onchain swap payouts in Sats"
    )
    maker_fee = serializers.FloatField(help_text="Exchange's set maker fee")
    taker_fee = serializers.FloatField(help_text="Exchange's set taker fee ")
    bond_size = serializers.FloatField(help_text="Default bond size (percent)")
    current_swap_fee_rate = serializers.FloatField(
        help_text="Swap fees to perform on-chain transaction (percent)"
    )
    version = VersionSerializer()
    notice_severity = serializers.ChoiceField(
        choices=[
            ("none", "none"),
            ("warning", "warning"),
            ("success", "success"),
            ("error", "error"),
            ("info", "info"),
        ]
    )
    market_price_apis = serializers.CharField()
    notice_message = serializers.CharField()


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
            "maker",
            "taker",
            "escrow_duration",
            "bond_size",
            "latitude",
            "longitude",
        )


# Only used in oas_schemas
class SummarySerializer(serializers.Serializer):
    sent_fiat = serializers.FloatField(
        required=False, help_text="same as `amount` (only for buyer)"
    )
    received_fiat = serializers.FloatField(
        required=False, help_text="same as `amount` (only for seller)"
    )
    sent_sats = serializers.IntegerField(
        required=False, help_text="The total sats you sent (only for seller)"
    )
    received_sats = serializers.IntegerField(
        required=False, help_text="same as `trade_satoshis` (only for buyer)"
    )
    is_swap = serializers.BooleanField(
        required=False, help_text="True if the payout was on-chain (only for buyer)"
    )
    is_buyer = serializers.BooleanField(
        required=False, help_text="True if the robot is the order buyer"
    )
    received_onchain_sats = serializers.IntegerField(
        required=False,
        help_text="The on-chain sats received (only for buyer and if `is_swap` is `true`)",
    )
    mining_fee_sats = serializers.IntegerField(
        required=False,
        help_text="Mining fees paid in satoshis (only for buyer and if `is_swap` is `true`)",
    )
    swap_fee_sats = serializers.IntegerField(
        required=False,
        help_text="Exchange swap fee in sats (i.e excluding miner fees) (only for buyer and if `is_swap` is `true`)",
    )
    swap_fee_percent = serializers.FloatField(
        required=False,
        help_text="same as `swap_fee_rate` (only for buyer and if `is_swap` is `true`",
    )
    bond_size_sats = serializers.IntegerField(
        required=False, help_text="The amount of Satoshis at stake"
    )
    bond_size_percent = serializers.FloatField(
        required=False, help_text="The relative size of Satoshis at stake"
    )
    trade_fee_sats = serializers.IntegerField(
        required=False,
        help_text="Exchange fees in sats (does not include swap fee and miner fee)",
    )
    trade_fee_percent = serializers.FloatField(
        required=False,
        help_text="Exchange fees in percent (does not include swap fee and miner fee)",
    )
    payment_hash = serializers.CharField(
        required=False, help_text="The payment_hash of the payout invoice"
    )
    preimage = serializers.CharField(
        required=False,
        help_text="The preimage of the payout invoice (proof of payment)",
    )
    address = serializers.CharField(
        required=False,
        help_text="The address of the payout if on-the-fly swap was selected",
    )
    txid = serializers.CharField(
        required=False,
        help_text="The transaction hash of the payout if on-the-fly swap was selected",
    )


# Only used in oas_schemas
class PlatformSummarySerializer(serializers.Serializer):
    contract_timestamp = serializers.DateTimeField(
        required=False,
        help_text="Timestamp of when the contract was finalized (price and sats fixed)",
    )
    contract_total_time = serializers.FloatField(
        required=False,
        help_text="The time taken for the contract to complete (from taker taking the order to completion of order) in seconds",
    )
    routing_fee_sats = serializers.IntegerField(
        required=False,
        help_text="Sats payed by the exchange for routing fees. Mining fee in case of on-chain swap payout",
    )
    trade_revenue_sats = serializers.IntegerField(
        required=False, help_text="The sats the exchange earned from the trade"
    )
    routing_budget_sats = serializers.FloatField(
        required=False, help_text="The budget allocated for routing costs in Satoshis"
    )
    contract_exchange_rate = serializers.FloatField(
        required=False,
        help_text="The exchange rate applied to this contract. Taken from externals APIs exactly when the taker bond was locked.",
    )


# Only used in oas_schemas
class OrderDetailSerializer(serializers.ModelSerializer):
    total_secs_exp = serializers.IntegerField(
        required=False,
        help_text="Duration of time (in seconds) to expire, according to the current status of order."
        "This is duration of time after `created_at` (in seconds) that the order will automatically expire."
        "This value changes according to which stage the order is in",
    )
    penalty = serializers.DateTimeField(
        required=False,
        help_text="Time when the user penalty will expire. Penalty applies when you create orders repeatedly without commiting a bond",
    )
    is_maker = serializers.BooleanField(
        required=False, help_text="Whether you are the maker or not"
    )
    is_taker = serializers.BooleanField(
        required=False, help_text="Whether you are the taker or not"
    )
    is_participant = serializers.BooleanField(
        required=False,
        help_text="True if you are either a taker or maker, False otherwise",
    )
    has_password = serializers.BooleanField(
        required=False,
        help_text="True if the order is password protected",
    )
    maker_status = serializers.CharField(
        required=False,
        help_text="Status of the maker:\n"
        "- **'Active'** (seen within last 2 min)\n"
        "- **'Seen Recently'** (seen within last 10 min)\n"
        "- **'Inactive'** (seen more than 10 min ago)\n\n"
        "Note: When you make a request to this route, your own status get's updated and can be seen by your counterparty",
    )
    taker_status = serializers.CharField(
        required=False,
        help_text="Status of the maker:\n"
        "- **'Active'** (seen within last 2 min)\n"
        "- **'Seen Recently'** (seen within last 10 min)\n"
        "- **'Inactive'** (seen more than 10 min ago)\n\n"
        "Note: When you make a request to this route, your own status get's updated and can be seen by your counterparty",
    )
    price_now = serializers.FloatField(
        required=False,
        help_text="Price of the order in the order's currency at the time of request (upto 5 significant digits)",
    )
    premium = serializers.CharField(
        required=False, help_text="Premium over the CEX price set by the maker"
    )
    premium_now = serializers.FloatField(
        required=False, help_text="Premium over the CEX price at the current time"
    )
    tg_enabled = serializers.BooleanField(
        required=False,
        help_text="(Only if `is_maker`) Whether Telegram notification is enabled or not",
    )
    tg_token = serializers.CharField(
        required=False,
        help_text="(Only if `is_maker`) Your telegram bot token required to enable notifications.",
    )
    tg_bot_name = serializers.CharField(
        required=False,
        help_text="(Only if `is_maker`) The Telegram username of the bot",
    )
    is_buyer = serializers.BooleanField(
        required=False,
        help_text="Whether you are a buyer of sats (you will be receiving sats)",
    )
    is_seller = serializers.BooleanField(
        required=False,
        help_text="Whether you are a seller of sats or not (you will be sending sats)",
    )
    maker_nick = serializers.CharField(
        required=False, help_text="Nickname (Robot name) of the maker"
    )
    maker_hash_id = serializers.CharField(
        required=False, help_text="The maker's robot hash"
    )
    maker_nostr_pubkey = serializers.CharField(
        required=False, help_text="The maker's robot nostr hex pubkey"
    )
    taker_nick = serializers.CharField(
        required=False, help_text="The taker's robot hash"
    )
    taker_hash_id = serializers.CharField(
        required=False, help_text="The taker's robot hash"
    )
    taker_nostr_pubkey = serializers.CharField(
        required=False, help_text="The taker's robot nostr hex pubkey"
    )
    status_message = serializers.CharField(
        required=False,
        help_text="The current status of the order corresponding to the `status`",
    )
    is_fiat_sent = serializers.BooleanField(
        required=False, help_text="Whether or not the fiat amount is sent by the buyer"
    )
    is_disputed = serializers.BooleanField(
        required=False, help_text="Whether or not the counterparty raised a dispute"
    )
    ur_nick = serializers.CharField(required=False, help_text="Your Nickname")
    maker_locked = serializers.BooleanField(
        required=False, help_text="True if maker bond is locked, False otherwise"
    )
    taker_locked = serializers.BooleanField(
        required=False, help_text="True if taker bond is locked, False otherwise"
    )
    escrow_locked = serializers.BooleanField(
        required=False,
        help_text="True if escrow is locked, False otherwise. Escrow is the sats to be sold, held by Robosats until the trade is finised.",
    )
    trade_satoshis = serializers.IntegerField(
        required=False,
        help_text="Seller sees the amount of sats they need to send. Buyer sees the amount of sats they will receive ",
    )
    bond_invoice = serializers.CharField(
        required=False, help_text="When `status` = `0`, `3`. Bond invoice to be paid"
    )
    bond_satoshis = serializers.IntegerField(
        required=False, help_text="The bond amount in satoshis"
    )
    escrow_invoice = serializers.CharField(
        required=False,
        help_text="For the seller, the escrow invoice to be held by RoboSats",
    )
    escrow_satoshis = serializers.IntegerField(
        required=False, help_text="The escrow amount in satoshis"
    )
    invoice_amount = serializers.IntegerField(
        required=False,
        help_text="The amount in sats the buyer needs to submit an invoice of to receive the trade amount",
    )
    swap_allowed = serializers.BooleanField(
        required=False, help_text="Whether on-chain swap is allowed"
    )
    swap_failure_reason = serializers.CharField(
        required=False, help_text="Reason for why on-chain swap is not available"
    )
    suggested_mining_fee_rate = serializers.FloatField(
        required=False, help_text="fee in sats/vbyte for the on-chain swap"
    )
    swap_fee_rate = serializers.FloatField(
        required=False,
        help_text="in percentage, the swap fee rate the platform charges",
    )
    latitude = serializers.FloatField(
        required=False,
        help_text="Latitude of the order for F2F payments",
    )
    longitude = serializers.FloatField(
        required=False,
        help_text="Longitude of the order for F2F payments",
    )
    pending_cancel = serializers.BooleanField(
        required=False,
        help_text="Your counterparty requested for a collaborative cancel when `status` is either `8`, `9` or `10`",
    )
    asked_for_cancel = serializers.BooleanField(
        required=False,
        help_text="You requested for a collaborative cancel `status` is either `8`, `9` or `10`",
    )
    statement_submitted = serializers.BooleanField(
        required=False,
        help_text="True if you have submitted a statement. Available when `status` is `11`",
    )
    retries = serializers.IntegerField(
        required=False,
        help_text="Number of times ln node has tried to make the payment to you (only if you are the buyer)",
    )
    next_retry_time = serializers.DateTimeField(
        required=False,
        help_text=f"The next time payment will be retried. Payment is retried every {RETRY_TIME} sec",
    )
    failure_reason = serializers.CharField(
        required=False, help_text="The reason the payout failed"
    )
    invoice_expired = serializers.BooleanField(
        required=False,
        help_text="True if the payout invoice expired. `invoice_amount` will be re-set and sent which means the user has to submit a new invoice to be payed",
    )
    trade_fee_percent = serializers.IntegerField(
        required=False,
        help_text="The fee for the trade (fees differ for maker and taker)",
    )
    bond_size_sats = serializers.IntegerField(
        required=False, help_text="The size of the bond in sats"
    )
    bond_size_percent = serializers.IntegerField(
        required=False, help_text="same as `bond_size`"
    )
    maker_summary = SummarySerializer(required=False)
    taker_summary = SummarySerializer(required=False)
    satoshis_now = serializers.IntegerField(
        required=False,
        help_text="Maximum size of the order right now in Satoshis",
    )
    platform_summary = PlatformSummarySerializer(required=False)
    expiry_message = serializers.CharField(
        required=False,
        help_text="The reason the order expired (message associated with the `expiry_reason`)",
    )
    num_satoshis = serializers.IntegerField(
        required=False,
        help_text="only if status = `14` (Successful Trade) and is_buyer = `true`",
    )
    sent_satoshis = serializers.IntegerField(
        required=False,
        help_text="only if status = `14` (Successful Trade) and is_buyer = `true`",
    )
    txid = serializers.CharField(
        required=False,
        help_text="Transaction id of the on-chain swap payout. Only if status = `14` (Successful Trade) and is_buyer = `true`",
    )
    network = serializers.CharField(
        required=False,
        help_text="The network eg. 'testnet', 'mainnet'. Only if status = `14` (Successful Trade) and is_buyer = `true`",
    )
    chat_last_index = serializers.IntegerField(
        required=False,
        help_text="The index of the last message sent in the trade chatroom",
    )

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
            "premium_now",
            "satoshis",
            "satoshis_now",
            "maker",
            "taker",
            "escrow_duration",
            "total_secs_exp",
            "penalty",
            "is_maker",
            "is_taker",
            "is_participant",
            "has_password",
            "maker_status",
            "taker_status",
            "price_now",
            "tg_enabled",
            "tg_token",
            "tg_bot_name",
            "is_buyer",
            "is_seller",
            "maker_nick",
            "maker_hash_id",
            "maker_nostr_pubkey",
            "taker_nick",
            "taker_hash_id",
            "taker_nostr_pubkey",
            "status_message",
            "is_fiat_sent",
            "is_disputed",
            "ur_nick",
            "ur_nick",
            "maker_locked",
            "taker_locked",
            "escrow_locked",
            "trade_satoshis",
            "bond_invoice",
            "bond_satoshis",
            "escrow_invoice",
            "escrow_satoshis",
            "invoice_amount",
            "swap_allowed",
            "swap_failure_reason",
            "suggested_mining_fee_rate",
            "swap_fee_rate",
            "pending_cancel",
            "asked_for_cancel",
            "statement_submitted",
            "retries",
            "next_retry_time",
            "failure_reason",
            "invoice_expired",
            "public_duration",
            "bond_size",
            "trade_fee_percent",
            "bond_size_sats",
            "bond_size_percent",
            "maker_summary",
            "taker_summary",
            "platform_summary",
            "expiry_reason",
            "expiry_message",
            "num_satoshis",
            "sent_satoshis",
            "txid",
            "network",
            "latitude",
            "longitude",
            "chat_last_index",
        )


class ListNotificationSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField(
        help_text="The `status` of the order when the notification was trigered",
    )

    class Meta:
        model = Notification
        fields = ("title", "description", "order_id", "status", "created_at")

    def get_status(self, notification) -> int:
        return notification.order.status


class OrderPublicSerializer(serializers.ModelSerializer):
    maker_nick = serializers.CharField(required=False)
    maker_hash_id = serializers.CharField(required=False)
    maker_status = serializers.CharField(
        help_text='Status of the nick - "Active", "Seen Recently" or "Inactive"',
        required=False,
    )
    price = serializers.FloatField(
        help_text="Price in order's fiat currency", required=False
    )
    satoshis_now = serializers.IntegerField(
        help_text="The amount of sats to be traded at the present moment (not including the fees)",
        required=False,
    )

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
            "maker",
            "maker_nick",
            "maker_hash_id",
            "maker_status",
            "price",
            "escrow_duration",
            "satoshis_now",
            "bond_size",
            "latitude",
            "longitude",
        )


class MakeOrderSerializer(serializers.ModelSerializer):
    currency = serializers.IntegerField(
        required=True,
        help_text="Currency id. See [here](https://github.com/RoboSats/robosats/blob/main/frontend/static/assets/currencies.json) for a list of all IDs",
    )
    payment_method = serializers.CharField(
        max_length=70,
        default="not specified",
        required=False,
        help_text="Can be any string. The UI recognizes [these payment methods](https://github.com/RoboSats/robosats/blob/main/frontend/src/components/payment-methods/Methods.js) and displays them with a logo.",
    )
    is_explicit = serializers.BooleanField(
        default=False,
        help_text="Whether the order is explicitly priced or not. If set to `true` then `satoshis` need to be specified",
    )
    has_range = serializers.BooleanField(
        default=False,
        help_text="Whether the order specifies a range of amount or a fixed amount.\n\nIf `true`, then `min_amount` and `max_amount` fields are **required**.\n\n If `false` then `amount` is **required**",
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
            "latitude",
            "longitude",
            "password",
        )


class UpdateOrderSerializer(serializers.Serializer):
    password = serializers.CharField(
        max_length=2000,
        allow_null=True,
        allow_blank=True,
        default=None,
        help_text="In case the order is password protected",
    )
    invoice = serializers.CharField(
        max_length=15000,
        allow_null=True,
        allow_blank=True,
        default=None,
        help_text="Invoice used for payouts. Must be PGP signed with the robot's public key. The expected Armored PGP header is -----BEGIN PGP SIGNED MESSAGE-----\nHash: SHA512\n\n",
    )
    routing_budget_ppm = serializers.IntegerField(
        default=0,
        min_value=Decimal(0),
        max_value=100_001,
        allow_null=True,
        required=False,
        help_text="Max budget to allocate for routing in PPM",
    )
    address = serializers.CharField(
        max_length=15000,
        allow_null=True,
        allow_blank=True,
        default=None,
        help_text="Onchain address used for payouts. Must be PGP signed with the robot's public key. The expected Armored PGP header is -----BEGIN PGP SIGNED MESSAGE-----\nHash: SHA512\n\n",
    )
    statement = serializers.CharField(
        max_length=500_000, allow_null=True, allow_blank=True, default=None
    )
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
            "undo_confirm",
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
    amount = serializers.DecimalField(
        max_digits=18, decimal_places=8, allow_null=True, required=False, default=None
    )
    mining_fee_rate = serializers.DecimalField(
        max_digits=6, decimal_places=3, allow_null=True, required=False, default=None
    )
    cancel_status = serializers.ChoiceField(
        choices=Order.Status.choices,
        allow_null=True,
        allow_blank=True,
        default=None,
        help_text="Status the order should have for it to be cancelled.",
    )


class ClaimRewardSerializer(serializers.Serializer):
    invoice = serializers.CharField(
        max_length=2000,
        allow_null=True,
        allow_blank=True,
        default=None,
        help_text="A valid LN invoice with the reward amount to withdraw",
    )
    routing_budget_ppm = serializers.IntegerField(
        default=0,
        min_value=Decimal(0),
        max_value=100_001,
        allow_null=True,
        required=False,
        help_text="Max budget to allocate for routing in PPM",
    )


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
        depth = 0


class ReviewSerializer(serializers.Serializer):
    pubkey = serializers.CharField(
        help_text="Robot's nostr hex pubkey",
        allow_null=False,
        allow_blank=False,
        required=True,
    )


class StealthSerializer(serializers.Serializer):
    wantsStealth = serializers.BooleanField()

import api.models.onchain_payment
from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import re
import uuid


class Migration(migrations.Migration):
    replaces = [
        ("api", "0001_initial"),
        ("api", "0002_auto_20220307_0821"),
        ("api", "0003_auto_20220324_2230"),
        ("api", "0004_alter_currency_currency"),
        ("api", "0005_alter_order_payment_method"),
        ("api", "0006_alter_currency_currency"),
        ("api", "0007_lnpayment_in_flight"),
        ("api", "0008_auto_20220501_1923"),
        ("api", "0009_alter_currency_currency"),
        ("api", "0010_lnpayment_failure_reason"),
        ("api", "0011_auto_20220527_0057"),
        ("api", "0012_auto_20220601_2221"),
        ("api", "0013_auto_20220605_1156"),
        ("api", "0014_auto_20220619_0535"),
        ("api", "0015_auto_20220702_1500"),
        ("api", "0016_alter_onchainpayment_swap_fee_rate"),
        ("api", "0017_auto_20220710_1127"),
        ("api", "0018_order_last_satoshis_time"),
        ("api", "0019_order_contract_finalization_time"),
        ("api", "0020_auto_20220731_1425"),
        ("api", "0021_auto_20220813_1333"),
        ("api", "0022_alter_profile_wants_stealth"),
        ("api", "0023_alter_currency_currency"),
        ("api", "0024_auto_20221109_2250"),
        ("api", "0025_auto_20221127_1135"),
        ("api", "0026_auto_20230213_2023"),
        ("api", "0027_auto_20230314_1801"),
        ("api", "0028_onchainpayment_broadcasted"),
        ("api", "0029_alter_currency_currency"),
        ("api", "0030_auto_20230410_1850"),
        ("api", "0031_auto_20230425_1211"),
        ("api", "0032_auto_20230430_1419"),
        ("api", "0033_auto_20230430_1603"),
        ("api", "0034_auto_20230430_1640"),
        ("api", "0035_rename_profile_robot"),
        ("api", "0036_remove_order_maker_last_seen_and_more"),
    ]

    initial = True

    dependencies = [
        ("control", "0002_auto_20220619_0535"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Currency",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "currency",
                    models.PositiveSmallIntegerField(
                        choices=[
                            (1, "USD"),
                            (2, "EUR"),
                            (3, "JPY"),
                            (4, "GBP"),
                            (5, "AUD"),
                            (6, "CAD"),
                            (7, "CHF"),
                            (8, "CNY"),
                            (9, "HKD"),
                            (10, "NZD"),
                            (11, "SEK"),
                            (12, "KRW"),
                            (13, "SGD"),
                            (14, "NOK"),
                            (15, "MXN"),
                            (16, "BYN"),
                            (17, "RUB"),
                            (18, "ZAR"),
                            (19, "TRY"),
                            (20, "BRL"),
                            (21, "CLP"),
                            (22, "CZK"),
                            (23, "DKK"),
                            (24, "HRK"),
                            (25, "HUF"),
                            (26, "INR"),
                            (27, "ISK"),
                            (28, "PLN"),
                            (29, "RON"),
                            (30, "ARS"),
                            (31, "VES"),
                            (32, "COP"),
                            (33, "PEN"),
                            (34, "UYU"),
                            (35, "PYG"),
                            (36, "BOB"),
                            (37, "IDR"),
                            (38, "ANG"),
                            (39, "CRC"),
                            (40, "CUP"),
                            (41, "DOP"),
                            (42, "GHS"),
                            (43, "GTQ"),
                            (44, "ILS"),
                            (45, "JMD"),
                            (46, "KES"),
                            (47, "KZT"),
                            (48, "MYR"),
                            (49, "NAD"),
                            (50, "NGN"),
                            (51, "AZN"),
                            (52, "PAB"),
                            (53, "PHP"),
                            (54, "PKR"),
                            (55, "QAR"),
                            (56, "SAR"),
                            (57, "THB"),
                            (58, "TTD"),
                            (59, "VND"),
                            (60, "XOF"),
                            (61, "TWD"),
                            (62, "TZS"),
                            (63, "XAF"),
                            (64, "UAH"),
                            (65, "EGP"),
                            (66, "LKR"),
                            (67, "MAD"),
                            (68, "AED"),
                            (69, "TND"),
                            (70, "ETB"),
                            (71, "GEL"),
                            (72, "UGX"),
                            (73, "RSD"),
                            (74, "IRT"),
                            (300, "XAU"),
                            (1000, "BTC"),
                        ],
                        unique=True,
                    ),
                ),
                (
                    "exchange_rate",
                    models.DecimalField(
                        decimal_places=4,
                        default=None,
                        max_digits=18,
                        null=True,
                        validators=[django.core.validators.MinValueValidator(0)],
                    ),
                ),
                ("timestamp", models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={
                "verbose_name": "Cached market currency",
                "verbose_name_plural": "Currencies",
            },
        ),
        migrations.CreateModel(
            name="LNPayment",
            fields=[
                (
                    "type",
                    models.PositiveSmallIntegerField(
                        choices=[(0, "Regular invoice"), (1, "hold invoice")], default=1
                    ),
                ),
                (
                    "concept",
                    models.PositiveSmallIntegerField(
                        choices=[
                            (0, "Maker bond"),
                            (1, "Taker bond"),
                            (2, "Trade escrow"),
                            (3, "Payment to buyer"),
                            (4, "Withdraw rewards"),
                        ],
                        default=0,
                    ),
                ),
                (
                    "status",
                    models.PositiveSmallIntegerField(
                        choices=[
                            (0, "Generated"),
                            (1, "Locked"),
                            (2, "Settled"),
                            (3, "Returned"),
                            (4, "Cancelled"),
                            (5, "Expired"),
                            (6, "Valid"),
                            (7, "In flight"),
                            (8, "Succeeded"),
                            (9, "Routing failed"),
                        ],
                        default=0,
                    ),
                ),
                (
                    "payment_hash",
                    models.CharField(
                        blank=True,
                        default=None,
                        max_length=100,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                (
                    "invoice",
                    models.CharField(
                        blank=True,
                        default=None,
                        max_length=1200,
                        null=True,
                        unique=True,
                    ),
                ),
                (
                    "preimage",
                    models.CharField(
                        blank=True, default=None, max_length=64, null=True, unique=True
                    ),
                ),
                (
                    "description",
                    models.CharField(
                        blank=True, default=None, max_length=500, null=True
                    ),
                ),
                (
                    "num_satoshis",
                    models.PositiveBigIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(100),
                            django.core.validators.MaxValueValidator(7500000.0),
                        ]
                    ),
                ),
                ("created_at", models.DateTimeField()),
                ("expires_at", models.DateTimeField()),
                (
                    "cltv_expiry",
                    models.PositiveSmallIntegerField(
                        blank=True, default=None, null=True
                    ),
                ),
                (
                    "expiry_height",
                    models.PositiveBigIntegerField(blank=True, default=None, null=True),
                ),
                ("routing_attempts", models.PositiveSmallIntegerField(default=0)),
                (
                    "last_routing_time",
                    models.DateTimeField(blank=True, default=None, null=True),
                ),
                (
                    "receiver",
                    models.ForeignKey(
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="receiver",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "sender",
                    models.ForeignKey(
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="sender",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "fee",
                    models.DecimalField(decimal_places=3, default=0, max_digits=10),
                ),
                ("in_flight", models.BooleanField(default=False)),
                (
                    "failure_reason",
                    models.PositiveSmallIntegerField(
                        choices=[
                            (0, "Payment isn't failed (yet)"),
                            (
                                1,
                                "There are more routes to try, but the payment timeout was exceeded.",
                            ),
                            (
                                2,
                                "All possible routes were tried and failed permanently. Or there were no routes to the destination at all.",
                            ),
                            (3, "A non-recoverable error has occurred."),
                            (
                                4,
                                "Payment details are incorrect (unknown hash, invalid amount or invalid final CLTV delta).",
                            ),
                            (5, "Insufficient unlocked balance in RoboSats' node."),
                        ],
                        default=None,
                        null=True,
                    ),
                ),
                (
                    "routing_budget_ppm",
                    models.PositiveBigIntegerField(
                        default=0,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(100000),
                        ],
                    ),
                ),
                (
                    "routing_budget_sats",
                    models.DecimalField(decimal_places=3, default=0, max_digits=10),
                ),
            ],
            options={
                "verbose_name": "Lightning payment",
                "verbose_name_plural": "Lightning payments",
            },
        ),
        migrations.CreateModel(
            name="MarketTick",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "price",
                    models.DecimalField(
                        decimal_places=2,
                        default=None,
                        max_digits=16,
                        null=True,
                        validators=[django.core.validators.MinValueValidator(0)],
                    ),
                ),
                (
                    "volume",
                    models.DecimalField(
                        decimal_places=8,
                        default=None,
                        max_digits=8,
                        null=True,
                        validators=[django.core.validators.MinValueValidator(0)],
                    ),
                ),
                (
                    "premium",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        default=None,
                        max_digits=5,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(-100),
                            django.core.validators.MaxValueValidator(999),
                        ],
                    ),
                ),
                ("timestamp", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "fee",
                    models.DecimalField(
                        decimal_places=4,
                        default=0.002,
                        max_digits=4,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(1),
                        ],
                    ),
                ),
                (
                    "currency",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="api.currency",
                    ),
                ),
            ],
            options={
                "verbose_name": "Market tick",
                "verbose_name_plural": "Market ticks",
            },
        ),
        migrations.CreateModel(
            name="OnchainPayment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "concept",
                    models.PositiveSmallIntegerField(
                        choices=[(3, "Payment to buyer")], default=3
                    ),
                ),
                (
                    "status",
                    models.PositiveSmallIntegerField(
                        choices=[
                            (0, "Created"),
                            (1, "Valid"),
                            (2, "In mempool"),
                            (3, "Confirmed"),
                            (4, "Cancelled"),
                            (5, "Queued"),
                        ],
                        default=0,
                    ),
                ),
                (
                    "address",
                    models.CharField(
                        blank=True, default=None, max_length=100, null=True
                    ),
                ),
                (
                    "txid",
                    models.CharField(
                        blank=True, default=None, max_length=64, null=True, unique=True
                    ),
                ),
                (
                    "num_satoshis",
                    models.PositiveBigIntegerField(
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(5000.0),
                            django.core.validators.MaxValueValidator(7500000.0),
                        ],
                    ),
                ),
                (
                    "sent_satoshis",
                    models.PositiveBigIntegerField(
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(5000.0),
                            django.core.validators.MaxValueValidator(7500000.0),
                        ],
                    ),
                ),
                (
                    "suggested_mining_fee_rate",
                    models.DecimalField(
                        decimal_places=3,
                        default=2.05,
                        max_digits=6,
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(999),
                        ],
                    ),
                ),
                (
                    "mining_fee_rate",
                    models.DecimalField(
                        decimal_places=3,
                        default=2.05,
                        max_digits=6,
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(999),
                        ],
                    ),
                ),
                ("mining_fee_sats", models.PositiveBigIntegerField(default=0)),
                (
                    "swap_fee_rate",
                    models.DecimalField(decimal_places=2, default=0.8, max_digits=4),
                ),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "balance",
                    models.ForeignKey(
                        default=api.models.onchain_payment.OnchainPayment.get_balance,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="balance",
                        to="control.balancelog",
                    ),
                ),
                (
                    "receiver",
                    models.ForeignKey(
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="tx_receiver",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("broadcasted", models.BooleanField(default=False)),
            ],
            options={
                "verbose_name": "Onchain payment",
                "verbose_name_plural": "Onchain payments",
            },
        ),
        migrations.CreateModel(
            name="Robot",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("total_contracts", models.PositiveIntegerField(default=0)),
                (
                    "telegram_token",
                    models.CharField(blank=True, max_length=20, null=True),
                ),
                (
                    "telegram_chat_id",
                    models.BigIntegerField(blank=True, default=None, null=True),
                ),
                ("telegram_enabled", models.BooleanField(default=False)),
                (
                    "telegram_lang_code",
                    models.CharField(blank=True, max_length=10, null=True),
                ),
                ("telegram_welcomed", models.BooleanField(default=False)),
                ("num_disputes", models.PositiveIntegerField(default=0)),
                ("lost_disputes", models.PositiveIntegerField(default=0)),
                ("num_disputes_started", models.PositiveIntegerField(default=0)),
                (
                    "orders_disputes_started",
                    models.CharField(
                        blank=True,
                        default=None,
                        max_length=999,
                        null=True,
                        validators=[
                            django.core.validators.RegexValidator(
                                re.compile("^\\d+(?:,\\d+)*\\Z"),
                                code="invalid",
                                message="Enter only digits separated by commas.",
                            )
                        ],
                    ),
                ),
                (
                    "avatar",
                    models.ImageField(
                        blank=True,
                        default="static/assets/avatars/unknown_avatar.png",
                        upload_to="",
                        verbose_name="Avatar",
                    ),
                ),
                (
                    "penalty_expiration",
                    models.DateTimeField(blank=True, default=None, null=True),
                ),
                (
                    "platform_rating",
                    models.PositiveIntegerField(blank=True, default=None, null=True),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("claimed_rewards", models.PositiveIntegerField(default=0)),
                ("earned_rewards", models.PositiveIntegerField(default=0)),
                (
                    "encrypted_private_key",
                    models.TextField(
                        blank=True, default=None, max_length=2000, null=True
                    ),
                ),
                (
                    "public_key",
                    models.TextField(
                        blank=True, default=None, max_length=2000, null=True
                    ),
                ),
                ("wants_stealth", models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name="Order",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "status",
                    models.PositiveSmallIntegerField(
                        choices=[
                            (0, "Waiting for maker bond"),
                            (1, "Public"),
                            (2, "Paused"),
                            (3, "Waiting for taker bond"),
                            (4, "Cancelled"),
                            (5, "Expired"),
                            (6, "Waiting for trade collateral and buyer invoice"),
                            (7, "Waiting only for seller trade collateral"),
                            (8, "Waiting only for buyer invoice"),
                            (9, "Sending fiat - In chatroom"),
                            (10, "Fiat sent - In chatroom"),
                            (11, "In dispute"),
                            (12, "Collaboratively cancelled"),
                            (13, "Sending satoshis to buyer"),
                            (14, "Sucessful trade"),
                            (15, "Failed lightning network routing"),
                            (16, "Wait for dispute resolution"),
                            (17, "Maker lost dispute"),
                            (18, "Taker lost dispute"),
                        ],
                        default=0,
                    ),
                ),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("expires_at", models.DateTimeField()),
                (
                    "type",
                    models.PositiveSmallIntegerField(choices=[(0, "BUY"), (1, "SELL")]),
                ),
                (
                    "amount",
                    models.DecimalField(
                        blank=True, decimal_places=8, max_digits=18, null=True
                    ),
                ),
                (
                    "payment_method",
                    models.CharField(
                        blank=True, default="not specified", max_length=70
                    ),
                ),
                ("is_explicit", models.BooleanField(default=False)),
                (
                    "premium",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        default=0,
                        max_digits=5,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(-100),
                            django.core.validators.MaxValueValidator(999),
                        ],
                    ),
                ),
                (
                    "satoshis",
                    models.PositiveBigIntegerField(
                        blank=True,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(20000),
                            django.core.validators.MaxValueValidator(5000000),
                        ],
                    ),
                ),
                (
                    "t0_satoshis",
                    models.PositiveBigIntegerField(
                        blank=True,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(20000),
                            django.core.validators.MaxValueValidator(5000000),
                        ],
                    ),
                ),
                (
                    "last_satoshis",
                    models.PositiveBigIntegerField(
                        blank=True,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(10000000),
                        ],
                    ),
                ),
                ("maker_asked_cancel", models.BooleanField(default=False)),
                ("taker_asked_cancel", models.BooleanField(default=False)),
                ("is_fiat_sent", models.BooleanField(default=False)),
                ("is_disputed", models.BooleanField(default=False)),
                (
                    "maker_statement",
                    models.TextField(
                        blank=True, default=None, max_length=50000, null=True
                    ),
                ),
                (
                    "taker_statement",
                    models.TextField(
                        blank=True, default=None, max_length=50000, null=True
                    ),
                ),
                ("maker_rated", models.BooleanField(default=False)),
                ("taker_rated", models.BooleanField(default=False)),
                ("maker_platform_rated", models.BooleanField(default=False)),
                ("taker_platform_rated", models.BooleanField(default=False)),
                (
                    "currency",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="api.currency",
                    ),
                ),
                (
                    "maker",
                    models.ForeignKey(
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="maker",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "maker_bond",
                    models.OneToOneField(
                        blank=True,
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="order_made",
                        to="api.lnpayment",
                    ),
                ),
                (
                    "payout",
                    models.OneToOneField(
                        blank=True,
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="order_paid_LN",
                        to="api.lnpayment",
                    ),
                ),
                (
                    "taker",
                    models.ForeignKey(
                        blank=True,
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="taker",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "taker_bond",
                    models.OneToOneField(
                        blank=True,
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="order_taken",
                        to="api.lnpayment",
                    ),
                ),
                (
                    "trade_escrow",
                    models.OneToOneField(
                        blank=True,
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="order_escrow",
                        to="api.lnpayment",
                    ),
                ),
                (
                    "bond_size",
                    models.DecimalField(
                        decimal_places=2,
                        default=3.0,
                        max_digits=4,
                        validators=[
                            django.core.validators.MinValueValidator(2.0),
                            django.core.validators.MaxValueValidator(15.0),
                        ],
                    ),
                ),
                ("has_range", models.BooleanField(default=False)),
                (
                    "max_amount",
                    models.DecimalField(
                        blank=True, decimal_places=8, max_digits=18, null=True
                    ),
                ),
                (
                    "min_amount",
                    models.DecimalField(
                        blank=True, decimal_places=8, max_digits=18, null=True
                    ),
                ),
                (
                    "public_duration",
                    models.PositiveBigIntegerField(
                        default=86399,
                        validators=[
                            django.core.validators.MinValueValidator(597.6),
                            django.core.validators.MaxValueValidator(86400.0),
                        ],
                    ),
                ),
                (
                    "escrow_duration",
                    models.PositiveBigIntegerField(
                        default=10799,
                        validators=[
                            django.core.validators.MinValueValidator(1800),
                            django.core.validators.MaxValueValidator(28800),
                        ],
                    ),
                ),
                (
                    "expiry_reason",
                    models.PositiveSmallIntegerField(
                        blank=True,
                        choices=[
                            (0, "Expired not taken"),
                            (1, "Maker bond not locked"),
                            (2, "Escrow not locked"),
                            (3, "Invoice not submitted"),
                            (4, "Neither escrow locked or invoice submitted"),
                        ],
                        default=None,
                        null=True,
                    ),
                ),
                ("is_swap", models.BooleanField(default=False)),
                (
                    "payout_tx",
                    models.OneToOneField(
                        blank=True,
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="order_paid_TX",
                        to="api.onchainpayment",
                    ),
                ),
                (
                    "last_satoshis_time",
                    models.DateTimeField(blank=True, default=None, null=True),
                ),
                (
                    "contract_finalization_time",
                    models.DateTimeField(blank=True, default=None, null=True),
                ),
                ("reference", models.UUIDField(default=uuid.uuid4, editable=False)),
                ("reverted_fiat_sent", models.BooleanField(default=False)),
                (
                    "proceeds",
                    models.PositiveBigIntegerField(
                        blank=True,
                        default=0,
                        null=True,
                        validators=[django.core.validators.MinValueValidator(0)],
                    ),
                ),
            ],
        ),
    ]

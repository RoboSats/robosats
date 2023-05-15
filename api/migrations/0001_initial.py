from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import re
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Currency',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('currency', models.PositiveSmallIntegerField(choices=[(1, 'USD'), (2, 'EUR'), (3, 'JPY'), (4, 'GBP'), (5, 'AUD'), (6, 'CAD'), (7, 'CHF'), (8, 'CNY'), (9, 'HKD'), (10, 'NZD'), (11, 'SEK'), (12, 'KRW'), (13, 'SGD'), (14, 'NOK'), (15, 'MXN'), (16, 'KRW'), (17, 'RUB'), (18, 'ZAR'), (19, 'TRY'), (20, 'BRL'), (21, 'CLP'), (22, 'CZK'), (23, 'DKK'), (24, 'HRK'), (25, 'HUF'), (26, 'INR'), (27, 'ISK'), (28, 'PLN'), (29, 'RON'), (30, 'ARS'), (31, 'VES'), (32, 'COP'), (33, 'PEN'), (34, 'UYU'), (35, 'PYG'), (36, 'BOB'), (37, 'IDR'), (38, 'ANG'), (39, 'CRC'), (40, 'CUP'), (41, 'DOP'), (42, 'GHS'), (43, 'GTQ'), (44, 'ILS'), (45, 'JMD'), (46, 'KES'), (47, 'KZT'), (48, 'MYR'), (49, 'NAD'), (50, 'NGN'), (51, 'AZN'), (52, 'PAB'), (53, 'PHP'), (54, 'PKR'), (55, 'QAR'), (56, 'SAR'), (57, 'THB'), (58, 'TTD'), (59, 'VND'), (60, 'XOF'), (300, 'XAU'), (1000, 'BTC')], unique=True)),
                ('exchange_rate', models.DecimalField(decimal_places=4, default=None, max_digits=14, null=True, validators=[django.core.validators.MinValueValidator(0)])),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Cached market currency',
                'verbose_name_plural': 'Currencies',
            },
        ),
        migrations.CreateModel(
            name='LNPayment',
            fields=[
                ('type', models.PositiveSmallIntegerField(choices=[(0, 'Regular invoice'), (1, 'hold invoice')], default=1)),
                ('concept', models.PositiveSmallIntegerField(choices=[(0, 'Maker bond'), (1, 'Taker bond'), (2, 'Trade escrow'), (3, 'Payment to buyer')], default=0)),
                ('status', models.PositiveSmallIntegerField(choices=[(0, 'Generated'), (1, 'Locked'), (2, 'Settled'), (3, 'Returned'), (4, 'Cancelled'), (5, 'Expired'), (6, 'Valid'), (7, 'In flight'), (8, 'Succeeded'), (9, 'Routing failed')], default=0)),
                ('payment_hash', models.CharField(blank=True, default=None, max_length=100, primary_key=True, serialize=False, unique=True)),
                ('invoice', models.CharField(blank=True, default=None, max_length=1200, null=True, unique=True)),
                ('preimage', models.CharField(blank=True, default=None, max_length=64, null=True, unique=True)),
                ('description', models.CharField(blank=True, default=None, max_length=500, null=True)),
                ('num_satoshis', models.PositiveBigIntegerField(validators=[django.core.validators.MinValueValidator(100.0), django.core.validators.MaxValueValidator(506000.0)])),
                ('created_at', models.DateTimeField()),
                ('expires_at', models.DateTimeField()),
                ('cltv_expiry', models.PositiveSmallIntegerField(blank=True, default=None, null=True)),
                ('expiry_height', models.PositiveBigIntegerField(blank=True, default=None, null=True)),
                ('routing_attempts', models.PositiveSmallIntegerField(default=0)),
                ('last_routing_time', models.DateTimeField(blank=True, default=None, null=True)),
                ('receiver', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='receiver', to=settings.AUTH_USER_MODEL)),
                ('sender', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='sender', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Lightning payment',
                'verbose_name_plural': 'Lightning payments',
            },
        ),
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_contracts', models.PositiveIntegerField(default=0)),
                ('total_ratings', models.PositiveIntegerField(default=0)),
                ('latest_ratings', models.CharField(blank=True, default=None, max_length=999, null=True, validators=[django.core.validators.RegexValidator(re.compile('^\\d+(?:,\\d+)*\\Z'), code='invalid', message='Enter only digits separated by commas.')])),
                ('avg_rating', models.DecimalField(blank=True, decimal_places=1, default=None, max_digits=4, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('telegram_token', models.CharField(blank=True, max_length=20, null=True)),
                ('telegram_chat_id', models.BigIntegerField(blank=True, default=None, null=True)),
                ('telegram_enabled', models.BooleanField(default=False)),
                ('telegram_lang_code', models.CharField(blank=True, max_length=4, null=True)),
                ('telegram_welcomed', models.BooleanField(default=False)),
                ('num_disputes', models.PositiveIntegerField(default=0)),
                ('lost_disputes', models.PositiveIntegerField(default=0)),
                ('num_disputes_started', models.PositiveIntegerField(default=0)),
                ('orders_disputes_started', models.CharField(blank=True, default=None, max_length=999, null=True, validators=[django.core.validators.RegexValidator(re.compile('^\\d+(?:,\\d+)*\\Z'), code='invalid', message='Enter only digits separated by commas.')])),
                ('avatar', models.ImageField(blank=True, default='static/assets/avatars/unknown_avatar.png', upload_to='', verbose_name='Avatar')),
                ('penalty_expiration', models.DateTimeField(blank=True, default=None, null=True)),
                ('platform_rating', models.PositiveIntegerField(blank=True, default=None, null=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.PositiveSmallIntegerField(choices=[(0, 'Waiting for maker bond'), (1, 'Public'), (2, 'Deleted'), (3, 'Waiting for taker bond'), (4, 'Cancelled'), (5, 'Expired'), (6, 'Waiting for trade collateral and buyer invoice'), (7, 'Waiting only for seller trade collateral'), (8, 'Waiting only for buyer invoice'), (9, 'Sending fiat - In chatroom'), (10, 'Fiat sent - In chatroom'), (11, 'In dispute'), (12, 'Collaboratively cancelled'), (13, 'Sending satoshis to buyer'), (14, 'Sucessful trade'), (15, 'Failed lightning network routing'), (16, 'Wait for dispute resolution'), (17, 'Maker lost dispute'), (18, 'Taker lost dispute')], default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('type', models.PositiveSmallIntegerField(choices=[(0, 'BUY'), (1, 'SELL')])),
                ('amount', models.DecimalField(decimal_places=8, max_digits=16, validators=[django.core.validators.MinValueValidator(1e-08)])),
                ('payment_method', models.CharField(blank=True, default='not specified', max_length=35)),
                ('is_explicit', models.BooleanField(default=False)),
                ('premium', models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(-100), django.core.validators.MaxValueValidator(999)])),
                ('satoshis', models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(10000), django.core.validators.MaxValueValidator(500000)])),
                ('t0_satoshis', models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(10000), django.core.validators.MaxValueValidator(500000)])),
                ('last_satoshis', models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(1000000)])),
                ('maker_last_seen', models.DateTimeField(blank=True, default=None, null=True)),
                ('taker_last_seen', models.DateTimeField(blank=True, default=None, null=True)),
                ('maker_asked_cancel', models.BooleanField(default=False)),
                ('taker_asked_cancel', models.BooleanField(default=False)),
                ('is_fiat_sent', models.BooleanField(default=False)),
                ('is_disputed', models.BooleanField(default=False)),
                ('maker_statement', models.TextField(blank=True, default=None, max_length=5000, null=True)),
                ('taker_statement', models.TextField(blank=True, default=None, max_length=5000, null=True)),
                ('maker_rated', models.BooleanField(default=False)),
                ('taker_rated', models.BooleanField(default=False)),
                ('maker_platform_rated', models.BooleanField(default=False)),
                ('taker_platform_rated', models.BooleanField(default=False)),
                ('currency', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.currency')),
                ('maker', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='maker', to=settings.AUTH_USER_MODEL)),
                ('maker_bond', models.OneToOneField(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='order_made', to='api.lnpayment')),
                ('payout', models.OneToOneField(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='order_paid', to='api.lnpayment')),
                ('taker', models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='taker', to=settings.AUTH_USER_MODEL)),
                ('taker_bond', models.OneToOneField(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='order_taken', to='api.lnpayment')),
                ('trade_escrow', models.OneToOneField(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='order_escrow', to='api.lnpayment')),
            ],
        ),
        migrations.CreateModel(
            name='MarketTick',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('price', models.DecimalField(decimal_places=2, default=None, max_digits=10, null=True, validators=[django.core.validators.MinValueValidator(0)])),
                ('volume', models.DecimalField(decimal_places=8, default=None, max_digits=8, null=True, validators=[django.core.validators.MinValueValidator(0)])),
                ('premium', models.DecimalField(blank=True, decimal_places=2, default=None, max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(-100), django.core.validators.MaxValueValidator(999)])),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('fee', models.DecimalField(decimal_places=4, default=0.002, max_digits=4, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(1)])),
                ('currency', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.currency')),
            ],
            options={
                'verbose_name': 'Market tick',
                'verbose_name_plural': 'Market ticks',
            },
        ),
    ]

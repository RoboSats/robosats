import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_auto_20220619_0535'),
    ]

    operations = [
        migrations.AlterField(
            model_name='currency',
            name='currency',
            field=models.PositiveSmallIntegerField(choices=[(1, 'USD'), (2, 'EUR'), (3, 'JPY'), (4, 'GBP'), (5, 'AUD'), (6, 'CAD'), (7, 'CHF'), (8, 'CNY'), (9, 'HKD'), (10, 'NZD'), (11, 'SEK'), (12, 'KRW'), (13, 'SGD'), (14, 'NOK'), (15, 'MXN'), (16, 'BYN'), (17, 'RUB'), (18, 'ZAR'), (19, 'TRY'), (20, 'BRL'), (21, 'CLP'), (22, 'CZK'), (23, 'DKK'), (24, 'HRK'), (25, 'HUF'), (26, 'INR'), (27, 'ISK'), (28, 'PLN'), (29, 'RON'), (30, 'ARS'), (31, 'VES'), (32, 'COP'), (33, 'PEN'), (34, 'UYU'), (35, 'PYG'), (36, 'BOB'), (37, 'IDR'), (38, 'ANG'), (39, 'CRC'), (40, 'CUP'), (41, 'DOP'), (42, 'GHS'), (43, 'GTQ'), (44, 'ILS'), (45, 'JMD'), (46, 'KES'), (47, 'KZT'), (48, 'MYR'), (49, 'NAD'), (50, 'NGN'), (51, 'AZN'), (52, 'PAB'), (53, 'PHP'), (54, 'PKR'), (55, 'QAR'), (56, 'SAR'), (57, 'THB'), (58, 'TTD'), (59, 'VND'), (60, 'XOF'), (61, 'TWD'), (62, 'TZS'), (63, 'XAF'), (64, 'UAH'), (65, 'EGP'), (66, 'LKR'), (67, 'MAD'), (68, 'AED'), (69, 'TND'), (300, 'XAU'), (1000, 'BTC')], unique=True),
        ),
        migrations.AlterField(
            model_name='onchainpayment',
            name='num_satoshis',
            field=models.PositiveBigIntegerField(null=True, validators=[django.core.validators.MinValueValidator(10000.0), django.core.validators.MaxValueValidator(3300000.0)]),
        ),
        migrations.AlterField(
            model_name='onchainpayment',
            name='sent_satoshis',
            field=models.PositiveBigIntegerField(null=True, validators=[django.core.validators.MinValueValidator(10000.0), django.core.validators.MaxValueValidator(3300000.0)]),
        ),
        migrations.AlterField(
            model_name='onchainpayment',
            name='swap_fee_rate',
            field=models.DecimalField(decimal_places=2, default=1.4000000000000001, max_digits=4),
        ),
    ]

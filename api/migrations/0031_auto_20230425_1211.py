import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0030_auto_20230410_1850'),
    ]

    operations = [
        migrations.AlterField(
            model_name='onchainpayment',
            name='num_satoshis',
            field=models.PositiveBigIntegerField(null=True, validators=[django.core.validators.MinValueValidator(5000.0), django.core.validators.MaxValueValidator(7500000.0)]),
        ),
        migrations.AlterField(
            model_name='onchainpayment',
            name='sent_satoshis',
            field=models.PositiveBigIntegerField(null=True, validators=[django.core.validators.MinValueValidator(5000.0), django.core.validators.MaxValueValidator(7500000.0)]),
        ),
        migrations.AlterField(
            model_name='order',
            name='maker_statement',
            field=models.TextField(blank=True, default=None, max_length=50000, null=True),
        ),
        migrations.AlterField(
            model_name='order',
            name='taker_statement',
            field=models.TextField(blank=True, default=None, max_length=50000, null=True),
        ),
    ]

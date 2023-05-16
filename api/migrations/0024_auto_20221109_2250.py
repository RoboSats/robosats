import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0023_alter_currency_currency'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lnpayment',
            name='num_satoshis',
            field=models.PositiveBigIntegerField(validators=[django.core.validators.MinValueValidator(100), django.core.validators.MaxValueValidator(7500000.0)]),
        ),
        migrations.AlterField(
            model_name='onchainpayment',
            name='num_satoshis',
            field=models.PositiveBigIntegerField(null=True, validators=[django.core.validators.MinValueValidator(10000.0), django.core.validators.MaxValueValidator(7500000.0)]),
        ),
        migrations.AlterField(
            model_name='onchainpayment',
            name='sent_satoshis',
            field=models.PositiveBigIntegerField(null=True, validators=[django.core.validators.MinValueValidator(10000.0), django.core.validators.MaxValueValidator(7500000.0)]),
        ),
        migrations.AlterField(
            model_name='order',
            name='last_satoshis',
            field=models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(10000000)]),
        ),
        migrations.AlterField(
            model_name='order',
            name='satoshis',
            field=models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(20000), django.core.validators.MaxValueValidator(5000000)]),
        ),
        migrations.AlterField(
            model_name='order',
            name='t0_satoshis',
            field=models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(20000), django.core.validators.MaxValueValidator(5000000)]),
        ),
    ]

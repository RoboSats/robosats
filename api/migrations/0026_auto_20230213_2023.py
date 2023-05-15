import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0025_auto_20221127_1135'),
    ]

    operations = [
        migrations.AlterField(
            model_name='onchainpayment',
            name='mining_fee_rate',
            field=models.DecimalField(decimal_places=3, default=2.05, max_digits=6, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(999)]),
        ),
        migrations.AlterField(
            model_name='onchainpayment',
            name='suggested_mining_fee_rate',
            field=models.DecimalField(decimal_places=3, default=2.05, max_digits=6, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(999)]),
        ),
    ]

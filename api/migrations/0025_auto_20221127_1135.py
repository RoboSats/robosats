import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0024_auto_20221109_2250'),
    ]

    operations = [
        migrations.AddField(
            model_name='lnpayment',
            name='routing_budget_ppm',
            field=models.PositiveBigIntegerField(default=0, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100000)]),
        ),
        migrations.AddField(
            model_name='lnpayment',
            name='routing_budget_sats',
            field=models.DecimalField(decimal_places=3, default=0, max_digits=10),
        ),
    ]

import django.core.validators
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_auto_20220307_0821'),
    ]

    operations = [
        migrations.AddField(
            model_name='lnpayment',
            name='fee',
            field=models.DecimalField(decimal_places=3, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='order',
            name='bond_size',
            field=models.DecimalField(decimal_places=2, default=1.0, max_digits=4, validators=[django.core.validators.MinValueValidator(1.0), django.core.validators.MaxValueValidator(15.0)]),
        ),
        migrations.AddField(
            model_name='order',
            name='bondless_taker',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='order',
            name='has_range',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='order',
            name='max_amount',
            field=models.DecimalField(blank=True, decimal_places=8, max_digits=18, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='min_amount',
            field=models.DecimalField(blank=True, decimal_places=8, max_digits=18, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='public_duration',
            field=models.PositiveBigIntegerField(default=86399, validators=[django.core.validators.MinValueValidator(597.6), django.core.validators.MaxValueValidator(86400.0)]),
        ),
        migrations.AlterField(
            model_name='currency',
            name='timestamp',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name='lnpayment',
            name='num_satoshis',
            field=models.PositiveBigIntegerField(validators=[django.core.validators.MinValueValidator(100), django.core.validators.MaxValueValidator(1601599.9999999998)]),
        ),
        migrations.AlterField(
            model_name='markettick',
            name='timestamp',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name='order',
            name='amount',
            field=models.DecimalField(blank=True, decimal_places=8, max_digits=18, null=True),
        ),
        migrations.AlterField(
            model_name='order',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name='order',
            name='last_satoshis',
            field=models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(1600000)]),
        ),
        migrations.AlterField(
            model_name='order',
            name='satoshis',
            field=models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(20000), django.core.validators.MaxValueValidator(800000)]),
        ),
        migrations.AlterField(
            model_name='order',
            name='t0_satoshis',
            field=models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(20000), django.core.validators.MaxValueValidator(800000)]),
        ),
        migrations.AlterField(
            model_name='profile',
            name='telegram_lang_code',
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
    ]

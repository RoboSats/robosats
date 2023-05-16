import api.models
from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('control', '0002_auto_20220619_0535'),
        ('api', '0013_auto_20220605_1156'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='is_swap',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='lnpayment',
            name='num_satoshis',
            field=models.PositiveBigIntegerField(validators=[django.core.validators.MinValueValidator(100), django.core.validators.MaxValueValidator(3300000.0)]),
        ),
        migrations.AlterField(
            model_name='order',
            name='last_satoshis',
            field=models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(4400000)]),
        ),
        migrations.AlterField(
            model_name='order',
            name='payout',
            field=models.OneToOneField(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='order_paid_LN', to='api.lnpayment'),
        ),
        migrations.AlterField(
            model_name='order',
            name='satoshis',
            field=models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(20000), django.core.validators.MaxValueValidator(2200000)]),
        ),
        migrations.AlterField(
            model_name='order',
            name='t0_satoshis',
            field=models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(20000), django.core.validators.MaxValueValidator(2200000)]),
        ),
        migrations.CreateModel(
            name='OnchainPayment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('concept', models.PositiveSmallIntegerField(choices=[(3, 'Payment to buyer')], default=3)),
                ('status', models.PositiveSmallIntegerField(choices=[(0, 'Created'), (1, 'Valid'), (2, 'In mempool'), (3, 'Confirmed'), (4, 'Cancelled')], default=0)),
                ('address', models.CharField(blank=True, default=None, max_length=100, null=True)),
                ('txid', models.CharField(blank=True, default=None, max_length=64, null=True, unique=True)),
                ('num_satoshis', models.PositiveBigIntegerField(null=True, validators=[django.core.validators.MinValueValidator(25000.0), django.core.validators.MaxValueValidator(3300000.0)])),
                ('sent_satoshis', models.PositiveBigIntegerField(null=True, validators=[django.core.validators.MinValueValidator(25000.0), django.core.validators.MaxValueValidator(3300000.0)])),
                ('suggested_mining_fee_rate', models.DecimalField(decimal_places=3, default=1.05, max_digits=6)),
                ('mining_fee_rate', models.DecimalField(decimal_places=3, default=1.05, max_digits=6)),
                ('mining_fee_sats', models.PositiveBigIntegerField(default=0)),
                ('swap_fee_rate', models.DecimalField(decimal_places=2, default=1.0, max_digits=4)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('balance', models.ForeignKey(default=api.models.OnchainPayment.get_balance, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='balance', to='control.balancelog')),
                ('receiver', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tx_receiver', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Onchain payment',
                'verbose_name_plural': 'Onchain payments',
            },
        ),
        migrations.AddField(
            model_name='order',
            name='payout_tx',
            field=models.OneToOneField(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='order_paid_TX', to='api.onchainpayment'),
        ),
    ]

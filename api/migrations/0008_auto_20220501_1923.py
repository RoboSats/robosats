from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0007_lnpayment_in_flight'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='escrow_duration',
            field=models.PositiveBigIntegerField(default=10799, validators=[django.core.validators.MinValueValidator(1800), django.core.validators.MaxValueValidator(28800)]),
        ),
        migrations.AddField(
            model_name='order',
            name='expiry_reason',
            field=models.PositiveSmallIntegerField(blank=True, choices=[(0, 'Expired not taken'), (1, 'Maker bond not locked'), (2, 'Escrow not locked'), (3, 'Invoice not submitted'), (4, 'Neither escrow locked or invoice submitted')], default=None, null=True),
        ),
        migrations.AlterField(
            model_name='lnpayment',
            name='num_satoshis',
            field=models.PositiveBigIntegerField(validators=[django.core.validators.MinValueValidator(100), django.core.validators.MaxValueValidator(2402399.9999999995)]),
        ),
        migrations.AlterField(
            model_name='lnpayment',
            name='receiver',
            field=models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='receiver', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='lnpayment',
            name='sender',
            field=models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sender', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='order',
            name='last_satoshis',
            field=models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(2400000)]),
        ),
        migrations.AlterField(
            model_name='order',
            name='satoshis',
            field=models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(20000), django.core.validators.MaxValueValidator(1200000)]),
        ),
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.PositiveSmallIntegerField(choices=[(0, 'Waiting for maker bond'), (1, 'Public'), (2, 'Paused'), (3, 'Waiting for taker bond'), (4, 'Cancelled'), (5, 'Expired'), (6, 'Waiting for trade collateral and buyer invoice'), (7, 'Waiting only for seller trade collateral'), (8, 'Waiting only for buyer invoice'), (9, 'Sending fiat - In chatroom'), (10, 'Fiat sent - In chatroom'), (11, 'In dispute'), (12, 'Collaboratively cancelled'), (13, 'Sending satoshis to buyer'), (14, 'Sucessful trade'), (15, 'Failed lightning network routing'), (16, 'Wait for dispute resolution'), (17, 'Maker lost dispute'), (18, 'Taker lost dispute')], default=0),
        ),
        migrations.AlterField(
            model_name='order',
            name='t0_satoshis',
            field=models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(20000), django.core.validators.MaxValueValidator(1200000)]),
        ),
    ]

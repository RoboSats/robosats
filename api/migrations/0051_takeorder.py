# Generated by Django 5.1.4 on 2025-02-24 13:10

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0050_alter_order_status'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='TakeOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(blank=True, decimal_places=8, max_digits=18, null=True)),
                ('expires_at', models.DateTimeField()),
                ('last_satoshis', models.PositiveBigIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(10000000)])),
                ('last_satoshis_time', models.DateTimeField(blank=True, default=None, null=True)),
                ('order', models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='order', to='api.order')),
                ('taker', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pretaker', to=settings.AUTH_USER_MODEL)),
                ('taker_bond', models.OneToOneField(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.lnpayment')),
            ],
        ),
    ]

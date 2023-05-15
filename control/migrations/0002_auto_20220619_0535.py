import django.utils.timezone
from django.db import migrations, models

import control.models


class Migration(migrations.Migration):

    dependencies = [
        ("control", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="BalanceLog",
            fields=[
                (
                    "time",
                    models.DateTimeField(
                        default=django.utils.timezone.now,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "total",
                    models.PositiveBigIntegerField(
                        default=control.models.BalanceLog.get_total
                    ),
                ),
                (
                    "onchain_fraction",
                    models.DecimalField(
                        decimal_places=5,
                        default=control.models.BalanceLog.get_frac,
                        max_digits=6,
                    ),
                ),
                (
                    "onchain_total",
                    models.PositiveBigIntegerField(
                        default=control.models.BalanceLog.get_oc_total
                    ),
                ),
                (
                    "onchain_confirmed",
                    models.PositiveBigIntegerField(
                        default=control.models.BalanceLog.get_oc_conf
                    ),
                ),
                (
                    "onchain_unconfirmed",
                    models.PositiveBigIntegerField(
                        default=control.models.BalanceLog.get_oc_unconf
                    ),
                ),
                (
                    "ln_local",
                    models.PositiveBigIntegerField(
                        default=control.models.BalanceLog.get_ln_local
                    ),
                ),
                (
                    "ln_remote",
                    models.PositiveBigIntegerField(
                        default=control.models.BalanceLog.get_ln_remote
                    ),
                ),
                (
                    "ln_local_unsettled",
                    models.PositiveBigIntegerField(
                        default=control.models.BalanceLog.get_ln_local_unsettled
                    ),
                ),
                (
                    "ln_remote_unsettled",
                    models.PositiveBigIntegerField(
                        default=control.models.BalanceLog.get_ln_remote_unsettled
                    ),
                ),
            ],
        ),
        migrations.DeleteModel(
            name="AccountingMonth",
        ),
        migrations.AddField(
            model_name="accountingday",
            name="mining_fees",
            field=models.DecimalField(decimal_places=3, default=0, max_digits=15),
        ),
    ]

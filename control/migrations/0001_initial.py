from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="AccountingDay",
            fields=[
                ("day", models.DateTimeField(primary_key=True, serialize=False)),
                (
                    "contracted",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                ("num_contracts", models.BigIntegerField(default=0)),
                (
                    "net_settled",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "net_paid",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "net_balance",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "inflow",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "outflow",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "routing_fees",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "cashflow",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "outstanding_earned_rewards",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "outstanding_pending_disputes",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "lifetime_rewards_claimed",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "earned_rewards",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "disputes",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "rewards_claimed",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
            ],
        ),
        migrations.CreateModel(
            name="AccountingMonth",
            fields=[
                ("month", models.DateTimeField(primary_key=True, serialize=False)),
                (
                    "contracted",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                ("num_contracts", models.BigIntegerField(default=0)),
                (
                    "net_settled",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "net_paid",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "net_balance",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "inflow",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "outflow",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "routing_fees",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "cashflow",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "outstanding_earned_rewards",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "outstanding_pending_disputes",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "lifetime_rewards_claimed",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "earned_rewards",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "pending_disputes",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
                (
                    "rewards_claimed",
                    models.DecimalField(decimal_places=3, default=0, max_digits=15),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Dispute",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
            ],
        ),
    ]

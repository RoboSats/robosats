from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0057_robot_webhook_enabled_alter_order_escrow_duration"),
    ]

    operations = [
        migrations.AlterField(
            model_name="lnpayment",
            name="concept",
            field=models.PositiveSmallIntegerField(
                choices=[
                    (0, "Maker bond"),
                    (1, "Taker bond"),
                    (2, "Trade escrow"),
                    (3, "Payment to buyer"),
                    (4, "Withdraw rewards"),
                    (5, "Devfund donation"),
                    (6, "Community donation"),
                ],
                default=0,
            ),
        ),
    ]

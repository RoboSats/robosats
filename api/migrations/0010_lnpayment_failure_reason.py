from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_alter_currency_currency'),
    ]

    operations = [
        migrations.AddField(
            model_name='lnpayment',
            name='failure_reason',
            field=models.PositiveSmallIntegerField(choices=[(0, "Payment isn't failed (yet)"), (1, 'There are more routes to try, but the payment timeout was exceeded.'), (2, 'All possible routes were tried and failed permanently. Or there were no routes to the destination at all.'), (3, 'A non-recoverable error has occurred.'), (4, 'Payment details are incorrect (unknown hash, invalid amount or invalid final CLTV delta).'), (5, "Insufficient unlocked balance in RoboSats' node.")], default=None, null=True),
        ),
    ]

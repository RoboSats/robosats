from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_alter_currency_currency'),
    ]

    operations = [
        migrations.AddField(
            model_name='lnpayment',
            name='in_flight',
            field=models.BooleanField(default=False),
        ),
    ]

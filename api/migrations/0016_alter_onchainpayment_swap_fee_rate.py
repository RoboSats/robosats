from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0015_auto_20220702_1500'),
    ]

    operations = [
        migrations.AlterField(
            model_name='onchainpayment',
            name='swap_fee_rate',
            field=models.DecimalField(decimal_places=2, default=0.8, max_digits=4),
        ),
    ]

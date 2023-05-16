from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0031_auto_20230425_1211'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='order',
            name='bondless_taker',
        ),
        migrations.AddField(
            model_name='order',
            name='reverted_fiat_sent',
            field=models.BooleanField(default=False),
        ),
    ]

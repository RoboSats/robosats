from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0032_auto_20230430_1419'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='order',
            name='reverted_fiat_sent',
        ),
        migrations.AddField(
            model_name='order',
            name='bondless_taker',
            field=models.BooleanField(default=False),
        ),
    ]

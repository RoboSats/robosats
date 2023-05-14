from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0018_order_last_satoshis_time'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='contract_finalization_time',
            field=models.DateTimeField(blank=True, default=None, null=True),
        ),
    ]

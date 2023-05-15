from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0026_auto_20230213_2023'),
    ]

    operations = [
        migrations.AlterField(
            model_name='onchainpayment',
            name='status',
            field=models.PositiveSmallIntegerField(choices=[(0, 'Created'), (1, 'Valid'), (2, 'In mempool'), (3, 'Confirmed'), (4, 'Cancelled'), (5, 'Queued')], default=0),
        ),
        migrations.AlterField(
            model_name='order',
            name='maker_statement',
            field=models.TextField(blank=True, default=None, max_length=10000, null=True),
        ),
        migrations.AlterField(
            model_name='order',
            name='taker_statement',
            field=models.TextField(blank=True, default=None, max_length=10000, null=True),
        ),
    ]

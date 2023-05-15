from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0017_auto_20220710_1127'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='last_satoshis_time',
            field=models.DateTimeField(blank=True, default=None, null=True),
        ),
    ]

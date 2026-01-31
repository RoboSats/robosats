
from django.db import migrations, models
class Migration(migrations.Migration):

    dependencies = [
        ('api', '0055_order_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='robot',
            name='webhook_url',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='robot',
            name='webhook_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='robot',
            name='webhook_api_key',
            field=models.CharField(blank=True, max_length=256, null=True),
        ),
        migrations.AddField(
            model_name='robot',
            name='webhook_timeout',
            field=models.PositiveIntegerField(default=10),
        ),
        migrations.AddField(
            model_name='robot',
            name='webhook_retries',
            field=models.PositiveIntegerField(default=3),
        ),
    ]

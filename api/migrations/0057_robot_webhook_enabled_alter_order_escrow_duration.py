

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0056_robot_webhook_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='robot',
            name='webhook_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='order',
            name='escrow_duration',
            field=models.PositiveBigIntegerField(default=10799, validators=[django.core.validators.MinValueValidator(1800), django.core.validators.MaxValueValidator(36000)]),
        ),
    ]

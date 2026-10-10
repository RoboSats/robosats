import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0059_merge_0058_alter_order_logs_0058_lnpayment_concept_community_donation'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='is_instant',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='order',
            name='chat_duration',
            field=models.PositiveBigIntegerField(default=86400, validators=[django.core.validators.MinValueValidator(1800), django.core.validators.MaxValueValidator(86400)]),
        ),
    ]

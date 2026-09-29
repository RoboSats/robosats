from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0057_robot_webhook_enabled_alter_order_escrow_duration'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='logs',
            field=models.TextField(blank=True, default='[]', editable=False, max_length=80000, null=True),
        ),
    ]

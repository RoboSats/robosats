from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_lnpayment_failure_reason'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='encrypted_private_key',
            field=models.TextField(blank=True, default=None, max_length=999, null=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='public_key',
            field=models.TextField(blank=True, default=None, max_length=999, null=True),
        ),
    ]

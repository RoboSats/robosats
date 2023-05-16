from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0020_auto_20220731_1425'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='reference',
            field=models.UUIDField(default=uuid.uuid4, editable=False),
        ),
        migrations.AddField(
            model_name='profile',
            name='wants_stealth',
            field=models.BooleanField(default=False),
        ),
    ]

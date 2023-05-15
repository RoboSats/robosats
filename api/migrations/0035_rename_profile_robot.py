from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0034_auto_20230430_1640'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Profile',
            new_name='Robot',
        ),
    ]

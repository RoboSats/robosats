from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0021_auto_20220813_1333'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='wants_stealth',
            field=models.BooleanField(default=True),
        ),
    ]

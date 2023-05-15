from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0027_auto_20230314_1801'),
    ]

    operations = [
        migrations.AddField(
            model_name='onchainpayment',
            name='broadcasted',
            field=models.BooleanField(default=False),
        ),
    ]

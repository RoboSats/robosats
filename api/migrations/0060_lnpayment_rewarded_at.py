from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        (
            "api",
            "0059_merge_0058_alter_order_logs_0058_lnpayment_concept_community_donation",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="lnpayment",
            name="rewarded_at",
            field=models.DateTimeField(blank=True, default=None, null=True),
        ),
    ]

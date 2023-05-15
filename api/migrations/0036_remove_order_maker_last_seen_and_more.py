import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0035_rename_profile_robot"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="order",
            name="maker_last_seen",
        ),
        migrations.RemoveField(
            model_name="order",
            name="taker_last_seen",
        ),
        migrations.RemoveField(
            model_name="robot",
            name="avg_rating",
        ),
        migrations.RemoveField(
            model_name="robot",
            name="is_referred",
        ),
        migrations.RemoveField(
            model_name="robot",
            name="latest_ratings",
        ),
        migrations.RemoveField(
            model_name="robot",
            name="pending_rewards",
        ),
        migrations.RemoveField(
            model_name="robot",
            name="referral_code",
        ),
        migrations.RemoveField(
            model_name="robot",
            name="referred_by",
        ),
        migrations.RemoveField(
            model_name="robot",
            name="total_ratings",
        ),
        migrations.AddField(
            model_name="order",
            name="proceeds",
            field=models.PositiveBigIntegerField(
                blank=True,
                default=0,
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
    ]

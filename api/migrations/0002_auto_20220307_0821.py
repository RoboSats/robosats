import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='claimed_rewards',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='profile',
            name='earned_rewards',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='profile',
            name='is_referred',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='profile',
            name='pending_rewards',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='profile',
            name='referral_code',
            field=models.CharField(blank=True, max_length=15, null=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='referred_by',
            field=models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='referee', to='api.profile'),
        ),
        migrations.AlterField(
            model_name='lnpayment',
            name='concept',
            field=models.PositiveSmallIntegerField(choices=[(0, 'Maker bond'), (1, 'Taker bond'), (2, 'Trade escrow'), (3, 'Payment to buyer'), (4, 'Withdraw rewards')], default=0),
        ),
        migrations.AlterField(
            model_name='markettick',
            name='price',
            field=models.DecimalField(decimal_places=2, default=None, max_digits=16, null=True, validators=[django.core.validators.MinValueValidator(0)]),
        ),
    ]

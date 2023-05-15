from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('api', '__first__'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ChatRoom',
            fields=[
                ('id', models.PositiveBigIntegerField(blank=True, default=None, primary_key=True, serialize=False)),
                ('maker_connected', models.BooleanField(default=False)),
                ('taker_connected', models.BooleanField(default=False)),
                ('maker_connect_date', models.DateTimeField(auto_now_add=True)),
                ('taker_connect_date', models.DateTimeField(auto_now_add=True)),
                ('room_group_name', models.CharField(blank=True, default=None, max_length=50, null=True)),
                ('maker', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='chat_maker', to=settings.AUTH_USER_MODEL)),
                ('order', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='order', to='api.order')),
                ('taker', models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='chat_taker', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]

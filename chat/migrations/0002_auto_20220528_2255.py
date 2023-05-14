from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_auto_20220527_0057'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('chat', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='chatroom',
            name='order',
            field=models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='chatroom', to='api.order'),
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('index', models.PositiveIntegerField(blank=True, default=None)),
                ('PGP_message', models.TextField(blank=True, default=None, max_length=5000, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('chatroom', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='chatroom', to='chat.chatroom')),
                ('order', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='message', to='api.order')),
                ('receiver', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='message_receiver', to=settings.AUTH_USER_MODEL)),
                ('sender', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='message_sender', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'get_latest_by': 'index',
            },
        ),
    ]

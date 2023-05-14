from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import User
from django.core.validators import validate_comma_separated_integer_list
from django.db import models
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.utils.html import mark_safe


class Robot(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # PGP keys, used for E2E chat encryption. Priv key is encrypted with user's passphrase (highEntropyToken)
    public_key = models.TextField(
        # Actually only 400-500 characters for ECC, but other types might be longer
        max_length=2000,
        null=True,
        default=None,
        blank=True,
    )
    encrypted_private_key = models.TextField(
        max_length=2000,
        null=True,
        default=None,
        blank=True,
    )

    # Total trades
    total_contracts = models.PositiveIntegerField(null=False, default=0)

    # Used to deep link telegram chat in case telegram notifications are enabled
    telegram_token = models.CharField(max_length=20, null=True, blank=True)
    telegram_chat_id = models.BigIntegerField(null=True, default=None, blank=True)
    telegram_enabled = models.BooleanField(default=False, null=False)
    telegram_lang_code = models.CharField(max_length=10, null=True, blank=True)
    telegram_welcomed = models.BooleanField(default=False, null=False)

    # Claimable rewards
    earned_rewards = models.PositiveIntegerField(null=False, default=0)
    # Total claimed rewards
    claimed_rewards = models.PositiveIntegerField(null=False, default=0)

    # Disputes
    num_disputes = models.PositiveIntegerField(null=False, default=0)
    lost_disputes = models.PositiveIntegerField(null=False, default=0)
    num_disputes_started = models.PositiveIntegerField(null=False, default=0)
    orders_disputes_started = models.CharField(
        max_length=999,
        null=True,
        default=None,
        validators=[validate_comma_separated_integer_list],
        blank=True,
    )  # Will only store ID of orders

    # RoboHash
    avatar = models.ImageField(
        default=("static/assets/avatars/" + "unknown_avatar.webp"),
        verbose_name="Avatar",
        blank=True,
    )

    # Penalty expiration (only used then taking/cancelling repeatedly orders in the book before comitting bond)
    penalty_expiration = models.DateTimeField(null=True, default=None, blank=True)

    # Platform rate
    platform_rating = models.PositiveIntegerField(null=True, default=None, blank=True)

    # Stealth invoices
    wants_stealth = models.BooleanField(default=True, null=False)

    @receiver(post_save, sender=User)
    def create_user_robot(sender, instance, created, **kwargs):
        if created:
            Robot.objects.create(user=instance)

    @receiver(post_save, sender=User)
    def save_user_robot(sender, instance, **kwargs):
        instance.robot.save()

    @receiver(pre_delete, sender=User)
    def del_avatar_from_disk(sender, instance, **kwargs):
        try:
            avatar_file = Path(
                settings.AVATAR_ROOT + instance.robot.avatar.url.split("/")[-1]
            )
            avatar_file.unlink()
        except Exception:
            pass

    def __str__(self):
        return self.user.username

    # to display avatars in admin panel
    def get_avatar(self):
        if not self.avatar:
            return settings.STATIC_ROOT + "unknown_avatar.png"
        return self.avatar.url

    # method to create a fake table field in read only mode
    def avatar_tag(self):
        return mark_safe('<img src="%s" width="50" height="50" />' % self.get_avatar())

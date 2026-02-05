from django.contrib.auth.models import User
from django.core.validators import validate_comma_separated_integer_list
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class Robot(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # Hash id (second sha256 of robot token)
    hash_id = models.CharField(
        max_length=64,
        unique=True,
        default=None,
        blank=True,
        null=True,
    )

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

    # nostr
    nostr_pubkey = models.CharField(max_length=64, null=True, blank=True)

    webhook_url = models.URLField(max_length=500, null=True, blank=True)
    webhook_api_key = models.CharField(max_length=256, null=True, blank=True)
    webhook_enabled = models.BooleanField(default=False, null=False)

    # Nostr forwarding to main account
    nostr_forward_pubkey = models.CharField(max_length=64, null=True, blank=True)
    nostr_forward_relay = models.CharField(max_length=500, null=True, blank=True)
    nostr_forward_enabled = models.BooleanField(default=False, null=False)

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

    @staticmethod
    def is_valid_onion_url(url):
        """Validates that the URL is a .onion address (Tor only)"""
        if not url:
            return False
        try:
            from urllib.parse import urlparse

            parsed = urlparse(url)
            hostname = parsed.hostname or ""
            return hostname.endswith(".onion")
        except Exception:
            return False

    def __str__(self):
        return self.user.username

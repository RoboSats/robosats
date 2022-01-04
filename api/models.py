from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator, validate_comma_separated_integer_list
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver

from django.utils.html import mark_safe

from pathlib import Path

#############################
# TODO
# Load hparams from .env file
min_satoshis_trade = 10*1000
max_satoshis_trade = 500*1000

class Order(models.Model):
    
    class Types(models.IntegerChoices):
        BUY  = 0, 'BUY'
        SELL = 1, 'SELL'

    class Currencies(models.IntegerChoices):
        USD = 1, 'USD'
        EUR = 2, 'EUR'
        ETH = 3, 'ETH'

    class Status(models.TextChoices):
        WFB = 0, 'Waiting for bond'
        PUB = 1, 'Published in order book'
        DEL = 2, 'Deleted from order book'
        TAK = 3, 'Taken'
        UCA = 4, 'Unilaterally cancelled'
        RET = 5, 'Returned to order book' # Probably same as 1 in most cases.
        WF2 = 6, 'Waiting for trade collateral and buyer invoice'
        WTC = 7, 'Waiting only for trade collateral'
        WBI = 8, 'Waiting only for buyer invoice'
        EXF = 9, 'Exchanging fiat / In chat'
        CCA = 10, 'Collaboratively cancelled'
        FSE = 11, 'Fiat sent'
        FCO = 12, 'Fiat confirmed'
        SUC = 13, 'Sucessfully settled'
        FAI = 14, 'Failed lightning network routing'
        UPI = 15, 'Updated invoice'
        DIS = 16, 'In dispute'
        MLD = 17, 'Maker lost dispute'
        TLD = 18, 'Taker lost dispute'
        EXP = 19, 'Expired'

    # order info, id = models.CharField(max_length=64, unique=True, null=False)
    status = models.PositiveSmallIntegerField(choices=Status.choices, default=Status.WFB)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    # order details
    type = models.PositiveSmallIntegerField(choices=Types.choices, null=False)
    currency = models.PositiveSmallIntegerField(choices=Currencies.choices, null=False)
    amount = models.DecimalField(max_digits=9, decimal_places=4, validators=[MinValueValidator(0.00001)])
    payment_method = models.CharField(max_length=30, null=False, default="Not specified")
    premium = models.DecimalField(max_digits=5, decimal_places=2, default=0, null=True, validators=[MinValueValidator(-100), MaxValueValidator(999)])
    satoshis = models.PositiveBigIntegerField(null=True, validators=[MinValueValidator(min_satoshis_trade), MaxValueValidator(max_satoshis_trade)])
    is_explicit = models.BooleanField(default=False, null=False) # pricing method. A explicit amount of sats, or a relative premium above/below market.

    # order participants
    maker = models.ForeignKey(User, related_name='maker', on_delete=models.CASCADE, null=True, default=None)  # unique = True, a maker can only make one order
    taker = models.ForeignKey(User, related_name='taker', on_delete=models.SET_NULL, null=True, default=None)  # unique = True, a taker can only take one order
    
    # order collateral
    has_maker_bond = models.BooleanField(default=False, null=False)
    has_taker_bond = models.BooleanField(default=False, null=False)
    has_trade_collat = models.BooleanField(default=False, null=False)

    maker_bond_secret = models.CharField(max_length=300, unique=False, null=True, default=None)
    taker_bond_secret = models.CharField(max_length=300, unique=False, null=True, default=None)
    trade_collat_secret = models.CharField(max_length=300, unique=False, null=True, default=None)

    # buyer payment LN invoice
    has_invoice = models.BooleanField(default=False, null=False) # has invoice and is valid
    invoice = models.CharField(max_length=300, unique=False, null=True, default=None)

class Profile(models.Model):
    user = models.OneToOneField(User,on_delete=models.CASCADE)

    # Ratings stored as a comma separated integer list
    total_ratings = models.PositiveIntegerField(null=False, default=0) 
    latest_ratings = models.CharField(max_length=999, null=True, default=None, validators=[validate_comma_separated_integer_list]) # Will only store latest ratings
    avg_rating = models.DecimalField(max_digits=4, decimal_places=1, default=None, null=True, validators=[MinValueValidator(0), MaxValueValidator(100)])

    # Disputes
    num_disputes = models.PositiveIntegerField(null=False, default=0)
    lost_disputes = models.PositiveIntegerField(null=False, default=0)

    # RoboHash
    avatar = models.ImageField(default="static/assets/avatars/unknown.png", verbose_name='Avatar')

    @receiver(post_save, sender=User)
    def create_user_profile(sender, instance, created, **kwargs):
        if created:
            Profile.objects.create(user=instance)

    @receiver(post_save, sender=User)
    def save_user_profile(sender, instance, **kwargs):
        instance.profile.save()

    def __str__(self):
        return self.user.username
    
    # to display avatars in admin panel
    def get_avatar(self):
        if not self.avatar:
            return 'static/assets/avatars/unknown.png'
        return self.avatar.url

    # method to create a fake table field in read only mode
    def avatar_tag(self):
        return mark_safe('<img src="%s" width="50" height="50" />' % self.get_avatar())

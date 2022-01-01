from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator

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

    # order details
    type = models.PositiveSmallIntegerField(choices=Types.choices, null=False)
    currency = models.PositiveSmallIntegerField(choices=Currencies.choices, null=False)
    amount = models.DecimalField(max_digits=9, decimal_places=4, validators=[MinValueValidator(0.00001)])
    premium = models.DecimalField(max_digits=3, decimal_places=2, default=0, null=True, validators=[MinValueValidator(-100), MaxValueValidator(1000)])
    satoshis = models.PositiveBigIntegerField(null=True, validators=[MinValueValidator(min_satoshis_trade), MaxValueValidator(max_satoshis_trade)])
    
    # order participants
    maker = models.ForeignKey(User, related_name='maker', on_delete=models.SET_NULL, null=True, default=None)  # unique = True, a maker can only make one order
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

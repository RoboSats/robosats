from rest_framework import serializers
from .models import Order, LNPayment

class ListOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('id','status','created_at','expires_at','type','currency','amount','payment_method','is_explicit','premium','satoshis','maker','taker')

class MakeOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('type','currency','amount','payment_method','is_explicit','premium','satoshis')

class UpdateOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('id','buyer_invoice')

class UpdateInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LNPayment
        fields = ['invoice']
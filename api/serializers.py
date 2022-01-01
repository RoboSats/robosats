from rest_framework import serializers
from .models import Order

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('id','status','created_at','type','currency','amount','premium','satoshis','maker')

class MakeOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('type','currency','amount','premium','satoshis')
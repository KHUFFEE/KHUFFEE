from rest_framework import serializers
from .models import Store, User

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['store_id', 'store_name']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['store_id', 'store_name', 'store_pw']

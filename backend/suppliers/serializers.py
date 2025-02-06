from rest_framework import serializers
from .models import Item
from .models import Supplier

class ItemSerializer(serializers.ModelSerializer):
    협력사명 = serializers.CharField(source='협력사.협력사명')  # ForeignKey 관계 필드 표시

    class Meta:
        model = Item
        fields = ['품목명', '협력사명', '규격', '단위', '입고단가', '입고단위', '입고단위단가']

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['협력사명']
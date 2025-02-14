# backend/suppliers/serializers.py
from rest_framework import serializers
from .models import Item, Supplier

class ItemSerializer(serializers.ModelSerializer):
    # 협력사_id를 Supplier 모델의 협력사_id 필드 값으로 노출 (읽기 전용)
    협력사_id = serializers.CharField(source='협력사_id.협력사_id', read_only=True)

    class Meta:
        model = Item
        fields = ['품목_id', '협력사_id', '품목명', '종류', '규격', '단위', '입고단가', '입고단위', '입고단위단가', '출고단위']


class SupplierSerializer(serializers.ModelSerializer):
    협력사_id = serializers.CharField(read_only=True)  # 읽기 전용으로 설정
    
    class Meta:
        model = Supplier
        fields = ['협력사_id', '협력사명']

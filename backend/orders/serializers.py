# backend/orders/serializers.py
from rest_framework import serializers
from .models import StoreOrder
from datetime import date
from orders.utils import get_기간_string  # 앞서 작성한 헬퍼 함수

class StoreOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreOrder
        # 클라이언트가 입력하는 필드만 받음 (기간은 자동 계산)
        fields = ('매장_id', '품목_id', '매장_발주량')
    
    def create(self, validated_data):
        today = date.today()
        validated_data['기간'] = get_기간_string(today)
        return super().create(validated_data)

class StoreOrderListSerializer(serializers.ModelSerializer):
    # 외래키 필드의 pk 값을 노출
    매장_id = serializers.CharField(source='매장_id.매장_id')
    품목_id = serializers.CharField(source='품목_id.품목_id')
    
    class Meta:
        model = StoreOrder
        fields = ('매장_id', '품목_id', '기간', '매장_발주량')
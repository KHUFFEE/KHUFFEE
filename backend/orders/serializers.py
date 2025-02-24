# backend/orders/serializers.py
from rest_framework import serializers
from .models import StoreOrder
from datetime import date
from orders.utils import get_기간_string  # 앞서 작성한 헬퍼 함수
from django.db import connection

class StoreOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreOrder
        # 클라이언트가 입력하는 필드만 받음 (기간은 자동 계산, 회차는 기본값 1 사용)
        fields = ('매장_id', '품목_id', '매장_발주량')
    
    def create(self, validated_data):
        today = date.today()
        validated_data['기간'] = get_기간_string(today)
        # 회차 필드는 클라이언트 입력 없이 기본값 1 사용
        validated_data['회차'] = 1
        new_value = validated_data.get('매장_발주량')
        
        duplicate_qs = StoreOrder.objects.filter(
            매장_id=validated_data['매장_id'],
            품목_id=validated_data['품목_id'],
            기간=validated_data['기간'],
            회차=validated_data['회차']
        )
        
        if duplicate_qs.exists():
            if new_value == "" or float(new_value) == 0:
                duplicate_qs.delete()
                instance = StoreOrder()
                instance.매장_id = validated_data['매장_id']
                instance.품목_id = validated_data['품목_id']
                instance.기간 = validated_data['기간']
                instance.회차 = validated_data['회차']
                instance.매장_발주량 = 0
                return instance
            else:
                table_name = StoreOrder._meta.db_table
                store_pk = validated_data['매장_id'].pk if hasattr(validated_data['매장_id'], 'pk') else validated_data['매장_id']
                item_pk = validated_data['품목_id'].pk if hasattr(validated_data['품목_id'], 'pk') else validated_data['품목_id']
                period_val = validated_data['기간']
                round_val = validated_data['회차']
                add_amount = new_value
                
                with connection.cursor() as cursor:
                    update_sql = f"""
                        UPDATE {table_name}
                        SET 매장_발주량 = 매장_발주량 + %s
                        WHERE 매장_id = %s AND 품목_id = %s AND 기간 = %s AND 회차 = %s
                    """
                    cursor.execute(update_sql, [add_amount, store_pk, item_pk, period_val, round_val])
                    
                    select_sql = f"""
                        SELECT 매장_발주량
                        FROM {table_name}
                        WHERE 매장_id = %s AND 품목_id = %s AND 기간 = %s AND 회차 = %s
                    """
                    cursor.execute(select_sql, [store_pk, item_pk, period_val, round_val])
                    row = cursor.fetchone()
                    new_amount = row[0] if row else add_amount

                instance = StoreOrder()
                instance.매장_id = validated_data['매장_id']
                instance.품목_id = validated_data['품목_id']
                instance.기간 = period_val
                instance.회차 = round_val
                instance.매장_발주량 = new_amount
                return instance

        return super().create(validated_data)

class StoreOrderListSerializer(serializers.ModelSerializer):
    매장_id = serializers.CharField(source='매장_id.매장_id')
    품목_id = serializers.CharField(source='품목_id.품목_id')
    
    class Meta:
        model = StoreOrder
        fields = ('매장_id', '품목_id', '기간', '회차', '매장_발주량')

# backend/orders/serializers.py
from rest_framework import serializers
from .models import StoreOrder
from datetime import date
from orders.utils import get_기간_string  # 앞서 작성한 헬퍼 함수
from django.db import connection

class StoreOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreOrder
        # 클라이언트가 입력하는 필드만 받음 (기간은 자동 계산)
        fields = ('매장_id', '품목_id', '매장_발주량')
    
    def create(self, validated_data):
        today = date.today()
        validated_data['기간'] = get_기간_string(today)
        new_value = validated_data.get('매장_발주량')
        
        # duplicate 여부 확인 (매장_id, 품목_id, 기간이 같은 경우)
        duplicate_qs = StoreOrder.objects.filter(
            매장_id=validated_data['매장_id'],
            품목_id=validated_data['품목_id'],
            기간=validated_data['기간']
        )
        
        if duplicate_qs.exists():
            # new_value가 빈 문자열("") 인지 먼저 체크
            if new_value == "" or float(new_value) == 0:
                duplicate_qs.delete()
                # 삭제 후, 삭제된 행의 정보를 담은 더미 인스턴스를 생성하여 반환
                instance = StoreOrder()
                instance.매장_id = validated_data['매장_id']
                instance.품목_id = validated_data['품목_id']
                instance.기간 = validated_data['기간']
                instance.매장_발주량 = 0
                return instance
            else:
                # 기존 주문이 있다면, 매장_발주량을 더함 (0이 아닌 경우)
                table_name = StoreOrder._meta.db_table  # "매장_발주"
                store_pk = validated_data['매장_id'].pk if hasattr(validated_data['매장_id'], 'pk') else validated_data['매장_id']
                item_pk = validated_data['품목_id'].pk if hasattr(validated_data['품목_id'], 'pk') else validated_data['품목_id']
                period_val = validated_data['기간']
                add_amount = new_value
                
                with connection.cursor() as cursor:
                    update_sql = f"""
                        UPDATE {table_name}
                        SET 매장_발주량 = 매장_발주량 + %s
                        WHERE 매장_id = %s AND 품목_id = %s AND 기간 = %s
                    """
                    cursor.execute(update_sql, [add_amount, store_pk, item_pk, period_val])
                    
                    # 변경 후 다시 조회
                    select_sql = f"""
                        SELECT 매장_발주량
                        FROM {table_name}
                        WHERE 매장_id = %s AND 품목_id = %s AND 기간 = %s
                    """
                    cursor.execute(select_sql, [store_pk, item_pk, period_val])
                    row = cursor.fetchone()
                    new_amount = row[0] if row else add_amount

                instance = StoreOrder()
                instance.매장_id = validated_data['매장_id']
                instance.품목_id = validated_data['품목_id']
                instance.기간 = period_val
                instance.매장_발주량 = new_amount
                return instance

        # duplicate가 없으면, 그대로 생성
        return super().create(validated_data)

class StoreOrderListSerializer(serializers.ModelSerializer):
    # 외래키 필드의 pk 값을 노출
    매장_id = serializers.CharField(source='매장_id.매장_id')
    품목_id = serializers.CharField(source='품목_id.품목_id')
    
    class Meta:
        model = StoreOrder
        fields = ('매장_id', '품목_id', '기간', '매장_발주량')

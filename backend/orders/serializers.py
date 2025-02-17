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
        
        # duplicate 여부를 ORM 필터로 확인 (id 칼럼은 사용하지 않음)
        duplicate_qs = StoreOrder.objects.filter(
            매장_id=validated_data['매장_id'],
            품목_id=validated_data['품목_id'],
            기간=validated_data['기간']
        )
        
        if duplicate_qs.exists():
            # 중복이 있을 경우, raw SQL로 기존 행의 매장_발주량을 업데이트
            table_name = StoreOrder._meta.db_table  # "매장_발주"
            # ForeignKey 필드는 이미 instance가 들어있으므로 pk 추출
            store_pk = validated_data['매장_id'].pk if hasattr(validated_data['매장_id'], 'pk') else validated_data['매장_id']
            item_pk = validated_data['품목_id'].pk if hasattr(validated_data['품목_id'], 'pk') else validated_data['품목_id']
            period_val = validated_data['기간']
            add_amount = validated_data['매장_발주량']
            
            with connection.cursor() as cursor:
                update_sql = f"""
                    UPDATE {table_name}
                    SET 매장_발주량 = 매장_발주량 + %s
                    WHERE 매장_id = %s AND 품목_id = %s AND 기간 = %s
                """
                cursor.execute(update_sql, [add_amount, store_pk, item_pk, period_val])
                
                # 업데이트된 매장_발주량을 다시 조회
                select_sql = f"""
                    SELECT 매장_발주량
                    FROM {table_name}
                    WHERE 매장_id = %s AND 품목_id = %s AND 기간 = %s
                """
                cursor.execute(select_sql, [store_pk, item_pk, period_val])
                row = cursor.fetchone()
                new_amount = row[0] if row else add_amount

            # serializer가 반환할 instance는 DB 조회 없이 수동으로 구성합니다.
            instance = StoreOrder()
            instance.매장_id = validated_data['매장_id']
            instance.품목_id = validated_data['품목_id']
            instance.기간 = period_val
            instance.매장_발주량 = new_amount
            return instance
        
        # duplicate가 아니면 기존 방식대로 생성
        return super().create(validated_data)

class StoreOrderListSerializer(serializers.ModelSerializer):
    # 외래키 필드의 pk 값을 노출
    매장_id = serializers.CharField(source='매장_id.매장_id')
    품목_id = serializers.CharField(source='품목_id.품목_id')
    
    class Meta:
        model = StoreOrder
        fields = ('매장_id', '품목_id', '기간', '매장_발주량')
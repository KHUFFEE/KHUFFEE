# backend/suppliers/serializers.py
from rest_framework import serializers
from .models import Item, Supplier

class ItemSerializer(serializers.ModelSerializer):
    # 협력사_id는 수정 가능하도록 PrimaryKeyRelatedField로 둡니다.
    협력사_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.filter(활성화=True)
    )
    # 협력사명을 쓰기 전용 필드로 추가합니다.
    협력사명 = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Item
        fields = [
            '품목_id', '협력사_id', '협력사명', '품목명', '종류', '규격', 
            '단위', '입고단가', '입고단위', '입고단위단가', '출고단위', '활성화'
        ]
        # 만약 클라이언트에 활성화 값이 노출되지 않아야 한다면 read_only_fields로 지정할 수도 있습니다.
        # read_only_fields = ['활성화']

    def update(self, instance, validated_data):
        # 만약 협력사명이 제공되면, 해당 Supplier 객체를 찾아 협력사_id를 업데이트
        supplier_name = validated_data.pop('협력사명', None)
        if supplier_name:
            try:
                supplier = Supplier.objects.get(협력사명=supplier_name, 활성화=True)
                validated_data['협력사_id'] = supplier
            except Supplier.DoesNotExist:
                raise serializers.ValidationError({"협력사명": "해당 협력사가 존재하지 않습니다."})
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # 응답에서는 협력사_id 대신 협력사명을 표시
        rep['협력사명'] = instance.협력사_id.협력사명
        return rep


class SupplierSerializer(serializers.ModelSerializer):
    협력사_id = serializers.CharField(read_only=True)
    
    class Meta:
        model = Supplier
        fields = ['협력사_id', '협력사명']

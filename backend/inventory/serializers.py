# backend/inventory/serializers.py
from rest_framework import serializers
from .models import (
    StoreInventory,
    WarehouseInventory,
    StoreMonthEndInventory,
    WarehouseExpiration,
)


class StoreInventorySerializer(serializers.ModelSerializer):
    # 매장_id와 품목_id의 pk 값을 문자열로 노출 (기존 다른 앱의 패턴과 유사하게)
    매장_id = serializers.CharField(source="매장_id.매장_id")
    품목_id = serializers.CharField(source="품목_id.품목_id")

    class Meta:
        model = StoreInventory
        fields = ["매장_id", "품목_id", "기간", "매장_재고량"]


class WarehouseInventorySerializer(serializers.ModelSerializer):
    매장_id = serializers.CharField(source="매장_id.매장_id")
    품목_id = serializers.CharField(source="품목_id.품목_id")

    class Meta:
        model = WarehouseInventory
        fields = ["매장_id", "품목_id", "기간", "창고_재고량"]


class StoreMonthEndInventoryUpdateSerializer(serializers.ModelSerializer):
    # 매장_id와 품목_id의 pk 값을 문자열로 노출 (다른 앱 패턴과 유사하게)
    매장_id = serializers.CharField(source="매장_id.매장_id")
    품목_id = serializers.CharField(source="품목_id.품목_id")

    class Meta:
        model = StoreMonthEndInventory
        fields = ["매장_id", "품목_id", "기간", "월말_재고량"]


class WarehouseExpirationSerializer(serializers.ModelSerializer):
    # 품목_id는 참조 모델의 pk인 '품목_id' 값을 문자열로 노출
    품목_id = serializers.CharField(source="품목_id.품목_id")

    class Meta:
        model = WarehouseExpiration
        fields = ["품목_id", "유통기한", "창고_재고량"]

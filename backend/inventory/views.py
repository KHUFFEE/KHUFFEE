# backend/inventory/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import StoreInventory, WarehouseInventory

class StoreInventoryListView(APIView):
    def get(self, request):
        # 프런트에서 "기간"을 올바른 형식(예: "2023.04.01")으로 전달한다고 가정합니다.
        period = request.GET.get('기간', None)
        store_id = request.GET.get('매장_id', None)  # 특정 매장 조회용
        
        qs = StoreInventory.objects.all()
        if period:
            qs = qs.filter(기간=period)
        if store_id:
            qs = qs.filter(매장_id=store_id)
        
        # values()를 사용하여 모델 인스턴스를 생성하지 않고 딕셔너리 목록으로 반환
        inventories = list(qs.values('매장_id', '품목_id', '기간', '매장_재고량'))
        return Response(inventories, status=status.HTTP_200_OK)

class WarehouseInventoryListView(APIView):
    def get(self, request):
        period = request.GET.get('기간', None)
        qs = WarehouseInventory.objects.all()
        if period:
            qs = qs.filter(기간=period)
        
        inventories = list(qs.values('매장_id', '품목_id', '기간', '창고_재고량'))
        return Response(inventories, status=status.HTTP_200_OK)

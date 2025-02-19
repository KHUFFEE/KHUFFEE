# backend/inventory/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import StoreInventory, WarehouseInventory

class StoreInventoryListView(APIView):
    def get(self, request):
        # 만약 URL 쿼리로 range=first_last가 전달되면 기간의 최소/최대값만 반환
        if request.GET.get("range") == "first_last":
            qs = StoreInventory.objects.all()
            earliest = qs.order_by("기간").values("기간").first()
            latest = qs.order_by("-기간").values("기간").first()
            if earliest and latest:
                return Response({
                    "earliest_period": earliest["기간"],
                    "latest_period": latest["기간"]
                }, status=status.HTTP_200_OK)
            else:
                return Response({}, status=status.HTTP_200_OK)
        
        # 기본: 기간이 지정되지 않으면 최신 기간만 조회하도록 함
        period = request.GET.get('기간', None)
        store_id = request.GET.get('매장_id', None)  # 매장 아이디 필터
        qs = StoreInventory.objects.all()
        if period:
            qs = qs.filter(기간=period)
        else:
            latest_record = qs.order_by("-기간").values("기간").first()
            if latest_record:
                qs = qs.filter(기간=latest_record["기간"])
        if store_id:
            qs = qs.filter(매장_id=store_id)
        
        # values()로 필요한 필드만 선택하여 딕셔너리 목록으로 반환
        inventories = list(qs.values('매장_id', '품목_id', '기간', '매장_재고량'))
        return Response(inventories, status=status.HTTP_200_OK)

class WarehouseInventoryListView(APIView):
    def get(self, request):
        if request.GET.get("range") == "first_last":
            qs = WarehouseInventory.objects.all()
            earliest = qs.order_by("기간").values("기간").first()
            latest = qs.order_by("-기간").values("기간").first()
            if earliest and latest:
                return Response({
                    "earliest_period": earliest["기간"],
                    "latest_period": latest["기간"]
                }, status=status.HTTP_200_OK)
            else:
                return Response({}, status=status.HTTP_200_OK)
        period = request.GET.get('기간', None)
        qs = WarehouseInventory.objects.all()
        if period:
            qs = qs.filter(기간=period)
        inventories = list(qs.values('매장_id', '품목_id', '기간', '창고_재고량'))
        return Response(inventories, status=status.HTTP_200_OK)

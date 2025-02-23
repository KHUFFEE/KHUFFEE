# backend/inventory/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import StoreInventory, WarehouseInventory, StoreMonthEndInventory
from decimal import Decimal
from accounts.models import Store
from suppliers.models import Item

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

class StoreInventoryUpdateView(APIView):
    def post(self, request):
        # 필수 필드: 매장_id, 품목_id, 기간, 매장_재고량
        store_id = request.data.get("매장_id")
        item_id = request.data.get("품목_id")
        period = request.data.get("기간")
        inventory_amount = request.data.get("매장_재고량")
        
        if not (store_id and item_id and period):
            return Response(
                {"error": "매장_id, 품목_id, 기간은 필수 입력입니다."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 외래키 객체로 변환
        try:
            store_obj = Store.objects.get(pk=store_id)
        except Store.DoesNotExist:
            return Response({"error": "해당 매장을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            item_obj = Item.objects.get(pk=item_id)
        except Item.DoesNotExist:
            return Response({"error": "해당 품목을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
        
        # 매장_재고량을 Decimal로 변환 (빈 문자열이나 None은 0으로 처리)
        try:
            new_value = Decimal(inventory_amount) if inventory_amount not in [None, ""] else Decimal("0.00")
        except Exception:
            return Response({"error": "매장_재고량은 소수 형태여야 합니다."}, status=status.HTTP_400_BAD_REQUEST)
        
        # 기존 재고 조회 (id 필드 참조 없이 filter 사용)
        qs = StoreInventory.objects.filter(매장_id=store_obj, 품목_id=item_obj, 기간=period)
        if qs.exists():
            if new_value == Decimal("0.00"):
                qs.delete()
                return Response({
                    "매장_id": store_obj.pk,
                    "품목_id": item_obj.pk,
                    "기간": period,
                    "매장_재고량": "0.00"
                }, status=status.HTTP_200_OK)
            else:
                qs.update(매장_재고량=new_value)
                updated_record = qs.order_by("매장_id", "품목_id", "기간") \
                                   .values("매장_id", "품목_id", "기간", "매장_재고량") \
                                   .first()
                return Response(updated_record, status=status.HTTP_200_OK)
        else:
            if new_value == Decimal("0.00"):
                return Response({
                    "매장_id": store_obj.pk,
                    "품목_id": item_obj.pk,
                    "기간": period,
                    "매장_재고량": "0.00"
                }, status=status.HTTP_200_OK)
            else:
                StoreInventory.objects.create(
                    매장_id=store_obj,
                    품목_id=item_obj,
                    기간=period,
                    매장_재고량=new_value
                )
                return Response({
                    "매장_id": store_obj.pk,
                    "품목_id": item_obj.pk,
                    "기간": period,
                    "매장_재고량": new_value
                }, status=status.HTTP_201_CREATED)
                
class StoreMonthEndInventoryUpdateView(APIView):
    def post(self, request):
        # 필수 필드: 매장_id, 품목_id, 기간, 월말_재고량
        store_id = request.data.get("매장_id")
        item_id = request.data.get("품목_id")
        period = request.data.get("기간")
        inventory_amount = request.data.get("월말_재고량")
        
        if not (store_id and item_id and period):
            return Response(
                {"error": "매장_id, 품목_id, 기간은 필수 입력입니다."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 외래키 객체로 변환
        try:
            store_obj = Store.objects.get(pk=store_id)
        except Store.DoesNotExist:
            return Response({"error": "해당 매장을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            item_obj = Item.objects.get(pk=item_id)
        except Item.DoesNotExist:
            return Response({"error": "해당 품목을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
        
        # 월말_재고량을 Decimal로 변환 (빈 문자열이나 None은 0으로 처리)
        try:
            new_value = Decimal(inventory_amount) if inventory_amount not in [None, ""] else Decimal("0.00")
        except Exception:
            return Response({"error": "월말_재고량은 소수 형태여야 합니다."}, status=status.HTTP_400_BAD_REQUEST)
        
        # 기존 월말 재고 조회
        qs = StoreMonthEndInventory.objects.filter(매장_id=store_obj, 품목_id=item_obj, 기간=period)
        if qs.exists():
            if new_value == Decimal("0.00"):
                qs.delete()
                return Response({
                    "매장_id": store_obj.pk,
                    "품목_id": item_obj.pk,
                    "기간": period,
                    "월말_재고량": "0.00"
                }, status=status.HTTP_200_OK)
            else:
                qs.update(월말_재고량=new_value)
                updated_record = qs.order_by("매장_id", "품목_id", "기간") \
                                   .values("매장_id", "품목_id", "기간", "월말_재고량") \
                                   .first()
                return Response(updated_record, status=status.HTTP_200_OK)
        else:
            if new_value == Decimal("0.00"):
                return Response({
                    "매장_id": store_obj.pk,
                    "품목_id": item_obj.pk,
                    "기간": period,
                    "월말_재고량": "0.00"
                }, status=status.HTTP_200_OK)
            else:
                StoreMonthEndInventory.objects.create(
                    매장_id=store_obj,
                    품목_id=item_obj,
                    기간=period,
                    월말_재고량=new_value
                )
                return Response({
                    "매장_id": store_obj.pk,
                    "품목_id": item_obj.pk,
                    "기간": period,
                    "월말_재고량": new_value
                }, status=status.HTTP_201_CREATED)
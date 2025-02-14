# backend/suppliers/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Item, Supplier
from .serializers import ItemSerializer, SupplierSerializer

class ItemListView(APIView):
    def get(self, request):
        # 활성화(True)인 품목만 조회
        items = Item.objects.filter(활성화=True)
        serialized_items = ItemSerializer(items, many=True)
        return Response(serialized_items.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data
        # 사용자가 선택한 협력사명으로 Supplier 조회 (활성화 상태여야 함)
        supplier_name = data.get("협력사명")
        if not supplier_name:
            return Response({"error": "협력사명은 필수 입력 항목입니다."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            supplier = Supplier.objects.get(협력사명=supplier_name, 활성화=True)
        except Supplier.DoesNotExist:
            return Response({"error": "해당 협력사가 존재하지 않습니다."}, status=status.HTTP_400_BAD_REQUEST)

        # 새 Item 생성 – 품목_id는 save()에서 자동 생성됨
        item = Item(
            협력사_id=supplier,
            품목명=data.get("품목명"),
            종류=data.get("종류"),
            규격=data.get("규격"),
            단위=data.get("단위"),
            입고단가=data.get("입고단가"),
            입고단위=data.get("입고단위"),
            입고단위단가=data.get("입고단위단가"),
            출고단위=data.get("출고단위"),
        )
        item.save()
        serializer = ItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ItemDeleteView(APIView):
    def post(self, request):
        # 프론트엔드에서 선택된 품목들의 품목_id 리스트를 받아 활성화(False)로 업데이트
        ids = request.data.get("ids", [])
        if not ids:
            return Response({"error": "삭제할 품목이 선택되지 않았습니다."}, status=status.HTTP_400_BAD_REQUEST)
        
        updated_count = Item.objects.filter(품목_id__in=ids).update(활성화=False)
        if updated_count > 0:
            return Response({"detail": "선택한 품목들이 비활성화되었습니다."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "해당 품목을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

class ItemUpdateView(APIView):
    def post(self, request):
        # 요청 데이터에 품목_id와 수정할 필드들이 포함되어 있어야 함
        품목_id = request.data.get("품목_id")
        if not 품목_id:
            return Response({"error": "품목_id가 필요합니다."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            item = Item.objects.get(품목_id=품목_id, 활성화=True)
        except Item.DoesNotExist:
            return Response({"error": "품목을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SupplierListView(APIView):
    def get(self, request):
        suppliers = Supplier.objects.filter(활성화=True)
        serialized_suppliers = SupplierSerializer(suppliers, many=True)
        return Response(serialized_suppliers.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SupplierSerializer(data=request.data)
        if serializer.is_valid():
            supplier = Supplier(협력사명=serializer.validated_data['협력사명'])
            supplier.save()  # 자동으로 협력사_id 생성
            return Response({
                "협력사_id": supplier.협력사_id,
                "협력사명": supplier.협력사명,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SupplierDeleteView(APIView):
    def post(self, request):
        names = request.data.get('names', [])
        if not names:
            return Response({"error": "No suppliers provided"}, status=status.HTTP_400_BAD_REQUEST)

        updated_count = Supplier.objects.filter(협력사명__in=names).update(활성화=False)
        
        if updated_count > 0:
            return Response({"detail": "Deactivated successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No matching suppliers found"}, status=status.HTTP_404_NOT_FOUND)

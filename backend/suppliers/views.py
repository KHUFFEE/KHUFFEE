from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Item, Supplier
from .serializers import ItemSerializer, SupplierSerializer

class ItemListView(APIView):
    def get(self, request):
        items = Item.objects.select_related('협력사_id').all()
        serialized_items = ItemSerializer(items, many=True)
        return Response(serialized_items.data, status=status.HTTP_200_OK)

class SupplierListView(APIView):
    def get(self, request):
        # 활성화(True)인 협력사만 조회
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
        names = request.data.get('names', [])  # 클라이언트에서 협력사명 리스트를 받음
        if not names:
            return Response({"error": "No suppliers provided"}, status=status.HTTP_400_BAD_REQUEST)

        # 실제 삭제 대신 활성화(False)로 업데이트
        updated_count = Supplier.objects.filter(협력사명__in=names).update(활성화=False)
        
        if updated_count > 0:
            return Response({"detail": "Deactivated successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No matching suppliers found"}, status=status.HTTP_404_NOT_FOUND)

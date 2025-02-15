# backend/orders/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import date
from .serializers import StoreOrderCreateSerializer
from .models import StoreOrder

class StoreOrderCreateView(APIView):
    def post(self, request):
        serializer = StoreOrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            store_order = serializer.save()
            return Response(StoreOrderCreateSerializer(store_order).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StoreOrderListView(APIView):
    def get(self, request):
        store_id = request.GET.get('store_id')
        page = request.GET.get('page', 1)
        limit = request.GET.get('limit', 10)

        try:
            page = int(page)
            limit = int(limit)
        except ValueError:
            return Response({"error": "유효한 페이지 및 limit 값을 입력하세요."}, status=status.HTTP_400_BAD_REQUEST)

        # 매장 필터링 (store_id가 제공된 경우)
        orders_queryset = StoreOrder.objects.all()
        if store_id:
            orders_queryset = orders_queryset.filter(매장_id=store_id)

        # 페이지네이션
        start = (page - 1) * limit
        end = start + limit

        orders = list(
            orders_queryset.values(
                '매장_id',  # 외래키의 pk 값 (Store 모델의 매장_id)
                '품목_id',  # Item 모델의 품목_id
                '기간',
                '매장_발주량'
            )[start:end]
        )
        return Response(orders, status=status.HTTP_200_OK)

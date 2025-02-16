# backend/orders/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import date
from .serializers import StoreOrderCreateSerializer
from .models import StoreOrder
from collections import OrderedDict

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
        try:
            page = int(request.GET.get('page', 1))
        except ValueError:
            return Response({"error": "유효한 페이지 번호를 입력하세요."}, status=status.HTTP_400_BAD_REQUEST)

        # 모든 주문 조회
        orders_queryset = StoreOrder.objects.all()
        if store_id:
            orders_queryset = orders_queryset.filter(매장_id=store_id)
        
        # 매장_발주량이 0인 주문은 제외
        orders_queryset = orders_queryset.exclude(매장_발주량=0)
        
        # 기간별로 내림차순 정렬 후 distinct한 기간 리스트 추출
        all_periods = list(orders_queryset.order_by('-기간').values_list('기간', flat=True))
        distinct_periods = list(OrderedDict.fromkeys(all_periods))

        # 페이지네이션: 전체 distinct_periods를 대상으로 진행
        total_pages = len(distinct_periods)
        if total_pages == 0:
            return Response({
                "current_period": None,
                "current_page": 0,
                "total_pages": 0,
                "orders": []
            }, status=status.HTTP_200_OK)

        if page < 1 or page > total_pages:
            return Response({"error": f"페이지 번호는 1부터 {total_pages} 사이여야 합니다."},
                            status=status.HTTP_400_BAD_REQUEST)

        # 선택한 기간에 해당하는 주문 필터링
        selected_period = distinct_periods[page - 1]
        orders_for_period = orders_queryset.filter(기간=selected_period).order_by('-기간')
        
        # 결과 반환
        orders = list(orders_for_period.values(
            '매장_id',
            '품목_id',
            '기간',
            '매장_발주량'
        ))
        
        result = {
            "current_period": selected_period,
            "current_page": page,
            "total_pages": total_pages,
            "orders": orders,
        }
        return Response(result, status=status.HTTP_200_OK)

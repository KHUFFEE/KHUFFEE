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
        # 페이지 번호는 필수, 기본값 1
        try:
            page = int(request.GET.get('page', 1))
        except ValueError:
            return Response({"error": "유효한 페이지 번호를 입력하세요."}, status=status.HTTP_400_BAD_REQUEST)

        # 매장 필터링 (store_id가 제공된 경우)
        orders_queryset = StoreOrder.objects.all()
        if store_id:
            orders_queryset = orders_queryset.filter(매장_id=store_id)
        
        # 기간별로 내림차순 정렬하고 distinct한 기간 리스트 추출
        # MySQL의 경우 distinct()와 order_by()의 조합에 주의 (파이썬 레벨에서 distinct 처리)
        all_periods = list(orders_queryset.order_by('-기간').values_list('기간', flat=True))
        # 중복 제거 (순서를 유지하기 위해 OrderedDict 사용)
        from collections import OrderedDict
        distinct_periods = list(OrderedDict.fromkeys(all_periods))
        
        # 최신 5개 기간만 고려
        latest_periods = distinct_periods[:5]
        total_pages = len(latest_periods)
        if page < 1 or page > total_pages:
            return Response({"error": f"페이지 번호는 1부터 {total_pages} 사이여야 합니다."}, status=status.HTTP_400_BAD_REQUEST)
        
        # 선택한 기간에 해당하는 주문 필터링
        selected_period = latest_periods[page - 1]
        orders_for_period = orders_queryset.filter(기간=selected_period).order_by('-기간')
        
        # 결과 반환 (필요에 따라 serializer 사용 가능)
        orders = list(orders_for_period.values(
            '매장_id',
            '품목_id',
            '기간',
            '매장_발주량'
        ))
        
        # 페이지 정보도 함께 반환
        result = {
            "current_period": selected_period,
            "current_page": page,
            "total_pages": total_pages,
            "orders": orders,
        }
        return Response(result, status=status.HTTP_200_OK)

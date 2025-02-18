from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import date
from .serializers import StoreOrderCreateSerializer, StoreOrderListSerializer
from .models import StoreOrder
from collections import OrderedDict

# 새로 추가: 외래키 모델 임포트
from accounts.models import Store
from suppliers.models import Item

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

        # 정렬 옵션: 기본은 최신순(내림차순), order=asc 시 오름차순 적용
        order_param = request.GET.get('order', 'desc').lower()
        ordering = '기간' if order_param == 'asc' else '-기간'

        orders_queryset = StoreOrder.objects.all()
        if store_id:
            orders_queryset = orders_queryset.filter(매장_id=store_id)
        
        # 매장_발주량이 0인 주문은 제외
        orders_queryset = orders_queryset.exclude(매장_발주량=0)
        
        # 매장_id만 따로 조회할 경우 (store_only 파라미터가 true)
        store_only = request.GET.get('store_only', '').lower()
        if store_only == 'true':
            store_ids = orders_queryset.order_by('매장_id').values_list('매장_id', flat=True).distinct()
            return Response({"store_ids": list(store_ids)}, status=status.HTTP_200_OK)

        # 새 기능: 기간 범위 조회 (YYYY.MM.W~YYYY.MM.W)
        period_param = request.GET.get('기간')
        if period_param and '~' in period_param:
            start_period, end_period = period_param.split('~')
            start_period = start_period.strip()
            end_period = end_period.strip()
            orders_for_range = orders_queryset.filter(기간__gte=start_period, 기간__lte=end_period).order_by(ordering)
            orders = list(orders_for_range.values(
                '매장_id',
                '품목_id',
                '기간',
                '매장_발주량'
            ))
            result = {
                "current_period": f"{start_period} ~ {end_period}",
                "current_page": 1,
                "total_pages": 1,
                "orders": orders,
            }
            return Response(result, status=status.HTTP_200_OK)

        # 기존 기능: 특정 기간 조회 (정확한 기간 문자열)
        if period_param:
            orders_for_period = orders_queryset.filter(기간=period_param).order_by(ordering)
            orders = list(orders_for_period.values(
                '매장_id',
                '품목_id',
                '기간',
                '매장_발주량'
            ))
            result = {
                "current_period": period_param,
                "current_page": 1,
                "total_pages": 1,
                "orders": orders,
            }
            return Response(result, status=status.HTTP_200_OK)

        # 페이지네이션: distinct한 기간 단위로 진행 (한 주차에 해당하는 주문들)
        all_periods = list(orders_queryset.order_by(ordering).values_list('기간', flat=True))
        distinct_periods = list(OrderedDict.fromkeys(all_periods))
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

        selected_period = distinct_periods[page - 1]
        orders_for_period = orders_queryset.filter(기간=selected_period).order_by(ordering)
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

class StoreOrderUpdateView(APIView):
    def post(self, request):
        # 필수 필드: 매장_id, 품목_id, 기간, 매장_발주량
        store_id = request.data.get("매장_id")
        item_id = request.data.get("품목_id")
        period = request.data.get("기간")
        order_amount = request.data.get("매장_발주량")
        
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
        
        # 매장_발주량을 정수로 변환 (빈 문자열이나 None은 0으로 처리)
        try:
            new_value = int(order_amount) if order_amount not in [None, ""] else 0
        except ValueError:
            return Response({"error": "매장_발주량은 정수여야 합니다."}, status=status.HTTP_400_BAD_REQUEST)
        
        # .get() 대신 filter()로 기존 주문 조회 (id 필드를 참조하지 않도록)
        qs = StoreOrder.objects.filter(매장_id=store_obj, 품목_id=item_obj, 기간=period)
        if qs.exists():
            if new_value == 0:
                qs.delete()
                return Response({
                    "매장_id": store_obj.pk,
                    "품목_id": item_obj.pk,
                    "기간": period,
                    "매장_발주량": 0
                }, status=status.HTTP_200_OK)
            else:
                qs.update(매장_발주량=new_value)
                # 존재하는 컬럼으로 명시적으로 정렬하여 id 필드 참조를 피함
                updated_record = qs.order_by("매장_id", "품목_id", "기간").values("매장_id", "품목_id", "기간", "매장_발주량").first()
                return Response(updated_record, status=status.HTTP_200_OK)
        else:
            if new_value == 0:
                return Response({
                    "매장_id": store_obj.pk,
                    "품목_id": item_obj.pk,
                    "기간": period,
                    "매장_발주량": 0
                }, status=status.HTTP_200_OK)
            else:
                StoreOrder.objects.create(
                    매장_id=store_obj,
                    품목_id=item_obj,
                    기간=period,
                    매장_발주량=new_value
                )
                return Response({
                    "매장_id": store_obj.pk,
                    "품목_id": item_obj.pk,
                    "기간": period,
                    "매장_발주량": new_value
                }, status=status.HTTP_201_CREATED)




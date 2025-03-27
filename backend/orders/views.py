# backend/orders/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import date
from .serializers import (
    StoreOrderCreateSerializer,
    StoreOrderListSerializer,
    WarehouseOrderCreateSerializer,
    WarehouseOrderListSerializer,
    WarehouseOutgoingCreateSerializer,
    WarehouseOutgoingListSerializer,
    WarehouseIncomingCreateSerializer,
    WarehouseIncomingListSerializer,
)
from .models import StoreOrder, WarehouseOrder, WarehouseOutgoing, WarehouseIncoming
from collections import OrderedDict
from django.db.models import F
from django.db import transaction

# 새로 추가: 외래키 모델 임포트
from accounts.models import Store
from suppliers.models import Item


class StoreOrderCreateView(APIView):
    def post(self, request):
        serializer = StoreOrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            store_order = serializer.save()
            return Response(
                StoreOrderCreateSerializer(store_order).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StoreOrderListView(APIView):
    def get(self, request):
        store_id = request.GET.get("store_id")
        round_param = request.GET.get("회차")  # 회차 필터링 (GET 파라미터)
        try:
            page = int(request.GET.get("page", 1))
        except ValueError:
            return Response(
                {"error": "유효한 페이지 번호를 입력하세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 정렬 옵션: 기본은 최신순(내림차순), order=asc 시 오름차순 적용
        order_param = request.GET.get("order", "desc").lower()
        if order_param == "asc":
            ordering = ["기간", "회차"]
        else:
            ordering = ["-기간", "-회차"]

        orders_queryset = StoreOrder.objects.all()
        if store_id:
            orders_queryset = orders_queryset.filter(매장_id=store_id)
        # 회차 파라미터가 있으면 필터링
        if round_param:
            orders_queryset = orders_queryset.filter(회차=round_param)

        # 매장_id만 조회하는 경우
        store_only = request.GET.get("store_only", "").lower()
        if store_only == "true":
            store_ids = (
                orders_queryset.order_by("매장_id")
                .values_list("매장_id", flat=True)
                .distinct()
            )
            return Response({"store_ids": list(store_ids)}, status=status.HTTP_200_OK)

        # 기간 범위 조회 (YYYY.MM.W~YYYY.MM.W)
        period_param = request.GET.get("기간")
        if period_param and "~" in period_param:
            start_period, end_period = period_param.split("~")
            start_period = start_period.strip()
            end_period = end_period.strip()
            qs = orders_queryset.filter(기간__gte=start_period, 기간__lte=end_period)
            orders_for_range = qs.order_by(*ordering)
            orders = list(
                orders_for_range.values(
                    "매장_id", "품목_id", "기간", "회차", "매장_발주량"
                )
            )
            result = {
                "current_period": f"{start_period}",
                "current_round": "전체",  # 범위 조회에서는 회차 개념 없이 전체
                "current_page": 1,
                "total_pages": 1,
                "orders": orders,
            }
            return Response(result, status=status.HTTP_200_OK)

        # 특정 기간 조회 (정확한 기간 문자열)
        if period_param:
            qs = orders_queryset.filter(기간=period_param)
            orders_for_period = qs.order_by(*ordering)
            orders = list(
                orders_for_period.values(
                    "매장_id", "품목_id", "기간", "회차", "매장_발주량"
                )
            )
            result = {
                "current_period": period_param,
                "current_round": round_param if round_param else None,
                "current_page": 1,
                "total_pages": 1,
                "orders": orders,
            }
            return Response(result, status=status.HTTP_200_OK)

        # 페이지네이션: distinct (기간, 회차) 쌍으로 진행
        all_pairs = list(
            orders_queryset.order_by(*ordering).values_list("기간", "회차")
        )
        distinct_pairs = list(OrderedDict.fromkeys(all_pairs))
        total_pages = len(distinct_pairs)
        if total_pages == 0:
            return Response(
                {
                    "current_period": None,
                    "current_round": None,
                    "current_page": 0,
                    "total_pages": 0,
                    "orders": [],
                },
                status=status.HTTP_200_OK,
            )

        if page < 1 or page > total_pages:
            return Response(
                {"error": f"페이지 번호는 1부터 {total_pages} 사이여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        selected_pair = distinct_pairs[page - 1]
        selected_period, selected_round = selected_pair
        orders_for_period = orders_queryset.filter(
            기간=selected_period, 회차=selected_round
        ).order_by(*ordering)
        orders = list(
            orders_for_period.values(
                "매장_id", "품목_id", "기간", "회차", "매장_발주량"
            )
        )

        result = {
            "current_period": selected_period,
            "current_round": selected_round,
            "current_page": page,
            "total_pages": total_pages,
            "orders": orders,
        }
        return Response(result, status=status.HTTP_200_OK)


class StoreOrderUpdateView(APIView):
    def post(self, request):
        store_id = request.data.get("매장_id")
        item_id = request.data.get("품목_id")
        period = request.data.get("기간")
        order_amount = request.data.get("매장_발주량")
        # 기존 기간/회차 정보 (수정 시에만 전달)
        old_period = request.data.get("old_기간")
        old_round = request.data.get("old_회차")
        # 새로 추가: app 파라미터 (default: false)
        app_param = request.data.get("app", "false").lower() == "true"

        if not (store_id and item_id and period):
            return Response(
                {"error": "매장_id, 품목_id, 기간은 필수 입력입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            store_obj = Store.objects.get(pk=store_id)
        except Store.DoesNotExist:
            return Response(
                {"error": "해당 매장을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            item_obj = Item.objects.get(pk=item_id)
        except Item.DoesNotExist:
            return Response(
                {"error": "해당 품목을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            new_value = int(order_amount) if order_amount not in [None, ""] else 0
        except ValueError:
            return Response(
                {"error": "매장_발주량은 정수여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_round = int(request.data.get("회차", 1))
        except ValueError:
            new_round = 1

        with transaction.atomic():
            if app_param:
                # app=true인 경우 (누적 업데이트)
                if old_period is not None and old_round is not None:
                    try:
                        order_obj = StoreOrder.objects.get(
                            매장_id=store_obj,
                            품목_id=item_obj,
                            기간=old_period,
                            회차=old_round,
                        )
                        order_obj.기간 = period
                        order_obj.회차 = new_round
                        order_obj.매장_발주량 += new_value
                        order_obj.save()
                        updated_record = StoreOrderListSerializer(order_obj).data
                        return Response(updated_record, status=status.HTTP_200_OK)
                    except StoreOrder.DoesNotExist:
                        new_order = StoreOrder.objects.create(
                            매장_id=store_obj,
                            품목_id=item_obj,
                            기간=period,
                            회차=new_round,
                            매장_발주량=new_value,
                        )
                        return Response(
                            StoreOrderCreateSerializer(new_order).data,
                            status=status.HTTP_201_CREATED,
                        )
                else:
                    try:
                        order_obj = StoreOrder.objects.get(
                            매장_id=store_obj,
                            품목_id=item_obj,
                            기간=period,
                            회차=new_round,
                        )
                        order_obj.매장_발주량 += new_value
                        order_obj.save()
                        updated_record = StoreOrderListSerializer(order_obj).data
                        return Response(updated_record, status=status.HTTP_200_OK)
                    except StoreOrder.DoesNotExist:
                        new_order = StoreOrder.objects.create(
                            매장_id=store_obj,
                            품목_id=item_obj,
                            기간=period,
                            회차=new_round,
                            매장_발주량=new_value,
                        )
                        return Response(
                            StoreOrderCreateSerializer(new_order).data,
                            status=status.HTTP_201_CREATED,
                        )
            else:
                # app 파라미터가 false인 경우 (값 덮어쓰기)
                if old_period is not None and old_round is not None:
                    try:
                        order_obj = StoreOrder.objects.get(
                            매장_id=store_obj,
                            품목_id=item_obj,
                            기간=old_period,
                            회차=old_round,
                        )
                        order_obj.기간 = period
                        order_obj.회차 = new_round
                        order_obj.매장_발주량 = new_value
                        order_obj.save()
                        updated_record = StoreOrderListSerializer(order_obj).data
                        return Response(updated_record, status=status.HTTP_200_OK)
                    except StoreOrder.DoesNotExist:
                        return Response(
                            {"error": "원래 주문이 존재하지 않습니다."},
                            status=status.HTTP_404_NOT_FOUND,
                        )
                else:
                    try:
                        order_obj = StoreOrder.objects.get(
                            매장_id=store_obj,
                            품목_id=item_obj,
                            기간=period,
                            회차=new_round,
                        )
                        order_obj.매장_발주량 = new_value
                        order_obj.save()
                        updated_record = StoreOrderListSerializer(order_obj).data
                        return Response(updated_record, status=status.HTTP_200_OK)
                    except StoreOrder.DoesNotExist:
                        new_order = StoreOrder.objects.create(
                            매장_id=store_obj,
                            품목_id=item_obj,
                            기간=period,
                            회차=new_round,
                            매장_발주량=new_value,
                        )
                        return Response(
                            StoreOrderCreateSerializer(new_order).data,
                            status=status.HTTP_201_CREATED,
                        )


class WarehouseOrderCreateView(APIView):
    def post(self, request):
        serializer = WarehouseOrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            warehouse_order = serializer.save()
            return Response(
                WarehouseOrderCreateSerializer(warehouse_order).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WarehouseOrderListView(APIView):
    def get(self, request):
        round_param = request.GET.get("회차")
        try:
            page = int(request.GET.get("page", 1))
        except ValueError:
            return Response(
                {"error": "유효한 페이지 번호를 입력하세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order_param = request.GET.get("order", "desc").lower()
        ordering = "기간" if order_param == "asc" else "-기간"

        orders_queryset = WarehouseOrder.objects.all()
        if round_param:
            orders_queryset = orders_queryset.filter(회차=round_param)
        # 창고_발주량 0인 주문 제외
        # orders_queryset = orders_queryset.exclude(창고_발주량=0)

        # 기간 범위 조회 (YYYY.MM~YYYY.MM)
        period_param = request.GET.get("기간")
        if period_param and "~" in period_param:
            start_period, end_period = period_param.split("~")
            start_period = start_period.strip()
            end_period = end_period.strip()
            qs = orders_queryset.filter(기간__gte=start_period, 기간__lte=end_period)
            orders_for_range = qs.order_by(ordering)
            orders = list(
                orders_for_range.values("품목_id", "기간", "회차", "창고_발주량")
            )
            result = {
                "current_period": start_period,
                "current_round": "전체",
                "current_page": 1,
                "total_pages": 1,
                "orders": orders,
            }
            return Response(result, status=status.HTTP_200_OK)

        # 특정 기간 조회
        if period_param:
            qs = orders_queryset.filter(기간=period_param)
            orders_for_period = qs.order_by(ordering)
            orders = list(
                orders_for_period.values("품목_id", "기간", "회차", "창고_발주량")
            )
            result = {
                "current_period": period_param,
                "current_round": round_param if round_param else None,
                "current_page": 1,
                "total_pages": 1,
                "orders": orders,
            }
            return Response(result, status=status.HTTP_200_OK)

        # 페이지네이션 (기간, 회차 쌍별)
        all_pairs = list(orders_queryset.order_by(ordering).values_list("기간", "회차"))
        distinct_pairs = list(OrderedDict.fromkeys(all_pairs))
        total_pages = len(distinct_pairs)
        if total_pages == 0:
            return Response(
                {
                    "current_period": None,
                    "current_round": None,
                    "current_page": 0,
                    "total_pages": 0,
                    "orders": [],
                },
                status=status.HTTP_200_OK,
            )

        if page < 1 or page > total_pages:
            return Response(
                {"error": f"페이지 번호는 1부터 {total_pages} 사이여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        selected_pair = distinct_pairs[page - 1]
        selected_period, selected_round = selected_pair
        orders_for_period = orders_queryset.filter(
            기간=selected_period, 회차=selected_round
        ).order_by(ordering)
        orders = list(
            orders_for_period.values("품목_id", "기간", "회차", "창고_발주량")
        )
        result = {
            "current_period": selected_period,
            "current_round": selected_round,
            "current_page": page,
            "total_pages": total_pages,
            "orders": orders,
        }
        return Response(result, status=status.HTTP_200_OK)


class WarehouseOrderUpdateView(APIView):
    def post(self, request):
        item_id = request.data.get("품목_id")
        period = request.data.get("기간")
        order_amount = request.data.get("창고_발주량")

        if not (item_id and period):
            return Response(
                {"error": "품목_id와 기간은 필수 입력입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            item_obj = Item.objects.get(pk=item_id)
        except Item.DoesNotExist:
            return Response(
                {"error": "해당 품목을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            new_value = int(order_amount) if order_amount not in [None, ""] else 0
        except ValueError:
            return Response(
                {"error": "창고_발주량은 정수여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            round_val = int(request.data.get("회차", 1))
        except ValueError:
            round_val = 1

        qs = WarehouseOrder.objects.filter(
            품목_id=item_obj, 기간=period, 회차=round_val
        )
        if qs.exists():
            qs.update(창고_발주량=new_value)
            updated_record = (
                qs.order_by("품목_id", "기간", "회차")
                .values("품목_id", "기간", "회차", "창고_발주량")
                .first()
            )
            return Response(updated_record, status=status.HTTP_200_OK)
        else:
            WarehouseOrder.objects.create(
                품목_id=item_obj, 기간=period, 회차=round_val, 창고_발주량=new_value
            )
            return Response(
                {
                    "품목_id": item_obj.pk,
                    "기간": period,
                    "회차": round_val,
                    "창고_발주량": new_value,
                },
                status=status.HTTP_201_CREATED,
            )


class WarehouseOutgoingCreateView(APIView):
    def post(self, request):
        serializer = WarehouseOutgoingCreateSerializer(data=request.data)
        if serializer.is_valid():
            outgoing_record = serializer.save()
            return Response(
                WarehouseOutgoingCreateSerializer(outgoing_record).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WarehouseOutgoingListView(APIView):
    def get(self, request):
        store_id = request.GET.get("store_id")
        try:
            page = int(request.GET.get("page", 1))
        except ValueError:
            return Response(
                {"error": "유효한 페이지 번호를 입력하세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order_param = request.GET.get("order", "desc").lower()
        ordering = "기간" if order_param == "asc" else "-기간"

        qs = WarehouseOutgoing.objects.all()
        if store_id:
            qs = qs.filter(매장_id=store_id)
        qs = qs.exclude(창고_출고량=0)

        period_param = request.GET.get("기간")
        # 기간 범위 조회 (ex: "2025.03.1~2025.03.4")
        if period_param and "~" in period_param:
            start_period, end_period = period_param.split("~")
            start_period = start_period.strip()
            end_period = end_period.strip()
            qs_range = qs.filter(기간__gte=start_period, 기간__lte=end_period).order_by(
                ordering
            )
            records = list(qs_range.values("매장_id", "품목_id", "기간", "창고_출고량"))
            result = {
                "current_period": start_period,
                "current_page": 1,
                "total_pages": 1,
                "orders": records,
            }
            return Response(result, status=status.HTTP_200_OK)

        # 특정 기간 조회
        if period_param:
            qs_period = qs.filter(기간=period_param).order_by(ordering)
            records = list(
                qs_period.values("매장_id", "품목_id", "기간", "창고_출고량")
            )
            result = {
                "current_period": period_param,
                "current_page": 1,
                "total_pages": 1,
                "orders": records,
            }
            return Response(result, status=status.HTTP_200_OK)

        # 페이지네이션: distinct한 기간별로 그룹화
        distinct_periods = list(
            OrderedDict.fromkeys(qs.order_by(ordering).values_list("기간", flat=True))
        )
        total_pages = len(distinct_periods)
        if total_pages == 0:
            return Response(
                {
                    "current_period": None,
                    "current_page": 0,
                    "total_pages": 0,
                    "orders": [],
                },
                status=status.HTTP_200_OK,
            )

        if page < 1 or page > total_pages:
            return Response(
                {"error": f"페이지 번호는 1부터 {total_pages} 사이여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        selected_period = distinct_periods[page - 1]
        qs_selected = qs.filter(기간=selected_period).order_by(ordering)
        records = list(qs_selected.values("매장_id", "품목_id", "기간", "창고_출고량"))

        result = {
            "current_period": selected_period,
            "current_page": page,
            "total_pages": total_pages,
            "orders": records,
        }
        return Response(result, status=status.HTTP_200_OK)


class WarehouseOutgoingUpdateView(APIView):
    def post(self, request):
        store_id = request.data.get("매장_id")
        item_id = request.data.get("품목_id")
        period = request.data.get("기간")
        order_amount = request.data.get("창고_출고량")

        if not (store_id and item_id and period):
            return Response(
                {"error": "매장_id, 품목_id, 기간은 필수 입력입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            store_obj = Store.objects.get(pk=store_id)
        except Store.DoesNotExist:
            return Response(
                {"error": "해당 매장을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            item_obj = Item.objects.get(pk=item_id)
        except Item.DoesNotExist:
            return Response(
                {"error": "해당 품목을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            new_value = int(order_amount) if order_amount not in [None, ""] else 0
        except ValueError:
            return Response(
                {"error": "창고_출고량은 정수여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = WarehouseOutgoing.objects.filter(
            매장_id=store_obj, 품목_id=item_obj, 기간=period
        )
        if qs.exists():
            if new_value == 0:
                qs.delete()
                return Response(
                    {
                        "매장_id": store_obj.pk,
                        "품목_id": item_obj.pk,
                        "기간": period,
                        "창고_출고량": 0,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                qs.update(창고_출고량=new_value)
                updated_record = (
                    qs.order_by("매장_id", "품목_id", "기간")
                    .values("매장_id", "품목_id", "기간", "창고_출고량")
                    .first()
                )
                return Response(updated_record, status=status.HTTP_200_OK)
        else:
            if new_value == 0:
                return Response(
                    {
                        "매장_id": store_obj.pk,
                        "품목_id": item_obj.pk,
                        "기간": period,
                        "창고_출고량": 0,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                WarehouseOutgoing.objects.create(
                    매장_id=store_obj,
                    품목_id=item_obj,
                    기간=period,
                    창고_출고량=new_value,
                )
                return Response(
                    {
                        "매장_id": store_obj.pk,
                        "품목_id": item_obj.pk,
                        "기간": period,
                        "창고_출고량": new_value,
                    },
                    status=status.HTTP_201_CREATED,
                )


class StoreOrderDeleteView(APIView):
    def post(self, request):
        # 필수 입력: 매장_id, 품목_id, 기간, (회차는 선택, 없으면 기본 1)
        store_id = request.data.get("매장_id")
        item_id = request.data.get("품목_id")
        period = request.data.get("기간")
        round_param = request.data.get("회차", 1)

        if not (store_id and item_id and period):
            return Response(
                {"error": "매장_id, 품목_id, 기간은 필수 입력입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            store_obj = Store.objects.get(pk=store_id)
        except Store.DoesNotExist:
            return Response(
                {"error": "해당 매장을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            item_obj = Item.objects.get(pk=item_id)
        except Item.DoesNotExist:
            return Response(
                {"error": "해당 품목을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            round_val = int(round_param)
        except ValueError:
            round_val = 1

        qs = StoreOrder.objects.filter(
            매장_id=store_obj, 품목_id=item_obj, 기간=period, 회차=round_val
        )

        if qs.exists():
            qs.delete()
            return Response(
                {
                    "message": "주문이 삭제되었습니다.",
                    "매장_id": store_obj.pk,
                    "품목_id": item_obj.pk,
                    "기간": period,
                    "회차": round_val,
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"error": "해당 주문이 존재하지 않습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )


class WarehouseIncomingCreateView(APIView):
    def post(self, request):
        serializer = WarehouseIncomingCreateSerializer(data=request.data)
        if serializer.is_valid():
            warehouse_incoming = serializer.save()
            return Response(
                WarehouseIncomingCreateSerializer(warehouse_incoming).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WarehouseIncomingListView(APIView):
    def get(self, request):
        store_id = request.GET.get("store_id")
        try:
            page = int(request.GET.get("page", 1))
        except ValueError:
            return Response(
                {"error": "유효한 페이지 번호를 입력하세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order_param = request.GET.get("order", "desc").lower()
        ordering = "기간" if order_param == "asc" else "-기간"

        qs = WarehouseIncoming.objects.all()
        if store_id:
            qs = qs.filter(매장_id=store_id)
        qs = qs.exclude(창고_입고량=0)

        period_param = request.GET.get("기간")
        if period_param and "~" in period_param:
            start_period, end_period = period_param.split("~")
            start_period = start_period.strip()
            end_period = end_period.strip()
            qs_range = qs.filter(기간__gte=start_period, 기간__lte=end_period).order_by(
                ordering
            )
            records = list(qs_range.values("매장_id", "품목_id", "기간", "창고_입고량"))
            result = {
                "current_period": start_period,
                "current_page": 1,
                "total_pages": 1,
                "orders": records,
            }
            return Response(result, status=status.HTTP_200_OK)

        if period_param:
            qs_period = qs.filter(기간=period_param).order_by(ordering)
            records = list(
                qs_period.values("매장_id", "품목_id", "기간", "창고_입고량")
            )
            result = {
                "current_period": period_param,
                "current_page": 1,
                "total_pages": 1,
                "orders": records,
            }
            return Response(result, status=status.HTTP_200_OK)

        distinct_periods = list(
            OrderedDict.fromkeys(qs.order_by(ordering).values_list("기간", flat=True))
        )
        total_pages = len(distinct_periods)
        if total_pages == 0:
            return Response(
                {
                    "current_period": None,
                    "current_page": 0,
                    "total_pages": 0,
                    "orders": [],
                },
                status=status.HTTP_200_OK,
            )

        if page < 1 or page > total_pages:
            return Response(
                {"error": f"페이지 번호는 1부터 {total_pages} 사이여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        selected_period = distinct_periods[page - 1]
        qs_selected = qs.filter(기간=selected_period).order_by(ordering)
        records = list(qs_selected.values("매장_id", "품목_id", "기간", "창고_입고량"))

        result = {
            "current_period": selected_period,
            "current_page": page,
            "total_pages": total_pages,
            "orders": records,
        }
        return Response(result, status=status.HTTP_200_OK)


class WarehouseIncomingUpdateView(APIView):
    def post(self, request):
        store_id = request.data.get("매장_id")
        item_id = request.data.get("품목_id")
        period = request.data.get("기간")
        incoming_amount = request.data.get("창고_입고량")

        if not (store_id and item_id and period):
            return Response(
                {"error": "매장_id, 품목_id, 기간은 필수 입력입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            store_obj = Store.objects.get(pk=store_id)
        except Store.DoesNotExist:
            return Response(
                {"error": "해당 매장을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 수정 시에도 매장_id가 ST_102여야 함
        if store_obj.pk != "ST_102":
            return Response(
                {"error": "매장_id must be ST_102 for WarehouseIncoming."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            item_obj = Item.objects.get(pk=item_id)
        except Item.DoesNotExist:
            return Response(
                {"error": "해당 품목을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            new_value = int(incoming_amount) if incoming_amount not in [None, ""] else 0
        except ValueError:
            return Response(
                {"error": "창고_입고량은 정수여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = WarehouseIncoming.objects.filter(
            매장_id=store_obj, 품목_id=item_obj, 기간=period
        )
        if qs.exists():
            if new_value == 0:
                qs.delete()
                return Response(
                    {
                        "매장_id": store_obj.pk,
                        "품목_id": item_obj.pk,
                        "기간": period,
                        "창고_입고량": 0,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                qs.update(창고_입고량=new_value)
                updated_record = (
                    qs.order_by("매장_id", "품목_id", "기간")
                    .values("매장_id", "품목_id", "기간", "창고_입고량")
                    .first()
                )
                return Response(updated_record, status=status.HTTP_200_OK)
        else:
            if new_value == 0:
                return Response(
                    {
                        "매장_id": store_obj.pk,
                        "품목_id": item_obj.pk,
                        "기간": period,
                        "창고_입고량": 0,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                WarehouseIncoming.objects.create(
                    매장_id=store_obj,
                    품목_id=item_obj,
                    기간=period,
                    창고_입고량=new_value,
                )
                return Response(
                    {
                        "매장_id": store_obj.pk,
                        "품목_id": item_obj.pk,
                        "기간": period,
                        "창고_입고량": new_value,
                    },
                    status=status.HTTP_201_CREATED,
                )

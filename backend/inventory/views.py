# backend/inventory/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import (
    StoreInventory,
    WarehouseInventory,
    StoreMonthEndInventory,
    WarehouseExpiration,
)
from .serializers import WarehouseExpirationSerializer, StoreInventorySerializer
from decimal import Decimal
from accounts.models import Store
from suppliers.models import Item
from collections import OrderedDict


class StoreInventoryListView(APIView):
    def get(self, request):
        # 만약 URL 쿼리로 range=first_last가 전달되면 기간의 최소/최대값만 반환
        if request.GET.get("range") == "first_last":
            qs = StoreInventory.objects.all()
            earliest = qs.order_by("기간").values("기간").first()
            latest = qs.order_by("-기간").values("기간").first()
            if earliest and latest:
                return Response(
                    {
                        "earliest_period": earliest["기간"],
                        "latest_period": latest["기간"],
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response({}, status=status.HTTP_200_OK)

        # 기본: 기간이 지정되지 않으면 최신 기간만 조회하도록 함
        period = request.GET.get("기간", None)
        store_id = request.GET.get("매장_id", None)  # 매장 아이디 필터
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
        inventories = list(qs.values("매장_id", "품목_id", "기간", "매장_재고량"))
        return Response(inventories, status=status.HTTP_200_OK)


class StoreMonthEndInventoryListView(APIView):
    def get(self, request):
        store_id = request.GET.get("store_id")
        try:
            page = int(request.GET.get("page", 1))
        except ValueError:
            return Response(
                {"error": "유효한 페이지 번호를 입력하세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 정렬 옵션: 기본은 최신순(내림차순), order=asc 시 오름차순 적용
        order_param = request.GET.get("order", "desc").lower()
        ordering = "기간" if order_param == "asc" else "-기간"

        inventory_queryset = StoreMonthEndInventory.objects.all()
        if store_id:
            inventory_queryset = inventory_queryset.filter(매장_id=store_id)

        # 기존: 월말_재고량이 0인 재고는 제외 -> 제거

        # 매장_id만 따로 조회할 경우 (store_only 파라미터가 true)
        store_only = request.GET.get("store_only", "").lower()
        if store_only == "true":
            store_ids = (
                inventory_queryset.order_by("매장_id")
                .values_list("매장_id", flat=True)
                .distinct()
            )
            return Response({"store_ids": list(store_ids)}, status=status.HTTP_200_OK)

        # 새 기능: 기간 범위 조회 (예: "YYYY.MM.W ~ YYYY.MM.W")
        period_param = request.GET.get("기간")
        if period_param and "~" in period_param:
            start_period, end_period = period_param.split("~")
            start_period = start_period.strip()
            end_period = end_period.strip()
            inventories_for_range = inventory_queryset.filter(
                기간__gte=start_period, 기간__lte=end_period
            ).order_by(ordering)
            inventories = list(
                inventories_for_range.values(
                    "매장_id", "품목_id", "기간", "월말_재고량"
                )
            )
            result = {
                "current_period": f"{start_period} ~ {end_period}",
                "current_page": 1,
                "total_pages": 1,
                "inventories": inventories,
            }
            return Response(result, status=status.HTTP_200_OK)

        # 기존 기능: 특정 기간 조회 (정확한 기간 문자열)
        if period_param:
            inventories_for_period = inventory_queryset.filter(
                기간=period_param
            ).order_by(ordering)
            inventories = list(
                inventories_for_period.values(
                    "매장_id", "품목_id", "기간", "월말_재고량"
                )
            )
            result = {
                "current_period": period_param,
                "current_page": 1,
                "total_pages": 1,
                "inventories": inventories,
            }
            return Response(result, status=status.HTTP_200_OK)

        # 페이지네이션: distinct한 기간 단위로 진행 (한 기간에 해당하는 재고 기록들)
        all_periods = list(
            inventory_queryset.order_by(ordering).values_list("기간", flat=True)
        )
        distinct_periods = list(OrderedDict.fromkeys(all_periods))
        total_pages = len(distinct_periods)
        if total_pages == 0:
            return Response(
                {
                    "current_period": None,
                    "current_page": 0,
                    "total_pages": 0,
                    "inventories": [],
                },
                status=status.HTTP_200_OK,
            )

        if page < 1 or page > total_pages:
            return Response(
                {"error": f"페이지 번호는 1부터 {total_pages} 사이여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        selected_period = distinct_periods[page - 1]
        inventories_for_period = inventory_queryset.filter(
            기간=selected_period
        ).order_by(ordering)
        inventories = list(
            inventories_for_period.values("매장_id", "품목_id", "기간", "월말_재고량")
        )

        result = {
            "current_period": selected_period,
            "current_page": page,
            "total_pages": total_pages,
            "inventories": inventories,
        }
        return Response(result, status=status.HTTP_200_OK)


class WarehouseInventoryListView(APIView):
    def get(self, request):
        if request.GET.get("range") == "first_last":
            qs = WarehouseInventory.objects.all()
            earliest = qs.order_by("기간").values("기간").first()
            latest = qs.order_by("-기간").values("기간").first()
            if earliest and latest:
                return Response(
                    {
                        "earliest_period": earliest["기간"],
                        "latest_period": latest["기간"],
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response({}, status=status.HTTP_200_OK)
        period = request.GET.get("기간", None)
        qs = WarehouseInventory.objects.all()
        if period:
            qs = qs.filter(기간=period)
        inventories = list(qs.values("매장_id", "품목_id", "기간", "창고_재고량"))
        return Response(inventories, status=status.HTTP_200_OK)


class StoreInventoryUpdateView(APIView):
    def post(self, request):
        # 요청 데이터가 리스트 형태인지 확인
        if not isinstance(request.data, list):
            return Response(
                {"error": "요청 본문은 아이템 리스트여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # StoreInventorySerializer를 사용하여 요청 데이터 유효성 검사 (many=True)
        # 클라이언트에서 '매장_id'를 각 아이템에 포함하여 보내야 합니다.
        # 이 예제에서는 직렬화기를 직접 사용하여 유효성 검사를 수행하지 않고,
        # 뷰 로직 내에서 각 필드를 직접 처리합니다.
        # 보다 엄격한 유효성 검사를 위해서는 serializer = StoreInventorySerializer(data=request.data, many=True)
        # if serializer.is_valid(): ... else: return Response(serializer.errors, ...)
        # 와 같은 패턴을 사용할 수 있습니다.

        results = []
        errors = []

        # 모든 DB 변경사항을 하나의 트랜잭션으로 처리
        try:
            with transaction.atomic():
                for item_data in request.data:
                    store_id = item_data.get("매장_id")
                    item_id = item_data.get("품목_id")
                    period = item_data.get("기간")
                    inventory_amount = item_data.get("매장_재고량")

                    if not (store_id and item_id and period and inventory_amount is not None): # 재고량이 0일 수도 있으므로 None 체크
                        errors.append(
                            {
                                "item_data": item_data,
                                "error": "각 아이템에는 매장_id, 품목_id, 기간, 매장_재고량이 필수입니다.",
                            }
                        )
                        continue  # 다음 아이템으로

                    try:
                        store_obj = Store.objects.get(pk=store_id)
                    except Store.DoesNotExist:
                        errors.append(
                            {"item_data": item_data, "error": f"매장 ID '{store_id}'를 찾을 수 없습니다."}
                        )
                        continue

                    try:
                        item_obj = Item.objects.get(pk=item_id)
                    except Item.DoesNotExist:
                        errors.append(
                            {"item_data": item_data, "error": f"품목 ID '{item_id}'를 찾을 수 없습니다."}
                        )
                        continue
                    
                    try:
                        new_value = (
                            Decimal(str(inventory_amount)) # str()로 감싸서 Decimal 변환 오류 방지
                            if inventory_amount not in [None, ""]
                            else Decimal("0.00")
                        )
                    except Exception:
                        errors.append(
                            {
                                "item_data": item_data,
                                "error": "매장_재고량은 유효한 숫자여야 합니다.",
                            }
                        )
                        continue

                    # update_or_create 사용: (매장_id, 품목_id, 기간)이 기본키 또는 unique_together로 설정되어 있어야 최적
                    # 현재 모델 정의에서는 복합 기본키가 아니므로, defaults를 사용하여 업데이트할 값을 지정합니다.
                    obj, created = StoreInventory.objects.update_or_create(
                        매장_id=store_obj,
                        품목_id=item_obj,
                        기간=period,
                        defaults={"매장_재고량": new_value},
                    )

                    results.append(
                        {
                            "매장_id": obj.매장_id.pk,
                            "품목_id": obj.품목_id.pk,
                            "기간": obj.기간,
                            "매장_재고량": obj.매장_재고량,
                            "created": created,
                        }
                    )
                
                # 만약 errors 리스트에 내용이 있다면, 트랜잭션을 롤백해야 합니다.
                if errors:
                    # 이 지점에 도달했다는 것은 부분적인 성공 후 오류가 발생한 경우일 수 있으나,
                    # transaction.atomic() 컨텍스트를 벗어나기 전에 예외를 발생시키면 전체 롤백됩니다.
                    # 여기서는 부분 성공/실패 응답을 위해 아래 로직을 유지하고,
                    # 심각한 오류(예: DB 연결 불가)가 아니면 커밋될 수 있으므로,
                    # 호출하는 쪽에서 응답을 보고 판단해야 합니다.
                    # 더 엄격하게 하려면, errors가 있을 경우 raise Exception("부분 오류 발생") 등으로 트랜잭션 강제 롤백.
                    pass


        except Exception as e:
            # 트랜잭션 중 예외 발생 시 (예: 데이터베이스 오류)
            return Response(
                {"error": f"트랜잭션 오류: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if errors:
            return Response(
                {"success": False, "results": results, "errors": errors},
                status=status.HTTP_400_BAD_REQUEST, # 또는 status.HTTP_207_MULTI_STATUS
            )
        else:
            return Response(
                {"success": True, "results": results}, status=status.HTTP_200_OK
            )


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
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 외래키 객체로 변환
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

        # 월말_재고량을 Decimal로 변환 (빈 문자열이나 None은 0.00으로 처리)
        try:
            new_value = (
                Decimal(inventory_amount)
                if inventory_amount not in [None, ""]
                else Decimal("0.00")
            )
        except Exception:
            return Response(
                {"error": "월말_재고량은 소수 형태여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 기존 월말 재고 조회 (id 필드 참조 없이 filter 사용)
        qs = StoreMonthEndInventory.objects.filter(
            매장_id=store_obj, 품목_id=item_obj, 기간=period
        )
        if qs.exists():
            qs.update(월말_재고량=new_value)
            updated_record = (
                qs.order_by("매장_id", "품목_id", "기간")
                .values("매장_id", "품목_id", "기간", "월말_재고량")
                .first()
            )
            return Response(updated_record, status=status.HTTP_200_OK)
        else:
            StoreMonthEndInventory.objects.create(
                매장_id=store_obj, 품목_id=item_obj, 기간=period, 월말_재고량=new_value
            )
            return Response(
                {
                    "매장_id": store_obj.pk,
                    "품목_id": item_obj.pk,
                    "기간": period,
                    "월말_재고량": new_value,
                },
                status=status.HTTP_201_CREATED,
            )


class WarehouseInventoryUpdateView(APIView):
    def post(self, request):
        # 필수 필드: 매장_id, 품목_id, 기간, 창고_재고량
        store_id = request.data.get("매장_id")
        item_id = request.data.get("품목_id")
        period = request.data.get("기간")
        inventory_amount = request.data.get("창고_재고량")

        if not (store_id and item_id and period):
            return Response(
                {"error": "매장_id, 품목_id, 기간은 필수 입력입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 외래키 객체로 변환
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

        # 창고_재고량을 정수로 변환 (빈 문자열이나 None은 0으로 처리)
        try:
            new_value = (
                int(inventory_amount) if inventory_amount not in [None, ""] else 0
            )
        except Exception:
            return Response(
                {"error": "창고_재고량은 정수 형태여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 기존 창고 재고 조회
        qs = WarehouseInventory.objects.filter(
            매장_id=store_obj, 품목_id=item_obj, 기간=period
        )
        if qs.exists():
            qs.update(창고_재고량=new_value)
            updated_record = (
                qs.order_by("매장_id", "품목_id", "기간")
                .values("매장_id", "품목_id", "기간", "창고_재고량")
                .first()
            )
            return Response(updated_record, status=status.HTTP_200_OK)
        else:
            WarehouseInventory.objects.create(
                매장_id=store_obj, 품목_id=item_obj, 기간=period, 창고_재고량=new_value
            )
            return Response(
                {
                    "매장_id": store_obj.pk,
                    "품목_id": item_obj.pk,
                    "기간": period,
                    "창고_재고량": new_value,
                },
                status=status.HTTP_201_CREATED,
            )


class WarehouseExpirationListView(APIView):
    def get(self, request):
        # 전체 WarehouseExpiration 레코드를 조회할 때, 필요한 필드만 선택하여 반환
        queryset = WarehouseExpiration.objects.all().values(
            "품목_id", "유통기한", "창고_재고량"
        )
        return Response(list(queryset), status=status.HTTP_200_OK)


class WarehouseExpirationCreateView(APIView):
    def post(self, request):
        data = request.data
        try:
            품목_id = data["품목_id"]
            유통기한 = data["유통기한"]
            창고_재고량 = data.get("창고_재고량", 0)
        except KeyError:
            return Response(
                {"error": "품목_id와 유통기한은 필수 입력입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            item_obj = Item.objects.get(pk=품목_id)
        except Item.DoesNotExist:
            return Response(
                {"error": "해당 품목을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if WarehouseExpiration.objects.filter(
            품목_id=item_obj, 유통기한=유통기한
        ).exists():
            return Response(
                {"error": "해당 키의 레코드가 이미 존재합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        WarehouseExpiration.objects.create(
            품목_id=item_obj, 유통기한=유통기한, 창고_재고량=창고_재고량
        )
        # 존재하는 칼럼으로 정렬하도록 수정
        record_data = (
            WarehouseExpiration.objects.filter(품목_id=item_obj, 유통기한=유통기한)
            .order_by("품목_id", "유통기한")
            .values("품목_id", "유통기한", "창고_재고량")
            .first()
        )
        return Response(record_data, status=status.HTTP_201_CREATED)


class WarehouseExpirationUpdateView(APIView):
    def post(self, request):
        data = request.data
        try:
            품목_id = data["품목_id"]
            new_유통기한 = data["유통기한"]
            창고_재고량 = data.get("창고_재고량", None)
        except KeyError:
            return Response(
                {"error": "품목_id와 유통기한은 필수 입력입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 수정 시 기존 유통기한(old_유통기한)이 함께 전달되면 이를 기준으로 찾음
        old_유통기한 = data.get("old_유통기한", None)

        try:
            item_obj = Item.objects.get(pk=품목_id)
        except Item.DoesNotExist:
            return Response(
                {"error": "해당 품목을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if old_유통기한:
            qs = WarehouseExpiration.objects.filter(
                품목_id=item_obj, 유통기한=old_유통기한
            )
        else:
            qs = WarehouseExpiration.objects.filter(
                품목_id=item_obj, 유통기한=new_유통기한
            )

        if not qs.exists():
            return Response(
                {"error": "수정할 레코드를 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        qs.update(유통기한=new_유통기한, 창고_재고량=창고_재고량)
        # 존재하는 칼럼으로 정렬하도록 수정
        record_data = (
            WarehouseExpiration.objects.filter(품목_id=item_obj, 유통기한=new_유통기한)
            .order_by("품목_id", "유통기한")
            .values("품목_id", "유통기한", "창고_재고량")
            .first()
        )
        return Response(record_data, status=status.HTTP_200_OK)


class WarehouseExpirationDeleteView(APIView):
    def post(self, request):
        data = request.data
        try:
            품목_id = data["품목_id"]
            유통기한 = data["유통기한"]
        except KeyError:
            return Response(
                {"error": "품목_id와 유통기한은 필수 입력입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            item_obj = Item.objects.get(pk=품목_id)
        except Item.DoesNotExist:
            return Response(
                {"error": "해당 품목을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        qs = WarehouseExpiration.objects.filter(품목_id=item_obj, 유통기한=유통기한)
        if not qs.exists():
            return Response(
                {"error": "삭제할 레코드를 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        qs.delete()
        return Response(
            {
                "message": "레코드가 삭제되었습니다.",
                "품목_id": 품목_id,
                "유통기한": 유통기한,
            },
            status=status.HTTP_200_OK,
        )

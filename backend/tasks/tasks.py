from celery import shared_task
from django.utils import timezone
from suppliers.models import Item
from orders.models import WarehouseOrder
from django.db import transaction


@shared_task
def create_monthly_warehouse_orders():
    """
    매월 1일 실행되어, 활성화=True인 품목(Item)마다
    WarehouseOrder 테이블에 (기간=YYYY.MM, 회차=1, 창고_발주량=0) 레코드를 자동 생성한다.
    """
    now = timezone.now()
    # 오늘 날짜로 "YYYY.MM" 만들기 (예: 2025.04)
    period = now.strftime("%Y.%m")
    round_value = 1

    # 활성화 필드가 True인 모든 품목 가져오기
    active_items = Item.objects.filter(활성화=True)

    # 원자성 보장 (트랜잭션)
    with transaction.atomic():
        for item in active_items:
            WarehouseOrder.objects.get_or_create(
                품목_id=item, 기간=period, 회차=round_value, defaults={"창고_발주량": 0}
            )

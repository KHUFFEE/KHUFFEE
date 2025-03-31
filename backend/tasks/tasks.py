from celery import shared_task
from django.utils import timezone
from django.db import transaction, connection
from datetime import timedelta, date
from suppliers.models import Item
from inventory.models import StoreInventory, WarehouseInventory
from orders.models import WarehouseOrder


@shared_task
def create_monthly_warehouse_orders():
    """
    매월 1일 실행되어, 활성화=True인 품목(Item)마다
    WarehouseOrder 테이블에 (기간=YYYY.MM, 회차=1, 창고_발주량=0) 레코드를 자동 생성한다.
    """
    now = timezone.localtime(timezone.now())
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


@shared_task
def store_inventory_rollover():
    """
    매일 실행: 어제의 매장 재고를 오늘 날짜(YYYY.MM.DD)로 이월 처리
    (어제 기록이 있고 오늘 기록이 없으면 복사)
    """
    today = date.today()
    yesterday = today - timedelta(days=1)
    today_str = today.strftime("%Y.%m.%d")
    yesterday_str = yesterday.strftime("%Y.%m.%d")

    records = StoreInventory.objects.filter(기간=yesterday_str)
    with transaction.atomic():
        for rec in records:
            if not StoreInventory.objects.filter(
                매장_id=rec.매장_id, 품목_id=rec.품목_id, 기간=today_str
            ).exists():
                StoreInventory.objects.create(
                    매장_id=rec.매장_id,
                    품목_id=rec.품목_id,
                    기간=today_str,
                    매장_재고량=rec.매장_재고량,
                )


@shared_task
def warehouse_inventory_rollover():
    """
    매일 실행: 어제의 창고 재고를 오늘 날짜(YYYY.MM.DD)로 이월 처리
    (어제 기록이 있고 오늘 기록이 없으면 복사)
    """
    today = date.today()
    yesterday = today - timedelta(days=1)
    today_str = today.strftime("%Y.%m.%d")
    yesterday_str = yesterday.strftime("%Y.%m.%d")

    records = WarehouseInventory.objects.filter(기간=yesterday_str)
    with transaction.atomic():
        for rec in records:
            if not WarehouseInventory.objects.filter(
                매장_id=rec.매장_id, 품목_id=rec.품목_id, 기간=today_str
            ).exists():
                WarehouseInventory.objects.create(
                    매장_id=rec.매장_id,
                    품목_id=rec.품목_id,
                    기간=today_str,
                    창고_재고량=rec.창고_재고량,
                )


@shared_task
def reset_warehouse_inventory_status():
    """
    매일 실행: '창고_재고' 테이블 관련 상태를 0으로 리셋
    """
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE khuffee.상태_관리
            SET 상태 = 0
            WHERE 테이블 = '창고_재고'
        """
        )

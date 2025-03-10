from django.db import models
from accounts.models import Store
from suppliers.models import Supplier, Item


class StoreOrder(models.Model):
    매장_id = models.ForeignKey(Store, on_delete=models.PROTECT, db_column="매장_id")
    품목_id = models.ForeignKey(Item, on_delete=models.PROTECT, db_column="품목_id")
    기간 = models.CharField(max_length=10)  # YYYY.MM.N
    회차 = models.PositiveSmallIntegerField(
        default=1
    )  # 새로 추가: 1~9 사이의 정수만 허용하도록 (DB에서 CHECK 제약조건 적용됨)
    매장_발주량 = models.IntegerField()

    class Meta:
        db_table = "매장_발주"
        unique_together = ("매장_id", "품목_id", "기간", "회차")


class WarehouseIncoming(models.Model):
    매장_id = models.ForeignKey(Store, on_delete=models.PROTECT, db_column="매장_id")
    품목_id = models.ForeignKey(Item, on_delete=models.PROTECT, db_column="품목_id")
    기간 = models.CharField(max_length=10)  # YYYY.MM.N
    창고_입고량 = models.IntegerField()

    class Meta:
        db_table = "창고_입고"
        unique_together = ("매장_id", "품목_id", "기간")


class WarehouseOutgoing(models.Model):
    매장_id = models.ForeignKey(Store, on_delete=models.PROTECT, db_column="매장_id")
    품목_id = models.ForeignKey(Item, on_delete=models.PROTECT, db_column="품목_id")
    기간 = models.CharField(max_length=10)  # YYYY.MM.N
    창고_출고량 = models.IntegerField()

    class Meta:
        db_table = "창고_출고"
        unique_together = ("매장_id", "품목_id", "기간")


class WarehouseOrder(models.Model):
    품목_id = models.ForeignKey(Item, on_delete=models.PROTECT, db_column="품목_id")
    기간 = models.CharField(max_length=7)  # YYYY.MM 형식
    회차 = models.PositiveSmallIntegerField(
        default=1
    )  # 1~9 사이의 값 (DB에서 CHECK 제약조건 적용)
    창고_발주량 = models.IntegerField()

    class Meta:
        db_table = "창고_발주"
        unique_together = ("품목_id", "기간", "회차")

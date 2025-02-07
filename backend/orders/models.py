from django.db import models
from accounts.models import Store
from suppliers.models import Supplier, Item

class StoreOrder(models.Model):
    매장_id = models.ForeignKey(Store, on_delete=models.PROTECT, db_column="매장_id")
    품목_id = models.ForeignKey(Item, on_delete=models.PROTECT, db_column="품목_id")
    기간 = models.CharField(max_length=10)  # YYYY.MM.N
    매장_발주량 = models.IntegerField()

    class Meta:
        db_table = "매장_발주"
        unique_together = ("매장_id", "품목_id", "기간")  # 복합 Primary Key 적용


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
    협력사_id = models.ForeignKey(Supplier, on_delete=models.PROTECT, db_column="협력사_id")
    품목_id = models.ForeignKey(Item, on_delete=models.PROTECT, db_column="품목_id")
    기간 = models.CharField(max_length=10)  # YYYY.MM.N
    창고_발주량 = models.IntegerField()

    class Meta:
        db_table = "창고_발주"
        unique_together = ("협력사_id", "품목_id", "기간")
from django.db import models
from accounts.models import Store
from suppliers.models import Item


class StoreInventory(models.Model):
    매장_id = models.ForeignKey(
        Store, on_delete=models.PROTECT, db_column="매장_id"
    )  # 삭제 방지
    품목_id = models.ForeignKey(
        Item, on_delete=models.PROTECT, db_column="품목_id"
    )  # 삭제 방지
    기간 = models.CharField(max_length=10)  # YYYY.MM.DD
    매장_재고량 = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "매장_재고"
        unique_together = ("매장_id", "품목_id", "기간")


class StoreMonthEndInventory(models.Model):
    매장_id = models.ForeignKey(
        Store, on_delete=models.PROTECT, db_column="매장_id"
    )  # 삭제 방지
    품목_id = models.ForeignKey(
        Item, on_delete=models.PROTECT, db_column="품목_id"
    )  # 삭제 방지
    기간 = models.CharField(max_length=7)  # 예: '2025.05', 연도와 월만 사용
    월말_재고량 = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "매장_월말재고"
        unique_together = ("매장_id", "품목_id", "기간")


class WarehouseInventory(models.Model):
    매장_id = models.ForeignKey(
        Store, on_delete=models.PROTECT, db_column="매장_id"
    )  # 삭제 방지
    품목_id = models.ForeignKey(
        Item, on_delete=models.PROTECT, db_column="품목_id"
    )  # 삭제 방지
    기간 = models.CharField(max_length=10)  # YYYY.MM.DD
    창고_재고량 = models.IntegerField()

    class Meta:
        db_table = "창고_재고"
        unique_together = ("매장_id", "품목_id", "기간")

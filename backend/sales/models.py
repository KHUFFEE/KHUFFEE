from django.db import models
from accounts.models import Store

class Sales(models.Model):
    매장_id = models.ForeignKey(Store, on_delete=models.PROTECT, db_column="매장_id")
    기간 = models.CharField(max_length=7)  # YYYY.MM
    매출액 = models.DecimalField(max_digits=15, decimal_places=2)

    class Meta:
        db_table = "매출"
        unique_together = ("매장_id", "기간")  # 복합 Primary Key 적용

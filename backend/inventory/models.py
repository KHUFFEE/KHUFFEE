from django.db import models
from accounts.models import Store
from suppliers.models import Item

class StoreInventory(models.Model):
    매장 = models.ForeignKey(Store, on_delete=models.CASCADE)
    품목 = models.ForeignKey(Item, on_delete=models.CASCADE)
    기간 = models.CharField(max_length=10)  # YYYY.MM.DD
    매장_재고량 = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ('매장', '품목', '기간')

    def __str__(self):
        return f"{self.매장} - {self.품목} ({self.기간})"

class WarehouseInventory(models.Model):
    매장 = models.ForeignKey(Store, on_delete=models.CASCADE)
    품목 = models.ForeignKey(Item, on_delete=models.CASCADE)
    기간 = models.CharField(max_length=10)  # YYYY.MM.DD
    창고_재고량 = models.IntegerField()

    class Meta:
        unique_together = ('매장', '품목', '기간')

    def __str__(self):
        return f"{self.매장} - {self.품목} ({self.기간})"

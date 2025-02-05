from django.db import models
from accounts.models import Store
from suppliers.models import Supplier, Item

class StoreOrder(models.Model):
    매장 = models.ForeignKey(Store, on_delete=models.CASCADE)
    품목 = models.ForeignKey(Item, on_delete=models.CASCADE)
    기간 = models.CharField(max_length=10)  # YYYY.MM.N
    매장_발주량 = models.IntegerField()

    class Meta:
        unique_together = ('매장', '품목', '기간')

    def __str__(self):
        return f"{self.매장} - {self.품목} ({self.기간})"

class WarehouseIncoming(models.Model):
    매장 = models.ForeignKey(Store, on_delete=models.CASCADE)
    품목 = models.ForeignKey(Item, on_delete=models.CASCADE)
    기간 = models.CharField(max_length=10)  # YYYY.MM.N
    창고_입고량 = models.IntegerField()

    class Meta:
        unique_together = ('매장', '품목', '기간')

    def __str__(self):
        return f"{self.매장} - {self.품목} ({self.기간})"

class WarehouseOutgoing(models.Model):
    매장 = models.ForeignKey(Store, on_delete=models.CASCADE)
    품목 = models.ForeignKey(Item, on_delete=models.CASCADE)
    기간 = models.CharField(max_length=10)  # YYYY.MM.N
    창고_출고량 = models.IntegerField()

    class Meta:
        unique_together = ('매장', '품목', '기간')

    def __str__(self):
        return f"{self.매장} - {self.품목} ({self.기간})"

class WarehouseOrder(models.Model):
    협력사 = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    품목 = models.ForeignKey(Item, on_delete=models.CASCADE)
    기간 = models.CharField(max_length=10)  # YYYY.MM.N
    창고_발주량 = models.IntegerField()

    class Meta:
        unique_together = ('협력사', '품목', '기간')

    def __str__(self):
        return f"{self.협력사} - {self.품목} ({self.기간})"

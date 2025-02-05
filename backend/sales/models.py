from django.db import models
from accounts.models import Store

class Sales(models.Model):
    매장 = models.ForeignKey(Store, on_delete=models.CASCADE)
    기간 = models.CharField(max_length=7)  # YYYY.MM
    매출액 = models.DecimalField(max_digits=15, decimal_places=2)

    class Meta:
        unique_together = ('매장', '기간')

    def __str__(self):
        return f"{self.매장} - {self.기간} 매출: {self.매출액}"

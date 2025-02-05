from django.db import models

class Supplier(models.Model):
    협력사_id = models.CharField(max_length=20, primary_key=True)
    협력사명 = models.CharField(max_length=255)

    def __str__(self):
        return self.협력사명

class Item(models.Model):
    품목_id = models.CharField(max_length=20, primary_key=True)
    협력사 = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    품목명 = models.CharField(max_length=255)
    규격 = models.CharField(max_length=255, blank=True, null=True)
    단위 = models.CharField(max_length=50, blank=True, null=True)
    입고단가 = models.DecimalField(max_digits=10, decimal_places=2)
    입고단위 = models.IntegerField(blank=True, null=True)
    입고단위단가 = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return self.품목명

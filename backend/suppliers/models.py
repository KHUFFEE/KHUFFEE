from django.db import models

class Supplier(models.Model):
    협력사_id = models.CharField(max_length=20, primary_key=True)
    협력사명 = models.CharField(max_length=255)

    class Meta:
        db_table = "협력사"  
        
    def save(self, *args, **kwargs):
        if not self.협력사_id:  # ID가 없을 때만 자동 생성
            last_id = Supplier.objects.order_by('-협력사_id').first()
            if last_id:
                last_number = int(last_id.협력사_id.split('_')[1])
                self.협력사_id = f"CO_{last_number + 1:03d}"
            else:
                self.협력사_id = "CO_101"  # 첫 ID 값
        super().save(*args, **kwargs)

class Item(models.Model):
    품목_id = models.CharField(max_length=20, primary_key=True)
    협력사 = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    품목명 = models.CharField(max_length=255)
    규격 = models.CharField(max_length=255, blank=True, null=True)
    단위 = models.CharField(max_length=50, blank=True, null=True)
    입고단가 = models.DecimalField(max_digits=10, decimal_places=2)
    입고단위 = models.IntegerField(blank=True, null=True)
    입고단위단가 = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = "품목"  
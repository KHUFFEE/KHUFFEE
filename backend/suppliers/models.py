from django.db import models

class Supplier(models.Model):
    협력사_id = models.CharField(max_length=20, primary_key=True)
    협력사명 = models.CharField(max_length=255)
    활성화 = models.BooleanField(default=True)  # MySQL TINYINT(1) DEFAULT 1 대응

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
    협력사_id = models.ForeignKey(Supplier, on_delete=models.PROTECT, db_column="협력사_id")
    품목명 = models.CharField(max_length=255)
    종류 = models.CharField(max_length=255)
    규격 = models.CharField(max_length=255, blank=True, null=True)
    단위 = models.CharField(max_length=50, blank=True, null=True)
    입고단가 = models.DecimalField(max_digits=16, decimal_places=6)
    입고단위 = models.IntegerField(blank=True, null=True)
    입고단위단가 = models.IntegerField(blank=True, null=True)
    출고단위 = models.IntegerField(blank=True, null=True)
    활성화 = models.BooleanField(default=True)  # MySQL TINYINT(1) DEFAULT 1 대응

    class Meta:
        db_table = "품목"

    def save(self, *args, **kwargs):
        if not self.품목_id:
            last_item = Item.objects.order_by('-품목_id').first()
            if last_item:
                try:
                    last_number = int(last_item.품목_id.split('_')[1])
                except (IndexError, ValueError):
                    last_number = 100  # 파싱 실패 시 기본값
                self.품목_id = f"IT_{last_number + 1:03d}"
            else:
                self.품목_id = "IT_101"  # 첫 ID 값
        super().save(*args, **kwargs)

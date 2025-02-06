from django.db import models

class Store(models.Model):
    매장_id = models.CharField(max_length=20, primary_key=True)
    매장명 = models.CharField(max_length=255)
    매장_비밀번호 = models.CharField(max_length=255)

    class Meta:
        db_table = "매장"  # Django가 "매장" 테이블을 사용하도록 명시

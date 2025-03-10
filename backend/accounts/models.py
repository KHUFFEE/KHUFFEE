from django.db import models


class Store(models.Model):
    매장_id = models.CharField(max_length=20, primary_key=True)
    매장명 = models.CharField(max_length=255)
    매장_비밀번호 = models.CharField(max_length=255)
    활성화 = models.BooleanField(default=True)  # TINYINT와 대응되는 BooleanField 사용

    class Meta:
        db_table = "매장"

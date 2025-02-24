from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class TableStatus(models.Model):
    테이블 = models.CharField(max_length=255, primary_key=True)  # 기존 DB 테이블의 PK
    상태 = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(9)]
    )  # 0부터 9까지의 정수만 저장

    class Meta:
        db_table = "상태_관리"

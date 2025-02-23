# management/models.py
from django.db import models

class TableStatus(models.Model):
    테이블 = models.CharField(max_length=255, primary_key=True)  # 기존 DB 테이블의 PK
    상태 = models.PositiveSmallIntegerField()  # 0 또는 1을 저장

    class Meta:
        db_table = "상태_관리"

from django.db import models


class Store(models.Model):
    매장_id = models.CharField(max_length=20, primary_key=True)
    매장명 = models.CharField(max_length=255)

    # 새 필드
    매장_아이디 = models.CharField(
        max_length=50,
        unique=True,
        null=False,
        blank=True,
    )

    매장_비밀번호 = models.CharField(max_length=255)
    활성화 = models.BooleanField(default=True)

    class Meta:
        db_table = "매장"

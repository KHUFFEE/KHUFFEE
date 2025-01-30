from django.db import models

class Store(models.Model):
    store_id = models.CharField(max_length=255, primary_key=True)
    store_name = models.CharField(max_length=255)

    class Meta:
        managed = False  # Django가 이 테이블을 생성하지 않도록 설정
        db_table = 'store'  # MySQL의 기존 테이블과 연결

class User(models.Model):
    store = models.OneToOneField(Store, on_delete=models.CASCADE, primary_key=True)
    store_name = models.CharField(max_length=255, blank=True, null=True)
    store_pw = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False  # Django가 이 테이블을 관리하지 않도록 설정
        db_table = 'user'  # MySQL의 기존 테이블과 연결

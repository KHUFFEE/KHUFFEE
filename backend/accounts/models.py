from django.db import models

class Store(models.Model):
    매장_id = models.CharField(max_length=20, primary_key=True)
    매장명 = models.CharField(max_length=255)
    매장_비밀번호 = models.CharField(max_length=255)

    def __str__(self):
        return self.매장명

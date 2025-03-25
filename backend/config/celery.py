import os
from celery import Celery

# Django 프로젝트의 settings 모듈 경로 설정
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("config")  # 첫 번째 인자는 Celery 인스턴스 이름
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

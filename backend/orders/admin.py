from django.contrib import admin
from .models import Store, User

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('store_id', 'store_name')  # 테이블에 표시할 필드 추가

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('store_id', 'store_name', 'store_pw')  # User 모델도 표시

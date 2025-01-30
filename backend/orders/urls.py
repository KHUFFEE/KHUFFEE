from django.urls import path
from .views import store_list, store_detail, store_login

urlpatterns = [
    path('stores/', store_list, name='store_list'),  # GET, POST
    path('stores/<str:store_id>/', store_detail, name='store_detail'),  # GET, PUT, DELETE
    path('login/', store_login, name='store_login'),  # 로그인
]

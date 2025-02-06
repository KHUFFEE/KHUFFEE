from django.urls import path
from .views import StoreLoginView

urlpatterns = [
    path('login/', StoreLoginView.as_view(), name='store-login'),
]

# backend/orders/urls.py
from django.urls import path
from .views import StoreOrderCreateView

urlpatterns = [
    path('store_order/', StoreOrderCreateView.as_view(), name='store-order-create'),
]

# backend/orders/urls.py
from django.urls import path
from .views import StoreOrderCreateView, StoreOrderListView

urlpatterns = [
    path('store_order_create/', StoreOrderCreateView.as_view(), name='store-order-create'),
    path('store_order_list/', StoreOrderListView.as_view(), name='store-order-list'),
]

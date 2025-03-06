# backend/orders/urls.py
from django.urls import path
from .views import StoreOrderCreateView, StoreOrderListView, StoreOrderUpdateView, WarehouseOrderCreateView, WarehouseOrderListView, WarehouseOrderUpdateView

urlpatterns = [
    path('store_order_create/', StoreOrderCreateView.as_view(), name='store-order-create'),
    path('store_order_list/', StoreOrderListView.as_view(), name='store-order-list'),
    path('store_order_update/', StoreOrderUpdateView.as_view(), name='store-order-update'),
    path('warehouse_order_create/', WarehouseOrderCreateView.as_view(), name='warehouse-order-create'),
    path('warehouse_order_list/', WarehouseOrderListView.as_view(), name='warehouse-order-list'),
    path('warehouse_order_update/', WarehouseOrderUpdateView.as_view(), name='warehouse-order-update'),
]

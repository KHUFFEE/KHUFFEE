# backend/inventory/urls.py
from django.urls import path
from .views import StoreInventoryListView, WarehouseInventoryListView, StoreInventoryUpdateView

urlpatterns = [
    path('store/', StoreInventoryListView.as_view(), name='store-inventory-list'),
    path('warehouse/', WarehouseInventoryListView.as_view(), name='warehouse-inventory-list'),
    path('store_order_update/', StoreInventoryUpdateView.as_view(), name='store-inventory-update'),
]
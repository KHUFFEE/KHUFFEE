# backend/inventory/urls.py
from django.urls import path
from .views import StoreInventoryListView, WarehouseInventoryListView, StoreInventoryUpdateView, StoreMonthEndInventoryUpdateView

urlpatterns = [
    path('store/', StoreInventoryListView.as_view(), name='store-inventory-list'),
    path('warehouse/', WarehouseInventoryListView.as_view(), name='warehouse-inventory-list'),
    path('store_inventory_update/', StoreInventoryUpdateView.as_view(), name='store-inventory-update'),
    path('store_monthend_inventory_update/', StoreMonthEndInventoryUpdateView.as_view(), name='store-monthend-inventory-update'),
]
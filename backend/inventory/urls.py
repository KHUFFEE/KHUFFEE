# backend/inventory/urls.py
from django.urls import path
from .views import (
    StoreInventoryListView,
    WarehouseInventoryListView,
    StoreInventoryUpdateView,
    StoreMonthEndInventoryUpdateView,
    StoreMonthEndInventoryListView,
    WarehouseInventoryUpdateView,
)

urlpatterns = [
    path("store/", StoreInventoryListView.as_view(), name="store-inventory-list"),
    path(
        "store_monthend/",
        StoreMonthEndInventoryListView.as_view(),
        name="store-monthend",
    ),
    path(
        "warehouse/",
        WarehouseInventoryListView.as_view(),
        name="warehouse-inventory-list",
    ),
    path(
        "store_inventory_update/",
        StoreInventoryUpdateView.as_view(),
        name="store-inventory-update",
    ),
    path(
        "store_monthend_inventory_update/",
        StoreMonthEndInventoryUpdateView.as_view(),
        name="store-monthend-inventory-update",
    ),
    path(
        "warehouse_inventory_update/",
        WarehouseInventoryUpdateView.as_view(),
        name="warehouse-inventory-update",
    ),
]

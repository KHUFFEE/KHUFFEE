# backend/inventory/urls.py
from django.urls import path
from .views import (
    StoreInventoryListView,
    WarehouseInventoryListView,
    StoreInventoryUpdateView,
    StoreMonthEndInventoryUpdateView,
    StoreMonthEndInventoryListView,
    WarehouseInventoryUpdateView,
    WarehouseExpirationListView,
    WarehouseExpirationCreateView,
    WarehouseExpirationUpdateView,
    WarehouseExpirationDeleteView,
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
    path(
        "warehouse_expiration_list/",
        WarehouseExpirationListView.as_view(),
        name="warehouse-expiration-list",
    ),
    path(
        "warehouse_expiration_create/",
        WarehouseExpirationCreateView.as_view(),
        name="warehouse-expiration-create",
    ),
    path(
        "warehouse_expiration_update/",
        WarehouseExpirationUpdateView.as_view(),
        name="warehouse-expiration-update",
    ),
    path(
        "warehouse_expiration_delete/",
        WarehouseExpirationDeleteView.as_view(),
        name="warehouse-expiration-delete",
    ),
]

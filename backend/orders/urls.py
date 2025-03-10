# backend/orders/urls.py
from django.urls import path
from .views import (
    StoreOrderCreateView,
    StoreOrderListView,
    StoreOrderUpdateView,
    WarehouseOrderCreateView,
    WarehouseOrderListView,
    WarehouseOrderUpdateView,
    WarehouseOutgoingCreateView,
    WarehouseOutgoingListView,
    WarehouseOutgoingUpdateView,
    StoreOrderDeleteView,
    WarehouseIncomingCreateView,
    WarehouseIncomingListView,
    WarehouseIncomingUpdateView,
)

urlpatterns = [
    path(
        "store_order_create/", StoreOrderCreateView.as_view(), name="store-order-create"
    ),
    path("store_order_list/", StoreOrderListView.as_view(), name="store-order-list"),
    path(
        "store_order_update/", StoreOrderUpdateView.as_view(), name="store-order-update"
    ),
    path(
        "store_order_delete/", StoreOrderDeleteView.as_view(), name="store-order-delete"
    ),
    path(
        "warehouse_order_create/",
        WarehouseOrderCreateView.as_view(),
        name="warehouse-order-create",
    ),
    path(
        "warehouse_order_list/",
        WarehouseOrderListView.as_view(),
        name="warehouse-order-list",
    ),
    path(
        "warehouse_order_update/",
        WarehouseOrderUpdateView.as_view(),
        name="warehouse-order-update",
    ),
    path(
        "warehouse_outgoing_create/",
        WarehouseOutgoingCreateView.as_view(),
        name="warehouse-outgoing-create",
    ),
    path(
        "warehouse_outgoing_list/",
        WarehouseOutgoingListView.as_view(),
        name="warehouse-outgoing-list",
    ),
    path(
        "warehouse_outgoing_update/",
        WarehouseOutgoingUpdateView.as_view(),
        name="warehouse-outgoing-update",
    ),
    path(
        "warehouse_incoming_create/",
        WarehouseIncomingCreateView.as_view(),
        name="warehouse-incoming-create",
    ),
    path(
        "warehouse_incoming_list/",
        WarehouseIncomingListView.as_view(),
        name="warehouse-incoming-list",
    ),
    path(
        "warehouse_incoming_update/",
        WarehouseIncomingUpdateView.as_view(),
        name="warehouse-incoming-update",
    ),
]

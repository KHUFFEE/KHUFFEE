# backend/suppliers/urls.py
from django.urls import path
from .views import ItemListView, SupplierListView, SupplierDeleteView, ItemDeleteView, ItemUpdateView

urlpatterns = [
    path('items/', ItemListView.as_view(), name='item-list'),
    path('items/update/', ItemUpdateView.as_view(), name='item-update'),
    path('', SupplierListView.as_view(), name='supplier-list'),  # GET과 POST 요청 모두 처리
    path('delete/', SupplierDeleteView.as_view(), name='supplier-delete'),
    path('items/delete/', ItemDeleteView.as_view(), name='item-delete'),
]

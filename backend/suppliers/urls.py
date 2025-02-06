from django.urls import path
from .views import ItemListView, SupplierListView, SupplierDeleteView

urlpatterns = [
    path('items/', ItemListView.as_view(), name='item-list'),
    path('', SupplierListView.as_view(), name='supplier-list'),  # GET과 POST 요청 모두 처리
    path('delete/', SupplierDeleteView.as_view(), name='supplier-delete'),
]

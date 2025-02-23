# management/urls.py
from django.urls import path
from .views import TableStatusUpdateView

urlpatterns = [
    path('table-status/', TableStatusUpdateView.as_view(), name='table-status-update'),
]

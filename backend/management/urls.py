# management/urls.py
from django.urls import path
from .views import TableStatusUpdateView, TableStatusListView

urlpatterns = [
    path(
        "table_status_update/",
        TableStatusUpdateView.as_view(),
        name="table-status-update",
    ),
    path("table_status_list/", TableStatusListView.as_view(), name="table-status-list"),
]

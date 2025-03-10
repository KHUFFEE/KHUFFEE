from django.urls import path
from .views import StoreLoginView, StoreListView

urlpatterns = [
    path("login/", StoreLoginView.as_view(), name="store-login"),
    path("stores/", StoreListView.as_view(), name="store-list"),
]

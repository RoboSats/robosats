from django.urls import path
from .views import MakeOrder

urlpatterns = [
    path('make/', MakeOrder.as_view())
    ]
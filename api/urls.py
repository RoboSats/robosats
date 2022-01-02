from django.urls import path
from .views import MakeOrder, OrderView

urlpatterns = [
    path('make/', MakeOrder.as_view()),
    path('order/', OrderView.as_view()),
    ]
from django.urls import path
from .views import MakeOrder, OrderView, UserGenerator, BookView

urlpatterns = [
    path('make/', MakeOrder.as_view()),
    path('order/', OrderView.as_view()),
    path('usergen/', UserGenerator.as_view()),
    path('book/', BookView.as_view()),
    ]
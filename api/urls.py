from django.urls import path
from .views import OrderMakerView, OrderView, UserView, BookView, get_currencies_json

urlpatterns = [
    path('make/', OrderMakerView.as_view()),
    path('order/', OrderView.as_view({'get':'get','post':'take_or_update'})),
    path('usergen/', UserView.as_view()),
    path('book/', BookView.as_view()),
    path('currencies/', get_currencies_json),
    ]
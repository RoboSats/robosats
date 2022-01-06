from django.urls import path
from .views import OrderMakerView, OrderView, UserView, BookView

urlpatterns = [
    path('make/', OrderMakerView.as_view()),
    path('order/', OrderView.as_view({'get':'get','post':'take_update_confirm_dispute_cancel'})),
    path('usergen/', UserView.as_view()),
    path('book/', BookView.as_view()),
    ]
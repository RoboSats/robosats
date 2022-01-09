from django.urls import path
from .views import MakerView, OrderView, UserView, BookView, InfoView, get_currencies_json

urlpatterns = [
    path('make/', MakerView.as_view()),
    path('order/', OrderView.as_view({'get':'get','post':'take_update_confirm_dispute_cancel'})),
    path('user/', UserView.as_view()),
    path('book/', BookView.as_view()),
    # path('robot/') # Profile Info
    path('info/', InfoView.as_view()),
    path('currencies/', get_currencies_json),
    ]
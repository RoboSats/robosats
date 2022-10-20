from django.urls import path
from .views import (
    MakerView,
    OrderView,
    UserView,
    BookView,
    InfoView,
    RewardView,
    PriceView,
    LimitView,
    HistoricalView,
    TickView,
    StealthView,
)
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView
from chat.views import ChatView

urlpatterns = [
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("make/", MakerView.as_view()),
    path(
        "order/",
        OrderView.as_view({"get": "get", "post": "take_update_confirm_dispute_cancel"}),
    ),
    path("user/", UserView.as_view()),
    path("book/", BookView.as_view()),
    path("info/", InfoView.as_view()),
    path("price/", PriceView.as_view()),
    path("limits/", LimitView.as_view()),
    path("reward/", RewardView.as_view()),
    path("historical/", HistoricalView.as_view()),
    path("ticks/", TickView.as_view()),
    path("stealth/", StealthView.as_view()),
    path("chat/", ChatView.as_view({"get": "get", "post": "post"})),
]

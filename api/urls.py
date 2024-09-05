from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView

from chat.views import ChatView

from .views import (
    BookView,
    HistoricalView,
    InfoView,
    LimitView,
    MakerView,
    OrderView,
    PriceView,
    RewardView,
    RobotView,
    StealthView,
    TickView,
    NotificationsView,
)

urlpatterns = [
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("make/", MakerView.as_view(), name="make"),
    path(
        "order/",
        OrderView.as_view({"get": "get", "post": "take_update_confirm_dispute_cancel"}),
        name="order",
    ),
    path("robot/", RobotView.as_view(), name="robot"),
    path("book/", BookView.as_view(), name="book"),
    path("info/", InfoView.as_view({"get": "get"}), name="info"),
    path("price/", PriceView.as_view(), name="price"),
    path("limits/", LimitView.as_view(), name="limits"),
    path("reward/", RewardView.as_view(), name="reward"),
    path("historical/", HistoricalView.as_view(), name="historical"),
    path("ticks/", TickView.as_view(), name="ticks"),
    path("stealth/", StealthView.as_view(), name="stealth"),
    path("chat/", ChatView.as_view({"get": "get", "post": "post"}), name="chat"),
    path("notifications/", NotificationsView.as_view(), name="notifications"),
]

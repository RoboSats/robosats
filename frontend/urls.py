from django.urls import path

from .views import basic, pro

urlpatterns = [
    path("", basic),
    path("create/", basic),
    path("robot/", basic),
    path("robot/<token>", basic),
    path("offers/", basic),
    path("order/<shortAlias>/<int:orderId>/", basic),
    path("settings/", basic),
    path("", basic),
    path("pro/", pro),
]

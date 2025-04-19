from django.urls import path

from .views import basic, pro

urlpatterns = [
    path("", basic, name="basic"),
    path("create/", basic),
    path("garage/", basic),
    path("garage/<token>", basic),
    path("offers/", basic),
    path("order/<shortAlias>/<int:orderId>/", basic),
    path("settings/", basic),
    path("", basic),
    path("pro/", pro, name="pro"),
]

from django.urls import path

from .views import basic, pro

urlpatterns = [
    path("", basic),
    path("make/", basic),
    path("robot/", basic),
    path("ref/<refCode>", basic),
    path("book/", basic),
    path("order/<int:orderId>", basic),
    path("settings/", basic),
    path("", basic),
    path("ref/<refCode>", basic),
    path("pro/", pro),
]

from django.urls import path

from .views import basic, pro

urlpatterns = [
    path("make/", basic),
    path("book/", basic),
    path("order/<int:orderId>", basic),
    path("", basic),
    path("ref/<refCode>", basic),
    path("pro/", pro),
]

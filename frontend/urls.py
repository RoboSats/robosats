from django.urls import path
from .views import index

urlpatterns = [
    path("make/", index),
    path("book/", index),
    path("order/<int:orderId>", index),
    path("", index),
    path("ref/<refCode>", index),
]

from django.urls import path
from .views import index

urlpatterns = [
    path('', index),
    path('info/', index),
    path('login/', index),
    path('make/', index),
    path('book/', index),
    path('order/<int:orderId>', index),
    path('wait/', index),
]
from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<order_id>\w+)/$", consumers.ChatRoomConsumer.as_asgi()),
]

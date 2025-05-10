import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from decouple import config
from django.core.asgi import get_asgi_application

import chat.routing
from robosats.middleware import TokenAuthMiddleware

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "robosats.settings")
# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

protocols = {}
protocols["websocket"] = AuthMiddlewareStack(
    TokenAuthMiddleware(
        URLRouter(
            chat.routing.websocket_urlpatterns,
            # add api.routing.websocket_urlpatterns when Order page works with websocket
        )
    )
)

if config("DEVELOPMENT", cast=bool, default=False):
    protocols["http"] = django_asgi_app

application = ProtocolTypeRouter(protocols)

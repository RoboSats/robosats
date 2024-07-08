"""robosats URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from decouple import config
from django.apps import apps
from django.conf import settings
from django.urls import include, path

from django_otp.admin import OTPAdminSite


class OTPAdmin(OTPAdminSite):
    pass


admin_site = OTPAdmin(name="OTPAdmin")
for model in apps.get_models():
    admin_site.register(model)

VERSION = settings.VERSION

urlpatterns = [
    path("coordinator/", admin_site.urls),
    path("api/", include("api.urls")),
    # path('chat/', include('chat.urls')),
    path("", include("frontend.urls")),
]

admin_site.site_header = f"RoboSats Coordinator: {config('COORDINATOR_ALIAS', cast=str, default='NoAlias')} {config('NETWORK', cast=str, default='')} (v{VERSION['major']}.{VERSION['minor']}.{VERSION['patch']})".title()
admin_site.index_title = "Coordinator administration"
admin_site.site_title = "RoboSats Coordinator Admin"

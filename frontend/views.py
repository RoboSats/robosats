from django.shortcuts import render
from decouple import config

# Create your views here.


def basic(request, *args, **kwargs):
    context = {"ONION_LOCATION": config("ONION_LOCATION")}
    return render(request, "frontend/basic.html", context=context)

def pro(request, *args, **kwargs):
    context = {"ONION_LOCATION": config("ONION_LOCATION")}
    return render(request, "frontend/pro.html", context=context)

from django.shortcuts import render
from decouple import config
# Create your views here.

def index(request, *args, **kwargs):
    context={'ONION_LOCATION': config('ONION_LOCATION')}
    return render(request, 'frontend/index.html', context=context)
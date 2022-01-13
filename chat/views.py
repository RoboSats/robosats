from django.shortcuts import render


def index(request):
    return render(request, 'index.html', {})

def room(request, order_id):
    return render(request, 'chatroom.html', {
        'order_id': order_id
    })
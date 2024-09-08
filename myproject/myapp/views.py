# myapp/views.py

from django.http import HttpResponse
from django.shortcuts import render
from datetime import datetime

def home(request):
    return render(request, 'myapp/home.html', {
        'current_year': datetime.now().year
    })

def login_view(request):
    return render(request, 'login.html')

def playground(request):
    return render(request, 'playground.html')
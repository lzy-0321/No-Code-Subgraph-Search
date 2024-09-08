"""
URL configuration for myproject project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
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

# myproject/urls.py

from django.contrib import admin
from django.urls import path
from myapp import views  # 确保导入路径正确

urlpatterns = [
    path('admin/', admin.site.urls),    # Django 管理员页面
    path('', views.home, name='home'),  # 首页
    path('login/', views.login_view, name='login'),  # 登录页面
    path('playground/', views.playground, name='playground'),  # Playground 页面
]
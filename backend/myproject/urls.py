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
from myapp.jwt_views import (
    MyTokenObtainPairView, 
    TokenRefreshView, 
    register_user,
    get_user_info  # 新增
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('home/', views.home, name='home'),
    path('playground/', views.playground, name='playground'),
    path('', views.home_redirect, name='home_redirect'),
    path('check_login_status/', views.check_login_status, name='check_login_status'),
    path('test_neo4j_and_signup/', views.test_neo4j_and_signup, name='test_neo4j_and_signup'),
    path('test_neo4j_and_login/', views.login_view, name='test_neo4j_and_login'),  # Login view
    path('logout/', views.logout_view, name='logout'),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', register_user, name='register'),
    path('api/user/info/', get_user_info, name='user_info'),  # 新增
    path('api/databases/', views.get_user_databases, name='get_user_databases'),
    path('api/database/select/', views.select_database, name='select_database'),
    path('api/database/info/', views.get_database_info, name='get_database_info'),
    path('api/database/nodes/', views.get_nodeEntities, name='get_nodeEntities'),
    path('api/database/relationships/', views.get_relationshipEntities, name='get_relationshipEntities'),
    path('api/database/delete/', views.delete_database, name='delete_database'),
    path('api/database/add/', views.add_database, name='add_database'),
    path('api/database/query/', views.match_query, name='match_query'),
    path('get_user_databases/', views.get_user_databases, name='get_user_databases_old'),
    path('select_database/', views.select_database, name='select_database_old'),
    path('get_database_info/', views.get_database_info, name='get_database_info_old'),
    path('get_nodeEntities/', views.get_nodeEntities, name='get_nodeEntities_old'),
    path('get_relationshipEntities/', views.get_relationshipEntities, name='get_relationshipEntities_old'),
    path('delete_database/', views.delete_database, name='delete_database_old'),
    path('add_database/', views.add_database, name='add_database_old'),
    path('match_query/', views.match_query, name='match_query_old'),
]
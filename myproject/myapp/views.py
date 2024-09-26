# myapp/views.py

from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib import messages
from datetime import datetime
from django.http import JsonResponse
from backend.neo4j_connector import Neo4jConnector
from myapp.models import Neo4jServer
import json
import traceback  # 用于打印详细错误堆栈

def home(request):
    return render(request, 'myapp/home.html', {
        'current_year': datetime.now().year
    })

def test_neo4j_and_signup(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        # 获取表单数据
        full_url = data.get('fullUrl')
        server_username = data.get('serverUsername')
        server_password = data.get('serverPassword')
        username = data.get('username')
        password = data.get('password')

        # 检查用户名是否已存在
        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'error': 'Username already exists'})

        # 测试Neo4j连接
        try:
            neo4j_connector = Neo4jConnector(full_url, server_username, server_password)
            success, message = neo4j_connector.test_connection()
            neo4j_connector.close()

            if not success:
                return JsonResponse({'success': False, 'error': f'Failed to connect to Neo4j: {message}'})
        except Exception as e:
            print(f"Error connecting to Neo4j: {e}")
            return JsonResponse({'success': False, 'error': 'Error connecting to Neo4j'})

        # 创建用户
        try:
            user = User.objects.create_user(username=username, password=password)
            user.save()

            # 存储Neo4jServer
            neo4j_server = Neo4jServer(user=user, url=full_url, server_password=server_password)
            neo4j_server.save()

            # 自动登录用户
            login(request, user)
            return JsonResponse({'success': True})

        except Exception as e:
            print(f"Error creating user: {e}")
            return JsonResponse({'success': False, 'error': 'Error creating user'})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})

def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        full_url = data.get('fullUrl')  # Full URL from the form

        # Authenticate the user
        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Retrieve the Neo4j server credentials associated with the user and selected URL
            try:
                neo4j_server = Neo4jServer.objects.get(user=user, url=full_url)
                server_username = data.get('serverUsername')  # Get server username from request
                server_password = neo4j_server.server_password

                # Test the Neo4j connection using the credentials
                neo4j_connector = Neo4jConnector(full_url, server_username, server_password)
                success, message = neo4j_connector.test_connection()
                neo4j_connector.close()

                if not success:
                    return JsonResponse({'success': False, 'error': f'Failed to connect to Neo4j: {message}'})

                # Log the user in if Neo4j connection is successful
                login(request, user)
                return JsonResponse({'success': True})

            except Neo4jServer.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'No Neo4j server associated with this URL'})

        else:
            return JsonResponse({'success': False, 'error': 'Invalid username or password'})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})

def playground(request):
    return render(request, 'myapp/playground.html')

def home_redirect(request):
    return redirect('/home/')
# myapp/views.py

from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.shortcuts import get_object_or_404
from datetime import datetime
from django.http import JsonResponse
from neo4jConnector.neo4j_connector import Neo4jConnector
from neo4jConnector.neo4j_connector import Neo4jSessionManager
from myapp.models import Neo4jServer
import json
from django.views.decorators.csrf import ensure_csrf_cookie
import traceback  # 用于打印详细错误堆栈
from django.views.decorators.csrf import csrf_exempt

# 初始化全局的 Neo4jSessionManager
neo4j_session_manager = Neo4jSessionManager()

@ensure_csrf_cookie
def check_login_status(request):
    # 返回用户登录状态
    if request.user.is_authenticated:
        return JsonResponse({'is_logged_in': True, 'username': request.user.username})
    else:
        return JsonResponse({'is_logged_in': False})

def home(request):
    return render(request, 'myapp/home.html', {
        'current_year': datetime.now().year
    })

@csrf_exempt
@ensure_csrf_cookie
def test_neo4j_and_signup(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        # 获取表单数据
        full_url = data.get('fullUrl')
        server_username = data.get('serverUser')
        server_password = data.get('serverPassword')
        username = data.get('username')
        password = data.get('password')
        remember_me = data.get('rememberMe', False)

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
            neo4j_server = Neo4jServer(user=user, url=full_url, server_username=server_username, server_password=server_password)
            neo4j_server.save()

            # 自动登录用户
            login(request, user)
            # 将 Neo4j 连接添加到 Neo4jSessionManager
            neo4j_session_manager.add_session(neo4j_connector)

            if remember_me:
                request.session.set_expiry(60 * 60 * 24 * 30)  # 30 天
            else:
                request.session.set_expiry(0)  # 会话在浏览器关闭时失效

            return JsonResponse({'success': True})

        except Exception as e:
            print(f"Error creating user: {e}")
            return JsonResponse({'success': False, 'error': 'Error creating user'})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@csrf_exempt
@ensure_csrf_cookie
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  # 确保请求体被正确解析
            username = data.get('username')
            password = data.get('password')
            remember_me = data.get('rememberMe', False)

            # 验证用户
            user = authenticate(request, username=username, password=password)

            if user is not None:
                # 成功验证用户，进行登录
                login(request, user)
                if remember_me:
                    request.session.set_expiry(60 * 60 * 24 * 30)  # 30 天
                else:
                    request.session.set_expiry(0)  # 会话关闭时失效

                return JsonResponse({'success': True})
            else:
                return JsonResponse({'success': False, 'error': 'Invalid username or password'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@csrf_exempt
@ensure_csrf_cookie
def logout_view(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse({'success': True, 'message': 'Logged out successfully'})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@csrf_exempt
@ensure_csrf_cookie
def get_user_databases(request):
    if request.method == 'GET' and request.user.is_authenticated:
        try:
            # Fetch all databases associated with the authenticated user
            databases = Neo4jServer.objects.filter(user=request.user)
            database_list = [
                {
                    'url': db.url,
                    'server_username': db.server_username,
                    'server_password': db.server_password,
                }
                for db in databases
            ]
            return JsonResponse({'success': True, 'databases': database_list})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    return JsonResponse({'success': False, 'error': 'Unauthorized or invalid request'}, status=400)

@csrf_exempt
@ensure_csrf_cookie
def add_database(request):
    if request.method == 'POST' and request.user.is_authenticated:
        data = json.loads(request.body)
        full_url = data.get('fullUrl')
        server_username = data.get('serverUsername')
        server_password = data.get('serverPassword')

        # 检查是否存在完全相同的数据库配置
        existing_db = Neo4jServer.objects.filter(
            user=request.user,
            url=full_url,
            server_username=server_username,
            server_password=server_password
        ).exists()

        if existing_db:
            return JsonResponse({
                'success': False,
                'error': 'Database with identical configuration already exists'
            })

        # 测试Neo4j连接
        try:
            neo4j_connector = Neo4jConnector(full_url, server_username, server_password)
            success, message = neo4j_connector.test_connection()
            neo4j_connector.close()

            if not success:
                return JsonResponse({
                    'success': False, 
                    'error': f'Failed to connect to Neo4j: {message}'
                })

        except Exception as e:
            print(f"Error connecting to Neo4j: {e}")
            return JsonResponse({
                'success': False, 
                'error': 'Error connecting to Neo4j'
            })

        # 如果连接成功且配置不重复，创建新的 Neo4jServer 记录
        try:
            new_server = Neo4jServer(
                user=request.user,
                url=full_url,
                server_username=server_username,
                server_password=server_password
            )
            new_server.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })

    return JsonResponse({
        'success': False,
        'error': 'Invalid request method'
    })

# 删除数据库记录的视图
@csrf_exempt
@ensure_csrf_cookie
def delete_database(request):
    if request.method == 'POST' and request.user.is_authenticated:
        data = json.loads(request.body)
        db_url = data.get('url')

        # 获取当前用户的数据库数量
        user_databases = Neo4jServer.objects.filter(user=request.user)
        database_count = user_databases.count()

        # 检查当前用户是否只剩下一个数据库
        if database_count <= 1:
            return JsonResponse({'success': False, 'error': 'Cannot delete the last remaining database.'})

        # 查找并删除数据库记录
        try:
            neo4j_server = get_object_or_404(Neo4jServer, user=request.user, url=db_url)
            neo4j_server.delete()  # 删除数据库记录
            return JsonResponse({'success': True, 'message': 'Database deleted successfully'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@csrf_exempt
@ensure_csrf_cookie
def select_database(request):
    if request.method == 'POST' and request.user.is_authenticated:
        data = json.loads(request.body)
        selected_url = data.get('selectedUrl')

        try:
            # 获取选中的数据库信息
            neo4j_server = Neo4jServer.objects.get(user=request.user, url=selected_url)
            server_username = neo4j_server.server_username
            server_password = neo4j_server.server_password

            # 创建新的 Neo4j 连接
            neo4j_connector = Neo4jConnector(selected_url, server_username, server_password)
            success, message = neo4j_connector.test_connection()

            if not success:
                return JsonResponse({'success': False, 'error': f'Failed to connect to Neo4j: {message}'})

            # 使用 Neo4jSessionManager 更新用户的会话
            neo4j_session_manager.add_session(neo4j_connector)

            # 打印当前所有存储的会话，检查是否添加成功
            neo4j_session_manager.print_session()

            return JsonResponse({'success': True, 'message': 'Database selected and connected successfully'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)

@csrf_exempt
@ensure_csrf_cookie
def get_database_info(request):
    if request.method == 'GET' and request.user.is_authenticated:
        connector = neo4j_session_manager.get_session()

        print(f"connector: {connector}")

        # 检查是否成功获取到连接器
        if not connector:
            return JsonResponse({'success': False, 'error': 'No active Neo4j session found for the user'}, status=500)

        labels = connector.get_node_labels()
        relationship_types = connector.get_relationship_types()
        property_keys = connector.get_property_keys()

        return JsonResponse({
            'success': True,
            'labels': labels,
            'relationship_types': relationship_types,
            'property_keys': property_keys
        })

    return JsonResponse({'success': False, 'error': 'Unauthorized or invalid request'}, status=400)

@csrf_exempt
@ensure_csrf_cookie
def get_nodeEntities(request):
    if request.method == 'POST' and request.user.is_authenticated:
        try:
            data = json.loads(request.body)
            label = data.get('label')
            if not label:
                return JsonResponse({'success': False, 'error': 'Label is required'}, status=400)

            connector = neo4j_session_manager.get_session()
            if not connector:
                return JsonResponse({'success': False, 'error': 'No active Neo4j session found for the user'}, status=500)

            # Fetch entities for the specified label
            node_entities = connector.get_node_entities(label)
            return JsonResponse({'success': True, 'nodeEntities': node_entities})

        except Exception as e:
            print(f"Error fetching node entities: {e}")
            return JsonResponse({'success': False, 'error': 'Server error'}, status=500)

    return JsonResponse({'success': False, 'error': 'Unauthorized or invalid request'}, status=400)

@csrf_exempt
@ensure_csrf_cookie
def get_relationshipEntities(request):
    if request.method == 'POST':
        try:
            # Parse JSON body and get `type`
            data = json.loads(request.body)
            relationship_type = data.get('type')

            if not relationship_type:
                return JsonResponse({'success': False, 'error': 'Relationship type is required'}, status=400)

            # Assuming `get_relationship_entities` function fetches the relationships for the given type
            connector = neo4j_session_manager.get_session()
            if not connector:
                return JsonResponse({'success': False, 'error': 'No active Neo4j session found for the user'}, status=500)

            relationships = connector.get_relationship_entities(relationship_type)
            return JsonResponse({'success': True, 'relationshipEntities': relationships})

        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON format'}, status=400)
        except Exception as e:
            print(f"Error fetching relationships for type {relationship_type}: {e}")
            return JsonResponse({'success': False, 'error': 'Server error'}, status=500)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=400)

def playground(request):
    if request.user.is_authenticated:
        # 获取当前用户的所有 Neo4j 服务器
        databases = Neo4jServer.objects.filter(user=request.user)
        return render(request, 'myapp/playground.html', {'databases': databases})  # 确保路径正确
    return redirect('login')

def home_redirect(request):
    return redirect('/home/')

@csrf_exempt
@ensure_csrf_cookie
def match_query(request):
    """处理match查询请求"""
    if request.method == 'POST' and request.user.is_authenticated:
        try:
            # 获取当前会话的connector
            connector = neo4j_session_manager.get_session()
            if not connector:
                error_msg = 'No active Neo4j session found'
                print(error_msg)  # 调试日志
                return JsonResponse({
                    'success': False,
                    'error': error_msg
                }, status=500)
                
            # 解析请求体
            query_params = json.loads(request.body)
            print(f"Received query params: {query_params}")  # 调试日志
            
            # 验证必要的参数
            if 'matchType' not in query_params:
                error_msg = 'matchType is required'
                print(error_msg)  # 调试日志
                return JsonResponse({
                    'success': False,
                    'error': error_msg
                }, status=400)
            
            # 执行查询
            result = connector.execute_match_query(query_params)
            print(f"Query result: {result}")  # 调试日志
            
            if result['success']:
                return JsonResponse(result)
            else:
                return JsonResponse(result, status=500)
            
        except json.JSONDecodeError as e:
            error_msg = f'Invalid JSON format: {str(e)}'
            print(error_msg)  # 调试日志
            return JsonResponse({
                'success': False,
                'error': error_msg
            }, status=400)
            
        except Exception as e:
            error_msg = f"Error in match_query view: {str(e)}"
            print(error_msg)  # 调试日志
            traceback.print_exc()  # 打印完整的错误堆栈
            return JsonResponse({
                'success': False,
                'error': error_msg
            }, status=500)
            
    return JsonResponse({
        'success': False,
        'error': 'Invalid request method or unauthorized'
    }, status=400)
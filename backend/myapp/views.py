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
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

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

@api_view(['POST'])
@permission_classes([AllowAny])
def test_neo4j_and_signup(request):
    """
    此方法已被 /api/register/ 端点替代，仅保留用于兼容性。
    建议直接使用 JWT 认证的注册端点。
    """
    # 重定向到JWT注册端点或返回相关信息
    return JsonResponse({
        'success': False, 
        'error': 'This endpoint is deprecated. Please use /api/register/ for JWT authentication.'
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    此方法已被 /api/token/ 端点替代，仅保留用于兼容性。
    建议直接使用 JWT 认证的登录端点。
    """
    # 重定向到JWT登录端点或返回相关信息
    return JsonResponse({
        'success': False, 
        'error': 'This endpoint is deprecated. Please use /api/token/ for JWT authentication.'
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    JWT认证不需要服务器端登出操作，客户端只需丢弃token即可。
    此方法仅保留用于兼容性。
    """
    # 在JWT认证中，登出操作一般在客户端进行（删除token）
    return JsonResponse({'success': True, 'message': 'JWT logout should be handled on client side by removing the token.'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_databases(request):
    # 获取JWT认证的用户
    user = request.user
    try:
        databases = Neo4jServer.objects.filter(user=user).values('url', 'server_username')
        return JsonResponse({
            'success': True,
            'databases': list(databases)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
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
@api_view(['POST'])
@permission_classes([IsAuthenticated])
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def select_database(request):
    data = request.data
    selected_url = data.get('selectedUrl')
    
    try:
        # 获取选中的数据库信息
        neo4j_server = Neo4jServer.objects.get(user=request.user, url=selected_url)
        server_username = neo4j_server.server_username
        # 使用解密方法获取密码
        server_password = neo4j_server.get_password()
        
        # 创建新的 Neo4j 连接
        neo4j_connector = Neo4jConnector(selected_url, server_username, server_password)
        success, message = neo4j_connector.test_connection()
        
        if not success:
            return JsonResponse({'success': False, 'error': f'Failed to connect to Neo4j: {message}'})
        
        # 使用用户ID来存储会话
        user_id = request.user.id
        neo4j_session_manager.add_session(user_id, neo4j_connector)
        
        return JsonResponse({'success': True, 'message': 'Database selected and connected successfully'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_database_info(request):
    user_id = request.user.id
    connector = neo4j_session_manager.get_session(user_id)
    
    if not connector:
        return JsonResponse({'success': False, 'error': '没有找到活动的Neo4j会话'}, status=500)
            
    labels = connector.get_node_labels()
    relationship_types = connector.get_relationship_types()
    property_keys = connector.get_property_keys()

    return JsonResponse({
        'success': True,
        'labels': labels,
        'relationship_types': relationship_types,
        'property_keys': property_keys
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_nodeEntities(request):
    try:
        data = request.data
        label = data.get('label')
        if not label:
            return JsonResponse({'success': False, 'error': 'Label is required'}, status=400)

        # 使用认证用户的ID获取会话
        user_id = request.user.id
        connector = neo4j_session_manager.get_session(user_id)
        
        if not connector:
            return JsonResponse({'success': False, 'error': 'No active Neo4j session found'}, status=500)

        # Fetch entities for the specified label
        node_entities = connector.get_node_entities(label)
        return JsonResponse({'success': True, 'nodeEntities': node_entities})
    except Exception as e:
        print(f"Error fetching node entities for label {label}: {e}")
        return JsonResponse({'success': False, 'error': 'Server error'}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_relationshipEntities(request):
    try:
        # Parse JSON body and get `type`
        data = request.data
        relationship_type = data.get('type')

        if not relationship_type:
            return JsonResponse({'success': False, 'error': 'Relationship type is required'}, status=400)

        # 获取用户ID并正确传递给会话管理器
        user_id = request.user.id
        connector = neo4j_session_manager.get_session(user_id)
        
        if not connector:
            return JsonResponse({'success': False, 'error': 'No active Neo4j session found for the user'}, status=500)

        relationships = connector.get_relationship_entities(relationship_type)
        return JsonResponse({'success': True, 'relationshipEntities': relationships})

    except Exception as e:
        print(f"Error fetching relationships for type {relationship_type}: {e}")
        return JsonResponse({'success': False, 'error': 'Server error'}, status=500)

def playground(request):
    if request.user.is_authenticated:
        # 使用会话认证
        # 获取当前用户的所有 Neo4j 服务器
        databases = Neo4jServer.objects.filter(user=request.user)
        return render(request, 'myapp/playground.html', {'databases': databases})  # 确保路径正确
    return redirect('login')

def home_redirect(request):
    return redirect('/home/')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def match_query(request):
    try:
        # 打印传入的查询参数以便调试
        # print(f"Received query params: {request.data}")
        
        # 获取用户ID
        user_id = request.user.id
        # print(f"User ID: {user_id}")
        
        connector = neo4j_session_manager.get_session(user_id)
        
        if not connector:
            print("No active Neo4j session found")
            return JsonResponse({'success': False, 'error': 'No active Neo4j session found'}, status=500)
        
        # 使用原有的execute_match_query方法
        result = connector.execute_match_query(request.data)
        # print(f"Query result status: {result.get('success', False)}")
        
        return JsonResponse(result)
            
    except Exception as e:
        print(f"Error executing match query: {e}")
        print(traceback.format_exc())
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # 添加自定义声明
        token['username'] = user.username
        return token

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    try:
        data = request.data
        username = data.get('username')
        password = data.get('password')
        neo4j_url = data.get('neo4j_url')
        neo4j_username = data.get('neo4j_username')
        neo4j_password = data.get('neo4j_password')
        
        # 检查用户名是否已经存在
        if User.objects.filter(username=username).exists():
            return Response({'error': '用户名已存在'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 验证密码强度
        try:
            validate_password(password)
        except ValidationError as e:
            return Response({'error': e.messages}, status=status.HTTP_400_BAD_REQUEST)
        
        # 测试Neo4j连接（如果提供了数据库信息）
        if neo4j_url and neo4j_username:
            try:
                from neo4jConnector.neo4j_connector import Neo4jConnector
                neo4j_connector = Neo4jConnector(neo4j_url, neo4j_username, neo4j_password)
                success, message = neo4j_connector.test_connection()
                neo4j_connector.close()
                
                if not success:
                    return Response({'error': f'无法连接到Neo4j: {message}'}, 
                                   status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': f'Neo4j连接错误: {str(e)}'}, 
                               status=status.HTTP_400_BAD_REQUEST)
        
        # 创建新用户
        user = User.objects.create_user(username=username, password=password)
        
        # 保存Neo4j数据库信息（如果提供）
        if neo4j_url and neo4j_username:
            from myapp.models import Neo4jServer
            neo4j_server = Neo4jServer(
                user=user, 
                url=neo4j_url, 
                server_username=neo4j_username, 
                server_password=neo4j_password
            )
            neo4j_server.save()
        
        # 生成令牌
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    """获取当前登录用户的信息"""
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_staff': user.is_staff
    }) 
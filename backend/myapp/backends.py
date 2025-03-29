from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from django.core.cache import cache
from django.conf import settings
from datetime import datetime, timedelta

class RateLimitedAuthBackend(ModelBackend):
    """
    限制登录尝试次数的认证后端
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        # 构建缓存键
        if request:
            ip_address = self.get_client_ip(request)
            cache_key = f"login_attempts:{username}:{ip_address}"
        else:
            cache_key = f"login_attempts:{username}"
        
        # 检查尝试次数
        attempts = cache.get(cache_key, 0)
        
        # 超过尝试限制，拒绝登录
        max_attempts = getattr(settings, 'MAX_LOGIN_ATTEMPTS', 5)
        if attempts >= max_attempts:
            return None
        
        # 尝试认证
        user = super().authenticate(request, username=username, password=password, **kwargs)
        
        if user is None:
            # 认证失败，增加尝试计数
            cache.set(cache_key, attempts + 1, getattr(settings, 'LOGIN_ATTEMPTS_TIMEOUT', 300))  # 默认5分钟超时
        else:
            # 认证成功，清除计数
            cache.delete(cache_key)
            
        return user
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip 
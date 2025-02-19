# models.py
from django.db import models
from django.contrib.auth.models import User

class Neo4jServer(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # 关联用户
    url = models.CharField(max_length=200)  # 存储 Neo4j URL
    server_username = models.CharField(max_length=50)  # 存储服务器用户名
    server_password = models.CharField(max_length=50)  # 存储服务器密码

    def __str__(self):
        return f"{self.user.username} - {self.url} - {self.server_username}"

    class Meta:
        # 添加唯一性约束
        unique_together = ['user', 'url', 'server_username', 'server_password']
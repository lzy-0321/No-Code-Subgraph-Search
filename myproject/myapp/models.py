# models.py
from django.db import models
from django.contrib.auth.models import User

class Neo4jServer(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # 关联用户
    url = models.CharField(max_length=255)  # 存储 Neo4j URL
    server_password = models.CharField(max_length=255)  # 存储服务器密码

    def __str__(self):
        return f"{self.user.username} - {self.url}"
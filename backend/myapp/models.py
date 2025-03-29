# models.py
from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
from cryptography.fernet import Fernet

class Neo4jServer(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # 关联用户
    url = models.CharField(max_length=200)  # 存储 Neo4j URL
    server_username = models.CharField(max_length=50)  # 存储服务器用户名
    server_password = models.CharField(max_length=255)  # 加长字段以存储加密后的密码

    def save(self, *args, **kwargs):
        # 加密密码后再保存
        if self.server_password and not self._is_encrypted(self.server_password):
            self.server_password = self._encrypt_password(self.server_password)
        super().save(*args, **kwargs)
    
    def get_password(self):
        # 返回解密后的密码
        return self._decrypt_password(self.server_password)
    
    def _encrypt_password(self, password):
        # 使用Fernet加密密码
        cipher_suite = Fernet(settings.ENCRYPTION_KEY)
        encrypted_password = cipher_suite.encrypt(password.encode('utf-8'))
        return encrypted_password.decode('utf-8')
    
    def _decrypt_password(self, encrypted_password):
        # 解密密码
        cipher_suite = Fernet(settings.ENCRYPTION_KEY)
        decrypted_password = cipher_suite.decrypt(encrypted_password.encode('utf-8'))
        return decrypted_password.decode('utf-8')
    
    def _is_encrypted(self, text):
        # 简单判断是否已经加密
        try:
            return text.startswith('gAAAAA')
        except:
            return False

    def __str__(self):
        return f"{self.user.username} - {self.url} - {self.server_username}"

    class Meta:
        # 添加唯一性约束
        unique_together = ['user', 'url', 'server_username', 'server_password']
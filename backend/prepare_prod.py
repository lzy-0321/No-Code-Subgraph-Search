#!/usr/bin/env python
"""
生产环境部署准备脚本
- 生成随机SECRET_KEY
- 设置DEBUG=False
- 创建.env文件
"""
import os
import random
import string
import sys

def generate_secret_key(length=50):
    """生成一个随机的SECRET_KEY"""
    chars = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(chars) for _ in range(length))

def main():
    # 项目根目录
    base_dir = os.path.dirname(os.path.abspath(__file__))
    env_file = os.path.join(base_dir, '.env')
    
    # 检查.env文件是否存在
    if os.path.exists(env_file):
        overwrite = input(".env文件已存在，是否覆盖？(y/n): ")
        if overwrite.lower() != 'y':
            print("操作已取消")
            sys.exit(0)
    
    # 生成SECRET_KEY
    secret_key = generate_secret_key()
    
    # 创建.env文件
    with open(env_file, 'w') as f:
        f.write(f'DJANGO_SECRET_KEY="{secret_key}"\n')
        f.write('DJANGO_DEBUG=False\n')
        f.write('ALLOWED_HOSTS=your-domain.com,www.your-domain.com\n')
        
    print(f".env文件已创建: {env_file}")
    print("请在部署前更新ALLOWED_HOSTS和其他必要设置")

if __name__ == "__main__":
    main() 
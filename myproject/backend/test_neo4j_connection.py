# test_neo4j_connection.py
from .neo4j_connector import Neo4jConnector

# 定义测试的 Neo4j URL、服务器用户名和密码
neo4j_url = 'bolt://192.168.0.54:7687'  # 根据你的 Neo4j 实例的 URL 修改
server_username = 'neo4j'  # 替换为你的 Neo4j 服务器的用户名
server_password = '20020321'  # 替换为你的 Neo4j 服务器密码

# 创建 Neo4jConnector 实例并测试连接
connector = Neo4jConnector(neo4j_url, server_username, server_password)
success, message = connector.test_connection()

# 打印测试结果
if success:
    print("Connection successful!")
else:
    print(f"Connection failed: {message}")

# 关闭连接
connector.close()
# # backend/neo4j_connector.py
from neo4j import GraphDatabase, basic_auth

class Neo4jSessionManager:
    def __init__(self):
        self.session = None  # 只有一个 session

    def add_session(self, neo4j_connector):
        # 将 Neo4jConnector 与当前会话关联
        self.session = neo4j_connector

    def get_session(self):
        # 获取当前的 session
        return self.session

    def close_session(self):
        # 关闭并删除当前的 session
        if self.session:
            self.session.close()
            self.session = None

    def print_session(self):
        # 打印当前存储的 session 信息，包括 URL、服务器用户名和密码
        if self.session:
            print(f"Current session - URL: {self.session.uri}, ServerUser: {self.session.server_username}, Password: {self.session.password}")
        else:
            print("No active session")

class Neo4jConnector:
    def __init__(self, uri, server_username, password):
        self.uri = uri  # 保存 URL
        self.server_username = server_username  # 保存服务器用户名
        self.password = password  # 保存密码
        print(f"URL: {uri}, ServerUser: {server_username}, Password: {password}")
        self.driver = GraphDatabase.driver(uri, auth=basic_auth(server_username, password))  # 初始化连接

    def close(self):
        if self.driver:
            self.driver.close()

    def test_connection(self):
        try:
            with self.driver.session() as session:
                session.run("RETURN 1")  # 执行测试查询
            return True, "Connection successful"
        except Exception as e:
            return False, str(e)

    def get_node_labels(self):
        try:
            with self.driver.session() as session:
                result = session.run("CALL db.labels()")
                labels = [record["label"] for record in result]
            return labels
        except Exception as e:
            print(f"Error fetching node labels: {e}")
            return []

    def get_relationship_types(self):
        try:
            with self.driver.session() as session:
                result = session.run("CALL db.relationshipTypes()")
                types = [record["relationshipType"] for record in result]
            return types
        except Exception as e:
            print(f"Error fetching relationship types: {e}")
            return []

    def get_property_keys(self):
        try:
            with self.driver.session() as session:
                result = session.run("CALL db.propertyKeys()")
                keys = [record["propertyKey"] for record in result]
            return keys
        except Exception as e:
            print(f"Error fetching property keys: {e}")
            return []
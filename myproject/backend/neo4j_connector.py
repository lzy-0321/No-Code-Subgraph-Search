# # backend/neo4j_connector.py
from neo4j import GraphDatabase, basic_auth

class Neo4jSessionManager:
    def __init__(self):
        self.sessions = {}

    def add_session(self, user, neo4j_connector):
        self.sessions[user.username] = neo4j_connector

    def get_session(self, user):
        return self.sessions.get(user.username)

    def close_session(self, user):
        if user.username in self.sessions:
            self.sessions[user.username].close()
            del self.sessions[user.username]

class Neo4jConnector:
    def __init__(self, uri, server_username, password):
        self.driver = GraphDatabase.driver(uri, auth=basic_auth(server_username, password))  # Use server_username and password

    def close(self):
        if self.driver:
            self.driver.close()

    def test_connection(self):
        try:
            with self.driver.session() as session:
                session.run("RETURN 1")  # 测试查询
            return True, "Connection successful"
        except Exception as e:
            return False, str(e)
import unittest
from neo4j_connector import Neo4jConnector

# 替换为你实际的 Neo4j 连接信息
NEO4J_URL = 'bolt://192.168.0.54:7687'
USERNAME = 'neo4j'
PASSWORD = '20020321'

class TestMovieRelationships(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # 在所有测试开始前，建立一次连接
        cls.connector = Neo4jConnector(NEO4J_URL, USERNAME, PASSWORD)
        success, message = cls.connector.test_connection()
        if not success:
            raise ConnectionError(f"Neo4j connection failed: {message}")

    @classmethod
    def tearDownClass(cls):
        # 在所有测试结束后，关闭连接
        cls.connector.close()

    def test_a_few_good_men_cast(self):
        """测试'A Few Good Men'电影相关的演员关系"""
        # 测试 James Marshall -> ACTED_IN -> A Few Good Men
        query_params = {
            "matchType": "relationshipMatch",
            "startLabel": "Person",
            "relationType": "ACTED_IN",
            "endLabel": "Movie",
            "startNodeProps": {"name": "James Marshall"},
            "endNodeProps": {"title": "A Few Good Men"}
        }
        
        results = self.connector.execute_match_query(query_params)
        self.assertTrue(results, "应该能找到 James Marshall 出演 A Few Good Men 的记录")
        self.assertEqual(results[0]['a']['properties']['name'], 'James Marshall')
        self.assertEqual(results[0]['b']['properties']['title'], 'A Few Good Men')

        # 测试 Rob Reiner -> DIRECTED -> A Few Good Men
        query_params = {
            "matchType": "relationshipMatch",
            "startLabel": "Person",
            "relationType": "DIRECTED",
            "endLabel": "Movie",
            "startNodeProps": {"name": "Rob Reiner"},
            "endNodeProps": {"title": "A Few Good Men"}
        }
        
        results = self.connector.execute_match_query(query_params)
        self.assertTrue(results, "应该能找到 Rob Reiner 导演 A Few Good Men 的记录")
        self.assertEqual(results[0]['a']['properties']['name'], 'Rob Reiner')
        self.assertEqual(results[0]['b']['properties']['title'], 'A Few Good Men')

    def test_top_gun_cast(self):
        """测试'Top Gun'电影相关的演员关系"""
        # 测试 Tom Cruise -> ACTED_IN -> Top Gun
        query_params = {
            "matchType": "relationshipMatch",
            "startLabel": "Person",
            "relationType": "ACTED_IN",
            "endLabel": "Movie",
            "startNodeProps": {"name": "Tom Cruise"},
            "endNodeProps": {"title": "Top Gun"}
        }
        
        results = self.connector.execute_match_query(query_params)
        self.assertTrue(results, "应该能找到 Tom Cruise 出演 Top Gun 的记录")
        self.assertEqual(results[0]['a']['properties']['name'], 'Tom Cruise')
        self.assertEqual(results[0]['b']['properties']['title'], 'Top Gun')
        self.assertIn('Maverick', results[0]['r']['properties']['roles'])

    def test_the_matrix_cast(self):
        """测试'The Matrix'电影相关的演员关系"""
        # 测试 Keanu Reeves -> ACTED_IN -> The Matrix
        query_params = {
            "matchType": "relationshipMatch",
            "startLabel": "Person",
            "relationType": "ACTED_IN",
            "endLabel": "Movie",
            "startNodeProps": {"name": "Keanu Reeves"},
            "endNodeProps": {"title": "The Matrix"}
        }
        
        results = self.connector.execute_match_query(query_params)
        self.assertTrue(results, "应该能找到 Keanu Reeves 出演 The Matrix 的记录")
        self.assertEqual(results[0]['a']['properties']['name'], 'Keanu Reeves')
        self.assertEqual(results[0]['b']['properties']['title'], 'The Matrix')
        self.assertIn('Neo', results[0]['r']['properties']['roles'])

    def test_label_match(self):
        """测试标签匹配查询"""
        query_params = {
            "matchType": "labelMatch",
            "label": "Movie",
            "properties": {"title": "The Matrix"},
            "limit": 1
        }
        
        results = self.connector.execute_match_query(query_params)
        self.assertTrue(results, "应该能找到 The Matrix 电影")
        self.assertEqual(results[0]['n']['properties']['title'], 'The Matrix')

if __name__ == '__main__':
    unittest.main()
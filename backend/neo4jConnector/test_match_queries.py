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
        """
        验证 'A Few Good Men' 相关演员/导演/编剧关系。
        例如 James Marshall (born=1967) -> ACTED_IN -> A Few Good Men (released=1992)
        """
        # 1) James Marshall -> ACTED_IN -> A Few Good Men
        query_params = {
            "matchType": "relationshipMatch",
            "label": "Person",  # 起始节点是 Person
            "relationship": {
                "type": "ACTED_IN",
                "properties": {}  # 如果要匹配 roles，可填 "roles": ["Pfc. Louden Downey"]
            },
            "whereClause": "a.name = 'James Marshall' AND b.title = 'A Few Good Men'",
            "returnFields": ["a","b","r"]
        }
        results = self.connector.execute_match_query(query_params)
        self.assertTrue(len(results) > 0, "应当能匹配到 James Marshall 与 A Few Good Men 的 ACTED_IN 关系")
        record = results[0]  # 拿第一条校验
        self.assertIn('a', record)
        self.assertIn('b', record)
        self.assertIn('r', record)
        self.assertEqual(record['a']['properties'].get('name'), 'James Marshall')
        self.assertEqual(record['b']['properties'].get('title'), 'A Few Good Men')
        self.assertEqual(record['r']['type'], 'ACTED_IN')
        # 如果需要校验 roles:
        # self.assertEqual(record['r']['properties'].get('roles'), ["Pfc. Louden Downey"])

        # 2) Rob Reiner -> DIRECTED -> A Few Good Men
        query_params = {
            "matchType": "relationshipMatch",
            "label": "Person",
            "relationship": {
                "type": "DIRECTED",
                "properties": {}
            },
            "whereClause": "a.name = 'Rob Reiner' AND b.title = 'A Few Good Men'",
            "returnFields": ["a","b","r"]
        }
        results = self.connector.execute_match_query(query_params)
        self.assertTrue(len(results) > 0, "应当能匹配到 Rob Reiner DIRECTED A Few Good Men")
        record = results[0]
        self.assertEqual(record['a']['properties'].get('name'), 'Rob Reiner')
        self.assertEqual(record['b']['properties'].get('title'), 'A Few Good Men')
        self.assertEqual(record['r']['type'], 'DIRECTED')

        # 你可以继续针对 Christopher Guest、Aaron Sorkin、等人写类似的验证
        # ...

    def test_top_gun_cast(self):
        """
        验证 'Top Gun' 的演员/导演/编剧
        例如 Tom Cruise -> ACTED_IN -> Top Gun
        """
        # Tom Cruise -> ACTED_IN -> Top Gun
        query_params = {
            "matchType": "relationshipMatch",
            "label": "Person",
            "relationship": {
                "type": "ACTED_IN"
            },
            "whereClause": "a.name = 'Tom Cruise' AND b.title = 'Top Gun'",
            "returnFields": ["a","b","r"]
        }
        results = self.connector.execute_match_query(query_params)
        self.assertTrue(len(results) > 0, "应当能匹配到 Tom Cruise 与 Top Gun 的 ACTED_IN 关系")
        record = results[0]
        self.assertEqual(record['a']['properties'].get('name'), 'Tom Cruise')
        self.assertEqual(record['b']['properties'].get('title'), 'Top Gun')
        self.assertEqual(record['r']['type'], 'ACTED_IN')
        roles = record['r']['properties'].get('roles', [])
        self.assertIn('Maverick', roles, "Tom Cruise 在Top Gun里的角色应该是 Maverick")

        # Tony Scott -> DIRECTED -> Top Gun
        query_params = {
            "matchType": "relationshipMatch",
            "label": "Person",
            "relationship": {
                "type": "DIRECTED"
            },
            "whereClause": "a.name = 'Tony Scott' AND b.title = 'Top Gun'",
            "returnFields": ["a","b","r"]
        }
        results = self.connector.execute_match_query(query_params)
        self.assertTrue(len(results) > 0, "应当能匹配到 Tony Scott DIRECTED Top Gun")

        # 继续测试其他演员/编剧 ...
        # ...

    def test_the_matrix_cast(self):
        """
        验证 'The Matrix' 的演员/导演/制片
        例如 Keanu Reeves -> ACTED_IN -> The Matrix
        """
        # Keanu Reeves -> ACTED_IN -> The Matrix
        query_params = {
            "matchType": "relationshipMatch",
            "label": "Person",
            "relationship": {
                "type": "ACTED_IN"
            },
            "whereClause": "a.name = 'Keanu Reeves' AND b.title = 'The Matrix'",
            "returnFields": ["a","b","r"]
        }
        results = self.connector.execute_match_query(query_params)
        self.assertTrue(len(results) > 0, "应当能匹配到 Keanu Reeves 与 The Matrix 的 ACTED_IN 关系")
        record = results[0]
        self.assertEqual(record['a']['properties']['name'], 'Keanu Reeves')
        self.assertEqual(record['b']['properties']['title'], 'The Matrix')
        self.assertEqual(record['r']['type'], 'ACTED_IN')
        self.assertIn('Neo', record['r']['properties']['roles'])

        # Wachowski 姐妹 -> DIRECTED -> The Matrix
        query_params = {
            "matchType": "relationshipMatch",
            "label": "Person",
            "relationship": {
                "type": "DIRECTED"
            },
            "whereClause": "b.title = 'The Matrix' AND (a.name = 'Lilly Wachowski' OR a.name = 'Lana Wachowski')",
            "returnFields": ["a","b","r"]
        }
        results = self.connector.execute_match_query(query_params)
        # 应该会返回多条：一条匹配 'Lilly Wachowski'，一条匹配 'Lana Wachowski'
        self.assertGreaterEqual(len(results), 2, "应该至少有两条记录，对应两位导演")

        # 也可以继续验证 PRODUCED, WROTE 等
        # ...

    def test_jerry_maguire_cast(self):
        """
        验证 'Jerry Maguire' 的演员
        例如 Tom Cruise -> ACTED_IN -> Jerry Maguire
        """
        query_params = {
            "matchType": "relationshipMatch",
            "label": "Person",
            "relationship": {
                "type": "ACTED_IN"
            },
            "whereClause": "a.name = 'Tom Cruise' AND b.title = 'Jerry Maguire'",
            "returnFields": ["a","b","r"]
        }
        results = self.connector.execute_match_query(query_params)
        self.assertTrue(len(results) > 0, "应当能匹配到 Tom Cruise 与 Jerry Maguire 的 ACTED_IN 关系")
        record = results[0]
        self.assertEqual(record['b']['properties']['title'], 'Jerry Maguire')
        self.assertIn('Jerry Maguire', record['r']['properties']['roles'])

if __name__ == '__main__':
    unittest.main()
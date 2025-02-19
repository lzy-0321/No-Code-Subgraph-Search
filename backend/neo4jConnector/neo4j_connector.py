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

class CypherQueryBuilder:
    """用于构建Cypher查询的辅助类"""
    
    @staticmethod
    def build_match_query(query_params):
        """
        根据传入的参数构建Cypher查询
        
        Args:
            query_params (dict): 包含查询参数的字典
            
        Returns:
            tuple: (query_string, params_dict) 查询字符串和参数字典
        """
        match_type = query_params.get('matchType')
        label = query_params.get('label')
        node_properties = query_params.get('nodeProperties', {})
        relationship = query_params.get('relationship', {})
        where_clause = query_params.get('whereClause', '')
        return_fields = query_params.get('returnFields', ['n'])
        optional = query_params.get('optional', False)
        use_with = query_params.get('useWithClause', False)
        aggregate = query_params.get('aggregate', False)
        multiple_matches = query_params.get('multipleMatches', False)
        variable_length = query_params.get('variableLength', {})
        
        # 参数化查询的参数字典
        params = {}
        
        # 构建基本MATCH子句
        match_clause = "OPTIONAL MATCH" if optional else "MATCH"
        
        if match_type == "allNodes":
            query = f"{match_clause} (n)"
        
        elif match_type == "labelMatch":
            query = f"{match_clause} (n:{label})"
            
        elif match_type == "propertyMatch":
            props_list = []
            for key, value in node_properties.items():
                param_name = f"prop_{key}"
                props_list.append(f"{key}: ${param_name}")
                params[param_name] = value
            props_str = "{" + ", ".join(props_list) + "}" if props_list else ""
            query = f"{match_clause} (n:{label} {props_str})"
            
        elif match_type == "relationshipMatch":
            rel_type = relationship.get('type', '')
            rel_props = relationship.get('properties', {})
            
            # 处理关系属性
            rel_props_list = []
            for key, value in rel_props.items():
                param_name = f"rel_{key}"
                rel_props_list.append(f"{key}: ${param_name}")
                params[param_name] = value
            rel_props_str = "{" + ", ".join(rel_props_list) + "}" if rel_props_list else ""
            
            # 处理可变长度路径
            if variable_length.get('enabled'):
                min_hops = variable_length.get('minHops', 1)
                max_hops = variable_length.get('maxHops')
                length_str = f"*{min_hops}..{max_hops}" if max_hops else f"*{min_hops}.."
            else:
                length_str = ""
                
            query = f"{match_clause} (a:{label})-[r:{rel_type}{length_str}{rel_props_str}]->(b)"
            
        else:
            raise ValueError(f"Unsupported match type: {match_type}")
            
        # 添加WHERE子句
        if where_clause:
            query += f" WHERE {where_clause}"
            
        # 添加WITH子句
        if use_with:
            query += " WITH " + ", ".join(return_fields)
            
        # 添加RETURN子句
        if aggregate:
            # 这里可以添加聚合函数的处理逻辑
            query += " RETURN " + ", ".join(return_fields)
        else:
            query += " RETURN " + ", ".join(return_fields)
            
        return query, params

class Neo4jConnector:
    def __init__(self, uri, server_username, password):
        self.uri = uri
        self.server_username = server_username
        self.password = password
        print(f"URL: {uri}, ServerUser: {server_username}, Password: {password}")
        self.driver = GraphDatabase.driver(uri, auth=basic_auth(server_username, password))

    def equals(self, other):
        """
        比较两个数据库连接配置是否相同
        
        Args:
            other (Neo4jConnector): 另一个数据库连接器实例
            
        Returns:
            bool: 如果配置完全相同返回 True，否则返回 False
        """
        if not isinstance(other, Neo4jConnector):
            return False
            
        return (self.uri == other.uri and 
                self.server_username == other.server_username and 
                self.password == other.password)

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

    def get_node_entities(self, label):
        """
        Retrieves entities (nodes) for the specified label from the Neo4j database,
        prioritizing properties that best represent each node.

        Parameters:
        label (str): The label of the nodes to retrieve.

        Returns:
        tuple: A tuple containing two lists:
            - prioritized_entities: A sorted list containing the prioritized property value for each node.
            - property_names: A list of unique property names from the first node of the specified label.
        """
        # Define a list of properties to prioritize
        priority_properties = ["name", "title", "id"]

        try:
            with self.driver.session() as session:
                # Query to match nodes with the specified label and return their properties
                query = f"MATCH (n:{label}) RETURN properties(n) AS properties LIMIT 100"
                result = session.run(query)

                # Extract prioritized property values and property names
                prioritized_entities = []
                property_names = set()

                for i, record in enumerate(result):
                    properties = record["properties"]
                    if properties:
                        # Extract property names from the first node only
                        if i == 0:
                            property_names.update(properties.keys())

                        # Find the first available priority property
                        selected_property = next(
                            (properties[prop] for prop in priority_properties if prop in properties),
                            None
                        )
                        # Default to the first available property if no priority property is found
                        if selected_property is None and properties:
                            selected_property = list(properties.values())[0]
                        prioritized_entities.append(selected_property)

                # Sort prioritized entities alphabetically
                prioritized_entities.sort()

            return_value = []
            return_value.append(prioritized_entities)
            return_value.append(list(property_names))

            return return_value
        except Exception as e:
            print(f"Error fetching entities for label {label}: {e}")
            return [], []


    def get_relationship_entities(self, label):
        """
        Retrieves relationships for the specified label from the Neo4j database,
        prioritizing properties that best represent each relationship.

        Parameters:
        label (str): The label of the relationships to retrieve.

        Returns:
        tuple: A tuple containing two elements:
            - relationships: A sorted list containing pairs of start and end node properties.
                            Each entry is formatted as [[start_property, end_property], ...]
            - relationship_property_names: A list of unique property names for the specified relationship type.
        """
        # Define a list of properties to prioritize
        priority_properties = ["type", "name", "title", "id"]

        try:
            with self.driver.session() as session:
                # Query to match relationships with the specified label and return start, end, and relationship properties
                query = (
                    f"MATCH (start)-[r:{label}]->(end) "
                    "RETURN start, end, properties(r) AS relationship_properties LIMIT 100"
                )
                result = session.run(query)

                # Extract relationships as start and end node property pairs
                relationships = []
                relationship_property_names = set()

                for i, record in enumerate(result):
                    start_node = record["start"]
                    end_node = record["end"]
                    relationship_properties = record["relationship_properties"]

                    # Extract relationship property names from the first relationship only
                    if i == 0 and relationship_properties:
                        relationship_property_names.update(relationship_properties.keys())

                    # Select the prioritized property for start and end nodes
                    start_property = next(
                        (start_node.get(prop) for prop in priority_properties if prop in start_node),
                        None
                    )
                    end_property = next(
                        (end_node.get(prop) for prop in priority_properties if prop in end_node),
                        None
                    )

                    # Use a fallback property if no prioritized properties are found
                    if start_property is None:
                        start_property = list(start_node.values())[0] if start_node else None
                    if end_property is None:
                        end_property = list(end_node.values())[0] if end_node else None

                    relationships.append([start_property, end_property])

                # Sort relationships by start and end properties alphabetically
                relationships.sort(key=lambda x: (x[0], x[1]))

            return_value = []
            return_value.append(relationships)
            return_value.append(list(relationship_property_names))

            return relationships, list(relationship_property_names)
        except Exception as e:
            print(f"Error fetching relationships for label {label}: {e}")
            return [], []

    def execute_match_query(self, query_params):
        """
        执行match查询
        
        Args:
            query_params (dict): 查询参数
            
        Returns:
            list: 查询结果列表
        """
        try:
            # 使用CypherQueryBuilder构建查询
            query, params = CypherQueryBuilder.build_match_query(query_params)
            
            with self.driver.session() as session:
                # 执行参数化查询
                result = session.run(query, params)
                
                # 处理结果
                records = []
                for record in result:
                    # 将neo4j的Record对象转换为字典
                    record_dict = {}
                    for key in record.keys():
                        value = record[key]
                        # 如果值是Node类型，转换为字典
                        if hasattr(value, 'labels'):
                            record_dict[key] = {
                                'labels': list(value.labels),
                                'properties': dict(value)
                            }
                        # 如果值是Relationship类型，转换为字典
                        elif hasattr(value, 'type'):
                            record_dict[key] = {
                                'type': value.type,
                                'properties': dict(value)
                            }
                        else:
                            record_dict[key] = value
                    records.append(record_dict)
                    
                return records
                
        except Exception as e:
            print(f"Error executing match query: {e}")
            raise


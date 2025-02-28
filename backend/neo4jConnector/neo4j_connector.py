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
        
        if match_type == 'labelMatch':
            label = query_params.get('label')
            properties = query_params.get('properties', {})
            limit = query_params.get('limit')
            
            # 初始化参数字典
            params = {}
            
            # 构建基本查询
            query = f"MATCH (n:{label})"
            
            # 添加属性条件
            if properties:
                props_list = []
                for key, value in properties.items():
                    param_name = f"prop_{key}"
                    props_list.append(f"n.{key} = ${param_name}")
                    params[param_name] = value
                if props_list:
                    query += " WHERE " + " AND ".join(props_list)
            
            # 添加返回语句和限制
            query += " RETURN n"
            if limit:
                query += f" LIMIT {limit}"
            
            return query, params
        
        elif match_type == 'relationshipMatch':
            rel_type = query_params.get('relationType')
            if not rel_type:
                raise ValueError("relationType is required")
            
            properties = query_params.get('properties', {})
            
            # 构建查询
            query_parts = []
            params = {}
            
            # 构建基本的关系匹配模式
            query = f"MATCH (a)-[r:{rel_type}]->(b)"
            
            # 添加关系属性条件
            if properties:
                props_list = []
                for key, value in properties.items():
                    param_name = f"rel_{key}"
                    props_list.append(f"r.{key} = ${param_name}")
                    params[param_name] = value
                if props_list:
                    query += " WHERE " + " AND ".join(props_list)
            
            # 返回语句
            query += " RETURN a, r, b"
            
            return query, params
        
        elif match_type == 'pathMatch':
            start_node = query_params.get('startNode', {})
            end_node = query_params.get('endNode', {})
            relationship = query_params.get('relationship', {})
            
            # 构建查询
            query_parts = []
            params = {}
            
            # 起始节点
            start_label = start_node.get('label')
            start_props = start_node.get('properties', {})
            
            # 终止节点
            end_label = end_node.get('label')
            end_props = end_node.get('properties', {})
            
            # 关系部分
            rel_types = relationship.get('types', [])
            min_hops = relationship.get('minHops', 1)
            max_hops = relationship.get('maxHops')
            
            # 构建基本查询
            query = f"MATCH p=(start:{start_label})"
            
            # 添加起始节点属性条件
            if start_props:
                conditions = []
                for key, value in start_props.items():
                    param_name = f"start_{key}"
                    conditions.append(f"start.{key} = ${param_name}")
                    params[param_name] = value
                if conditions:
                    query += " WHERE " + " AND ".join(conditions)
            
            # 构建关系部分
            rel_type_str = "|".join(f"`{t}`" for t in rel_types) if rel_types else ""
            rel_type_part = f":{rel_type_str}" if rel_type_str else ""
            
            # 构建可变长度部分
            length_part = f"*{min_hops}"
            if max_hops is not None:
                length_part += f"..{max_hops}"
            
            # 添加关系和终止节点
            query += f"-[r{rel_type_part}{length_part}]->(end:{end_label})"
            
            # 添加终止节点属性条件
            if end_props:
                end_conditions = []
                for key, value in end_props.items():
                    param_name = f"end_{key}"
                    end_conditions.append(f"end.{key} = ${param_name}")
                    params[param_name] = value
                if end_conditions:
                    query += " AND " + " AND ".join(end_conditions)
            
            # 返回完整路径
            query += " RETURN p"
            
            print(f"Generated path query: {query}")  # 调试日志
            print(f"With params: {params}")  # 调试日志
            
            return query, params
        
        else:
            raise ValueError(f"Unsupported match type: {match_type}")

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
        """执行match查询"""
        try:
            print("Query params received:", query_params)  # 调试日志
            
            match_type = query_params.get('matchType')
            if not match_type:
                raise ValueError("matchType is required")
            
            # 使用CypherQueryBuilder构建查询
            query, params = CypherQueryBuilder.build_match_query(query_params)
            
            if not query:
                raise ValueError("Failed to generate query")
            
            with self.driver.session() as session:
                try:
                    # 执行参数化查询
                    result = session.run(query, params)
                    
                    # 处理结果
                    records = []
                    for record in result:
                        try:
                            record_dict = {}
                            for key in record.keys():
                                if key == 'p':  # 处理路径
                                    path = record[key]
                                    path_dict = {
                                        'nodes': [],
                                        'relationships': []
                                    }
                                    
                                    # 处理路径中的节点
                                    for node in path.nodes:
                                        path_dict['nodes'].append({
                                            'id': node.id,
                                            'labels': list(node.labels),
                                            'properties': dict(node)
                                        })
                                    
                                    # 处理路径中的关系
                                    for rel in path.relationships:
                                        path_dict['relationships'].append({
                                            'id': rel.id,
                                            'type': rel.type,
                                            'startNode': rel.start_node.id,
                                            'endNode': rel.end_node.id,
                                            'properties': dict(rel)
                                        })
                                    
                                    record_dict[key] = path_dict
                                else:  # 处理其他类型的记录
                                    node = record[key]
                                    if hasattr(node, 'labels'):  # 节点
                                        record_dict[key] = {
                                            'id': node.id,
                                            'labels': list(node.labels),
                                            'properties': dict(node)
                                        }
                                    elif hasattr(node, 'type'):  # 关系
                                        record_dict[key] = {
                                            'type': node.type,
                                            'startNode': node.start_node.id,
                                            'endNode': node.end_node.id,
                                            'properties': dict(node)
                                        }
                                    else:
                                        record_dict[key] = node
                            records.append(record_dict)
                        except Exception as e:
                            print(f"Error processing record: {e}")  # 调试日志
                            continue
                    
                    return {
                        'success': True,
                        'data': records
                    }
                    
                except Exception as e:
                    print(f"Error executing query: {e}")  # 调试日志
                    return {
                        'success': False,
                        'error': f"Query execution error: {str(e)}"
                    }
                
        except Exception as e:
            print(f"Error in execute_match_query: {e}")  # 调试日志
            return {
                'success': False,
                'error': str(e)
            }


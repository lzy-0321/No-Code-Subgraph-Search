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
            query_details = query_params.get('query', {})
            rel_type = query_details.get('relationType')
            start_props = query_details.get('startNodeProps', {})
            end_props = query_details.get('endNodeProps', {})
            start_label = query_details.get('startNodeLabel', '')  # 获取起始节点标签
            end_label = query_details.get('endNodeLabel', '')      # 获取结束节点标签
            exact_match = query_details.get('exactMatch', False)

            if exact_match:
                # 构建节点属性条件
                start_props_str = '{' + ', '.join(f"{k}: ${k}" for k in start_props.keys()) + '}'
                end_props_str = '{' + ', '.join(f"{k}: ${k}" for k in end_props.keys()) + '}'
                
                # 构建节点标签部分（只在有标签时添加）
                start_label_str = f":{start_label}" if start_label else ""
                end_label_str = f":{end_label}" if end_label else ""
                
                # 构建查询，根据是否有属性决定是否添加属性条件
                start_node = f"(a{start_label_str}"
                start_node += f" {start_props_str}" if start_props else ""
                start_node += ")"
                
                end_node = f"(b{end_label_str}"
                end_node += f" {end_props_str}" if end_props else ""
                end_node += ")"
                
                # 组装完整查询
                query = f"MATCH {start_node}-[r:{rel_type}]->{end_node} RETURN a, r, b"
                
                # 合并所有参数
                params = {**start_props, **end_props}
                
                # print(f"Generated query: {query}")  # 调试日志
                # print(f"Query parameters: {params}")  # 调试日志
                
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
            
            # print(f"Generated path query: {query}")  # 调试日志
            # print(f"With params: {params}")  # 调试日志
            
            return query, params
        
        elif match_type == 'chainRelationshipMatch':
            relationships = query_params.get('relationships', [])
            
            # 用于存储查询参数和变量名映射
            params = {}
            used_vars = {}
            query_parts = []
            
            for i, rel in enumerate(relationships):
                # 处理起始节点
                if rel.get('startNodeRef'):
                    # 使用引用的节点变量
                    start_var = rel['startNodeRef']
                else:
                    # 为新节点生成字母变量名
                    start_var = chr(97 + len(used_vars))
                    used_vars[start_var] = rel['startNodeLabel']
                
                # 处理终止节点
                if rel.get('endNodeRef'):
                    # 使用引用的节点变量
                    end_var = rel['endNodeRef']
                else:
                    # 为新节点生成字母变量名
                    end_var = chr(97 + len(used_vars))
                    used_vars[end_var] = rel['endNodeLabel']
                
                # 构建关系属性
                rel_props_str = ""
                if rel.get('relationshipProps'):
                    rel_props_str = " {"
                    props = []
                    for key, value in rel['relationshipProps'].items():
                        param_name = f"rel_{i}_{key}"
                        props.append(f"{key}: ${param_name}")
                        params[param_name] = value
                    rel_props_str += ", ".join(props) + "}"
                
                # 构建节点属性
                start_props_str = ""
                if not rel.get('startNodeRef') and rel.get('startNodeProps'):
                    start_props_str = " {"
                    props = []
                    for key, value in rel['startNodeProps'].items():
                        param_name = f"start_{i}_{key}"
                        props.append(f"{key}: ${param_name}")
                        params[param_name] = value
                    start_props_str += ", ".join(props) + "}"
                
                end_props_str = ""
                if not rel.get('endNodeRef') and rel.get('endNodeProps'):
                    end_props_str = " {"
                    props = []
                    for key, value in rel['endNodeProps'].items():
                        param_name = f"end_{i}_{key}"
                        props.append(f"{key}: ${param_name}")
                        params[param_name] = value
                    end_props_str += ", ".join(props) + "}"
                
                # 构建完整的匹配模式
                start_pattern = f"({start_var}"
                if not rel.get('startNodeRef'):
                    start_pattern += f":{rel['startNodeLabel']}{start_props_str}"
                start_pattern += ")"
                
                end_pattern = f"({end_var}"
                if not rel.get('endNodeRef'):
                    end_pattern += f":{rel['endNodeLabel']}{end_props_str}"
                end_pattern += ")"
                
                # 构建MATCH子句
                match_clause = f"MATCH {start_pattern}-[r{i}:{rel['relationType']}{rel_props_str}]->{end_pattern}"
                query_parts.append(match_clause)
            
            # 组合所有MATCH子句
            query = "\n".join(query_parts)
            
            # 添加RETURN子句，返回所有唯一的节点和关系
            all_vars = list(used_vars.keys())  # 使用字母变量
            all_rels = [f"r{i}" for i in range(len(relationships))]
            query += f"\nRETURN {', '.join(all_vars)}, {', '.join(all_rels)}"
            
            # print(f"Generated query: {query}")  # 调试日志
            # print(f"Query parameters: {params}")  # 调试日志
            
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
        including display properties and IDs.

        Parameters:
        label (str): The label of the nodes to retrieve.

        Returns:
        tuple: A tuple containing:
            - prime_entities: A list of [display_value, id_value] pairs for each node
            - property_names: A list of unique property names
            - display_info: A dictionary containing display and id property information
        """
        # Define priority properties
        priority_properties = ["name", "title", "id"]
        id_properties = ["id", "uid", "nodeId"]

        try:
            with self.driver.session() as session:
                query = f"MATCH (n:{label}) RETURN n"
                result = session.run(query)

                prime_entities = []
                property_names = set()
                display_info = {
                    'displayProperty': None,
                    'idProperty': None,
                }

                # 第一次遍历确定显示属性和ID属性
                first_node = None
                for record in result:
                    node = record["n"]
                    properties = dict(node)
                    
                    if not first_node:
                        first_node = properties
                        property_names.update(properties.keys())

                        # 确定显示属性
                        for prop in priority_properties:
                            if prop in properties:
                                display_info['displayProperty'] = prop
                                break
                        if not display_info['displayProperty'] and properties:
                            display_info['displayProperty'] = list(properties.keys())[0]

                        # 确定ID属性
                        for prop in id_properties:
                            if prop in properties:
                                display_info['idProperty'] = prop
                                break
                        if not display_info['idProperty']:
                            display_info['idProperty'] = 'id'  # 使用Neo4j内部ID作为后备

                    # 获取显示值和ID值
                    display_value = properties.get(display_info['displayProperty'])
                    id_value = properties.get(display_info['idProperty'], node.id)  # 如果没有指定的ID属性，使用Neo4j的内部ID

                    # 将显示值和ID值作为一对添加到结果中
                    if display_value is not None:
                        prime_entities.append([display_value, id_value])

                # 按显示值排序
                prime_entities.sort(key=lambda x: str(x[0]))

                return [
                    prime_entities,  # 第一个元素：[display_value, id_value] 对的列表
                    list(property_names),  # 第二个元素：属性名列表
                    {label: display_info}  # 第三个元素：将label作为键的display_info字典
                ]

        except Exception as e:
            print(f"Error fetching entities for label {label}: {e}")
            return [], [], {label: {'displayProperty': None, 'idProperty': None}}

    def get_relationship_entities(self, label):
        """
        Retrieves relationships for the specified label from the Neo4j database,
        including display properties and IDs.

        Parameters:
        label (str): The label of the relationships to retrieve.

        Returns:
        tuple: A tuple containing:
            - prime_entities: A list of [[start_display, start_id], [end_display, end_id]] pairs
            - property_names: A list of unique property names
            - display_info: A dictionary containing display and id property information
        """
        # Define priority properties
        priority_properties = ["name", "title", "id"]
        id_properties = ["id", "uid", "nodeId"]

        try:
            with self.driver.session() as session:
                query = f"MATCH (start)-[r:{label}]->(end) RETURN start, end, r"
                result = session.run(query)

                prime_entities = []
                relationship_property_names = set()
                display_info = {
                    'displayProperty': None,
                    'idProperty': None,
                }

                # 第一次遍历确定显示属性和ID属性
                first_rel = None
                for record in result:
                    start_node = record["start"]
                    end_node = record["end"]
                    rel = record["r"]
                    
                    start_props = dict(start_node)
                    end_props = dict(end_node)
                    rel_props = dict(rel)

                    if not first_rel:
                        first_rel = rel_props
                        relationship_property_names.update(rel_props.keys())

                        # 确定显示属性
                        for prop in priority_properties:
                            if prop in rel_props:
                                display_info['displayProperty'] = prop
                                break
                        if not display_info['displayProperty'] and rel_props:
                            display_info['displayProperty'] = list(rel_props.keys())[0]

                        # 确定ID属性
                        for prop in id_properties:
                            if prop in rel_props:
                                display_info['idProperty'] = prop
                                break
                        if not display_info['idProperty']:
                            display_info['idProperty'] = 'id'

                    # 获取起始节点的显示值和ID
                    start_display = next(
                        (start_props.get(prop) for prop in priority_properties if prop in start_props),
                        list(start_props.values())[0] if start_props else None
                    )
                    start_id = next(
                        (start_props.get(prop) for prop in id_properties if prop in start_props),
                        start_node.id
                    )

                    # 获取终止节点的显示值和ID
                    end_display = next(
                        (end_props.get(prop) for prop in priority_properties if prop in end_props),
                        list(end_props.values())[0] if end_props else None
                    )
                    end_id = next(
                        (end_props.get(prop) for prop in id_properties if prop in end_props),
                        end_node.id
                    )

                    # 将节点对添加到结果中
                    if start_display is not None and end_display is not None:
                        prime_entities.append([
                            [start_display, start_id],
                            [end_display, end_id]
                        ])

                # 按起始节点的显示值排序
                prime_entities.sort(key=lambda x: (str(x[0][0]), str(x[1][0])))

                return [
                    prime_entities,  # 第一个元素：[[start_display, start_id], [end_display, end_id]] 对的列表
                    list(relationship_property_names),  # 第二个元素：属性名列表
                    {label: display_info}  # 第三个元素：将label作为键的display_info字典
                ]

        except Exception as e:
            print(f"Error fetching relationships for label {label}: {e}")
            return [], [], {label: {'displayProperty': None, 'idProperty': None}}

    def execute_match_query(self, query_params):
        """执行match查询"""
        try:
            # print("Query params received:", query_params)  # 调试日志
            
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
                            # print(f"Error processing record: {e}")  # 调试日志
                            continue
                    
                    return {
                        'success': True,
                        'data': records
                    }
                    
                except Exception as e:
                    # print(f"Error executing query: {e}")  # 调试日志
                    return {
                        'success': False,
                        'error': f"Query execution error: {str(e)}"
                    }
                
        except Exception as e:
            # print(f"Error in execute_match_query: {e}")  # 调试日志
            return {
                'success': False,
                'error': str(e)
            }


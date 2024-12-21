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


# test_neo4j_connection.py
from neo4j_connector import Neo4jConnector

# Define test parameters for Neo4j connection
neo4j_url = 'bolt://192.168.0.54:7687'  # Adjust with your Neo4j instance URL
server_username = 'neo4j'  # Replace with your Neo4j server username
server_password = '20020321'  # Replace with your Neo4j server password

# 创建 Neo4jConnector 实例并测试连接
connector = Neo4jConnector(neo4j_url, server_username, server_password)
success, message = connector.test_connection()

# 打印测试结果
if success:
    print("Connection successful!")

    # Test fetching node labels
    labels = connector.get_node_labels()
    print(f"Node Labels: {labels}")

    # Test fetching relationship types
    relationship_types = connector.get_relationship_types()
    print(f"Relationship Types: {relationship_types}")

    # Test fetching property keys
    property_keys = connector.get_property_keys()
    print(f"Property Keys: {property_keys}")

    # Test fetching node entities for a specific label (e.g., "Person")
    test_label = "Person"  # Replace with an actual label in your database
    node_entities = connector.get_node_entities(test_label)
    print(f"Entities with label '{test_label}': {node_entities}")

    # Test fetching relationship entities for a specific type (e.g., "FRIEND_OF")
    test_type = "ACTED_IN"  # Replace with an actual relationship type in your database
    relationship_entities = connector.get_relationship_entities(test_type)
    print(f"Entities with relationship type '{test_type}': {relationship_entities}")

else:
    print(f"Connection failed: {message}")

# 关闭连接
connector.close()
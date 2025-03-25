# Adding Nodes and Relationships in Match Queries

  

## Overview

Learn how to add nodes and relationships to your match queries using our visual interface. This guide will walk you through the process of creating and connecting nodes in your graph database.




## 1. Adding a Node

### Method 1: Use the sidebar

   1. Find the desired node label in the left navigation bar

   2. Click the "+" button next to the label to add it to the query

   <img src="/assets/docs/Add_node_Example_1.png" alt="Add node Example 1" />

### Method 2: Use the query builder

   1. Click the "Add Node" button in the query builder

   2. Select the node label from the drop-down menu (for example, Person, Movie, etc.)

   3. Add properties to the node:

      1. Enter the node property value if you need and click next

      2. Click show advanced can setup node limit to display in graph

      3. Click "Add" button to add node in graph
   <img src="/assets/docs/Add_node_Example_2.png" alt="Add node Example 2" />



## 2. Creating Relationships

### Method 1: Use the sidebar


   1. Find the desired relationship type in the left navigation bar

   2. Click the "+" button next to the relationship type

   <img src="/assets/docs/Add_relationship_Example_1.png" alt="Add relationship Example 1" />

### Method 2: Use the query builder

   1. Click the "Add Relationship" button in the query builder

   2. Select the relationship type from the drop-down menu (for example, ACTED_IN, etc.)

   3. Select the start node and end node label if needed from the drop-down menu (for example, Person, Movie, etc.)

   4. Add properties to the relationship and node:

      1. Enter the relationship property value if you need

      2. Click show advanced can setup node property(if select start/end node label)  in relationship

      3. Click "Add" button to add relationship in graph

<img src="/assets/docs/Add_relationship_Example_2.png" alt="Add relationship Example 2" />
  
## Tips

- Use descriptive labels for nodes

- Keep relationship types meaningful

- Consider property indexing for better performance

- Use parameters for dynamic values

- Test queries with small datasets first

  

## Best Practices

1. Always validate property values

2. Use clear naming conventions

3. Keep queries focused and specific

4. Consider query performance

5. Document complex patterns


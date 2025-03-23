# Adding Nodes and Relationships in Match Queries

## Overview
Learn how to add nodes and relationships to your match queries using our visual interface. This guide will walk you through the process of creating and connecting nodes in your graph database.

## Steps

### 1. Adding a Node
1. Click the "Add Node" button in the query builder
2. Select a label for your node (e.g., Person, Movie, etc.)
3. Add properties to your node:
   - Click "Add Property"
   - Enter property name and value
   - Choose property type (String, Number, etc.)

### 2. Creating Relationships
1. Click and drag from one node to another
2. Select relationship type from the dropdown
3. Add relationship properties (optional)
4. Confirm the connection

### 3. Configuring Match Conditions
1. Click on any node or relationship to edit
2. Add WHERE clauses for filtering
3. Set property constraints
4. Choose return values

## Examples

### Basic Node Match
cypher
MATCH (p:Person)
WHERE p.name = "Alice"
RETURN p

### Node with Relationship
cypher
MATCH (p:Person)-[r:KNOWS]->(f:Person)
WHERE p.name = "Alice"
RETURN p, r, f

### Complex Pattern
cypher
MATCH (p:Person)-[r:WORKS_AT]->(c:Company)
WHERE p.age > 25 AND c.industry = "Tech"
RETURN p.name, c.name, r.since


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

## Related Features
- Filter nodes by properties
- Save common patterns
- Export query results
- Visual query optimization
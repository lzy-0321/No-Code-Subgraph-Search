# Database Connection

## Overview

This document will guide you on how to connect to a graph database. SMARTD Studio supports connections to various graph databases, including Neo4j, JanusGraph, and more.

## Connection Steps

### 1. Open the Connection Dialog

In the left navigation bar of the application's main interface, click "Use database" or "+ Add New Database" button to open the connection dialog.

### 2. Enter Connection Information

In the connection dialog, you need to provide the following information:

1. **Connection URL**:
   - Select the protocol from the dropdown menu (e.g., bolt://)
   - Enter the database server address and port (e.g., 192.168.0.54:7687)

2. **Server Username**:
   - Enter your database username in the "Server Username" field

3. **Server Password**:
   - Enter your database password in the "Server Password" field

### 3. Establish Connection

After filling in all necessary information, click the "Connect Database" button to establish the connection.

## Managing Database Connections

### Connecting to Existing Databases
- Click on a previously added database in the left sidebar to connect to it directly
- This allows you to quickly switch between different database connections

### Managing Database Connections
- Click the settings button next to a database to delete it
- Note that at least one database connection must exist at all times
- The system will not allow you to delete the last remaining database connection
- Duplicate database connections are not permitted - each connection must be unique

## After Successful Connection

Once successfully connected to the database, you will be able to:

1. View nodes and relationships in your database in the left navigation bar
2. Expand "Node labels" to see all available node types
3. Expand "Relationship types" to see all available relationship types
4. Expand "Property keys" to see all available property keys

## Troubleshooting

If the connection fails, check:

1. Whether the server address and port are correct
2. Whether the username and password are correct
3. Whether the database server is running
4. Whether the network connection is normal
5. Whether firewall settings allow the connection

## Security Tips

1. Do not save passwords in shared environments
2. Change database passwords regularly
3. Configure database users with the principle of least privilege
4. Consider using SSL/TLS encrypted connections

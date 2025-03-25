# Data Filtering

## Overview

The Data Filtering feature in SMARTD Studio allows you to control which elements are displayed in your graph visualization. This functionality helps you focus on specific nodes and relationships, making it easier to analyze your graph data.

## Accessing the Filter

Click the filter button in the toolbar to open the filter panel. This panel displays all relationship types and node labels that currently exist in your graph.

## Filtering Capabilities

### Relationship Filtering

- Show or hide specific relationship types
- Toggle visibility of relationships by clicking on their names in the filter panel
- Hidden relationships will not appear in the graph visualization, but remain in the database

### Node Focus

- Click on a node label in the filter panel to focus on nodes with that label
- When a node label is selected, only nodes with that label and their directly connected nodes will be displayed
- You can select multiple node labels to create a combined focus view
- This helps you concentrate on specific parts of your graph without being distracted by unrelated nodes

## Using Filters

### Basic Relationship Filtering

1. Open the filter panel by clicking the filter button
2. In the Relationships section, click on any relationship type to toggle its visibility
3. Relationships that are hidden will not appear in the graph visualization
4. Click again on a hidden relationship type to make it visible again

### Node Focus Mode

1. Open the filter panel by clicking the filter button
2. In the Node Labels section, click on a node label to focus on nodes with that label
3. The graph will update to show only nodes with the selected label and their direct connections
4. Click on additional node labels to include them in the focus view
5. Click on a selected node label to remove it from the focus

## Practical Applications

### Simplifying Complex Graphs
- Hide relationship types that aren't relevant to your current analysis
- Focus on specific node types to reduce visual clutter

### Exploring Connections
- Select a node label to see all its connections at once
- Add another node label to explore relationships between different node types

### Data Analysis
- Isolate specific parts of your graph for detailed examination
- Toggle relationship visibility to compare different connection patterns

## Tips for Effective Filtering

1. Start by focusing on the most important node labels
2. Hide relationship types that aren't relevant to your current task
3. Combine multiple node label selections to explore specific subgraphs
4. Remember to reset filters when starting a new analysis

## Performance Considerations

- Filtering happens client-side and doesn't affect the database
- Complex graphs perform better with appropriate filtering
- Consider using filters when working with large datasets

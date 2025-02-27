// 查询类型枚举
export const QueryType = {
  LABEL: 'LABEL',
  PROPERTY: 'PROPERTY',
  RELATIONSHIP: 'RELATIONSHIP',
  PATH: 'PATH'
};

// 查询状态类
export class QueryState {
  constructor(id, type, params, result = null) {
    this.id = id;
    this.type = type;
    this.params = params;
    this.result = result;
    this.timestamp = Date.now();
    this.isActive = true;
  }
}

// 查询管理器类
export class QueryManager {
  constructor() {
    this.generator = new QueryParamsGenerator();
    this.queries = new Map(); // 存储所有查询
    this.activeQueries = new Set(); // 当前活动的查询
    this.queryCounter = 0; // 用于生成唯一ID
    this.queryResults = new Map(); // 存储查询结果
  }

  // 生成唯一查询ID
  generateQueryId() {
    return `query_${++this.queryCounter}`;
  }

  // 创建标签查询
  createLabelQuery(label) {
    const queryId = this.generateQueryId();
    const params = this.generator.generateLabelQuery(label);
    const queryState = new QueryState(queryId, QueryType.LABEL, params);
    this.queries.set(queryId, queryState);
    this.activeQueries.add(queryId);
    return queryId;
  }

  // 创建属性查询
  createPropertyQuery(label, properties) {
    const queryId = this.generateQueryId();
    const params = this.generator.generatePropertyQuery(label, properties);
    const queryState = new QueryState(queryId, QueryType.PROPERTY, params);
    this.queries.set(queryId, queryState);
    this.activeQueries.add(queryId);
    return queryId;
  }

  // 创建关系查询
  createRelationshipQuery(startLabel, relationType, endLabel, relationshipProps, variableLength) {
    const queryId = this.generateQueryId();
    const params = this.generator.generateRelationshipQuery(
      startLabel, 
      relationType, 
      endLabel, 
      relationshipProps, 
      variableLength
    );
    const queryState = new QueryState(queryId, QueryType.RELATIONSHIP, params);
    this.queries.set(queryId, queryState);
    this.activeQueries.add(queryId);
    return queryId;
  }

  // 创建路径查询
  createPathQuery(startLabel, endLabel, pathProperties) {
    const queryId = this.generateQueryId();
    const params = this.generator.generatePathQuery(
      startLabel,
      endLabel,
      pathProperties
    );
    const queryState = new QueryState(queryId, QueryType.PATH, params);
    this.queries.set(queryId, queryState);
    this.activeQueries.add(queryId);
    return queryId;
  }

  // 更新查询参数
  updateQueryParams(queryId, newParams) {
    const queryState = this.queries.get(queryId);
    if (queryState) {
      queryState.params = { ...queryState.params, ...newParams };
      return true;
    }
    return false;
  }

  // 存储查询结果
  setQueryResult(queryId, result) {
    const queryState = this.queries.get(queryId);
    if (queryState) {
      queryState.result = result;
      return true;
    }
    return false;
  }

  // 获取查询状态
  getQueryState(queryId) {
    return this.queries.get(queryId);
  }

  // 获取查询参数
  getQueryParams(queryId) {
    const queryState = this.queries.get(queryId);
    return queryState ? queryState.params : null;
  }

  // 获取查询结果
  getQueryResult(queryId) {
    const queryState = this.queries.get(queryId);
    return queryState ? queryState.result : null;
  }

  // 停用查询
  deactivateQuery(queryId) {
    const queryState = this.queries.get(queryId);
    if (queryState) {
      queryState.isActive = false;
      this.activeQueries.delete(queryId);
      return true;
    }
    return false;
  }

  // 重新激活查询
  activateQuery(queryId) {
    const queryState = this.queries.get(queryId);
    if (queryState) {
      queryState.isActive = true;
      this.activeQueries.add(queryId);
      return true;
    }
    return false;
  }

  // 获取所有活动查询
  getActiveQueries() {
    return Array.from(this.activeQueries)
      .map(id => this.queries.get(id))
      .filter(query => query !== undefined);
  }

  // 获取特定类型的所有查询
  getQueriesByType(type) {
    return Array.from(this.queries.values())
      .filter(query => query.type === type);
  }

  // 清除所有查询
  clearQueries() {
    this.queries.clear();
    this.activeQueries.clear();
    this.queryCounter = 0;
  }

  // 删除特定查询
  deleteQuery(queryId) {
    this.activeQueries.delete(queryId);
    return this.queries.delete(queryId);
  }

  // 合并多个查询
  mergeQueries(queryIds) {
    const queries = queryIds
      .map(id => this.getQueryState(id))
      .filter(query => query !== null);

    if (queries.length === 0) return null;

    // 这里可以实现具体的查询合并逻辑
    // 返回合并后的查询参数
    return {
      multipleMatches: true,
      queries: queries.map(q => q.params)
    };
  }

  // 执行标签查询
  async executeLabelQuery(params) {
    try {
      console.log('Executing label query with params:', params); // 调试日志

      const requestBody = {
        matchType: 'labelMatch',
        label: params.label,
        properties: params.properties || {},
        limit: params.limit
      };
      
      console.log('Request body:', requestBody); // 调试日志

      const response = await fetch('http://localhost:8000/match_query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status); // 调试日志
      const data = await response.json();
      console.log('Response data:', data); // 调试日志

      if (!data.success) {
        throw new Error(data.error || 'Query failed');
      }

      return {
        nodes: data.data.map(record => ({
          id: record.n.properties.id || Math.random(),
          labels: Array.isArray(record.n.labels) ? record.n.labels : [record.n.labels],
          properties: record.n.properties
        })),
        relationships: []
      };
    } catch (error) {
      console.error('Label query execution failed:', error);
      throw error;
    }
  }

  // 执行关系查询
  async executeRelationshipQuery(params) {
    try {
      console.log('Executing relationship query with params:', params);

      if (!params.relationType) {
        throw new Error('relationType is required');
      }

      const requestBody = {
        matchType: 'relationshipMatch',
        relationType: params.relationType,
        properties: params.properties || {},
        startNodeProps: params.startNodeProps || {},
        endNodeProps: params.endNodeProps || {}
      };

      console.log('Sending request with body:', requestBody);

      const response = await fetch('http://localhost:8000/match_query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Query failed');
      }

      // 创建一个 Map 来存储唯一的节点
      const nodesMap = new Map();
      
      // 处理所有节点
      data.data.forEach(record => {
        // 处理起始节点 'a'
        nodesMap.set(record.a.id, {
          id: record.a.id,
          labels: record.a.labels,
          properties: record.a.properties
        });
        
        // 处理终止节点 'b'
        nodesMap.set(record.b.id, {
          id: record.b.id,
          labels: record.b.labels,
          properties: record.b.properties
        });
      });

      // 转换为数组格式
      const nodes = Array.from(nodesMap.values());
      
      // 处理关系
      const relationships = data.data.map(record => ({
        startNode: record.r.startNode,  // 使用关系中存储的 startNode id
        endNode: record.r.endNode,      // 使用关系中存储的 endNode id
        type: record.r.type,
        properties: record.r.properties || {}
      }));

      return {
        nodes,
        relationships
      };
    } catch (error) {
      console.error('Relationship query execution failed:', error);
      throw error;
    }
  }

  // 执行路径查询
  async executePathQuery(params) {
    try {
      const response = await fetch('http://localhost:8000/match_query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          matchType: 'pathMatch',
          startNode: params.startNode,
          endNode: params.endNode,
          relationship: params.relationship
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Query failed');
      }

      // 解析路径结果
      const nodes = new Map();
      const relationships = new Set();

      data.data.forEach(record => {
        const path = record.p;
        path.nodes.forEach(node => {
          nodes.set(node.id, {
            id: node.id,
            labels: Array.isArray(node.labels) ? node.labels : [node.labels],
            properties: node.properties
          });
        });

        path.relationships.forEach(rel => {
          relationships.add({
            startNode: rel.startNode,
            endNode: rel.endNode,
            type: rel.type,
            properties: rel.properties
          });
        });
      });

      return {
        nodes: Array.from(nodes.values()),
        relationships: Array.from(relationships)
      };
    } catch (error) {
      console.error('Path query execution failed:', error);
      throw error;
    }
  }

  // 执行查询的主方法
  async executeQuery(queryIdOrParams) {
    try {
      let params;
      
      // 检查是否传入的是查询ID还是直接的参数
      if (typeof queryIdOrParams === 'string') {
        // 如果是查询ID，从查询状态获取参数
        const queryState = this.queries.get(queryIdOrParams);
        if (!queryState) return null;
        params = queryState.params;
      } else {
        // 如果直接传入参数，直接使用
        params = queryIdOrParams;
      }

      console.log('Final query params:', params); // 调试日志

      // 根据matchType决定使用哪个查询执行方法
      let result;
      switch (params.type) {
        case 'node':
          result = await this.executeLabelQuery(params.params);
          break;
        case 'relationship':
          result = await this.executeRelationshipQuery(params.params);
          break;
        case 'path':
          result = await this.executePathQuery(params.params);
          break;
        default:
          throw new Error(`Unknown query type: ${params.type}`);
      }

      // 如果是查询ID，存储结果
      if (typeof queryIdOrParams === 'string') {
        this.queryResults.set(queryIdOrParams, result);
      }

      return result;
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  // 获取所有活动查询的结果
  getAllQueryResults() {
    const results = [];
    for (const queryId of this.activeQueries) {
      const queryState = this.queries.get(queryId);
      const result = this.queryResults.get(queryId);
      if (queryState && result) {
        results.push({
          id: queryId,
          type: queryState.type,
          params: queryState.params,
          result: result
        });
      }
    }
    return results;
  }

  // 获取特定类型的查询结果
  getQueryResultsByType(type) {
    return Array.from(this.activeQueries)
      .filter(id => this.queries.get(id)?.type === type)
      .map(id => ({
        id,
        params: this.queries.get(id)?.params,
        result: this.queryResults.get(id)
      }));
  }

  // 清除查询结果
  clearQueryResults() {
    this.queryResults.clear();
  }

  // 删除特定查询的结果
  deleteQueryResult(queryId) {
    this.queryResults.delete(queryId);
  }

  createGetLabelsQuery() {
    // 创建获取所有标签的 Cypher 查询
    const query = 'CALL db.labels()';
    return this.addQuery(query);
  }
}

export class QueryParamsGenerator {
  constructor() {
    this.queryParams = {
      matchType: 'allNodes',
      label: '',
      nodeProperties: {},
      relationship: {},
      whereClause: '',
      returnFields: ['n'],
      optional: false,
      useWithClause: false,
      aggregate: false,
      multipleMatches: false,
      variableLength: {
        enabled: false,
        minHops: 1,
        maxHops: null
      }
    };
  }

  // 根据节点标签生成查询
  generateLabelQuery(label) {
    return {
      ...this.queryParams,
      matchType: 'labelMatch',
      label: label,
      properties: {},
      returnFields: ['n']
    };
  }

  // 根据节点属性生成查询
  generatePropertyQuery(label, properties) {
    return {
      ...this.queryParams,
      matchType: 'propertyMatch',
      label: label,
      nodeProperties: properties,
      returnFields: ['n']
    };
  }

  // 根据关系生成查询
  generateRelationshipQuery(startLabel, relationType, endLabel, relationshipProps = {}, variableLength = null) {
    return {
      ...this.queryParams,
      matchType: 'relationshipMatch',
      startLabel: startLabel,
      relationType: relationType,
      endLabel: endLabel,
      properties: relationshipProps.relationship || {},
      startNodeProps: relationshipProps.startNode || {},
      endNodeProps: relationshipProps.endNode || {}
    };
  }

  // 添加WHERE子句
  addWhereClause(query, whereClause) {
    return {
      ...query,
      whereClause: whereClause
    };
  }

  // 添加聚合
  addAggregation(query, aggregateFields) {
    return {
      ...query,
      aggregate: true,
      returnFields: aggregateFields
    };
  }

  // 生成路径查询
  generatePathQuery(startLabel, endLabel, pathProperties) {
    return {
      ...this.queryParams,
      matchType: 'pathMatch',
      startNode: {
        label: startLabel,
        properties: pathProperties.startNode || {}
      },
      endNode: {
        label: endLabel,
        properties: pathProperties.endNode || {}
      },
      relationship: {
        types: pathProperties.relationship.types || [],
        minHops: parseInt(pathProperties.relationship.minHops) || 1,
        maxHops: pathProperties.relationship.maxHops ? 
          parseInt(pathProperties.relationship.maxHops) : null
      }
    };
  }
} 
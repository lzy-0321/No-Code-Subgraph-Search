// 查询示例:

// 1. 标签查询示例
// 查询所有 Person 标签的节点
// {
//   type: 'node',
//   params: {
//     matchType: 'labelMatch',
//     label: 'Person',
//     properties: {}
//   }
// }

// 2. 带属性的标签查询示例
// 查询 name 为 'John' 的 Person 节点
// {
//   type: 'node', 
//   params: {
//     matchType: 'labelMatch',
//     label: 'Person',
//     properties: {
//       name: 'John'
//     }
//   }
// }

// 3. 关系查询示例
// 查询从 Person(name='John') 到 Movie(title='Matrix') 的 ACTED_IN 关系
// {
//   type: 'relationship',
//   params: {
//     matchType: 'relationshipMatch',
//     relationType: 'ACTED_IN',
//     startNodeProps: {
//       name: 'John'
//     },
//     endNodeProps: {
//       title: 'Matrix'  
//     }
//   }
// }

// 4. 多节点关系查询示例
// 查询所有 Person 和 Movie 之间的 ACTED_IN 关系
// {
//   type: 'relationship',
//   params: {
//     matchType: 'relationshipMatch',
//     relationType: 'ACTED_IN',
//     startNodeLabel: 'Person',
//     endNodeLabel: 'Movie'
//   }
// }

// 5. 属性查询示例
// 查询所有带有 age 属性且值大于 30 的 Person 节点
// {
//   type: 'node',
//   params: {
//     matchType: 'propertyMatch',
//     label: 'Person',
//     properties: {
//       age: {
//         operator: '>',
//         value: 30
//       }
//     }
//   }
// }
// 6. 路径查询示例
// 查询从 Person(name='John') 到 Movie(title='Matrix') 的所有路径
// {
//   type: 'path',
//   params: {
//     matchType: 'pathMatch',
//     startNodeProps: {
//       label: 'Person', 
//       properties: {
//         name: 'John'
//       }
//     },
//     endNodeProps: {
//       label: 'Movie',
//       properties: {
//         title: 'Matrix'
//       }
//     },
//     maxDepth: 3  // 可选,限制路径深度
//   }
// }

// 7. 模式匹配查询示例
// 查询满足特定模式的子图,如 (Person)-[FOLLOWS]->(Person)-[RATED]->(Movie)
// {
//   type: 'pattern',
//   params: {
//     matchType: 'patternMatch',
//     pattern: [
//       {
//         nodeLabel: 'Person',
//         relationship: 'FOLLOWS',
//         direction: 'out'
//       },
//       {
//         nodeLabel: 'Person', 
//         relationship: 'RATED',
//         direction: 'out'
//       },
//       {
//         nodeLabel: 'Movie'
//       }
//     ]
//   }
// }

// 8. 链式关系查询示例
// 查询满足多个连续关系的节点,如 (Person)-[FOLLOWS]->(Person)-[REVIEWED]->(Movie)
// {
//   type: 'chainRelationship',
//   params: {
//     matchType: 'chainRelationshipMatch',
//     relationships: [
//       {
//         startNodeLabel: 'Person',
//         relationType: 'FOLLOWS',
//         endNodeLabel: 'Person',
//         startNodeProps: {}, // 可选
//         endNodeProps: {},   // 可选
//         relationshipProps: {} // 可选
//       },
//       {
//         startNodeLabel: 'Person', // 可以引用前一个查询的节点
//         relationType: 'REVIEWED',
//         endNodeLabel: 'Movie',
//         startNodeProps: {}, // 可选,如果引用前一个查询的节点则忽略
//         endNodeProps: {},   // 可选
//         relationshipProps: {} // 可选
//       }
//     ],
//     nodeReferences: {
//       // 指定节点之间的引用关系
//       // key是当前查询中的节点位置,value是要引用的节点位置
//       // 例如: "1.start": "0.end" 表示第二个关系的起始节点引用第一个关系的终止节点
//       "1.start": "0.end"  
//     }
//   }
// }
//
// 链式查询结果格式:
// {
//   data: [
//     {
//       nodes: [  // 所有涉及的节点
//         {
//           id: "节点ID",
//           labels: ["节点标签"],
//           properties: {节点属性}
//         }
//       ],
//       relationships: [  // 所有涉及的关系
//         {
//           type: "关系类型",
//           startNode: "起始节点ID",
//           endNode: "终止节点ID",
//           properties: {关系属性}
//         }
//       ]
//     }
//   ]
// }

// 查询结果到图形数据的转换模板:

// 1. 节点查询结果格式
// 输入数据格式:
// {
//   data: [
//     {
//       n: {
//         id: "节点ID",
//         labels: ["节点标签1", "节点标签2"],
//         properties: {
//           属性名1: "属性值1",
//           属性名2: "属性值2"
//         }
//       }
//     }
//   ]
// }
//
// 转换后的节点格式:
// {
//   nodes: [
//     {
//       id: "节点ID",
//       nodeLabel: "节点标签1",  // 使用第一个标签
//       properties: {
//         属性名1: "属性值1",
//         属性名2: "属性值2"
//       }
//     }
//   ],
//   relationships: []  // 节点查询不返回关系
// }

// 2. 关系查询结果格式
// 输入数据格式:
// {
//   data: [
//     {
//       a: {起始节点信息},
//       b: {终止节点信息},
//       r: {
//         type: "关系类型",
//         properties: {关系属性},
//         startNode: "起始节点ID",
//         endNode: "终止节点ID"
//       }
//     }
//   ]
// }
//
// 转换后的关系格式:
// {
//   nodes: [
//     {
//       id: "起始节点ID",
//       nodeLabel: "起始节点标签",
//       properties: {起始节点属性}
//     },
//     {
//       id: "终止节点ID",
//       nodeLabel: "终止节点标签",
//       properties: {终止节点属性}
//     }
//   ],
//   relationships: [
//     {
//       startNode: "起始节点ID",
//       endNode: "终止节点ID",
//       type: "关系类型",
//       properties: {关系属性}
//     }
//   ]
// }

// 3. 路径查询结果格式
// 输入数据格式:
// {
//   data: [
//     {
//       p: {
//         nodes: [节点列表],
//         relationships: [关系列表]
//       }
//     }
//   ]
// }
//
// 转换后的路径格式:
// {
//   nodes: [
//     {
//       id: "节点ID",
//       nodeLabel: "节点标签",
//       properties: {节点属性}
//     }
//   ],
//   relationships: [
//     {
//       startNode: "起始节点ID",
//       endNode: "终止节点ID",
//       type: "关系类型",
//       properties: {关系属性}
//     }
//   ]
// }

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
      //console.log('Executing label query with params:', params);

      const requestBody = {
        matchType: 'labelMatch',
        label: params.label,
        properties: params.properties || {},
        limit: params.limit,
        exactMatch: false  // 添加这个参数来获取所有匹配的节点
      };
      
      //console.log('Request body:', requestBody);

      const response = await fetch('http://localhost:8000/match_query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      //console.log('Response status:', response.status);
      const data = await response.json();
      //console.log('Response data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Query failed');
      }

      // 确保所有节点都被正确处理
      const uniqueNodes = new Map();
      data.data.forEach(record => {
        const node = record.n;
        if (!uniqueNodes.has(node.id)) {
          uniqueNodes.set(node.id, {
            id: node.id,
            nodeLabel: Array.isArray(node.labels) ? node.labels[0] : node.labels,
            properties: node.properties || {}
          });
        }
      });

      return {
        nodes: Array.from(uniqueNodes.values()),
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
      //console.log('Executing relationship query with params:', params);

      const requestBody = {
        matchType: 'relationshipMatch',
        query: {
          relationType: params.relationType,
          ...(params.startNodeLabel && {
            startNodeLabel: params.startNodeLabel,
            ...(Object.keys(params.startNodeProps || {}).length > 0 && {
              startNodeProps: params.startNodeProps
            })
          }),
          ...(params.endNodeLabel && {
            endNodeLabel: params.endLabel,
            ...(Object.keys(params.endNodeProps || {}).length > 0 && {
              endNodeProps: params.endNodeProps
            })
          }),
          exactMatch: true,
          // 将 limit 移到 query 对象内部
          limit: params.limit ? parseInt(params.limit) : undefined
        }
      };

      //console.log('Request body:', requestBody);

      const response = await fetch('http://localhost:8000/match_query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Query failed');
      }

      // 直接处理返回的精确结果
      const nodes = new Map();
      const relationships = [];

      // 只处理限制数量内的结果
      const limitedData = params.limit ? data.data.slice(0, params.limit) : data.data;

      limitedData.forEach(record => {
        // 添加起始节点
        nodes.set(record.a.id, {
          id: record.a.id,
          nodeLabel: record.a.labels[0],
          properties: record.a.properties
        });

        // 添加终止节点
        nodes.set(record.b.id, {
          id: record.b.id,
          nodeLabel: record.b.labels[0],
          properties: record.b.properties
        });

        // 添加关系
        relationships.push({
          startNode: record.a.id,
          endNode: record.b.id,
          type: record.r.type,
          properties: record.r.properties
        });
      });

      return {
        nodes: Array.from(nodes.values()),
        relationships: relationships
      };

    } catch (error) {
      console.error('Relationship query execution failed:', error);
      throw error;
    }
  }

  // 执行路径查询
  async executePathQuery(params) {
    try {
      //console.log('Executing path query with params:', params);

      // 过滤掉空的属性对象
      const startNodeProps = Object.keys(params.startNode.properties || {}).length > 0 
        ? params.startNode.properties 
        : {};
        
      const endNodeProps = Object.keys(params.endNode.properties || {}).length > 0 
        ? params.endNode.properties 
        : {};

      const requestBody = {
        matchType: 'pathMatch',
        startNode: {
          label: params.startNode.label,
          properties: startNodeProps
        },
        endNode: {
          label: params.endNode.label,
          properties: endNodeProps
        },
        relationship: {
          types: params.relationship?.types || [],
          minHops: params.relationship?.minHops || 1,
          maxHops: params.relationship?.maxHops || null
        }
      };

      //console.log('Request body:', requestBody);

      const response = await fetch('http://localhost:8000/match_query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
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
        
        // 处理节点
        path.nodes.forEach(node => {
          if (!nodes.has(node.id)) {
            nodes.set(node.id, {
              id: node.id,
              nodeLabel: Array.isArray(node.labels) ? node.labels[0] : node.labels,
              properties: node.properties || {}
            });
          }
        });

        // 处理关系
        path.relationships.forEach(rel => {
          relationships.add({
            startNode: rel.startNode,
            endNode: rel.endNode,
            type: rel.type,
            properties: rel.properties || {}
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
      //console.log('executeQuery received:', queryIdOrParams);
      
      // 检查是否传入的是查询ID还是直接的参数
      if (typeof queryIdOrParams === 'string') {
        const queryState = this.queries.get(queryIdOrParams);
        if (!queryState) return null;
        params = queryState.params;
      } else {
        params = queryIdOrParams;
      }

      //console.log('Processed params:', params);

      // 根据type决定使用哪个查询执行方法
      let result;
      if (!params.type) {
        console.error('Missing type in params:', params);
        throw new Error('Query type is required');
      }

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
        case 'chainRelationship':
          result = await this.executeChainRelationshipQuery(params.params);
          break;
        default:
          throw new Error(`Unknown query type: ${params.type}`);
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

  // 执行链式关系查询
  async executeChainRelationshipQuery(params) {
    try {
      // 添加详细的调试日志
      //console.log('Executing chain relationship query with params:', JSON.stringify(params, null, 2));

      const response = await fetch('http://localhost:8000/match_query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          matchType: 'chainRelationshipMatch',
          relationships: params.relationships
        })
      });

      // 添加响应调试日志
      const data = await response.json();
      //console.log('Chain query response:', JSON.stringify(data, null, 2));

      if (!data.success) {
        throw new Error(data.error || 'Chain relationship query failed');
      }

      // 处理返回的结果
      const nodes = new Map();
      const relationships = new Set();

      data.data.forEach(record => {
        // 处理所有返回的节点
        Object.values(record).forEach(value => {
          if (value && value.labels) { // 是节点
            if (!nodes.has(value.id)) {
              nodes.set(value.id, {
                id: value.id,
                nodeLabel: value.labels[0],
                properties: value.properties
              });
            }
          } else if (value && value.type) { // 是关系
            relationships.add({
              startNode: value.startNode,
              endNode: value.endNode,
              type: value.type,
              properties: value.properties || {}
            });
          }
        });
      });

      return {
        nodes: Array.from(nodes.values()),
        relationships: Array.from(relationships)
      };

    } catch (error) {
      console.error('Chain relationship query execution failed:', error);
      throw error;
    }
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
    //console.log('generatePathQuery inputs:', { startLabel, endLabel, pathProperties });  // 添加日志
    return {
      type: 'path',  // 确保包含 type
      params: {
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
          types: pathProperties.relationship?.types || [],
          minHops: parseInt(pathProperties.relationship?.minHops) || 1,
          maxHops: pathProperties.relationship?.maxHops ? 
            parseInt(pathProperties.relationship.maxHops) : null
        }
      }
    };
  }

  // 生成链式关系查询
  generateChainRelationshipQuery(relationships, nodeReferences) {
    return {
      type: 'chainRelationship',
      params: {
        matchType: 'chainRelationshipMatch',
        relationships: relationships  // 直接使用传入的 relationships
      }
    };
  }
} 
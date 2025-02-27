import { QueryManager } from '../utils/queryGenerator';
import { useState, useEffect } from 'react';

const Playground = () => {
  const [nodeLabels, setNodeLabels] = useState([]);
  const queryManager = new QueryManager();

  // 获取所有节点标签
  useEffect(() => {
    const fetchNodeLabels = async () => {
      try {
        // 假设这是获取所有标签的查询ID
        const labelsQueryId = queryManager.createGetLabelsQuery();
        const result = await queryManager.executeQuery(labelsQueryId);
        if (result && Array.isArray(result)) {
          setNodeLabels(result);
        }
      } catch (error) {
        console.error('Failed to fetch node labels:', error);
      }
    };

    fetchNodeLabels();
  }, []);

  const handleQueryGenerated = async (queryData) => {
    const { type, params } = queryData;
    
    // 创建查询并执行
    let queryId;
    switch (type) {
      case 'node':
        queryId = queryManager.createLabelQuery(params.label);
        break;
      case 'relationship':
        queryId = queryManager.createRelationshipQuery(
          params.startLabel,
          params.type,
          params.endLabel,
          params.properties
        );
        break;
      case 'path':
        queryId = queryManager.createPathQuery(
          params.startLabel,
          params.endLabel,
          params.pathProperties
        );
        break;
    }

    if (queryId) {
      // 执行查询并获取结果
      const result = await queryManager.executeQuery(queryId);
      
      // 根据结果更新视图
      if (result) {
        updateGraphView(result);
      }
    }
  };

  return (
    <div className={styles.playground}>
      {/* ... 其他组件 ... */}
      <AddTab 
        nodeLabels={nodeLabels}
        AddTabNodeEntities={nodeEntities}
        AddTabRelationshipEntities={relationshipEntities}
        onQueryGenerated={handleQueryGenerated}
      />
      {/* ... 其他组件 ... */}
    </div>
  );
}; 
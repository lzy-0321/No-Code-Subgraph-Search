import React, { useState, useRef, useEffect, useMemo } from "react";
import Draggable from "react-draggable";
import styles from "../styles/Filter.module.css";
import { TbFilter, TbEye, TbEyeOff } from "react-icons/tb";
import NumberTicker from "../components/ui/number-ticker";

const Filter = ({ 
  graphNodes: nodes, 
  graphRelationships: relationships, 
  setGraphNodes, 
  setGraphRelationships, 
  graphNodesBuffer, 
  graphRelationshipsBuffer, 
  setGraphNodesBuffer, 
  setGraphRelationshipsBuffer,
  activeTabId,
  onFilterStateChange,
  initialFilterState,
  onBufferChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(initialFilterState?.activeFilterTab || "relationship");
  const [hiddenTypes, setHiddenTypes] = useState(() => {
    return initialFilterState?.hiddenTypes || {};
  });
  const [selectedNodes, setSelectedNodes] = useState(new Set(initialFilterState?.selectedNodes || []));
  const [relationshipTypeOrder, setRelationshipTypeOrder] = useState(initialFilterState?.relationshipTypeOrder || []);

  // Group nodes by their labels
  const nodeLabels = [...new Set(nodes.map((node) => node.nodeLabel))];
  
  // Group relationships by type
  const groupedRelationships = groupRelationshipsByType(relationships.concat(graphRelationshipsBuffer));

  // 检查是否有数据
  const hasData = nodes.length > 0 || relationships.length > 0 || graphNodesBuffer.length > 0 || graphRelationshipsBuffer.length > 0;
  
  // 检查是否有关系数据
  const hasRelationships = useMemo(() => {
    // 检查可见的关系
    const visibleRelationships = relationships.length > 0;
    
    // 检查缓冲区中的关系
    const bufferedRelationships = graphRelationshipsBuffer.length > 0;
    
    // 检查关系类型是否存在
    const hasRelationshipTypes = relationshipTypeOrder.length > 0;
    
    // 检查 Tab 状态中是否有关系类型
    const hasRelationshipTypesInTab = initialFilterState?.relationshipTypeOrder?.length > 0;
    
    // 添加调试日志
    console.log('hasRelationships calculation:', {
      visibleRelationships,
      bufferedRelationships,
      hasRelationshipTypes,
      hasRelationshipTypesInTab,
      result: visibleRelationships || bufferedRelationships || hasRelationshipTypes || hasRelationshipTypesInTab
    });
    
    return visibleRelationships || bufferedRelationships || hasRelationshipTypes || hasRelationshipTypesInTab;
  }, [relationships, graphRelationshipsBuffer, relationshipTypeOrder, initialFilterState]);

  // 检查是否有节点数据
  const hasNodes = nodes.length > 0 || graphNodesBuffer.length > 0;

  // 修改通知父组件的 useEffect
  useEffect(() => {
    // 使用防抖函数避免频繁更新
    const timer = setTimeout(() => {
      if (onFilterStateChange && activeTabId) {
        // 将 Set 转换为数组，因为 Set 无法直接序列化
        onFilterStateChange({
          activeFilterTab: activeTab,
          hiddenTypes,
          selectedNodes: [...selectedNodes],
          relationshipTypeOrder,
        });
      }
    }, 100); // 添加100ms延迟，减少更新频率
    
    return () => clearTimeout(timer); // 清除定时器
  }, [activeTab, hiddenTypes, selectedNodes, relationshipTypeOrder, activeTabId, onFilterStateChange]);

  // 只在初始化和数据类型变化时更新激活的标签页
  useEffect(() => {
    // 只在以下情况更新activeTab：
    // 1. 当前选中的标签页不可用（比如选中relationship但没有关系数据）
    // 2. 当前没有选中的标签页
    const isCurrentTabInvalid = 
      (activeTab === "relationship" && !hasRelationships) || 
      (activeTab !== "relationship" && !nodeLabels.includes(activeTab));

    if (isCurrentTabInvalid) {
      if (hasRelationships) {
        setActiveTab("relationship");
      } else if (hasNodes && nodeLabels.length > 0) {
        setActiveTab(nodeLabels[0]);
      }
    }
  }, [hasRelationships, hasNodes, nodeLabels, activeTab]);

  // 修改 useEffect 来正确更新关系类型顺序
  useEffect(() => {
    // 获取当前所有关系类型
    const allRelationships = relationships.concat(graphRelationshipsBuffer);
    const currentTypes = Object.keys(groupRelationshipsByType(allRelationships));
    
    // 检查是否有新类型被添加或需要更新顺序
    if (currentTypes.length > 0) {
      // 1. 保留现有顺序中仍然存在的类型
      const existingOrderedTypes = relationshipTypeOrder.filter(type => 
        currentTypes.includes(type)
      );
      
      // 2. 找出新添加的类型（在当前类型中但不在现有顺序中）
      const newTypes = currentTypes.filter(type => 
        !relationshipTypeOrder.includes(type)
      );
      
      // 3. 合并保留的顺序和新类型
      if (newTypes.length > 0 || existingOrderedTypes.length !== relationshipTypeOrder.length) {
        setRelationshipTypeOrder([...existingOrderedTypes, ...newTypes]);
      }
    }
  }, [relationships, graphRelationshipsBuffer]);

  // 修改对 initialFilterState 变化的监听，避免无限循环
  useEffect(() => {
    if (initialFilterState) {
      // 确保深度比较hiddenTypes对象
      const newHiddenTypes = initialFilterState.hiddenTypes || {};
      const hiddenTypesChanged = JSON.stringify(newHiddenTypes) !== JSON.stringify(hiddenTypes);
      
      if (hiddenTypesChanged) {
        console.log('Updating hiddenTypes:', newHiddenTypes); // 添加调试日志
        setHiddenTypes(newHiddenTypes);
      }
      
      // 使用函数比较当前状态和新状态，只在真正需要更新时才更新
      const newActiveTab = initialFilterState.activeFilterTab || "relationship";
      const newSelectedNodes = new Set(initialFilterState.selectedNodes || []);
      const newRelationshipTypeOrder = initialFilterState.relationshipTypeOrder || [];
      
      // 只有当值真正变化时才更新状态
      if (newActiveTab !== activeTab) {
        setActiveTab(newActiveTab);
      }
      
      // 比较数组是否相等
      const selectedNodesArray = [...selectedNodes];
      const newSelectedNodesArray = [...newSelectedNodes];
      const selectedNodesChanged = 
        selectedNodesArray.length !== newSelectedNodesArray.length || 
        selectedNodesArray.some((id, i) => id !== newSelectedNodesArray[i]);
      
      if (selectedNodesChanged) {
        setSelectedNodes(newSelectedNodes);
      }
      
      // 比较关系类型顺序是否变化
      const relationshipTypeOrderChanged = 
        newRelationshipTypeOrder.length !== relationshipTypeOrder.length ||
        newRelationshipTypeOrder.some((type, i) => type !== relationshipTypeOrder[i]);
      
      if (relationshipTypeOrderChanged) {
        setRelationshipTypeOrder(newRelationshipTypeOrder);
      }
    }
  }, [initialFilterState]); // 移除 activeTabId 作为依赖项，避免循环更新

  // 添加调试日志，帮助排查问题
  useEffect(() => {
    console.log('Filter component state:', {
      activeTab,
      hasRelationships,
      relationshipCount: relationships.length,
      bufferCount: graphRelationshipsBuffer.length,
      typeCount: relationshipTypeOrder.length,
      hiddenTypesCount: Object.keys(hiddenTypes).length
    });
  }, [activeTab, hasRelationships, relationships, graphRelationshipsBuffer, relationshipTypeOrder, hiddenTypes]);

  // 添加对 activeTabId 变化的监听，强制刷新组件状态
  useEffect(() => {
    if (activeTabId) {
      // 当 Tab 切换时，强制刷新组件状态
      console.log('Tab changed, forcing refresh');
      
      // 延迟执行，确保父组件的状态已更新
      setTimeout(() => {
        // 重新计算 hasRelationships
        const visibleRelationships = relationships.length > 0;
        const bufferedRelationships = graphRelationshipsBuffer.length > 0;
        const hasRelationshipTypes = relationshipTypeOrder.length > 0;
        
        console.log('Forced refresh data:', {
          visibleRelationships,
          bufferedRelationships,
          hasRelationshipTypes,
          relationshipTypeOrder
        });
        
        // 如果有关系数据但当前不在关系标签页，切换到关系标签页
        if ((visibleRelationships || bufferedRelationships || hasRelationshipTypes) && 
            activeTab !== "relationship") {
          setActiveTab("relationship");
        }
      }, 100);
    }
  }, [activeTabId]);

  // 处理标签页切换
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  const toggleVisibilityByType = async (type) => {
    const isHidden = hiddenTypes[type];
    
    const isIsolated = (nodeId, updatedRelationships) =>
      !updatedRelationships.some(
        (relationship) =>
          relationship.startNode === nodeId || relationship.endNode === nodeId
      );

    // 使用更简单的方式处理显示和隐藏
    if (!isHidden) {
      // 隐藏指定类型的关系
      const relationshipsToToggle = groupRelationshipsByType(relationships)[type] || [];
      
      // 更新显示的关系
      const updatedRelationships = relationships.filter(rel => rel.type !== type);
      
      // 找出将变为孤立的节点
      const isolatedNodes = [];
      nodes.forEach(node => {
        if (isIsolated(node.id, updatedRelationships)) {
          isolatedNodes.push(node);
        }
      });
      
      // 更新状态
      setGraphRelationships(updatedRelationships);
      setGraphRelationshipsBuffer(prev => [...prev, ...relationshipsToToggle]);
      
      // 处理孤立节点
      const remainingNodes = nodes.filter(node => !isolatedNodes.some(n => n.id === node.id));
      setGraphNodes(remainingNodes);
      setGraphNodesBuffer(prev => [...prev, ...isolatedNodes]);
      
      // 立即通知父组件状态变化
      if (onBufferChange) {
        onBufferChange(
          remainingNodes,
          updatedRelationships,
          [...graphNodesBuffer, ...isolatedNodes],
          [...graphRelationshipsBuffer, ...relationshipsToToggle]
        );
      }
    } else {
      // 显示指定类型的关系
      const relationshipsToToggle = groupRelationshipsByType(graphRelationshipsBuffer)[type] || [];
      
      // 找出需要恢复的节点 ID
      const nodeIdsToRestore = new Set();
      relationshipsToToggle.forEach(rel => {
        nodeIdsToRestore.add(rel.startNode);
        nodeIdsToRestore.add(rel.endNode);
      });
      
      // 找出需要从缓冲区恢复的节点
      const nodesToRestore = graphNodesBuffer.filter(
        node => nodeIdsToRestore.has(node.id)
      );
      
      // 更新状态
      setGraphRelationships(prev => [...prev, ...relationshipsToToggle]);
      setGraphRelationshipsBuffer(prev => 
        prev.filter(rel => !relationshipsToToggle.some(r => 
          r.startNode === rel.startNode && 
          r.endNode === rel.endNode && 
          r.type === rel.type
        ))
      );
      
      setGraphNodes(prev => [...prev, ...nodesToRestore]);
      setGraphNodesBuffer(prev => 
        prev.filter(node => !nodesToRestore.some(n => n.id === node.id))
      );
      
      // 立即通知父组件状态变化
      if (onBufferChange) {
        const updatedNodes = [...nodes, ...nodesToRestore];
        const updatedRelationships = [...relationships, ...relationshipsToToggle];
        const updatedNodesBuffer = graphNodesBuffer.filter(
          node => !nodesToRestore.some(n => n.id === node.id)
        );
        const updatedRelationshipsBuffer = graphRelationshipsBuffer.filter(
          rel => !relationshipsToToggle.some(r => 
            r.startNode === rel.startNode && 
            r.endNode === rel.endNode && 
            r.type === rel.type
          )
        );
        
        onBufferChange(
          updatedNodes,
          updatedRelationships,
          updatedNodesBuffer,
          updatedRelationshipsBuffer
        );
      }
    }
    
    // 切换类型的隐藏状态并立即通知父组件
    const newHiddenTypes = {
      ...hiddenTypes,
      [type]: !isHidden
    };
    
    setHiddenTypes(newHiddenTypes);
    
    // 立即通知父组件hiddenTypes状态变化
    if (onFilterStateChange) {
      onFilterStateChange({
        activeFilterTab: activeTab,
        hiddenTypes: newHiddenTypes,
        selectedNodes: [...selectedNodes],
        relationshipTypeOrder,
      });
    }
  };

  // 处理节点选中
  const handleNodeSelect = async (nodeId) => {
    const newSelectedNodes = new Set(selectedNodes);
    
    if (selectedNodes.has(nodeId)) {
      // 如果节点已经被选中，则取消选中
      newSelectedNodes.delete(nodeId);
      
      if (newSelectedNodes.size === 0) {
        // 如果没有选中的节点了，恢复所有节点和关系
        await setGraphNodes(prev => [...prev, ...graphNodesBuffer]);
        await setGraphNodesBuffer([]);
        
        await setGraphRelationships(prev => [...prev, ...graphRelationshipsBuffer]);
        await setGraphRelationshipsBuffer([]);
      } else {
        // 否则，重新计算要显示的节点和关系
        updateVisibleNodesAndRelationships(newSelectedNodes);
      }
    } else {
      // 选中新节点
      newSelectedNodes.add(nodeId);
      updateVisibleNodesAndRelationships(newSelectedNodes);
    }
    
    setSelectedNodes(newSelectedNodes);
  };

  // 新增辅助函数来更新可见的节点和关系
  const updateVisibleNodesAndRelationships = async (selectedNodeIds) => {
    // 找出所有与选中节点相关的关系
    const relatedRelationships = relationships.concat(graphRelationshipsBuffer).filter(
      rel => selectedNodeIds.has(rel.startNode) || selectedNodeIds.has(rel.endNode)
    );
    
    // 找出所有相关节点的ID
    const relatedNodeIds = new Set([
      ...selectedNodeIds,
      ...relatedRelationships.map(rel => rel.startNode),
      ...relatedRelationships.map(rel => rel.endNode)
    ]);
    
    // 将所有节点分为要显示的和要缓存的
    const allNodes = nodes.concat(graphNodesBuffer);
    const [nodesToShow, nodesToBuffer] = allNodes.reduce(
      ([show, buffer], node) => {
        if (relatedNodeIds.has(node.id)) {
          show.push(node);
        } else {
          buffer.push(node);
        }
        return [show, buffer];
      },
      [[], []]
    );
    
    // 将所有关系分为要显示的和要缓存的
    const allRelationships = relationships.concat(graphRelationshipsBuffer);
    const [relsToShow, relsToBuffer] = allRelationships.reduce(
      ([show, buffer], rel) => {
        if (relatedNodeIds.has(rel.startNode) && relatedNodeIds.has(rel.endNode)) {
          show.push(rel);
        } else {
          buffer.push(rel);
        }
        return [show, buffer];
      },
      [[], []]
    );

    // 更新显示和缓冲区
    await setGraphNodes(nodesToShow);
    await setGraphNodesBuffer(nodesToBuffer);
    await setGraphRelationships(relsToShow);
    await setGraphRelationshipsBuffer(relsToBuffer);

    // 调用 onBufferChange
    if (onBufferChange) {
      onBufferChange(
        nodesToShow, 
        relsToShow, 
        nodesToBuffer, 
        relsToBuffer
      );
    }
  };

  return (
    <div className={styles.filterContainer}>
      <button className={styles.filterButton} onClick={() => setIsExpanded(!isExpanded)}>
        <TbFilter size={24} color="rgb(245, 244, 244)" />
      </button>

      {isExpanded && (
        <div className={styles.filterWindow}>
          {/* Header */}
          {hasData && (
            <div className={styles.filterHeader}>
              {activeTab === "relationship" && hasRelationships ? "Relationship Types" : 
               nodeLabels.includes(activeTab) ? `${activeTab} Properties` : null}
            </div>
          )}

          {/* Tabs */}
          {hasData && (
            <div className={styles.tabs}>
              {/* 始终显示 Relationship 标签，除非确定没有任何关系数据 */}
              <button
                className={`${styles.tab} ${activeTab === "relationship" ? styles.activeTab : ""}`}
                onClick={() => handleTabChange("relationship")}
              >
                Relationship
              </button>
              {nodeLabels.map((label) => (
                <button
                  key={label}
                  className={`${styles.tab} ${activeTab === label ? styles.activeTab : ""}`}
                  onClick={() => handleTabChange(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {!hasData ? (
              <div className={styles.noDataMessage}>
                No entities in the graph
              </div>
            ) : (
              <>
                {activeTab === "relationship" && hasRelationships && (
                  <div className={styles.relationshipContent}>
                    {relationshipTypeOrder.map((type) => {
                      const relationships = groupedRelationships[type] || [];
                      return (
                        <div key={type} className={styles.relationshipRow}>
                          <span className={styles.relationshipType}>{type}</span>
                          <span className={styles.relationshipCount}>
                            ({relationships.length})
                          </span>
                          <button
                            className={styles.toggleVisibilityButton}
                            onClick={() => toggleVisibilityByType(type)}
                            title={hiddenTypes[type] ? "Show relationships" : "Hide relationships"}
                          >
                            {hiddenTypes[type] ? <TbEyeOff /> : <TbEye />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {nodeLabels.includes(activeTab) && (
                  <div className={styles.nodeContent}>
                    {nodes
                      .filter((node) => node.nodeLabel === activeTab)
                      .map((node, index) => (
                        <div 
                          key={index} 
                          className={`${styles.nodeRow} ${selectedNodes.has(node.id) ? styles.selectedNode : ''}`}
                          onClick={() => handleNodeSelect(node.id)}
                        >
                          <div className={styles.nodeProperty}>
                            <strong>ID:</strong> {node.id}
                          </div>
                          {Object.entries(node.properties).map(([key, value]) => (
                            <div key={key} className={styles.nodeProperty}>
                              <strong>{key}:</strong> {value}
                            </div>
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Utility function to group relationships by type
const groupRelationshipsByType = (relationships) => {
  return relationships.reduce((acc, rel) => {
    if (!acc[rel.type]) {
      acc[rel.type] = [];
    }
    acc[rel.type].push(rel);
    return acc;
  }, {});
};

export default Filter;
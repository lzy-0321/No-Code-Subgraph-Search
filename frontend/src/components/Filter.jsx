import React, { useState, useRef, useEffect } from "react";
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
  initialFilterState
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(initialFilterState?.activeFilterTab || "relationship");
  const [hiddenTypes, setHiddenTypes] = useState(initialFilterState?.hiddenTypes || {});
  const [selectedNodes, setSelectedNodes] = useState(new Set(initialFilterState?.selectedNodes || []));
  const [relationshipTypeOrder, setRelationshipTypeOrder] = useState(initialFilterState?.relationshipTypeOrder || []);
  
  // 保存所有见过的关系类型，确保不会因为隐藏而丢失
  const [allSeenTypes, setAllSeenTypes] = useState(new Set(initialFilterState?.relationshipTypeOrder || []));

  // 使用ref跟踪之前的数据状态，用于检测清除操作
  const prevDataState = useRef({
    nodesLength: nodes.length,
    relationshipsLength: relationships.length,
    bufferNodesLength: graphNodesBuffer.length,
    bufferRelationshipsLength: graphRelationshipsBuffer.length
  });

  // Group nodes by their labels
  const nodeLabels = [...new Set(nodes.map((node) => node.nodeLabel))];
  
  // Group relationships by type - 同时包含显示的和缓冲区中的关系
  const allRelationships = relationships.concat(graphRelationshipsBuffer);
  const groupedRelationships = groupRelationshipsByType(allRelationships);

  // 检查是否有数据
  const hasData = nodes.length > 0 || relationships.length > 0 || graphNodesBuffer.length > 0 || graphRelationshipsBuffer.length > 0;
  
  // 检查是否有关系数据 - 修改为检查所有关系（包括缓冲区）以及历史类型
  const hasRelationships = allRelationships.length > 0 || allSeenTypes.size > 0;

  // 检查是否有节点数据
  const hasNodes = nodes.length > 0 || graphNodesBuffer.length > 0;

  // 重置过滤器状态 - 当图表被清除时调用
  const resetFilterState = () => {
    // 重置状态变量
    setHiddenTypes({});
    setSelectedNodes(new Set());
    setAllSeenTypes(new Set());
    setRelationshipTypeOrder([]);
    
    // 重要：同时清空缓冲区
    setGraphNodesBuffer([]);
    setGraphRelationshipsBuffer([]);
    
    // 通知父组件过滤器状态已重置
    if (onFilterStateChange) {
      onFilterStateChange({
        activeFilterTab: "relationship",
        hiddenTypes: {},
        selectedNodes: [],
        relationshipTypeOrder: []
      });
    }
    
    console.log("过滤器状态和缓冲区已完全重置");
  };

  // 使用更可靠的方法检测清除操作 - 比较前后数据状态变化
  useEffect(() => {
    const currentState = {
      nodesLength: nodes.length,
      relationshipsLength: relationships.length,
      bufferNodesLength: graphNodesBuffer.length,
      bufferRelationshipsLength: graphRelationshipsBuffer.length
    };
    
    // 检查是否从有数据变为无数据 - 这表示发生了清除操作
    const hadData = prevDataState.current.nodesLength > 0 || 
                    prevDataState.current.relationshipsLength > 0 ||
                    prevDataState.current.bufferNodesLength > 0 ||
                    prevDataState.current.bufferRelationshipsLength > 0;
                    
    const hasNoData = currentState.nodesLength === 0 && 
                      currentState.relationshipsLength === 0 &&
                      currentState.bufferNodesLength === 0 &&
                      currentState.bufferRelationshipsLength === 0;
    
    // 如果之前有数据，现在没有数据，则视为清除操作
    if (hadData && hasNoData) {
      console.log("图表已清除，重置过滤器状态");
      resetFilterState();
    }
    
    // 更新前一状态
    prevDataState.current = currentState;
  }, [nodes.length, relationships.length, graphNodesBuffer.length, graphRelationshipsBuffer.length]);

  // 当活动的Tab ID变化时，通知父组件保存当前过滤器状态
  useEffect(() => {
    if (onFilterStateChange && activeTabId) {
      // 将 Set 转换为数组，因为 Set 无法直接序列化
      onFilterStateChange({
        activeFilterTab: activeTab,
        hiddenTypes,
        selectedNodes: [...selectedNodes],
        relationshipTypeOrder: [...allSeenTypes], // 使用allSeenTypes确保保存所有类型
      });
    }
  }, [activeTab, hiddenTypes, selectedNodes, relationshipTypeOrder, allSeenTypes, activeTabId]);

  // 只在初始化和数据类型变化时更新激活的标签页
  useEffect(() => {
    // 修改逻辑：无论是否有显示的关系，只要总体上有关系数据就保留relationship标签
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

  // 每当发现新的关系类型，更新allSeenTypes
  useEffect(() => {
    // 获取当前所有关系类型
    const allRelationships = relationships.concat(graphRelationshipsBuffer);
    const currentTypes = Object.keys(groupRelationshipsByType(allRelationships));
    
    // 检查是否有新的关系类型
    let hasNewTypes = false;
    const updatedSeenTypes = new Set(allSeenTypes);
    
    currentTypes.forEach(type => {
      if (!updatedSeenTypes.has(type)) {
        updatedSeenTypes.add(type);
        hasNewTypes = true;
      }
    });
    
    // 如果发现新类型，更新allSeenTypes
    if (hasNewTypes) {
      setAllSeenTypes(updatedSeenTypes);
    }
    
    // 更新关系类型顺序，确保包含所有类型（无论是否当前显示）
    const updatedOrder = [...relationshipTypeOrder];
    let orderChanged = false;
    
    // 添加新类型到末尾
    updatedSeenTypes.forEach(type => {
      if (!updatedOrder.includes(type)) {
        updatedOrder.push(type);
        orderChanged = true;
      }
    });
    
    if (orderChanged) {
      setRelationshipTypeOrder(updatedOrder);
    }
  }, [relationships, graphRelationshipsBuffer]);

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

    if (!isHidden) {
      // 隐藏关系和管理节点
      const relationshipsToToggle = groupRelationshipsByType(relationships)[type];
      if (!relationshipsToToggle || relationshipsToToggle.length === 0) {
        // 没有要隐藏的关系，直接返回
        return;
      }
      
      const updatedRelationships = relationships.filter(
        (rel) => rel.type !== type
      );
      await setGraphRelationships(updatedRelationships);

      await setGraphRelationshipsBuffer((prev) => [
        ...prev,
        ...relationshipsToToggle,
      ]);

      // 检查并移动孤立节点到缓冲区
      relationshipsToToggle.forEach(async (rel) => {
        const startNode = nodes.find((node) => node.id === rel.startNode);
        const endNode = nodes.find((node) => node.id === rel.endNode);

        if (startNode && isIsolated(rel.startNode, updatedRelationships)) {
          await setGraphNodesBuffer((prev) => [...prev, startNode]);
          await setGraphNodes((prev) =>
            prev.filter((node) => node.id !== rel.startNode)
          );
        }

        if (endNode && isIsolated(rel.endNode, updatedRelationships)) {
          await setGraphNodesBuffer((prev) => [...prev, endNode]);
          await setGraphNodes((prev) =>
            prev.filter((node) => node.id !== rel.endNode)
          );
        }
      });
    } else {
      // 显示关系和相关节点
      const relationshipsToToggle = groupRelationshipsByType(graphRelationshipsBuffer)[type];
      if (!relationshipsToToggle || relationshipsToToggle.length === 0) {
        // 没有要显示的关系，直接返回
        return;
      }
      
      await setGraphRelationships((prev) => [...prev, ...relationshipsToToggle]);

      await setGraphRelationshipsBuffer((prev) =>
        prev.filter((rel) => !relationshipsToToggle.includes(rel))
      );

      relationshipsToToggle.forEach(async (rel) => {
        const startNode = graphNodesBuffer.find((node) => node.id === rel.startNode);
        const endNode = graphNodesBuffer.find((node) => node.id === rel.endNode);

        if (startNode) {
          await setGraphNodes((prev) => [...prev, startNode]);
          await setGraphNodesBuffer((prev) =>
            prev.filter((node) => node.id !== rel.startNode)
          );
        }

        if (endNode) {
          await setGraphNodes((prev) => [...prev, endNode]);
          await setGraphNodesBuffer((prev) =>
            prev.filter((node) => node.id !== rel.endNode)
          );
        }
      });
    }
    
    // 切换类型的隐藏状态
    setHiddenTypes((prev) => ({
      ...prev,
      [type]: !isHidden,
    }));
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
              {hasRelationships && (
                <button
                  className={`${styles.tab} ${activeTab === "relationship" ? styles.activeTab : ""}`}
                  onClick={() => handleTabChange("relationship")}
                >
                  Relationship
                </button>
              )}
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
                    {[...allSeenTypes].map((type) => {
                      // 获取显示的和隐藏的所有关系
                      const typeRelationships = allRelationships.filter(rel => rel.type === type);
                      const isTypeHidden = hiddenTypes[type];
                      
                      return (
                        <div key={type} className={styles.relationshipRow}>
                          <span className={styles.relationshipType}>{type}</span>
                          <span className={styles.relationshipCount}>
                            ({typeRelationships.length})
                          </span>
                          <button
                            className={styles.toggleVisibilityButton}
                            onClick={() => toggleVisibilityByType(type)}
                          >
                            {isTypeHidden ? <TbEyeOff /> : <TbEye />}
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
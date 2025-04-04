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

  // Group nodes by their labels
  const nodeLabels = [...new Set(nodes.map((node) => node.nodeLabel))];
  
  // Group relationships by type
  const groupedRelationships = groupRelationshipsByType(relationships.concat(graphRelationshipsBuffer));

  // 检查是否有数据
  const hasData = nodes.length > 0 || relationships.length > 0 || graphNodesBuffer.length > 0 || graphRelationshipsBuffer.length > 0;
  
  // 检查是否有关系数据
  const hasRelationships = relationships.length > 0 || graphRelationshipsBuffer.length > 0;

  // 检查是否有节点数据
  const hasNodes = nodes.length > 0 || graphNodesBuffer.length > 0;

  // 当活动的Tab ID变化时，通知父组件保存当前过滤器状态
  useEffect(() => {
    if (onFilterStateChange && activeTabId) {
      // 将 Set 转换为数组，因为 Set 无法直接序列化
      onFilterStateChange({
        activeFilterTab: activeTab,
        hiddenTypes,
        selectedNodes: [...selectedNodes],
        relationshipTypeOrder,
      });
    }
  }, [activeTab, hiddenTypes, selectedNodes, relationshipTypeOrder, activeTabId]);

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

        if (isIsolated(rel.startNode, updatedRelationships)) {
          await setGraphNodesBuffer((prev) => [...prev, startNode]);
          await setGraphNodes((prev) =>
            prev.filter((node) => node.id !== rel.startNode)
          );
        }

        if (isIsolated(rel.endNode, updatedRelationships)) {
          await setGraphNodesBuffer((prev) => [...prev, endNode]);
          await setGraphNodes((prev) =>
            prev.filter((node) => node.id !== rel.endNode)
          );
        }
      });
    } else {
      // 显示关系和相关节点
      const relationshipsToToggle = groupRelationshipsByType(graphRelationshipsBuffer)[type];
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
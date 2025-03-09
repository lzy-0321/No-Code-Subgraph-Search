import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import styles from "../styles/Filter.module.css";
import { TbFilter, TbEye, TbEyeOff } from "react-icons/tb";
import NumberTicker from "../components/ui/number-ticker";

const Filter = ({ graphNodes: nodes, graphRelationships: relationships, setGraphNodes, setGraphRelationships, graphNodesBuffer, graphRelationshipsBuffer, setGraphNodesBuffer, setGraphRelationshipsBuffer }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("relationship");
  const [hiddenTypes, setHiddenTypes] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);

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
    if (selectedNode === nodeId) {
      // 取消选中 - 恢复所有节点和关系
      setSelectedNode(null);
      
      // 恢复缓冲区中的节点
      await setGraphNodes(prev => [...prev, ...graphNodesBuffer]);
      await setGraphNodesBuffer([]);
      
      // 恢复缓冲区中的关系
      await setGraphRelationships(prev => [...prev, ...graphRelationshipsBuffer]);
      await setGraphRelationshipsBuffer([]);
    } else {
      // 选中新节点
      setSelectedNode(nodeId);
      
      // 找出与选中节点相关的关系
      const relatedRelationships = relationships.filter(
        rel => rel.startNode === nodeId || rel.endNode === nodeId
      );
      
      // 找出与这些关系相关的节点ID
      const relatedNodeIds = new Set([
        nodeId,
        ...relatedRelationships.map(rel => rel.startNode),
        ...relatedRelationships.map(rel => rel.endNode)
      ]);
      
      // 将不相关的节点移到缓冲区
      const [nodesToKeep, nodesToBuffer] = nodes.reduce(
        ([keep, buffer], node) => {
          if (relatedNodeIds.has(node.id)) {
            keep.push(node);
          } else {
            buffer.push(node);
          }
          return [keep, buffer];
        },
        [[], []]
      );
      
      // 将不相关的关系移到缓冲区
      const [relsToKeep, relsToBuffer] = relationships.reduce(
        ([keep, buffer], rel) => {
          if (relatedNodeIds.has(rel.startNode) && relatedNodeIds.has(rel.endNode)) {
            keep.push(rel);
          } else {
            buffer.push(rel);
          }
          return [keep, buffer];
        },
        [[], []]
      );

      // 更新显示和缓冲区
      await setGraphNodes(nodesToKeep);
      await setGraphNodesBuffer(prev => [...prev, ...nodesToBuffer]);
      await setGraphRelationships(relsToKeep);
      await setGraphRelationshipsBuffer(prev => [...prev, ...relsToBuffer]);
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
                    {Object.entries(groupedRelationships)
                    .map(([type, relationships]) => {
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
                          className={`${styles.nodeRow} ${selectedNode === node.id ? styles.selectedNode : ''}`}
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
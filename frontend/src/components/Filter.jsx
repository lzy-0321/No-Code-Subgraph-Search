import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import styles from "../styles/Filter.module.css";
import { TbFilter, TbEye, TbEyeOff } from "react-icons/tb";
import NumberTicker from "../components/ui/number-ticker";

const Filter = ({ graphNodes: nodes, graphRelationships: relationships, setGraphNodes, setGraphRelationships, graphNodesBuffer, graphRelationshipsBuffer, setGraphNodesBuffer, setGraphRelationshipsBuffer }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("relationship");
  const [hiddenTypes, setHiddenTypes] = useState({});

  // Group nodes by their labels
  const nodeLabels = [...new Set(nodes.map((node) => node.nodeLabel))];
  
  // Group relationships by type
  const groupedRelationships = groupRelationshipsByType(relationships.concat(graphRelationshipsBuffer));

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

  return (
    <div className={styles.filterContainer}>
      <button className={styles.filterButton} onClick={() => setIsExpanded(!isExpanded)}>
        <TbFilter size={24} color="rgb(245, 244, 244)" />
      </button>

      {isExpanded && (
        <div className={styles.filterWindow}>
          {/* Header */}
          <div className={styles.filterHeader}>
            {activeTab === "relationship" ? "Relationship Types" : `${activeTab} Properties`}
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "relationship" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("relationship")}
            >
              Relationship
            </button>
            {nodeLabels.map((label) => (
              <button
                key={label}
                className={`${styles.tab} ${activeTab === label ? styles.activeTab : ""}`}
                onClick={() => setActiveTab(label)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === "relationship" && (
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
                    <div key={index} className={styles.nodeRow}>
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
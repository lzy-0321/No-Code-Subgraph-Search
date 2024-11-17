import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import styles from "../styles/Filter.module.css";
import { TbFilter } from "react-icons/tb";
import NumberTicker from "../components/ui/number-ticker"
import { searchData } from '../utils/searchUtils';

const Filter = ({ graphNodes: nodes, graphRelationships: relationships, setGraphNodes, setGraphRelationships, graphNodesBuffer, graphRelationshipsBuffer, setGraphNodesBuffer, setGraphRelationshipsBuffer, tabContentBounds }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("relationship");

  // Group nodes by their labels
  const nodeLabels = [...new Set(nodes.map((node) => node.nodeLabel))];

  // Group relationships by type and get only the first relationship of each type
  const groupedRelationships = groupRelationshipsByType(relationships);

  const [position, setPosition] = useState({ x: (tabContentBounds.width / 2) - 10 - 50, y: (-tabContentBounds.height / 2) + 20 + 50 });
  const [menuDirection, setMenuDirection] = useState('downleft');

  useEffect(() => {
    if (tabContentBounds || position) {

      const isCloseToTop = position.y < 0;
      const isCloseToBottom = position.y > 0;
      const isCloseToLeft = position.x < 0;
      const isCloseToRight = position.x > 0;
      const isCloseToTopRight = isCloseToTop && isCloseToRight;
      const isCloseToTopLeft = isCloseToTop && isCloseToLeft;
      const isCloseToBottomRight = isCloseToBottom && isCloseToRight;
      const isCloseToBottomLeft = isCloseToBottom && isCloseToLeft;

      // console.log(tabContentBounds, position, isCloseToTopRight, isCloseToTopLeft, isCloseToBottomRight, isCloseToBottomLeft);

      if (isCloseToTopRight) {
        setMenuDirection('downleft');
      } else if (isCloseToTopLeft) {
        setMenuDirection('downright');
      } else if (isCloseToBottomRight) {
        setMenuDirection('upleft');
      } else if (isCloseToBottomLeft) {
        setMenuDirection('upright');
      }
    }
  }, [position, tabContentBounds]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleSettingsMenu = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  const [maxWidth, setMaxWidth] = useState(0); // 存储最长 propertyName 的宽度

  // 动态计算最长的 propertyName 宽度
  useEffect(() => {
    if (nodes.length > 0) {
      // 获取最长的 propertyName
      // 检查所有节点的 properties，找到最长的 propertyName
      const maxProperty = nodes.reduce((acc, node) => {
        const properties = Object.keys(node.properties);
        const longestProperty = properties.reduce((longest, property) => {
          return property.length > longest.length ? property : longest;
        }, "");
        return longestProperty.length > acc.length ? longestProperty : acc;
      }, "");

      // 计算最长 propertyName 的宽度
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = "18px Arial";
      const textWidth = context.measureText(maxProperty).width;
      setMaxWidth(textWidth + 15); // 加上一些额外的空间
    }
  }, [nodes]);

  const [value, setValue] = useState(25);
  const [intervalId, setIntervalId] = useState(null); // 保存定时器 ID

  // 按下按钮时启动定时器
  const handleMouseDown = (adjustment) => {
    const id = setInterval(() => {
      setValue((prev) => Math.max(0, prev + adjustment));
    }, 100); // 每 100ms 调整一次
    setIntervalId(id);
  };

  // 松开按钮时清除定时器
  const handleMouseUp = () => {
    clearInterval(intervalId);
    setIntervalId(null);
  };

  // searchQuery 状态
  const [filters, setFilters] = useState({});
  const [suggestions, setSuggestions] = useState({}); // Tracks suggestions for each property

  const handleSearch = (property, query) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [property]: query,
    }));

    if (!query.trim()) {
      // If the input is cleared, restore all nodes and relationships from the buffer
      setGraphNodes((prevNodes) => [...prevNodes, ...graphNodesBuffer]); // Restore nodes
      setGraphRelationships((prevRelationships) => [...prevRelationships, ...graphRelationshipsBuffer]); // Restore relationships
      setGraphNodesBuffer([]); // Clear buffer
      setGraphRelationshipsBuffer([]); // Clear buffer
      return;
    }

    // Filter nodes based on the query
    const filteredSuggestions = searchData(
      nodes,
      query,
      (node) => node.properties[property], // Accessor for the property
      (node) => node.id // Accessor for node ID
    );

    setSuggestions((prevSuggestions) => ({
      ...prevSuggestions,
      [property]: filteredSuggestions, // Save the filtered suggestions
    }));
  };

  const handleSuggestionClick = (property, suggestion) => {
    const nodeId = suggestion.id; // Ensure the ID is consistent

    // Update the searchbox value
    setFilters((prevFilters) => ({
      ...prevFilters,
      [property]: suggestion.value,
    }));

    // Clear suggestions (closes the dropdown)
    setSuggestions((prevSuggestions) => ({
      ...prevSuggestions,
      [property]: [],
    }));

    // Debugging: Log the clicked suggestion
    console.log("Suggestion clicked:", suggestion);

    // Find the selected node
    const selectedNode = nodes.find((node) => node.id === nodeId);

    if (!selectedNode) {
      console.error(`Node not found: ${nodeId}`);
      return;
    }

    // Filter relationships to include only those connected to the selected node
    const relatedRelationships = relationships.filter(
      (rel) => rel.startNode === nodeId || rel.endNode === nodeId
    );

    // Find nodes connected by the filtered relationships
    const relatedNodeIds = new Set(
      relatedRelationships.flatMap((rel) => [rel.startNode, rel.endNode])
    );

    // Filter nodes to include only the selected node and connected nodes
    const filteredNodes = nodes.filter((node) => relatedNodeIds.has(node.id));

    // Move other nodes and relationships to the buffer
    // graphNodesBuffer 和 graphRelationshipsBuffer 是用来保存其他节点和关系的
    // bufferNodes = graphNodes - filteredNodes
    // bufferRelationships = graphRelationships - relatedRelationships
    const bufferNodes = nodes.filter(
      (node) => !filteredNodes.some((filteredNode) => filteredNode.id === node.id)
    );
    const bufferRelationships = relationships.filter(
      (rel) =>
        !relatedRelationships.some(
          (relatedRel) =>
            relatedRel.startNode === rel.startNode &&
            relatedRel.endNode === rel.endNode &&
            relatedRel.type === rel.type // Ensure match on type, if applicable
        )
    );

    // Update states
    setGraphNodes(filteredNodes); // Keep only the selected node and connected nodes
    setGraphRelationships(relatedRelationships); // Keep only related relationships
    setGraphNodesBuffer(bufferNodes); // Move other nodes to the buffer
    setGraphRelationshipsBuffer(bufferRelationships); // Move other relationships to the buffer

    // Debugging: Log the updated graph state
    console.log("Filtered Nodes:", filteredNodes);
    console.log("Filtered Relationships:", relatedRelationships);
    console.log("Buffered Nodes:", bufferNodes);
    console.log("Buffered Relationships:", bufferRelationships);
  };

  const handleClearSelection = () => {
    setGraphNodes((prevNodes) => [...prevNodes, ...graphNodesBuffer]); // Restore nodes
    setGraphRelationships((prevRelationships) => [...prevRelationships, ...graphRelationshipsBuffer]); // Restore relationships
    setGraphNodesBuffer([]); // Clear buffer
    setGraphRelationshipsBuffer([]); // Clear buffer
    return;
  };

  const handleTagSelect = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prevTags) => [...prevTags, tag]);
    }
  };

  const handleTagRemove = (tag) => {
    setSelectedTags((prevTags) => prevTags.filter((t) => t !== tag));
  };

  return (
    <Draggable
      position={position} // 绑定位置到状态
      onStop={(e, data) => {
        // 拖动结束时确保位置被更新
        setPosition({ x: data.x, y: data.y });
      }}
      bounds={{
        top: -tabContentBounds.height / 2,
        left: -tabContentBounds.width / 2,
        right: tabContentBounds.width / 2,
        bottom: tabContentBounds.height /2,
      }}
      handle={`.${styles.filterButton}`} // 拖动按钮
    >
      <div className={styles.filterContainer}>
        {/* Draggable Button */}
        <button className={styles.filterButton} onClick={() => setIsExpanded(!isExpanded)}>
          <TbFilter size={24} color="white" /> {/* Replace with TbFilter icon */}
          </button>

        {/* Expandable Window */}
        {isExpanded && (
          <div className={`${styles.filterWindow} ${styles[menuDirection]}`}>
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
                  {Object.entries(groupedRelationships).map(([type, relationships]) => {
                    const rel = relationships[0]; // Use the first relationship of the type
                    const startNode = nodes.find((node) => node.id === rel.startNode);
                    const endNode = nodes.find((node) => node.id === rel.endNode);

                    return (
                      <div key={type} className={styles.relationshipRow}>
                        <span className={styles.relationshipNode}>
                          {startNode ? startNode.nodeLabel : `Node ${rel.startNode}`}
                        </span>
                        <span className={styles.relationshipArrow}>→</span>
                        <span className={styles.relationshipNode}>
                          {endNode ? endNode.nodeLabel : `Node ${rel.endNode}`}
                        </span>
                        <span className={styles.relationshipType}>{type}</span>
                        <button className={styles.settingsButton}>⚙️</button>
                        <button className={styles.deleteButton}>✖</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {nodeLabels.includes(activeTab) && (
                <div className={styles.nodeContent}>
                  <div className= {styles.settingsRow}>
                    <span className={styles.settingLabel}>Settings</span>
                    <button
                      className={styles.settingsButton1}
                      onClick={toggleSettingsMenu}
                    >
                      Configure
                    </button>
                  </div>

                  {/* Settings Menu */}
                  {isSettingsOpen && (
                    <div className={styles.settingsMenu}>
                      {nodes.length > 0 && (
                        <div className={styles.nodeGroup}>
                          {Object.keys(nodes.filter((node) => node.nodeLabel === activeTab)[0].properties).map((property, index) => (
                            <div key={index} className={styles.propertyRow}>
                              <span
                                className={styles.propertyName}
                                style={{ width: maxWidth }}
                              >
                                {property}
                              </span>
                              <div className={styles.dragIcon}>=</div>
                              <div className={styles.propertyControl}>
                                  <input
                                    className={styles.propertyInput}
                                    type="text"
                                    value={filters[property] || ""} // Controlled input value
                                    onChange={(e) => {
                                      const query = e.target.value;
                                      handleSearch(property, query); // Trigger filtering logic
                                    }}
                                    placeholder={`Search ${property}`} // Dynamic placeholder
                                  />
                                {/* Render suggestions dynamically */}
                                {suggestions[property]?.length > 0 && (
                                  <ul className={styles.suggestionsList}>
                                    {suggestions[property].map((suggestion, idx) => (
                                      <li
                                        key={suggestion.id || idx}
                                        className={styles.suggestionItem}
                                        onClick={() => {
                                          // Set the clicked suggestion as the selected tag
                                          setFilters((prevFilters) => ({
                                            ...prevFilters,
                                            [property]: suggestion.value || suggestion, // Update filters with the clicked suggestion
                                          }));
                                          handleSuggestionClick(property, suggestion); // Handle additional logic for the suggestion
                                        }}
                                      >
                                        {suggestion.value || suggestion} {/* Render the suggestion value */}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                            </div>
                          ))}
                          <div className={styles.propertyRow}>
                            <span
                              className={styles.propertyName}
                              style={{ width: maxWidth }}
                            >
                              Number
                            </span>
                            <div className={styles.dragIcon}>=</div>
                            <div className={styles.numberControl}>
                            <button
                                className={styles.arrowButton}
                                onMouseDown={() => handleMouseDown(-1)} // 减少数字
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                              >
                                ‹
                              </button>
                              <NumberTicker value={value} decimalPlaces={0}/>
                              <button
                                className={styles.arrowButton}
                                onMouseDown={() => handleMouseDown(1)} // 增加数字
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                              >
                                ›
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {!isSettingsOpen &&nodes
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
                        <button className={styles.deleteButton}>✖</button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
};

// Utility to group relationships by type
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
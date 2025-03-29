import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/AddQuery.module.css"; // Update with your actual styles path
import { TbCrosshair } from "react-icons/tb";
import { QueryManager } from '../utils/queryGenerator';

const ChainQueryDisplay = ({ queries, getNodeLetter }) => {
  return (
    <div className={styles.chainQueryDisplay}>
      <h4>Current Query:</h4>
      <div className={styles.queryList}>
        {queries.map((query, index) => (
          <div key={index} className={styles.queryItem}>
            <div className={styles.queryStep}>{index + 1}:</div>
            <div className={styles.queryDetails}>
              {/* 显示起始节点 */}
              <span className={styles.nodeLabel}>
                ({query.startNodeRef || 
                  (query.startNodeLabel ? 
                    `${getNodeLetter(index, 'start')}: ${query.startNodeLabel}` : 
                    getNodeLetter(index, 'start'))})
              </span>
              {/* 显示关系 */}
              <span className={styles.relationshipType}>
                -[:{query.relationType}]-{'>'}
              </span>
              {/* 显示终止节点 */}
              <span className={styles.nodeLabel}>
                ({query.endNodeRef || 
                  (query.endNodeLabel ? 
                    `${getNodeLetter(index, 'end')}: ${query.endNodeLabel}` : 
                    getNodeLetter(index, 'end'))})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // 3秒后自动关闭
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={styles.toast}>
      {message}
    </div>
  );
};

const WarningBox = ({ message }) => {
  return (
    <div className={styles.warningBox}>
      <div className={styles.warningIcon}>⚠️</div>
      <div className={styles.warningMessage}>{message}</div>
    </div>
  );
};

const WarningMessage = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className={styles.warningMessage}>
      <div className={styles.warningIcon}>⚠️</div>
      <div className={styles.warningText}>{message}</div>
    </div>
  );
};

const AddQuery = ({ 
  AddTabNodeEntities: nodeEntities, 
  AddTabRelationshipEntities: relationshipEntities,
  onQueryGenerated  // 新增的回调属性
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activeAddTab, setActiveAddTab] = useState("addNode");
  const [step, setStep] = useState(1); // Current step
  const [selectedLabel, setSelectedLabel] = useState("");
  const [selectedStartLabel, setSelectedStartLabel] = useState("");
  const [selectedEndLabel, setSelectedEndLabel] = useState("");
  const [pathProperties, setPathProperties] = useState({
    startNode: {},
    endNode: {},
    relationship: {}
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [relationshipProperties, setRelationshipProperties] = useState({
    startNode: {},
    endNode: {},
    relationship: {}
  });
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState([]);
  const popupRef = useRef(null);
  const queryManager = new QueryManager();
  const [nodeProperties, setNodeProperties] = useState({});
  const [limit, setLimit] = useState("");
  const [relationshipStep, setRelationshipStep] = useState(1); // 专门用于relationship的步骤控制
  const [chainQueries, setChainQueries] = useState([]);
  const [isChainMode, setIsChainMode] = useState(false);
  const [availableNodes, setAvailableNodes] = useState(new Map());
  const [toastMessage, setToastMessage] = useState(null);
  const [nodePropertyOperators, setNodePropertyOperators] = useState({});
  const [relationshipPropertyOperators, setRelationshipPropertyOperators] = useState({});
  const [startNodePropertyOperators, setStartNodePropertyOperators] = useState({});
  const [endNodePropertyOperators, setEndNodePropertyOperators] = useState({});
  const [pathStartNodePropertyOperators, setPathStartNodePropertyOperators] = useState({});
  const [pathEndNodePropertyOperators, setPathEndNodePropertyOperators] = useState({});

  const propertyOperators = [
    { value: "=", label: "  =  " },
    { value: "!=", label: "  !=  " },
    { value: ">", label: "  >  " },
    { value: "<", label: "  <  " },
    { value: ">=", label: "  >=  " },
    { value: "<=", label: "  <=  " },
    { value: "CONTAINS", label: "contains" },
    { value: "STARTS WITH", label: "starts with" },
    { value: "ENDS WITH", label: "ends with" }
  ];

  const handleNodePropertyChange = (property, value, operator = "=") => {
    const newProperties = { ...nodeProperties };
    
    if (operator !== "=") {
      newProperties[property] = {
        value: value,
        operator: operator
      };
    } else {
      newProperties[property] = value;
    }
    
    setNodeProperties(newProperties);
    
    setNodePropertyOperators({
      ...nodePropertyOperators,
      [property]: operator
    });
  };

  const handleRelationshipPropertyChange = (property, value, operator = "=") => {
    const newProperties = { ...relationshipProperties };
    
    if (operator !== "=") {
      newProperties.relationship = {
        ...newProperties.relationship,
        [property]: {
          value: value,
          operator: operator
        }
      };
    } else {
      newProperties.relationship = {
        ...newProperties.relationship,
        [property]: value
      };
    }
    
    setRelationshipProperties(newProperties);
    
    setRelationshipPropertyOperators({
      ...relationshipPropertyOperators,
      [property]: operator
    });
  };

  const handleStartNodePropertyChange = (property, value, operator = "=") => {
    const newProperties = { ...relationshipProperties };
    
    if (operator !== "=") {
      newProperties.startNode = {
        ...newProperties.startNode,
        [property]: {
          value: value,
          operator: operator
        }
      };
    } else {
      newProperties.startNode = {
        ...newProperties.startNode,
        [property]: value
      };
    }
    
    setRelationshipProperties(newProperties);
    
    setStartNodePropertyOperators({
      ...startNodePropertyOperators,
      [property]: operator
    });
  };

  const handleEndNodePropertyChange = (property, value, operator = "=") => {
    const newProperties = { ...relationshipProperties };
    
    if (operator !== "=") {
      newProperties.endNode = {
        ...newProperties.endNode,
        [property]: {
          value: value,
          operator: operator
        }
      };
    } else {
      newProperties.endNode = {
        ...newProperties.endNode,
        [property]: value
      };
    }
    
    setRelationshipProperties(newProperties);
    
    setEndNodePropertyOperators({
      ...endNodePropertyOperators,
      [property]: operator
    });
  };

  const handlePathStartNodePropertyChange = (property, value, operator = "=") => {
    const newProperties = { ...pathProperties };
    
    if (operator !== "=") {
      newProperties.startNode = {
        ...newProperties.startNode,
        [property]: {
          value: value,
          operator: operator
        }
      };
    } else {
      newProperties.startNode = {
        ...newProperties.startNode,
        [property]: value
      };
    }
    
    setPathProperties(newProperties);
    
    setPathStartNodePropertyOperators({
      ...pathStartNodePropertyOperators,
      [property]: operator
    });
  };

  const handlePathEndNodePropertyChange = (property, value, operator = "=") => {
    const newProperties = { ...pathProperties };
    
    if (operator !== "=") {
      newProperties.endNode = {
        ...newProperties.endNode,
        [property]: {
          value: value,
          operator: operator
        }
      };
    } else {
      newProperties.endNode = {
        ...newProperties.endNode,
        [property]: value
      };
    }
    
    setPathProperties(newProperties);
    
    setPathEndNodePropertyOperators({
      ...pathEndNodePropertyOperators,
      [property]: operator
    });
  };

  const handleOpenPopup = (e) => {
    e.stopPropagation(); // 阻止事件冒泡
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setStep(1);
    setSelectedLabel("");
    setSelectedStartLabel("");
    setSelectedEndLabel("");
    setNodeProperties({});
    setLimit("");
    setPathProperties({
      startNode: {},
      endNode: {},
      relationship: {}
    });
    setRelationshipProperties({
      startNode: {},
      endNode: {},
      relationship: {}
    });
    setShowAdvanced(false);  // 重置 advanced 设置状态
    
    // 清空链式查询相关状态
    setChainQueries([]);
    setIsChainMode(false);
    setAvailableNodes(new Map());
  };

  const handleAddTabSwitch = (tab) => {
    if (step === 1) {
      setActiveAddTab(tab);
      setSelectedLabel("");
      setSelectedStartLabel("");
      setSelectedEndLabel("");
    }
  };

  const handleAddPath = () => {
    // //console.log('Starting handleAddPath');  // 添加日志
    
    // 过滤掉空属性
    const startNodeProps = Object.fromEntries(
      Object.entries(pathProperties.startNode || {})
        .filter(([_, value]) => value !== '')
    );
    
    const endNodeProps = Object.fromEntries(
      Object.entries(pathProperties.endNode || {})
        .filter(([_, value]) => value !== '')
    );

    const queryParams = {
      type: 'path',
      params: {
        matchType: 'pathMatch',
        startNode: {
          label: selectedStartLabel,
          properties: startNodeProps  // 使用过滤后的属性
        },
        endNode: {
          label: selectedEndLabel,
          properties: endNodeProps    // 使用过滤后的属性
        },
        relationship: {
          types: Array.isArray(selectedRelationshipTypes) ? selectedRelationshipTypes : [],
          minHops: parseInt(pathProperties.relationship?.minHops) || 1,
          maxHops: pathProperties.relationship?.maxHops ? 
            parseInt(pathProperties.relationship.maxHops) : null
        }
      }
    };
    
    //console.log('Generated queryParams:', queryParams);  // 添加日志
    
    if (selectedStartLabel && selectedEndLabel) {
      onQueryGenerated(queryParams);
      handleClosePopup();  // 添加这行来关闭弹窗
    }
  };

  const handleAddNode = () => {
    // 过滤掉空属性
    const filteredProperties = Object.fromEntries(
      Object.entries(nodeProperties)
        .filter(([_, value]) => value !== '')
    );

    const queryParams = {
      type: 'node',
      params: {
        matchType: 'labelMatch',
        label: selectedLabel,
        properties: filteredProperties,
        limit: limit ? parseInt(limit) : undefined
      }
    };

    //console.log('Node query params:', queryParams); // 添加日志

    onQueryGenerated(queryParams);
    handleClosePopup();
  };

  // 修改 getNodeLetter 函数
  const getNodeLetter = (index, position) => {
    if (position === 'start') {
      // 如果是第一个查询或者复用前面的节点，使用 'a'
      return 'a';
    } else {
      // end position
      if (index === 0) return 'b';  // 第一个查询的终止节点用 'b'
      if (index === 1) return 'c';  // 第二个查询的终止节点用 'c'
      return String.fromCharCode(97 + index + 1); // 后续查询用 'd', 'e' 等
    }
  };

  // 添加一个函数来获取可用的节点选项
  const getAvailableNodeOptions = (excludeKey = null) => {
    const usedNodes = new Set();
    const options = [];
    
    // 添加之前查询中的节点
    Array.from(availableNodes.entries()).forEach(([key, node]) => {
      if (key !== excludeKey && !usedNodes.has(node.letter)) {
        options.push({
          key: key,
          value: `ref:${key}`,
          label: `Node ${node.letter} (${node.label})`
        });
        usedNodes.add(node.letter);
      }
    });
    
    // 添加新的节点标签选项
    Object.keys(nodeEntities).forEach(label => {
      options.push({
        key: label,
        value: label,
        label: label
      });
    });
    
    return options;
  };

  // 修改验证逻辑，添加一个函数来检查当前选择是否有效
  const isValidCombination = () => {
    if (!selectedLabel || !selectedStartLabel || !selectedEndLabel) return true;
    
    return !chainQueries.some(query => {
      // 修复节点引用解析逻辑
      let existingStartLabel;
      let existingEndLabel;
      
      // 安全解析开始节点引用
      if (query.startNodeRef) {
        if (query.startNodeRef.length === 1) {
          existingStartLabel = query.startNodeLabel;
        } else {
          try {
            const refIndex = parseInt(query.startNodeRef.split('.')[0]);
            existingStartLabel = chainQueries[refIndex] ? chainQueries[refIndex].startNodeLabel : query.startNodeLabel;
          } catch (e) {
            existingStartLabel = query.startNodeLabel;
          }
        }
      } else {
        existingStartLabel = query.startNodeLabel;
      }
      
      // 安全解析结束节点引用
      if (query.endNodeRef) {
        if (query.endNodeRef.length === 1) {
          existingEndLabel = query.endNodeLabel;
        } else {
          try {
            const refIndex = parseInt(query.endNodeRef.split('.')[0]);
            existingEndLabel = chainQueries[refIndex] ? chainQueries[refIndex].endNodeLabel : query.endNodeLabel;
          } catch (e) {
            existingEndLabel = query.endNodeLabel;
          }
        }
      } else {
        existingEndLabel = query.endNodeLabel;
      }
      
      // 获取当前选择的开始节点的实际标签
      let newStartLabel;
      if (selectedStartLabel.startsWith('ref:')) {
        try {
          const refKey = selectedStartLabel.substring(4);
          if (refKey.includes('.')) {
            const refIndex = parseInt(refKey.split('.')[0]);
            newStartLabel = chainQueries[refIndex] ? chainQueries[refIndex].startNodeLabel : selectedStartLabel;
          } else {
            const node = Array.from(availableNodes.entries()).find(([k, n]) => k === refKey)?.[1];
            newStartLabel = node ? node.label : selectedStartLabel;
          }
        } catch (e) {
          newStartLabel = selectedStartLabel;
        }
      } else {
        newStartLabel = selectedStartLabel;
      }
      
      let newEndLabel;
      if (selectedEndLabel.startsWith('ref:')) {
        try {
          const refKey = selectedEndLabel.substring(4);
          if (refKey.includes('.')) {
            const refIndex = parseInt(refKey.split('.')[0]);
            newEndLabel = chainQueries[refIndex] ? chainQueries[refIndex].endNodeLabel : selectedEndLabel;
          } else {
            const node = Array.from(availableNodes.entries()).find(([k, n]) => k === refKey)?.[1];
            newEndLabel = node ? node.label : selectedEndLabel;
          }
        } catch (e) {
          newEndLabel = selectedEndLabel;
        }
      } else {
        newEndLabel = selectedEndLabel;
      }

      return existingStartLabel === newStartLabel && 
             existingEndLabel === newEndLabel && 
             query.relationType === selectedLabel;
    });
  };

  // 更新错误消息
  const getErrorMessage = () => {
    if (!isValidCombination()) {
      const duplicateQuery = chainQueries.find(query => {
        // 使用与 isValidCombination 相同的安全解析逻辑
        let existingStartLabel;
        let existingEndLabel;
        
        // 安全解析开始节点引用
        if (query.startNodeRef) {
          if (query.startNodeRef.length === 1) {
            existingStartLabel = query.startNodeLabel;
          } else {
            try {
              const refIndex = parseInt(query.startNodeRef.split('.')[0]);
              existingStartLabel = chainQueries[refIndex] ? chainQueries[refIndex].startNodeLabel : query.startNodeLabel;
            } catch (e) {
              existingStartLabel = query.startNodeLabel;
            }
          }
        } else {
          existingStartLabel = query.startNodeLabel;
        }
        
        // 安全解析结束节点引用
        if (query.endNodeRef) {
          if (query.endNodeRef.length === 1) {
            existingEndLabel = query.endNodeLabel;
          } else {
            try {
              const refIndex = parseInt(query.endNodeRef.split('.')[0]);
              existingEndLabel = chainQueries[refIndex] ? chainQueries[refIndex].endNodeLabel : query.endNodeLabel;
            } catch (e) {
              existingEndLabel = query.endNodeLabel;
            }
          }
        } else {
          existingEndLabel = query.endNodeLabel;
        }
        
        // 处理当前选择的节点
        let newStartLabel;
        if (selectedStartLabel.startsWith('ref:')) {
          try {
            const refKey = selectedStartLabel.substring(4);
            if (refKey.includes('.')) {
              const refIndex = parseInt(refKey.split('.')[0]);
              newStartLabel = chainQueries[refIndex] ? chainQueries[refIndex].startNodeLabel : selectedStartLabel;
            } else {
              const node = Array.from(availableNodes.entries()).find(([k, n]) => k === refKey)?.[1];
              newStartLabel = node ? node.label : selectedStartLabel;
            }
          } catch (e) {
            newStartLabel = selectedStartLabel;
          }
        } else {
          newStartLabel = selectedStartLabel;
        }
        
        let newEndLabel;
        if (selectedEndLabel.startsWith('ref:')) {
          try {
            const refKey = selectedEndLabel.substring(4);
            if (refKey.includes('.')) {
              const refIndex = parseInt(refKey.split('.')[0]);
              newEndLabel = chainQueries[refIndex] ? chainQueries[refIndex].endNodeLabel : selectedEndLabel;
            } else {
              const node = Array.from(availableNodes.entries()).find(([k, n]) => k === refKey)?.[1];
              newEndLabel = node ? node.label : selectedEndLabel;
            }
          } catch (e) {
            newEndLabel = selectedEndLabel;
          }
        } else {
          newEndLabel = selectedEndLabel;
        }

        return existingStartLabel === newStartLabel && 
               existingEndLabel === newEndLabel && 
               query.relationType === selectedLabel;
      });

      const queryIndex = chainQueries.indexOf(duplicateQuery) + 1;
      return `此关系模式已存在于查询 ${queryIndex}。请选择不同的组合。`;
    }
    return null;
  };

  // 修改 handleMoreQuery 函数
  const handleMoreQuery = () => {
    // 检查是否存在重复的查询
    if (isValidCombination()) {
      setIsChainMode(true);
      const currentQuery = {
        startNodeLabel: selectedStartLabel.startsWith('ref:') ? null : selectedStartLabel,
        endNodeLabel: selectedEndLabel.startsWith('ref:') ? null : selectedEndLabel,
        relationType: selectedLabel,
        startNodeProps: relationshipProperties.startNode,
        endNodeProps: relationshipProperties.endNode,
        relationshipProps: relationshipProperties.relationship,
        startNodeRef: selectedStartLabel.startsWith('ref:') ? 
          availableNodes.get(selectedStartLabel.substring(4))?.letter : null,
        endNodeRef: selectedEndLabel.startsWith('ref:') ? 
          availableNodes.get(selectedEndLabel.substring(4))?.letter : null
      };
      
      setChainQueries([...chainQueries, currentQuery]);
      
      // 添加新节点到可用节点列表
      const newNodes = new Map(availableNodes);
      if (!selectedStartLabel.startsWith('ref:')) {
        newNodes.set(`${chainQueries.length}.start`, {
          label: selectedStartLabel,
          position: 'start',
          letter: getNodeLetter(chainQueries.length, 'start')
        });
      }
      if (!selectedEndLabel.startsWith('ref:')) {
        newNodes.set(`${chainQueries.length}.end`, {
          label: selectedEndLabel,
          position: 'end',
          letter: getNodeLetter(chainQueries.length, 'end')
        });
      }
      setAvailableNodes(newNodes);
      
      // 重置状态
      setStep(1);
      setShowAdvanced(false);
      setSelectedLabel('');
      setSelectedStartLabel('');
      setSelectedEndLabel('');
      setRelationshipProperties({
        startNode: {},
        endNode: {},
        relationship: {}
      });
    } else {
      // 使用 alert 或者其他提示组件
      alert('This query combination already exists. Please choose different nodes or relationship type.');
    }
  };

  // 修改 handleAddRelationship 函数
  const handleAddRelationship = () => {
    if (chainQueries.length > 0) {
      // 检查是否存在重复的查询
      if (isValidCombination()) {
        setIsChainMode(true);
        const relationships = [
          ...chainQueries,
          {
            startNodeLabel: selectedStartLabel.startsWith('ref:') ? null : selectedStartLabel,
            endNodeLabel: selectedEndLabel.startsWith('ref:') ? null : selectedEndLabel,
            relationType: selectedLabel,
            startNodeProps: relationshipProperties.startNode,
            endNodeProps: relationshipProperties.endNode,
            relationshipProps: relationshipProperties.relationship,
            startNodeRef: selectedStartLabel.startsWith('ref:') ? 
              availableNodes.get(selectedStartLabel.substring(4))?.letter : null,
            endNodeRef: selectedEndLabel.startsWith('ref:') ? 
              availableNodes.get(selectedEndLabel.substring(4))?.letter : null
          }
        ];

        // 添加调试日志
        //console.log('Chain relationships:', relationships);
        //console.log('Available nodes:', Array.from(availableNodes.entries()));

        const queryParams = {
          type: 'chainRelationship',
          params: {
            matchType: 'chainRelationshipMatch',
            relationships: relationships
          }
        };

        // 添加调试日志
        //console.log('Generated chain query params:', queryParams);

        onQueryGenerated(queryParams);
      } else {
        // 使用 alert 或者其他提示组件
        alert('This query combination already exists. Please choose different nodes or relationship type.');
      }
    } else {
      // 第一次添加关系
      // 过滤掉空属性
      const startNodeProps = Object.fromEntries(
        Object.entries(relationshipProperties.startNode || {})
          .filter(([_, value]) => value !== '')
      );
      
      const endNodeProps = Object.fromEntries(
        Object.entries(relationshipProperties.endNode || {})
          .filter(([_, value]) => value !== '')
      );
      
      const relationshipProps = Object.fromEntries(
        Object.entries(relationshipProperties.relationship || {})
          .filter(([_, value]) => value !== '' && value !== 'limit') // 排除 limit 属性
      );

      const queryParams = {
        type: 'relationship',
        params: {
          matchType: 'relationshipMatch',
          relationType: selectedLabel,
          properties: relationshipProps,
          // 只在选择了具体标签且有属性时才包含节点信息
          ...(selectedStartLabel && selectedStartLabel !== "Any node label" && {
            startNodeLabel: selectedStartLabel,
            ...(Object.keys(startNodeProps).length > 0 && { startNodeProps })
          }),
          ...(selectedEndLabel && selectedEndLabel !== "Any node label" && {
            endNodeLabel: selectedEndLabel,
            ...(Object.keys(endNodeProps).length > 0 && { endNodeProps })
          }),
          // 添加 limit 参数
          limit: relationshipProperties.relationship?.limit ? 
            parseInt(relationshipProperties.relationship.limit) : undefined
        }
      };

      //console.log('Relationship query params:', queryParams); // 添加日志

      onQueryGenerated(queryParams);
    }
    
    // 重置状态
    setChainQueries([]);
    setIsChainMode(false);
    setAvailableNodes(new Map());
    handleClosePopup();
  };

  // 修改提示方式
  const showToast = (message) => {
    setToastMessage(message);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // 确保点击的不是弹窗内部元素
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        handleClosePopup();
      }
    };

    // 只在弹窗打开时添加事件监听
    if (isPopupOpen) {
      // 使用 setTimeout 确保事件监听器在下一个事件循环中添加
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopupOpen]);

  // 监听 step 变化
  useEffect(() => {
    if (step !== 2) {
      setShowAdvanced(false);  // 当不在 step 2 时，关闭 advanced 设置
    }
  }, [step]);

  return (
    <>
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          onClose={() => setToastMessage(null)} 
        />
      )}
      <button 
        className={styles.iconButton} 
        onClick={handleOpenPopup}
        type="button" // 明确指定按钮类型
      >
        <TbCrosshair size={24} />
      </button>
      {isPopupOpen && (
        <div 
          className={styles.popupOverlay}
          onClick={(e) => e.stopPropagation()} // 阻止overlay的点击事件冒泡
        >
          <div 
            className={styles.popupContent} 
            ref={popupRef}
          >
            <div className={styles.tabHeader}>
              <button
                className={`${styles.tabButton} ${activeAddTab === "addNode" ? styles.activeTab : ""}`}
                onClick={() => handleAddTabSwitch("addNode")}
                disabled={step > 1}
              >
                Add Node
              </button>
              <button
                className={`${styles.tabButton} ${activeAddTab === "addRelationship" ? styles.activeTab : ""}`}
                onClick={() => handleAddTabSwitch("addRelationship")}
                disabled={step > 1}
              >
                Add Relationship
              </button>
              <button
                className={`${styles.tabButton} ${activeAddTab === "pathMatch" ? styles.activeTab : ""}`}
                onClick={() => handleAddTabSwitch("pathMatch")}
                disabled={step > 1}
              >
                Path Match
              </button>
            </div>

            <div className={`${styles.tabContent} ${showAdvanced ? styles.showingAdvanced : ''}`}>
              {activeAddTab === "addNode" && (
                <div>
                  {step === 1 && (
                    <div className={styles.stepOne}>
                      <div className={styles.rowSection}>
                        <div className={styles.leftSection}>Add Node</div>
                        <div className={styles.rightSection}>
                          <select
                            value={selectedLabel}
                            onChange={(e) => setSelectedLabel(e.target.value)}
                            className={styles.selectBox}
                          >
                            <option value="" disabled>
                              Select a label
                            </option>
                            {Object.keys(nodeEntities).map((label) => (
                              <option key={label} value={label}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className={styles.buttonContainer}>
                        <button 
                          className={styles.cancelButton} 
                          onClick={handleClosePopup}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.nextButton}
                          onClick={() => selectedLabel && setStep(2)}
                          disabled={!selectedLabel}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                  {step === 2 && (
                    <div className={styles.stepTwo}>
                      <div className={styles.headerContainer}>
                        <h3 className={styles.headerText}> Set {selectedLabel} Properties </h3>
                          <button 
                            className={styles.advancedButton} 
                            onClick={() => setShowAdvanced(!showAdvanced)}
                          >
                            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                          </button>

                      </div>
                      

                      <div className={styles.tabContent}>
                        {/* 节点属性部分 */}
                        <div className={styles.propertiesSection}>
                          <h4 className={styles.propertiesSectionTitle}>Node Properties</h4>
                          {nodeEntities[selectedLabel]?.map((property, index) => (
                            <div key={index} className={styles.propertyRowWithOperator}>
                              <span className={styles.propertyLabel}>{property}</span>
                              
                              <div className={styles.propertyComparisonContainer}>
                                <select
                                  className={styles.propertyOperatorSelect}
                                  value={nodePropertyOperators[property] || "="}
                                  onChange={(e) => {
                                    const newOperator = e.target.value;
                                    setNodePropertyOperators({
                                      ...nodePropertyOperators,
                                      [property]: newOperator
                                    });
                                    
                                    if (nodeProperties[property]) {
                                      const currentValue = typeof nodeProperties[property] === 'object' 
                                        ? nodeProperties[property].value 
                                        : nodeProperties[property];
                                      
                                      handleNodePropertyChange(property, currentValue, newOperator);
                                    }
                                  }}
                                >
                                  {propertyOperators.map(op => (
                                    <option key={op.value} value={op.value}>{op.label}</option>
                                  ))}
                                </select>
                                
                                <input
                                  type="text"
                                  placeholder={`Search for ${property}`}
                                  className={`${styles.propertyInput} ${styles.propertyInputWithOperator}`}
                                  onChange={(e) => handleNodePropertyChange(
                                    property, 
                                    e.target.value,
                                    nodePropertyOperators[property] || "="
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                          {(!nodeEntities[selectedLabel] || nodeEntities[selectedLabel]?.length === 0) && (
                            <div className={styles.emptyMessage}>No properties available for this node type</div>
                          )}
                        </div>
                        
                        {/* 高级选项 */}
                        {showAdvanced && (
                          <div className={styles.advancedSection}>
                            <div className={styles.propertiesSection}>
                              <h4 className={styles.propertiesSectionTitle}>Advanced Options</h4>
                              <div className={styles.propertyRow}>
                                <span className={styles.propertyLabel}>Limit results</span>
                                <span className={styles.propertyEquals}>=</span>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Enter limit number"
                                  className={styles.propertyInput}
                                  onChange={(e) => setLimit(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      
                      <div className={styles.buttonContainer}>
                        <button className={styles.backButton} onClick={() => setStep(1)}>
                          Back
                        </button>
                        <button 
                          className={styles.addButton} 
                          onClick={handleAddNode}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeAddTab === "addRelationship" && (
                <div>
                  {step === 1 && (
                    <div className={styles.stepOne}>
                      {/* 传递 getNodeLetter 函数给 ChainQueryDisplay */}
                      {isChainMode && chainQueries.length > 0 && (
                        <ChainQueryDisplay 
                          queries={chainQueries} 
                          getNodeLetter={getNodeLetter}
                        />
                      )}

                      <div className={styles.rowSection}>
                        <div className={styles.leftSection}>Add Relationship</div>
                        <div className={styles.rightSection}>
                          <select
                            value={selectedLabel}
                            onChange={(e) => setSelectedLabel(e.target.value)}
                            className={styles.selectBox}
                          >
                            <option value="" disabled>
                              Select a relationship type
                            </option>
                            {Object.keys(relationshipEntities).map((relationshipType) => (
                              <option key={relationshipType} value={relationshipType}>
                                {relationshipType}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {selectedLabel && (
                        <>
                          <div className={styles.rowSection}>
                            <div className={styles.leftSection}>Start Node</div>
                            <div className={styles.rightSection}>
                              <select
                                value={selectedStartLabel}
                                onChange={(e) => setSelectedStartLabel(e.target.value)}
                                className={styles.selectBox}
                              >
                                <option value="">Any node label</option>
                                {getAvailableNodeOptions().map(option => (
                                  <option key={option.key} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className={styles.rowSection}>
                            <div className={styles.leftSection}>End Node</div>
                            <div className={styles.rightSection}>
                              <select
                                value={selectedEndLabel}
                                onChange={(e) => setSelectedEndLabel(e.target.value)}
                                className={styles.selectBox}
                              >
                                <option value="">Any node label</option>
                                {getAvailableNodeOptions(selectedStartLabel.startsWith('ref:') ? selectedStartLabel.substring(4) : null)
                                  .map(option => (
                                    <option key={option.key} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      <div className={styles.buttonContainer}>
                        {isChainMode ? (
                          <button 
                            className={styles.backButton} 
                            onClick={() => {
                              const updatedQueries = [...chainQueries];
                              updatedQueries.pop();
                              setChainQueries(updatedQueries);
                              
                              const lastQuery = chainQueries[chainQueries.length - 1];
                              setStep(2);
                              setSelectedLabel(lastQuery.relationType);
                              setSelectedStartLabel(lastQuery.startNodeRef ? 
                                `ref:${chainQueries.length - 2}.start` : 
                                lastQuery.startNodeLabel);
                              setSelectedEndLabel(lastQuery.endNodeRef ? 
                                `ref:${chainQueries.length - 2}.end` : 
                                lastQuery.endNodeLabel);
                              setRelationshipProperties({
                                startNode: lastQuery.startNodeProps || {},
                                endNode: lastQuery.endNodeProps || {},
                                relationship: lastQuery.relationshipProps || {}
                              });
                            }}
                          >
                            Back
                          </button>
                        ) : (
                          <button 
                            className={styles.cancelButton} 
                            onClick={handleClosePopup}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          className={styles.nextButton}
                          onClick={() => selectedLabel && setStep(2)}
                          disabled={!selectedLabel || !isValidCombination()}
                          data-tooltip={!isValidCombination() ? getErrorMessage() : null}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                  {step === 2 && (
                    <div className={styles.stepTwo}>
                      <div className={styles.headerContainer}>
                        <h3 className={styles.headerText}>Set {selectedLabel} Properties</h3>
                        <button 
                          className={styles.advancedButton} 
                          onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                        </button>
                      </div>
                      
                      <div className={styles.scrollContainer}>
                        {/* 关系属性部分 */}
                        <div className={styles.propertiesSection}>
                          <h4 className={styles.propertiesSectionTitle}>Relationship Properties</h4>
                          {relationshipEntities[selectedLabel]?.map((property, index) => (
                            <div key={index} className={styles.propertyRowWithOperator}>
                              <span className={styles.propertyLabel}>{property}</span>
                              
                              <div className={styles.propertyComparisonContainer}>
                                <select
                                  className={styles.propertyOperatorSelect}
                                  value={relationshipPropertyOperators[property] || "="}
                                  onChange={(e) => {
                                    const newOperator = e.target.value;
                                    setRelationshipPropertyOperators({
                                      ...relationshipPropertyOperators,
                                      [property]: newOperator
                                    });
                                    
                                    // 更新现有属性值以使用新操作符
                                    if (relationshipProperties.relationship && relationshipProperties.relationship[property]) {
                                      const currentValue = typeof relationshipProperties.relationship[property] === 'object' 
                                        ? relationshipProperties.relationship[property].value 
                                        : relationshipProperties.relationship[property];
                                      
                                      handleRelationshipPropertyChange(property, currentValue, newOperator);
                                    }
                                  }}
                                >
                                  {propertyOperators.map(op => (
                                    <option key={op.value} value={op.value}>{op.label}</option>
                                  ))}
                                </select>
                                
                                <input
                                  type="text"
                                  placeholder={`Enter ${property}`}
                                  className={`${styles.propertyInput} ${styles.propertyInputWithOperator}`}
                                  onChange={(e) => handleRelationshipPropertyChange(
                                    property, 
                                    e.target.value,
                                    relationshipPropertyOperators[property] || "="
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Advanced Settings */}
                        {showAdvanced && (
                          <div className={styles.advancedSection}>
                            {/* Start Node Properties */}
                            {selectedStartLabel && !selectedStartLabel.startsWith('ref:') && (
                              <div className={styles.propertiesSection}>
                                <h4 className={styles.propertiesSectionTitle}>Start Node ({selectedStartLabel}) Properties</h4>
                                {nodeEntities[selectedStartLabel]?.map((property, index) => (
                                  <div key={index} className={styles.propertyRowWithOperator}>
                                    <span className={styles.propertyLabel}>{property}</span>
                                    <div className={styles.propertyComparisonContainer}>
                                      <select
                                        className={styles.propertyOperatorSelect}
                                        value={startNodePropertyOperators[property] || "="}
                                        onChange={(e) => {
                                          const newOperator = e.target.value;
                                          setStartNodePropertyOperators({
                                            ...startNodePropertyOperators,
                                            [property]: newOperator
                                          });
                                          
                                          if (relationshipProperties.startNode && relationshipProperties.startNode[property]) {
                                            const currentValue = typeof relationshipProperties.startNode[property] === 'object'
                                              ? relationshipProperties.startNode[property].value
                                              : relationshipProperties.startNode[property];
                                            
                                            handleStartNodePropertyChange(property, currentValue, newOperator);
                                          }
                                        }}
                                      >
                                        {propertyOperators.map(op => (
                                          <option key={op.value} value={op.value}>{op.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <input
                                      type="text"
                                      placeholder={`Enter ${property}`}
                                      className={`${styles.propertyInput} ${styles.propertyInputWithOperator}`}
                                      onChange={(e) => handleStartNodePropertyChange(
                                        property, 
                                        e.target.value,
                                        startNodePropertyOperators[property] || "="
                                      )}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* End Node Properties */}
                            <div className={styles.propertiesSection}>
                              <h4 className={styles.propertiesSectionTitle}>End Node ({selectedEndLabel}) Properties</h4>
                              {nodeEntities[selectedEndLabel]?.map((property, index) => (
                                <div key={index} className={styles.propertyRowWithOperator}>
                                  <span className={styles.propertyLabel}>{property}</span>
                                  
                                  <div className={styles.propertyComparisonContainer}>
                                    <select
                                      className={styles.propertyOperatorSelect}
                                      value={endNodePropertyOperators[property] || "="}
                                      onChange={(e) => {
                                        const newOperator = e.target.value;
                                        setEndNodePropertyOperators({
                                          ...endNodePropertyOperators,
                                          [property]: newOperator
                                        });
                                        
                                        if (relationshipProperties.endNode && relationshipProperties.endNode[property]) {
                                          const currentValue = typeof relationshipProperties.endNode[property] === 'object' 
                                            ? relationshipProperties.endNode[property].value 
                                            : relationshipProperties.endNode[property];
                                          
                                          handleEndNodePropertyChange(property, currentValue, newOperator);
                                        }
                                      }}
                                    >
                                      {propertyOperators.map(op => (
                                        <option key={op.value} value={op.value}>{op.label}</option>
                                      ))}
                                    </select>
                                    
                                    <input
                                      type="text"
                                      placeholder={`Enter ${property}`}
                                      className={`${styles.propertyInput} ${styles.propertyInputWithOperator}`}
                                      onChange={(e) => handleEndNodePropertyChange(
                                        property, 
                                        e.target.value,
                                        endNodePropertyOperators[property] || "="
                                      )}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                
                      <div className={styles.buttonContainer}>
                        <button className={styles.backButton} onClick={() => setStep(1)}>
                          Back
                        </button>
                        <button className={styles.moreButton} onClick={handleMoreQuery}>
                          More Query
                        </button>
                        <button className={styles.addButton} onClick={handleAddRelationship}>
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeAddTab === "pathMatch" && (
                <div>
                  {step === 1 && (
                    <div className={styles.stepOne}>
                      <div className={styles.rowSection}>
                        <div className={styles.leftSection}>Start Node</div>
                        <div className={styles.rightSection}>
                          <select
                            value={selectedStartLabel}
                            onChange={(e) => setSelectedStartLabel(e.target.value)}
                            className={styles.selectBox}
                          >
                            <option value="" disabled>Select start node label</option>
                            {Object.keys(nodeEntities).map((label) => (
                              <option key={label} value={label}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className={styles.rowSection}>
                        <div className={styles.leftSection}>End Node</div>
                        <div className={styles.rightSection}>
                          <select
                            value={selectedEndLabel}
                            onChange={(e) => setSelectedEndLabel(e.target.value)}
                            className={styles.selectBox}
                          >
                            <option value="" disabled>Select end node label</option>
                            {Object.keys(nodeEntities).map((label) => (
                              <option key={label} value={label}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className={styles.buttonContainer}>
                        <button className={styles.cancelButton} onClick={handleClosePopup}>
                          Cancel
                        </button>
                        <button
                          className={styles.nextButton}
                          onClick={() => setStep(2)}
                          disabled={!selectedStartLabel || !selectedEndLabel}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                  {step === 2 && (
                    <div className={styles.pathMatchStep}>
                      <h3 className={styles.pathMatchTitle}>Define Path Properties</h3>
                      
                      <div className={styles.pathMatchContent}>
                        {/* 起始节点属性 */}
                        <div className={styles.nodePropertyCard}>
                          <h4 className={styles.nodePropertyTitle}>Start Node Properties ({selectedStartLabel})</h4>
                          <div className={styles.nodePropertyList}>
                            {nodeEntities[selectedStartLabel]?.map((property, index) => (
                              <div key={index} className={styles.propertyItem}>
                                <span className={styles.propertyName}>{property}</span>
                                <select
                                  className={styles.operatorSelect}
                                  value={pathStartNodePropertyOperators[property] || "="}
                                  onChange={(e) => {
                                    const newOperator = e.target.value;
                                    setPathStartNodePropertyOperators({
                                      ...pathStartNodePropertyOperators,
                                      [property]: newOperator
                                    });
                                    
                                    if (pathProperties.startNode && pathProperties.startNode[property]) {
                                      const currentValue = typeof pathProperties.startNode[property] === 'object'
                                        ? pathProperties.startNode[property].value
                                        : pathProperties.startNode[property];
                                      
                                      handlePathStartNodePropertyChange(property, currentValue, newOperator);
                                    }
                                  }}
                                >
                                  {propertyOperators.map(op => (
                                    <option key={op.value} value={op.value}>{op.label}</option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder={`Enter ${property}`}
                                  className={styles.propertyValueInput}
                                  onChange={(e) => handlePathStartNodePropertyChange(
                                    property, 
                                    e.target.value,
                                    pathStartNodePropertyOperators[property] || "="
                                  )}
                                />
                              </div>
                            ))}
                            {(!nodeEntities[selectedStartLabel] || nodeEntities[selectedStartLabel]?.length === 0) && (
                              <div className={styles.emptyProperty}>No properties available</div>
                            )}
                          </div>
                        </div>

                        {/* 结束节点属性 */}
                        <div className={styles.nodePropertyCard}>
                          <h4 className={styles.nodePropertyTitle}>End Node Properties ({selectedEndLabel})</h4>
                          <div className={styles.nodePropertyList}>
                            {nodeEntities[selectedEndLabel]?.map((property, index) => (
                              <div key={index} className={styles.propertyItem}>
                                <span className={styles.propertyName}>{property}</span>
                                <select
                                  className={styles.operatorSelect}
                                  value={pathEndNodePropertyOperators[property] || "="}
                                  onChange={(e) => {
                                    const newOperator = e.target.value;
                                    setPathEndNodePropertyOperators({
                                      ...pathEndNodePropertyOperators,
                                      [property]: newOperator
                                    });
                                    
                                    if (pathProperties.endNode && pathProperties.endNode[property]) {
                                      const currentValue = typeof pathProperties.endNode[property] === 'object'
                                        ? pathProperties.endNode[property].value
                                        : pathProperties.endNode[property];
                                      
                                      handlePathEndNodePropertyChange(property, currentValue, newOperator);
                                    }
                                  }}
                                >
                                  {propertyOperators.map(op => (
                                    <option key={op.value} value={op.value}>{op.label}</option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder={`Enter ${property}`}
                                  className={styles.propertyValueInput}
                                  onChange={(e) => handlePathEndNodePropertyChange(
                                    property, 
                                    e.target.value,
                                    pathEndNodePropertyOperators[property] || "="
                                  )}
                                />
                              </div>
                            ))}
                            {(!nodeEntities[selectedEndLabel] || nodeEntities[selectedEndLabel]?.length === 0) && (
                              <div className={styles.emptyProperty}>No properties available</div>
                            )}
                          </div>
                        </div>

                        {/* 关系配置 */}
                        <div className={styles.relationshipConfigCard}>
                          <h4 className={styles.nodePropertyTitle}>Path Configuration</h4>
                          
                          <div className={styles.relationshipConfig}>
                            <div className={styles.configItem}>
                              <span className={styles.configLabel}>Relationship types</span>
                              <div className={styles.relationshipTypeWrapper}>
                                <select
                                  className={styles.relationshipTypeSelect}
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value && !selectedRelationshipTypes.includes(e.target.value)) {
                                      setSelectedRelationshipTypes([...selectedRelationshipTypes, e.target.value]);
                                    }
                                  }}
                                >
                                  <option value="">Select relationship types</option>
                                  {Object.keys(relationshipEntities).map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* 添加已选择关系类型的显示区域 */}
                            <div className={styles.selectedTypesContainer}>
                              {selectedRelationshipTypes.map((type) => (
                                <div key={type} className={styles.typeTag}>
                                  {type}
                                  <button
                                    className={styles.removeTypeButton}
                                    onClick={() => setSelectedRelationshipTypes(
                                      selectedRelationshipTypes.filter(t => t !== type)
                                    )}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              {selectedRelationshipTypes.length === 0 && (
                                <div className={styles.noTypesSelected}>No relationship types selected</div>
                              )}
                            </div>

                            <div className={styles.configItem}>
                              <span className={styles.configLabel}>Min hops</span>
                              <input
                                type="number"
                                min="1"
                                placeholder="1"
                                className={styles.configInput}
                                onChange={(e) => setPathProperties(prev => ({
                                  ...prev,
                                  relationship: {
                                    ...prev.relationship,
                                    minHops: e.target.value
                                  }
                                }))}
                              />
                            </div>
                            
                            <div className={styles.configItem}>
                              <span className={styles.configLabel}>Max hops</span>
                              <input
                                type="number"
                                min="1"
                                placeholder="Optional"
                                className={styles.configInput}
                                onChange={(e) => setPathProperties(prev => ({
                                  ...prev,
                                  relationship: {
                                    ...prev.relationship,
                                    maxHops: e.target.value
                                  }
                                }))}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.buttonContainer}>
                        <button className={styles.backButton} onClick={() => setStep(1)}>
                          Back
                        </button>
                        <button 
                          className={styles.addButton} 
                          onClick={handleAddPath}
                        >
                          Add Path
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddQuery;

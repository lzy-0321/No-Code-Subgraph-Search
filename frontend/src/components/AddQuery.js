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
    console.log('Starting handleAddPath');  // 添加日志
    
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
    
    console.log('Generated queryParams:', queryParams);  // 添加日志
    
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

    console.log('Node query params:', queryParams); // 添加日志

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
      // 获取开始节点的实际标签
      const existingStartLabel = query.startNodeRef ? 
        chainQueries[parseInt(query.startNodeRef.split('.')[0])].startNodeLabel : 
        query.startNodeLabel;
      
      // 获取结束节点的实际标签
      const existingEndLabel = query.endNodeRef ? 
        chainQueries[parseInt(query.endNodeRef.split('.')[0])].endNodeLabel : 
        query.endNodeLabel;
      
      // 获取当前选择的开始节点的实际标签
      const newStartLabel = selectedStartLabel.startsWith('ref:') ? 
        chainQueries[parseInt(selectedStartLabel.substring(4).split('.')[0])].startNodeLabel : 
        selectedStartLabel;
      
      // 获取当前选择的结束节点的实际标签
      const newEndLabel = selectedEndLabel.startsWith('ref:') ? 
        chainQueries[parseInt(selectedEndLabel.substring(4).split('.')[0])].endNodeLabel : 
        selectedEndLabel;
      
      // 检查节点标签组合和关系类型是否重复
      const isSameNodes = existingStartLabel === newStartLabel && existingEndLabel === newEndLabel;
      const isSameRelationType = query.relationType === selectedLabel;

      return isSameNodes && isSameRelationType;
    });
  };

  // 更新错误消息
  const getErrorMessage = () => {
    if (!isValidCombination()) {
      const duplicateQuery = chainQueries.find(query => {
        const existingStartLabel = query.startNodeRef ? 
          chainQueries[parseInt(query.startNodeRef.split('.')[0])].startNodeLabel : 
          query.startNodeLabel;
        const existingEndLabel = query.endNodeRef ? 
          chainQueries[parseInt(query.endNodeRef.split('.')[0])].endNodeLabel : 
          query.endNodeLabel;
        const newStartLabel = selectedStartLabel.startsWith('ref:') ? 
          chainQueries[parseInt(selectedStartLabel.substring(4).split('.')[0])].startNodeLabel : 
          selectedStartLabel;
        const newEndLabel = selectedEndLabel.startsWith('ref:') ? 
          chainQueries[parseInt(selectedEndLabel.substring(4).split('.')[0])].endNodeLabel : 
          selectedEndLabel;

        return existingStartLabel === newStartLabel && 
               existingEndLabel === newEndLabel && 
               query.relationType === selectedLabel;
      });

      const queryIndex = chainQueries.indexOf(duplicateQuery) + 1;
      return `This relationship pattern already exists in Query ${queryIndex}. Please choose a different combination.`;
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
        console.log('Chain relationships:', relationships);
        console.log('Available nodes:', Array.from(availableNodes.entries()));

        const queryParams = {
          type: 'chainRelationship',
          params: {
            matchType: 'chainRelationshipMatch',
            relationships: relationships
          }
        };

        // 添加调试日志
        console.log('Generated chain query params:', queryParams);

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

      console.log('Relationship query params:', queryParams); // 添加日志

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

            <div className={styles.tabContent}>
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
                        <h3 className={styles.headerText}>Set {selectedLabel} Properties</h3>
                        <button 
                          className={styles.advancedButton} 
                          onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                        </button>
                      </div>
                      
                      <div className={styles.scrollContainer}>
                        {/* 节点属性部分 */}
                        <div className={styles.propertyContainer}>
                          {nodeEntities[selectedLabel]?.map((property, index) => (
                            <div key={index} className={styles.propertyRow}>
                              <span className={styles.propertyLabel}>{property}</span>
                              <span className={styles.propertyIcon}>=</span>
                              <input
                                type="text"
                                placeholder={`Search for ${property}`}
                                className={styles.propertyInput}
                                onChange={(e) => {
                                  const newProperties = { ...nodeProperties };
                                  newProperties[property] = e.target.value;
                                  setNodeProperties(newProperties);
                                }}
                              />
                            </div>
                          ))}
                        </div>

                        {/* 高级选项部分 */}
                        {showAdvanced && (
                          <div className={styles.advancedSection}>
                            <div className={styles.propertyRow}>
                              <span className={styles.propertyLabel}>Limit</span>
                              <span className={styles.propertyIcon}>=</span>
                              <input
                                type="number"
                                min="1"
                                placeholder="Enter Number"
                                className={styles.propertyInput}
                                onChange={(e) => setLimit(e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={styles.buttonContainer}>
                        <button className={styles.backButton} onClick={() => setStep(1)}>
                          Back
                        </button>
                        <button className={styles.addButton} onClick={handleAddNode}>
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
                        {/* Relationship Properties - 只在有属性时显示 */}
                        {relationshipEntities[selectedLabel]?.length > 0 && (
                          <div className={styles.propertiesSection}>
                            <h4>Relationship Properties</h4>
                            {relationshipEntities[selectedLabel].map((property, index) => (
                              <div key={index} className={styles.propertyRow}>
                                <span className={styles.propertyLabel}>{property}</span>
                                <span className={styles.propertyIcon}>=</span>
                                <input
                                  type="text"
                                  placeholder={`Enter ${property}`}
                                  className={styles.propertyInput}
                                  onChange={(e) => setRelationshipProperties(prev => ({
                                    ...prev,
                                    relationship: {
                                      ...prev.relationship,
                                      [property]: e.target.value
                                    }
                                  }))}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Advanced Settings */}
                        {showAdvanced && (
                          <div className={styles.advancedSection}>
                            {/* Start Node Properties */}
                            {selectedStartLabel && !selectedStartLabel.startsWith('ref:') && (
                              <div className={styles.propertiesSection}>
                                <h4>Start Node ({selectedStartLabel}) Properties</h4>
                                {nodeEntities[selectedStartLabel]?.map((property, index) => (
                                  <div key={index} className={styles.propertyRow}>
                                    <span className={styles.propertyLabel}>{property}</span>
                                    <span className={styles.propertyIcon}>=</span>
                                    <input
                                      type="text"
                                      placeholder={`Enter ${property}`}
                                      className={styles.propertyInput}
                                      onChange={(e) => setRelationshipProperties(prev => ({
                                        ...prev,
                                        startNode: {
                                          ...prev.startNode,
                                          [property]: e.target.value
                                        }
                                      }))}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* End Node Properties */}
                            {selectedEndLabel && !selectedEndLabel.startsWith('ref:') && (
                              <div className={styles.propertiesSection}>
                                <h4>End Node ({selectedEndLabel}) Properties</h4>
                                {nodeEntities[selectedEndLabel]?.map((property, index) => (
                                  <div key={index} className={styles.propertyRow}>
                                    <span className={styles.propertyLabel}>{property}</span>
                                    <span className={styles.propertyIcon}>=</span>
                                    <input
                                      type="text"
                                      placeholder={`Enter ${property}`}
                                      className={styles.propertyInput}
                                      onChange={(e) => setRelationshipProperties(prev => ({
                                        ...prev,
                                        endNode: {
                                          ...prev.endNode,
                                          [property]: e.target.value
                                        }
                                      }))}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
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
                    <div className={styles.stepTwo}>
                      <div className={styles.headerContainer}>
                        <h3 className={styles.headerText}>Define Path Properties</h3>
                      </div>
                      
                      <div className={styles.scrollContainer}>
                        <div className={styles.pathMatchContainer}>
                          {/* Start Node Properties */}
                          <div className={styles.nodeSection}>
                            <h4>Start Node Properties ({selectedStartLabel})</h4>
                            {nodeEntities[selectedStartLabel]?.map((property, index) => (
                              <div key={index} className={styles.propertyRow}>
                                <span className={styles.propertyLabel}>{property}</span>
                                <input
                                  type="text"
                                  placeholder={`Enter ${property}`}
                                  className={styles.propertyInput}
                                  onChange={(e) => setPathProperties(prev => ({
                                    ...prev,
                                    startNode: {
                                      ...prev.startNode,
                                      [property]: e.target.value
                                    }
                                  }))}
                                />
                              </div>
                            ))}
                          </div>

                          {/* End Node Properties */}
                          <div className={styles.nodeSection}>
                            <h4>End Node Properties ({selectedEndLabel})</h4>
                            {nodeEntities[selectedEndLabel]?.map((property, index) => (
                              <div key={index} className={styles.propertyRow}>
                                <span className={styles.propertyLabel}>{property}</span>
                                <input
                                  type="text"
                                  placeholder={`Enter ${property}`}
                                  className={styles.propertyInput}
                                  onChange={(e) => setPathProperties(prev => ({
                                    ...prev,
                                    endNode: {
                                      ...prev.endNode,
                                      [property]: e.target.value
                                    }
                                  }))}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Path Properties Section */}
                          <div className={styles.pathPropertiesSection}>
                            {/* 现有的路径属性部分（关系类型选择和跳数设置） */}
                              {/* Relationship Types Selection */}
                            <div className={styles.propertyRow}>
                              <span className={styles.propertyLabel}>Relationship types</span>
                              <div className={styles.relationshipTypeSelect}>
                                <select
                                  className={styles.propertyInput}
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
                                <div className={styles.selectedTypes}>
                                  {selectedRelationshipTypes.map((type) => (
                                    <div key={type} className={styles.typeTag}>
                                      {type}
                                      <button
                                        className={styles.removeType}
                                        onClick={() => setSelectedRelationshipTypes(
                                          selectedRelationshipTypes.filter(t => t !== type)
                                        )}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Min/Max hops */}
                            <div className={styles.propertyRow}>
                              <span className={styles.propertyLabel}>Min hops</span>
                              <input
                                type="number"
                                min="1"
                                placeholder="Minimum hops"
                                className={styles.propertyInput}
                                onChange={(e) => setPathProperties(prev => ({
                                  ...prev,
                                  relationship: {
                                    ...prev.relationship,
                                    minHops: e.target.value
                                  }
                                }))}
                              />
                            </div>
                            <div className={styles.propertyRow}>
                              <span className={styles.propertyLabel}>Max hops</span>
                              <input
                                type="number"
                                min="1"
                                placeholder="Maximum hops (optional)"
                                className={styles.propertyInput}
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

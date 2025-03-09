import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/AddQuery.module.css"; // Update with your actual styles path
import { TbCrosshair } from "react-icons/tb";
import { QueryManager } from '../utils/queryGenerator';

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
  };

  const handleAddTabSwitch = (tab) => {
    if (step === 1) {
      setActiveAddTab(tab);
      setSelectedLabel("");
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

  const handleAddRelationship = () => {
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
    handleClosePopup();
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

  return (
    <>
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
                      <div className={styles.buttonContainer}>
                        <button className={styles.cancelButton} onClick={handleClosePopup}>
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
                        {showAdvanced && (
                          <div className={styles.advancedSection}>
                            {/* Start Node Section */}
                            <div className={styles.nodeSection}>
                              <h4>Start Node (Optional)</h4>
                              <select
                                value={selectedStartLabel}
                                onChange={(e) => setSelectedStartLabel(e.target.value)}
                                className={styles.selectBox}
                              >
                                <option value="">Any node label</option>
                                {Object.keys(nodeEntities).map((label) => (
                                  <option key={label} value={label}>{label}</option>
                                ))}
                              </select>
                              {selectedStartLabel && (
                                <div className={styles.propertyContainer}>
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
                            </div>
                
                            {/* End Node Section */}
                            <div className={styles.nodeSection}>
                              <h4>End Node (Optional)</h4>
                              <select
                                value={selectedEndLabel}
                                onChange={(e) => setSelectedEndLabel(e.target.value)}
                                className={styles.selectBox}
                              >
                                <option value="">Any node label</option>
                                {Object.keys(nodeEntities).map((label) => (
                                  <option key={label} value={label}>{label}</option>
                                ))}
                              </select>
                              {selectedEndLabel && (
                                <div className={styles.propertyContainer}>
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
                          </div>
                        )}
                
                        {/* Relationship Properties */}
                        <div className={styles.propertyContainer}>
                          <h4>Relationship Properties</h4>
                          {relationshipEntities[selectedLabel]?.map((property, index) => (
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
                          <div className={styles.propertyRow}>
                            <span className={styles.propertyLabel}>Limit</span>
                            <span className={styles.propertyIcon}>=</span>
                            <input
                              type="number"
                              min="1"
                              placeholder="Enter number of results"
                              className={styles.propertyInput}
                              onChange={(e) => setRelationshipProperties(prev => ({
                                ...prev,
                                relationship: {
                                  ...prev.relationship,
                                  limit: e.target.value
                                }
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                
                      <div className={styles.buttonContainer}>
                        <button className={styles.backButton} onClick={() => setStep(1)}>
                          Back
                        </button>
                        <button 
                          className={styles.addButton} 
                          onClick={handleAddRelationship}
                        >
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

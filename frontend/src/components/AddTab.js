import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/AddTab.module.css"; // Update with your actual styles path
import { TbCrosshair } from "react-icons/tb";
import { QueryManager } from '../utils/queryGenerator';

const AddTab = ({ 
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

  const handleOpenPopup = () => setIsPopupOpen(true);

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

  const renderPathMatchStep = () => (
    <div className={styles.stepTwo}>
      <div className={styles.headerContainer}>
        <h3 className={styles.headerText}>Define Path</h3>
      </div>
      
      <div className={styles.scrollContainer}>
        <div className={styles.pathMatchContainer}>
          {/* Start Node Section */}
          <div className={styles.nodeSection}>
            <h4>Start Node</h4>
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
            )}
          </div>

          {/* End Node Section */}
          <div className={styles.nodeSection}>
            <h4>End Node</h4>
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
            )}
          </div>

          {/* Path Properties Section */}
          <div className={styles.pathPropertiesSection}>
            <h4>Path Properties</h4>
            
            {/* Relationship Types Selection */}
            <div className={styles.propertyRow}>
              <span className={styles.propertyLabel}>Relationship types</span>
              <span className={styles.propertyIcon}>=</span>
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

            {/* Min hops */}
            <div className={styles.propertyRow}>
              <span className={styles.propertyLabel}>Min hops</span>
              <span className={styles.propertyIcon}>=</span>
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

            {/* Max hops */}
            <div className={styles.propertyRow}>
              <span className={styles.propertyLabel}>Max hops</span>
              <span className={styles.propertyIcon}>=</span>
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
          disabled={!selectedStartLabel || !selectedEndLabel}
        >
          Add Path
        </button>
      </div>
    </div>
  );

  const handleAddPath = () => {
    const queryParams = {
      matchType: 'pathMatch',
      startNode: {
        label: selectedStartLabel,
        properties: pathProperties.startNode || {}
      },
      endNode: {
        label: selectedEndLabel,
        properties: pathProperties.endNode || {}
      },
      relationship: {
        types: selectedRelationshipTypes,
        minHops: parseInt(pathProperties.relationship.minHops) || 1,
        maxHops: pathProperties.relationship.maxHops ? 
          parseInt(pathProperties.relationship.maxHops) : null
      }
    };

    onQueryGenerated({
      type: 'path',
      params: queryParams
    });

    handleClosePopup();
  };

  const renderRelationshipStep = () => (
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
            <span className={styles.propertyLabel}>Path limit</span>
            <span className={styles.propertyIcon}>=</span>
            <input
              type="number"
              min="1"
              placeholder="Enter Number"
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
  );

  const handleAddNode = () => {
    const queryParams = {
      label: selectedLabel,
      properties: nodeProperties,
      limit: limit ? parseInt(limit) : undefined
    };

    onQueryGenerated({
      type: 'node',
      params: queryParams
    });

    handleClosePopup();
  };

  const handleAddRelationship = () => {
    const queryParams = {
      matchType: 'relationshipMatch',
      relationType: selectedLabel,  // 这是关系类型
      properties: relationshipProperties.relationship || {},
      // 如果有高级选项，添加节点属性
      ...(showAdvanced && {
        startNodeProps: relationshipProperties.startNode || {},
        endNodeProps: relationshipProperties.endNode || {}
      })
    };

    console.log('Sending relationship query params:', queryParams);

    onQueryGenerated({
      type: 'relationship',  // 这里正确添加了type
      params: queryParams
    });

    handleClosePopup();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        handleClosePopup();
      }
    };

    if (isPopupOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopupOpen]);

  return (
    <>
      <button className={styles.iconButton} onClick={handleOpenPopup}>
        <TbCrosshair size={24} />
      </button>
      {isPopupOpen && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent} ref={popupRef}>
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
                  {step === 2 && renderRelationshipStep()}
                </div>
              )}

              {activeAddTab === "pathMatch" && (
                <div>
                  {step === 1 && (
                    <div className={styles.stepTwo}>
                      <div className={styles.headerContainer}>
                        <h3 className={styles.headerText}>Define Path</h3>
                      </div>
                      
                      <div className={styles.scrollContainer}>
                        <div className={styles.pathMatchContainer}>
                          {/* Start Node Section */}
                          <div className={styles.nodeSection}>
                            <h4>Start Node</h4>
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
                            {selectedStartLabel && (
                              <div className={styles.propertyContainer}>
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
                            )}
                          </div>

                          {/* End Node Section */}
                          <div className={styles.nodeSection}>
                            <h4>End Node</h4>
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
                            {selectedEndLabel && (
                              <div className={styles.propertyContainer}>
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
                            )}
                          </div>

                          {/* Path Properties Section */}
                          <div className={styles.pathPropertiesSection}>
                            <h4>Path Properties</h4>
                            
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
                          disabled={!selectedStartLabel || !selectedEndLabel || selectedRelationshipTypes.length === 0}
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

export default AddTab;

import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/AddTab.module.css"; // Update with your actual styles path
import { TbCrosshair } from "react-icons/tb";

const AddTab = ({ AddTabNodeEntities: nodeEntities, AddTabRelationshipEntities: relationshipEntities }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activeAddTab, setActiveAddTab] = useState("addNode");
  const [step, setStep] = useState(1); // Current step
  const [selectedLabel, setSelectedLabel] = useState("");
  const popupRef = useRef(null);

  const handleOpenPopup = () => setIsPopupOpen(true);

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setStep(1); // Reset step to 1 when closing
    setSelectedLabel(""); // Reset selected label
  };

  const handleAddTabSwitch = (tab) => {
    if (step === 1) {
      setActiveAddTab(tab);
      setSelectedLabel("");
    }
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
                className={`${styles.tabButton} ${
                  activeAddTab === "addNode" ? styles.activeTab : ""
                }`}
                onClick={() => handleAddTabSwitch("addNode")}
                disabled={step > 1}
              >
                Add Node
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeAddTab === "addRelationship" ? styles.activeTab : ""
                }`}
                onClick={() => handleAddTabSwitch("addRelationship")}
                disabled={step > 1}
              >
                Add Relationship
              </button>
            </div>
            <div className={styles.tabContent}>
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
                        </div>
                        <div className={styles.propertyContainer}>
                        {relationshipEntities[selectedLabel]?.map((property, index) => (
                            <div key={index} className={styles.propertyRow}>
                            <span className={styles.propertyLabel}>{property}</span>
                            <span className={styles.propertyIcon}>=</span>
                            <input
                                type="text"
                                placeholder={`Enter ${property}`}
                                className={styles.propertyInput}
                            />
                            </div>
                        ))}
                        <div className={styles.propertyRow}>
                          <span className={styles.propertyLabel}>Path limit</span>
                          <span className={styles.propertyIcon}>=</span>
                          <input
                              type="text"
                              placeholder={`Enter Number`}
                              className={styles.propertyInput}
                          />
                        </div>
                        </div>
                        <div className={styles.buttonContainer}>
                        <button className={styles.backButton} onClick={() => setStep(1)}>
                            Back
                        </button>
                        <button className={styles.addButton} onClick={handleClosePopup}>
                            Add
                        </button>
                        </div>
                    </div>
                    )}
                </div>
              )}

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
                        </div>
                        <div className={styles.propertyContainer}>
                        {nodeEntities[selectedLabel]?.map((property, index) => (
                            <div key={index} className={styles.propertyRow}>
                            <span className={styles.propertyLabel}>{property}</span>
                            <span className={styles.propertyIcon}>=</span>
                            <input
                                type="text"
                                placeholder={`Search for ${property}`}
                                className={styles.propertyInput}
                            />
                            </div>
                        ))}
                        <div className={styles.propertyRow}>
                          <span className={styles.propertyLabel}>Number limit</span>
                          <span className={styles.propertyIcon}>=</span>
                          <input
                              type="text"
                              placeholder={`Enter Number`}
                              className={styles.propertyInput}
                          />
                        </div>
                        </div>
                        <div className={styles.buttonContainer}>
                        <button className={styles.backButton} onClick={() => setStep(1)}>
                            Back
                        </button>
                        <button className={styles.addButton} onClick={handleClosePopup}>
                            Add
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

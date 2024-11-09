import { useState, useEffect } from 'react';
import styles from '../styles/playground.module.css';
import Image from 'next/image';
import SearchBox from '../components/SearchBox';
import SearchResults from '../components/SearchResults';

export default function Playground() {
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDatabaseMenuOpen, setIsDatabaseMenuOpen] = useState(false);
  const [protocol, setProtocol] = useState('bolt://');
  const [connectUrl, setConnectUrl] = useState('');
  const [serverUsername, setServerUsername] = useState('');
  const [serverPassword, setServerPassword] = useState('');
  const [openSettingsIndex, setOpenSettingsIndex] = useState(null);
  const [nodeLabels, setNodeLabels] = useState([]);
  const [expandedLabel, setExpandedLabel] = useState(null); // Track which label is expanded
  const [nodeEntities, setNodeEntities] = useState({}); // Store entities for each label
  const [relationshipTypes, setRelationshipTypes] = useState([]);
  const [expandedRelationship, setExpandedRelationship] = useState(null);
  const [relationshipEntities, setRelationshipEntities] = useState({});
  const [propertyKeys, setPropertyKeys] = useState([]);
  const [isNodeLabelsOpen, setIsNodeLabelsOpen] = useState(false);
  const [isRelationshipTypesOpen, setIsRelationshipTypesOpen] = useState(false);
  const [isPropertyKeysOpen, setIsPropertyKeysOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState({
    nodeEntities: [],
    relationshipEntities: [],
    propertyKeys: [],
  });

  const data = {
    nodeEntities,
    relationshipEntities,
    propertyKeys,
  };

  const [graphNodes, setGraphNodes] = useState([]);
  const [graphRelationships, setGraphRelationships] = useState([]);

  const handleSearch = (query) => {
    const lowerCaseQuery = query.toLowerCase();

    // Grouped results by type
    const results = {
      nodeEntities: Object.entries(data.nodeEntities).flatMap(([label, entities]) =>
        entities.filter(entity => entity.toLowerCase().includes(lowerCaseQuery))
      ),
      relationshipEntities: Object.entries(data.relationshipEntities).flatMap(([type, entities]) =>
        entities.filter(entity => entity.some(e => e.toLowerCase().includes(lowerCaseQuery)))
      ),
      propertyKeys: data.propertyKeys.filter(key => key.toLowerCase().includes(lowerCaseQuery)),
    };

    setFilteredResults(results);
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await fetch('http://localhost:8000/get_user_databases/', {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
        });

        if (!response.ok) {
          throw new Error('Failed to fetch databases');
        }

        const data = await response.json();
        if (data.success) {
          setDatabases(data.databases);
        } else {
          console.error(data.error);
        }
      } catch (error) {
        console.error('Error fetching databases:', error);
      }
    };

    fetchDatabases();
  }, []);

  const handleDatabaseSelection = async (url) => {
    try {
      const csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrftoken='))
        ?.split('=')[1];

      const response = await fetch('http://localhost:8000/select_database/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ selectedUrl: url }),
        credentials: 'include',
      });

      const result = await response.json();
      if (result.success) {
        setSelectedDatabase(url);
        alert('Database selected and connected successfully.');

        // 在数据库选择成功后调用 fetchDatabaseInfo 获取数据库信息
        await fetchDatabaseInfo();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error selecting database:', error);
      alert('Error selecting database.');
    }
  };

  const handleAddDatabase = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleToggleSettingsMenu = (index) => {
    setOpenSettingsIndex(openSettingsIndex === index ? null : index);
  };

  const handleToggleDatabaseMenu = () => {
    setIsDatabaseMenuOpen(!isDatabaseMenuOpen);
    console.log('Database menu open:', !isDatabaseMenuOpen);
  };

  const handleDeleteDatabase = async (url) => {
    if (databases.length <= 1) {
      alert('You must have at least one database.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/delete_database/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        credentials: 'include', // Include cookies for authentication
      });

      const result = await response.json();
      if (result.success) {
        // Update the local state to remove the deleted database
        setDatabases(databases.filter((db) => db.url !== url));
        alert('Database deleted successfully.');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting database:', error);
      alert('Error deleting database.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const fullUrl = `${protocol}${connectUrl}`;

    try {
      const response = await fetch('http://localhost:8000/add_database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullUrl,
          serverUsername,
          serverPassword,
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert('Database added successfully!');
        setIsModalOpen(false);
        // 处理成功后的其他逻辑，比如刷新数据库列表
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding database:', error);
    }
  };

  // Function to fetch node labels, relationship types, and property keys from the back-end
  const fetchDatabaseInfo = async () => {
    try {
      const response = await fetch('http://localhost:8000/get_database_info/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setNodeLabels(data.labels || []);
        setRelationshipTypes(data.relationship_types || []);
        setPropertyKeys(data.property_keys || []);

        // Wait until nodeLabels and relationshipTypes are set, then fetch entities
        for (const label of data.labels || []) {
          await fetchEntitiesForLabel(label);
        }
        for (const type of data.relationship_types || []) {
          await fetchEntitiesForRelationship(type);
        }
      } else {
        console.error("Error fetching database info:", data.error);
      }
    } catch (error) {
      console.error("Error fetching database info:", error);
    }
  };

  // Fetch entities for a given label when it is expanded
  const fetchEntitiesForLabel = (label) => {
    fetch('http://localhost:8000/get_nodeEntities/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ label }),
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setNodeEntities((prevEntities) => {
            const updatedEntities = { ...prevEntities, [label]: data.nodeEntities };
            console.log("Entities for each label after update:", updatedEntities);
            return updatedEntities;
          });
        } else {
          alert('Error fetching entities: ' + data.error);
        }
      })
      .catch((error) => console.error('Error fetching entities:', error));
  };

  // Fetch entities for a given relationship type when it is expanded
  const fetchEntitiesForRelationship = (type) => {
    fetch('http://localhost:8000/get_relationshipEntities/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setRelationshipEntities((prevEntities) => {
            const updatedEntities = { ...prevEntities, [type]: data.relationshipEntities };
            console.log("Entities for each relationship type after update:", updatedEntities);
            return updatedEntities;
          });
        } else {
          alert('Error fetching entities: ' + data.error);
        }
      })
      .catch((error) => console.error('Error fetching entities:', error));
  };

  const toggleNodeLabels = () => setIsNodeLabelsOpen(!isNodeLabelsOpen);
  const toggleRelationshipTypes = () => setIsRelationshipTypesOpen(!isRelationshipTypesOpen);
  const togglePropertyKeys = () => setIsPropertyKeysOpen(!isPropertyKeysOpen);
  const toggleExpandedLabel = (label) => {
    setExpandedLabel(expandedLabel === label ? null : label); // Toggle between expanded and collapsed
  };
  const toggleExpandedRelationship = (type) => {
    setExpandedRelationship(expandedRelationship === type ? null : type); // Toggle between expanded and collapsed
  };

  return (
    <div className={styles.flexColumn}>
      <section className={`${styles.playground} ${styles.mainContentSection}`}>
        <div className={styles.contentBoxGroup}>
          <div className={styles.flexRowHeader}>
            <div className={styles.brandingContainer}>
              <Image
                className={styles.brandingImage}
                src="/assets/0fbf1a91f14780ce3fa9a491a86c9449.svg"
                alt="alt text"
                width={100}
                height={50}
              />
              <div className={styles.brandingTextContainer}>
                <p className={styles.brandingNameText}>SMARTD</p>
                <p className={styles.brandingStudioText}>STUDIO</p>
              </div>
            </div>
            <a href="/" className={styles.navItemHome}>Home</a>
            <a href="/playground" className={styles.navItemPlayground}>Playground</a>
            <p className={styles.navItemTutorial}>Tutorial</p>
            <p className={styles.navItemAbout}>About</p>
          </div>
        </div>

        <div className={styles.featureGroup}>
          <div className={styles.flexRowFeatures}>
            <div className={styles.featureContentBox}>
              <div className={styles.featureColumnBox}>
                <div className={styles.flexRowInfoDatabase}>
                  <div className={styles.flexRowDatabaseImages} onClick={handleToggleDatabaseMenu}>
                    <Image
                      className={styles.imageDatabase}
                      src="/assets/b8cc5f09c290b9922de3d8a93473af01.svg"
                      alt="alt text"
                      width={50}
                      height={50}
                    />
                    <p className={styles.featureTextUseDatabase}>Use database</p>
                    <Image
                      className={`${styles.imageDatabaseExtra} ${isDatabaseMenuOpen ? styles.rotate : ''}`}
                      src="/assets/c1122939168fb69f50f3e2f253333e62.svg"
                      alt="extra options"
                      width={20}
                      height={20}
                    />
                  </div>

                  {/* 数据库菜单部分，只有在 isDatabaseMenuOpen 为 true 时才显示 */}
                  {isDatabaseMenuOpen && (
                    <div className={`${styles.databaseMenu} show`} onClick={() => console.log('Menu is rendered')}>
                        <div className={styles.addDatabaseSection}>
                            <button id="addDatabaseBtn" className={styles.addDatabaseBtn}
                            // clickout to close the AddDatabase
                            onClick= {() => {
                                handleAddDatabase();
                                document.addEventListener('click', (e) => {
                                if (!e.target.closest(`.${styles.addDatabaseBtn}`)) {
                                    setIsModalOpen(false);
                                }
                                });
                            }}
                            >+ Add New Database</button>
                        </div>

                        {databases.map((db, index) => (
                        <div
                            key={index}
                            className={`${styles.databaseItem} ${selectedDatabase === db.url ? styles.selected : ''}`}
                            onClick={() => handleDatabaseSelection(db.url)}
                        >
                            <span className={`${styles.selectedLabel} ${selectedDatabase === db.url ? '' : styles.hidden}`}>
                            <Image
                                src="/assets/asd953aa98cdd54cef71b5b8167386wa.svg"
                                alt="check icon"
                                width={20}
                                height={20}
                            />
                            </span>
                            <p>{db.url.replace('neo4j://', '').replace('bolt://', '').replace('neo4j+s://', '').replace('bolt+s://', '')}</p>
                            <input type="hidden" className={styles.fullUrl} value={db.url} />
                            <Image
                            className={styles.settingsIcon}
                            src="/assets/e21aaacasc3469ef458c264147aer45c.svg"
                            alt="settings icon"
                            width={20}
                            height={20}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevents the parent `onClick` from being triggered
                                handleToggleSettingsMenu(index);
                                // clickout to close the settings menu
                                document.addEventListener('click', (e) => {
                                if (!e.target.closest(`.${styles.settingsMenu}`)) {
                                    setOpenSettingsIndex(null);
                                }
                                });
                              }}
                            />

                            {/* Settings menu, shown if openSettingsIndex matches the current index */}
                            {openSettingsIndex === index && (
                            <div className={`${styles.settingsMenu}`}>
                                <button
                                className={styles.settingsMenuItem}
                                onClick={() => handleDeleteDatabase(db.url)}
                                >
                                Delete Database
                                </button>
                            </div>
                            )}
                        </div>
                        ))}
                    </div>
                    )}

                    {/* 模态框部分 */}
                    {isModalOpen && (
                    <div className={styles.modal}>
                        <div className={styles['modal-content']}>
                        <span className={styles.closeBtn} onClick={handleCloseModal}>&times;</span>
                        <form onSubmit={handleFormSubmit}>
                            <div className={styles['input-group']}>
                            <label htmlFor="addDatabaseProtocol">Connect URL</label>
                            <div className={styles['input-flex']}>
                                <select
                                value={protocol}
                                onChange={(e) => setProtocol(e.target.value)}
                                >
                                <option value="neo4j://">neo4j://</option>
                                <option value="bolt://">bolt://</option>
                                <option value="neo4j+s://">neo4j+s://</option>
                                <option value="bolt+s://">bolt+s://</option>
                                </select>
                                <input
                                type="text"
                                value={connectUrl}
                                onChange={(e) => setConnectUrl(e.target.value)}
                                placeholder="192.168.0.54:7687"
                                required
                                />
                            </div>
                            </div>
                            <div className={styles['input-group']}>
                            <label htmlFor="serverUsername">Server Username</label>
                            <input
                                type="text"
                                value={serverUsername}
                                onChange={(e) => setServerUsername(e.target.value)}
                                placeholder="Enter server username"
                                required
                            />
                            </div>
                            <div className={styles['input-group']}>
                            <label htmlFor="serverPassword">Server Password</label>
                            <input
                                type="password"
                                value={serverPassword}
                                onChange={(e) => setServerPassword(e.target.value)}
                                placeholder="Enter server password"
                                required
                            />
                            </div>
                            <button type="submit" className={styles['submit-btn']}>
                            Connect Database
                            </button>
                        </form>
                        </div>
                    </div>
                    )}
                </div>

                <div className={styles.searchFeatureContentBox}>
                  <div className={styles.flexRowSearchFeature}>
                    <Image
                      className={styles.imageSearchFeature}
                      src="/assets/5ef24176ffb1a63d056fe2471d9a3805.svg"
                      alt="search icon"
                      width={30}
                      height={30}
                    />
                    <input
                      type="text"
                      placeholder="Search for..."
                      value={searchQuery}
                      onChange={handleSearchInput}
                      className={styles.searchInput}
                    />
                  </div>

                  {/* Display categorized search results */}
                  <div className={styles.searchResults}>
                    {Object.entries(filteredResults).map(([category, results]) => (
                      results.length > 0 && (
                        <div key={category} className={styles.searchCategory}>
                          <h4 className={styles.categoryTitle}>{category}</h4>
                          {results.map((result, idx) => (
                            <div key={idx} className={styles.searchResultItem}>
                              <span className={styles.resultName}>{result}</span>
                            </div>
                          ))}
                        </div>
                      )
                    ))}
                  </div>
                </div>

                <div className={styles.flexRowGraphInfo}>
                  <Image
                    className={styles.imageGraphInfo}
                    src="/assets/93f66d49f8cec41f326c7bb705c4363e.svg"
                    alt="graph info"
                    width={30}
                    height={30}
                  />
                  <p className={styles.featureTextInGraph}>In Graph</p>
                </div>

                <div className={styles.nodeLabelContentBox}>
                  <div className={styles.flexColumnNodeLabels}>
                    <div className={styles.flexRowNodeImage}>
                      <Image
                        className={styles.imageNode}
                        src="/assets/5c7bc533b46918472c06b5da9e3111a7.svg"
                        alt="node"
                        width={30}
                        height={30}
                      />
                      <div className={styles.infoNodeCount}>Node (0)</div>
                    </div>
                    <div className={styles.flexRowRelationshipInfo}>
                      <Image
                        className={styles.imageRelationship}
                        src="/assets/461cd4b84fab404232553c25b46adbe5.svg"
                        alt="relationship"
                        width={30}
                        height={30}
                      />
                      <div className={styles.infoRelationshipCount}>Relationship (0)</div>
                    </div>
                  </div>
                </div>

                <div className={styles.nodeLabelsContentBox}>
                  <div className={styles.flexRowNodeLabels}  onClick={toggleNodeLabels}>
                    <Image
                      className={styles.imageNodeLabels}
                      src="/assets/f39953aa98cdd54cef71b5b81673864d.svg"
                      alt="node labels"
                      width={30}
                      height={30}
                    />
                    <p className={styles.featureTextNodeLabels}>Node labels</p>
                    <Image
                      className={`${styles.imageNodeLabelsExtra} ${isNodeLabelsOpen ? styles.rotate : ''}`}
                      src="/assets/c1122939168fb69f50f3e2f253333e62.svg"
                      alt="expand"
                      width={20}
                      height={20}
                    />
                  </div>
                  {isNodeLabelsOpen && (
                  <div id="nodeLabelsList" className={styles.nodeLabelsList}>
                    {nodeLabels.map((label, index) => (
                      <div key={index} className={styles.labelItemContainer}>
                        <div className={styles.labelItem} onClick={() => toggleExpandedLabel(label)}>
                          {label}
                          <Image
                            className={`${styles.imageNodeLabelsExtra} ${expandedLabel === label ? styles.rotate : ''}`}
                            src="/assets/c1122939168fb69f50f3e2f253333e62.svg"
                            alt="expand"
                            width={20}
                            height={20}
                          />
                        </div>
                        {expandedLabel === label && nodeEntities[label] && (
                        <div className={styles.entityList}>
                          {nodeEntities[label].map((entity, idx) => (
                            <div key={idx} className={styles.entityItemContainer}>
                              <p className={styles.entityItem}>{entity}</p>
                              <Image
                                src="/assets/add.svg"
                                alt="add"
                                width={20}
                                height={20}
                                className={styles.addButton}
                                onClick={() => handleAddEntity(entity)}
                              />
                            </div>
                          ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  )}
                </div>

                <div className={styles.relationshipTypesContentBox}>
                  <div className={styles.flexRowRelationshipTypes} onClick={toggleRelationshipTypes}>
                    <Image
                      className={styles.imageRelationshipTypes}
                      src="/assets/af00d02696e9f28253626de3f4913e06.svg"
                      alt="relationship types"
                      width={30}
                      height={30}
                    />
                    <p className={styles.featureTextRelationshipTypes}>Relationship types</p>
                    <Image
                      className={`${styles.imageRelationshipTypesExtra} ${isRelationshipTypesOpen ? styles.rotate : ''}`}
                      src="/assets/c1122939168fb69f50f3e2f253333e62.svg"
                      alt="expand"
                      width={20}
                      height={20}
                    />
                  </div>
                  {isRelationshipTypesOpen && (
                    <div id="relationshipTypesList" className={styles.relationshipTypesList}>
                      {relationshipTypes.map((type, index) => (
                        <div key={index} className={styles.typeItemContainer}>
                          <p className={styles.typeItem} onClick={() => toggleExpandedRelationship(type)}>
                            {type}
                            <Image
                              className={`${styles.imageRelationshipTypesExtra} ${expandedRelationship === type ? styles.rotate : ''}`}
                              src="/assets/c1122939168fb69f50f3e2f253333e62.svg"
                              alt="expand"
                              width={20}
                              height={20}
                            />
                          </p>
                          {expandedRelationship === type && relationshipEntities[type] && (
                            <div className={styles.entityList}>
                              {relationshipEntities[type].map((entity, idx) => (
                                <div key={idx} className={styles.entityGroup}>
                                  <div className={styles.entityItemContainer}>
                                    <div className={styles.relationshipEntityItemContainer}>
                                      {/* First line: Display the first element of the entity */}
                                      <p className={styles.entityItem}>{entity[0]}</p>

                                      {/* Second line: Centered arrow icon */}
                                      <div className={styles.arrowContainer}>
                                        <Image
                                          src="/assets/cc-arrow-down.svg"
                                          alt="arrow down"
                                          width={20}
                                          height={20}
                                          className={styles.arrowIcon}
                                        />
                                      </div>

                                      {/* Third line: Display the second element of the entity */}
                                      <p className={styles.entityItem}>{entity[1]}</p>
                                    </div>
                                    <Image
                                      src="/assets/add.svg"
                                      alt="add"
                                      width={20}
                                      height={20}
                                      className={styles.addButton}
                                      onClick={() => handleAddEntity(entity)}
                                    />
                                  </div>
                                  {/* Separator line */}
                                  <div className={styles.separator}></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.propertyKeysContentBox}>
                  <div className={styles.flexRowPropertyKeys} onClick={togglePropertyKeys}>
                    <Image
                      className={styles.imagePropertyKeys}
                      src="/assets/d819e70012ea9e1d2487b007aec7b35b.svg"
                      alt="property keys"
                      width={30}
                      height={30}
                    />
                    <p className={styles.featureTextPropertyKeys}>Property keys</p>
                    <Image
                      className={`${styles.imagePropertyKeysExtra} ${isPropertyKeysOpen ? styles.rotate : ''}`}
                      src="/assets/c1122939168fb69f50f3e2f253333e62.svg"
                      alt="expand"
                      width={20}
                      height={20}
                    />
                  </div>
                  {isPropertyKeysOpen && (
                    <div id="propertyKeysList" className={styles.propertyKeysList}>
                        {/* 动态加载 property keys */}
                        {propertyKeys.map((key, index) => (
                            <p key={index} className={styles.keyItem}>{key}</p>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.flexRowGalleryImages}>
          <Image
            className={styles.imageGallery1}
            src="/assets/1a56e8e208ac2c0c653ced0adf8f94e4.svg"
            alt="Gallery 1"
            width={100}
            height={100}
          />
          <Image
            className={styles.imageGallery2}
            src="/assets/a905b1857bdcb12b37a25f21999ed4b6.svg"
            alt="Gallery 2"
            width={100}
            height={100}
          />
          <Image
            className={styles.imageGallery3}
            src="/assets/c4c5271e3a965c1947519f3d1043ca07.svg"
            alt="Gallery 3"
            width={100}
            height={100}
          />
          <Image
            className={styles.imageGallery4}
            src="/assets/da4eefaf0a92648334ca6ec4b0a024bb.svg"
            alt="Gallery 4"
            width={100}
            height={100}
          />
          <Image
            className={styles.imageGallery5}
            src="/assets/c1e0f400b1ed9085e7051a447b48c9d8.svg"
            alt="Gallery 5"
            width={100}
            height={100}
          />
        </div>
      </section>
    </div>
  );
}

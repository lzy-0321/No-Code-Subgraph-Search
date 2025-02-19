import { useRef, useState, useEffect } from 'react';
import styles from '../styles/playground.module.css';
import Image from 'next/image';
import { searchData } from '../utils/searchUtils';
import dynamic from 'next/dynamic';
import Filter from '../components/Filter';
import AddTab from "../components/AddTab";
import GraphInfoDisplay from '../components/GraphInfoDisplay';
import { TbCrosshair, TbTrash } from 'react-icons/tb';
import DatabaseManager from '../components/Database/DatabaseManager';

// 动态加载 GraphComponent
const DrawGraph = dynamic(() => import('../components/DrawGraph'), { ssr: false });

class QueryParamsGenerator {
  constructor() {
    this.queryParams = {
      matchType: 'allNodes',
      label: '',
      nodeProperties: {},
      relationship: {},
      whereClause: '',
      returnFields: ['n'],
      optional: false,
      useWithClause: false,
      aggregate: false,
      multipleMatches: false,
      variableLength: {
        enabled: false,
        minHops: 1,
        maxHops: null
      }
    };
  }

  // 根据节点标签生成查询
  generateLabelQuery(label) {
    return {
      ...this.queryParams,
      matchType: 'labelMatch',
      label: label,
      returnFields: ['n']
    };
  }

  // 根据节点属性生成查询
  generatePropertyQuery(label, properties) {
    return {
      ...this.queryParams,
      matchType: 'propertyMatch',
      label: label,
      nodeProperties: properties,
      returnFields: ['n']
    };
  }

  // 根据关系生成查询
  generateRelationshipQuery(startLabel, relationType, endLabel, relationshipProps = {}, variableLength = null) {
    const query = {
      ...this.queryParams,
      matchType: 'relationshipMatch',
      label: startLabel,
      relationship: {
        type: relationType,
        properties: relationshipProps
      },
      returnFields: ['a', 'b']
    };

    if (variableLength) {
      query.variableLength = {
        enabled: true,
        minHops: variableLength.minHops || 1,
        maxHops: variableLength.maxHops
      };
    }

    return query;
  }

  // 添加WHERE子句
  addWhereClause(query, whereClause) {
    return {
      ...query,
      whereClause: whereClause
    };
  }

  // 添加聚合
  addAggregation(query, aggregateFields) {
    return {
      ...query,
      aggregate: true,
      returnFields: aggregateFields
    };
  }
}

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
  const [nodePrimeEntities, setNodePrimeEntities] = useState({}); // Store entities for each label
  const [nodeEntities, setNodeEntities] = useState({});
  const [relationshipTypes, setRelationshipTypes] = useState([]);
  const [expandedRelationship, setExpandedRelationship] = useState(null);
  const [relationshipPrimeEntities, setRelationshipPrimeEntities] = useState({});
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

  const [graphNodes, setGraphNodes] = useState([
    // { id: 1, nodeLabel: 'PERSON', properties: { name: 'Alice', age: 30, role: 'Engineer' } },
    // { id: 2, nodeLabel: 'PERSON', properties: { name: 'Bob', age: 25, role: 'Designer' } },
    // { id: 3, nodeLabel: 'KNOWLEDGE', properties: { title: 'Graph Database', type: 'Tutorial', category: 'Technology' } },
    // { id: 4, nodeLabel: 'PERSON', properties: { name: 'Charlie', age: 35, role: 'Manager' } },
    // { id: 5, nodeLabel: 'KNOWLEDGE', properties: { title: 'Graph Science', type: 'Tutorial', category: 'Technology' } },
  ]);
  const [graphRelationships, setGraphRelationships] = useState([
    // { startNode: 1, endNode: 2, type: 'FRIEND', properties: { since: '2020', frequency: 'Weekly' } },
    // { startNode: 1, endNode: 3, type: 'LIKES', properties: { since: '2019', frequency: 'Monthly' } },
    // { startNode: 2, endNode: 3, type: 'LIKES', properties: { since: '2018', frequency: 'Daily' } },
    // { startNode: 4, endNode: 5, type: 'LIKES', properties: { since: '2016', frequency: 'Monthly' } },
  ]);
  const [graphNodesBuffer, setGraphNodesBuffer] = useState([]);
  const [graphRelationshipsBuffer, setGraphRelationshipsBuffer] = useState([]);

  //每一次更新 graphNodes 和 graphRelationships 时，都需要检查是否有重复的节点和关系，
  // 如果有重复的节点和关系，需要将重复的节点和关系去重
  //检查完成之后才允许GraphComponent渲染
  const [isDataClean, setIsDataClean] = useState(false);
  const deduplicateNodes = (nodes) => {
    const seen = new Set();
    return nodes.filter(node => {
      if (seen.has(node.id)) {
        return false;
      }
      seen.add(node.id);
      return true;
    });
  };

  const deduplicateRelationships = (relationships) => {
    const seen = new Set();
    return relationships.filter(rel => {
      const key = `${rel.startNode}-${rel.endNode}-${rel.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  useEffect(() => {
    const uniqueNodes = deduplicateNodes(graphNodes);
    const uniqueRelationships = deduplicateRelationships(graphRelationships);

    let nodesUpdated = false;
    let relationshipsUpdated = false;

    if (uniqueNodes.length !== graphNodes.length) {
      setGraphNodes(uniqueNodes);
      nodesUpdated = true;
    }

    if (uniqueRelationships.length !== graphRelationships.length) {
      setGraphRelationships(uniqueRelationships);
      relationshipsUpdated = true;
    }

    // Set readiness only after ensuring data is clean
    if (!nodesUpdated && !relationshipsUpdated) {
      setIsDataClean(true);
    } else {
      setIsDataClean(false);
    }
  }, [graphNodes, graphRelationships]);

  const cleanUp = () => {
    setNodeLabels([]);
    setExpandedLabel(null);
    setNodePrimeEntities({});
    setRelationshipTypes([]);
    setExpandedRelationship(null);
    setRelationshipPrimeEntities({});
    setPropertyKeys([]);
    setIsNodeLabelsOpen(false);
    setIsRelationshipTypesOpen(false);
    setIsPropertyKeysOpen(false);
    setSearchQuery('');
    setFilteredResults({
      nodeEntities: [],
      relationshipEntities: [],
      propertyKeys: [],
    });
  };

  const [tabs, setTabs] = useState([
    {
      id: 1,
      title: 'Tab 1',
      databaseInfo: { protocol: 'bolt://', connectUrl: '', selectedDatabase: null },
      graphData: {
        graphNodes: [], // Nodes for the graph
        graphRelationships: [], // Relationships for the graph
        graphNodesBuffer: [],
        graphRelationshipsBuffer: [],
      },
      nodeInfo: { nodeLabels: [], expandedLabel: null, nodeEntities: {} },
      relationshipInfo: { relationshipTypes: [], expandedRelationship: null, relationshipEntities: {} },
      propertyInfo: { propertyKeys: [] },
      uiState: {
        isNodeLabelsOpen: false,
        isRelationshipTypesOpen: false,
        isPropertyKeysOpen: false,
        searchQuery: '',
        filteredResults: {
          nodeEntities: [],
          relationshipEntities: [],
          propertyKeys: [],
        },
      },
    },
  ]);

  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    if (!tabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(1);
    }
  }, [tabs]);

  const saveCurrentTabState = () => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTab
          ? {
              ...tab,
              graphData: {
                graphNodes: graphNodes,
                graphRelationships: graphRelationships,
                graphNodesBuffer: graphNodesBuffer,
                graphRelationshipsBuffer: graphRelationshipsBuffer,
              },
              nodeInfo: {
                nodeLabels,
                expandedLabel,
                nodeEntities: nodePrimeEntities,
              },
              relationshipInfo: {
                relationshipTypes,
                expandedRelationship,
                relationshipEntities: relationshipPrimeEntities,
              },
              propertyInfo: {
                propertyKeys,
              },
              uiState: {
                isNodeLabelsOpen,
                isRelationshipTypesOpen,
                isPropertyKeysOpen,
                searchQuery,
                filteredResults,
              },
            }
          : tab
      )
    );
  };

  // 存储当前tab的状态
  // 清楚页面上的所有数据
  // 切换到新的tab
  // 从新的tab中恢复数据
  const handleTabSwitch = (tabId) => {
    saveCurrentTabState();
    cleanUp();

    const newTab = tabs.find((tab) => tab.id === tabId);
    if (newTab) {
      setNodeLabels(newTab.nodeInfo.nodeLabels || []);
      setExpandedLabel(newTab.nodeInfo.expandedLabel || null);
      setNodePrimeEntities(newTab.nodeInfo.nodeEntities || {});

      setRelationshipTypes(newTab.relationshipInfo.relationshipTypes || []);
      setExpandedRelationship(newTab.relationshipInfo.expandedRelationship || null);
      setRelationshipPrimeEntities(newTab.relationshipInfo.relationshipEntities || {});

      setPropertyKeys(newTab.propertyInfo.propertyKeys || []);

      setIsNodeLabelsOpen(newTab.uiState.isNodeLabelsOpen || false);
      setIsRelationshipTypesOpen(newTab.uiState.isRelationshipTypesOpen || false);
      setIsPropertyKeysOpen(newTab.uiState.isPropertyKeysOpen || false);

      setSearchQuery(newTab.uiState.searchQuery || '');
      setFilteredResults(newTab.uiState.filteredResults || {
        nodeEntities: [],
        relationshipEntities: [],
        propertyKeys: [],
      });

      // Restore graph data
      setGraphNodes(newTab.graphData.graphNodes || []);
      setGraphRelationships(newTab.graphData.graphRelationships || []);
      setGraphNodesBuffer(newTab.graphData.graphNodesBuffer || []);
      setGraphRelationshipsBuffer(newTab.graphData.graphRelationshipsBuffer || []);

      setActiveTab(tabId);
    }
  };

  const handleAddTab = () => {
    const newTabId = tabs.length > 0 ? tabs[tabs.length - 1].id + 1 : 1;

    // Save the current tab state
    saveCurrentTabState();

    // Add the new tab
    const newTab = {
      id: newTabId,
      title: `Tab ${newTabId}`,
      databaseInfo: { protocol: 'bolt://', connectUrl: '', selectedDatabase: null },
      nodeInfo: { nodeLabels: [], expandedLabel: null, nodeEntities: {} },
      relationshipInfo: { relationshipTypes: [], expandedRelationship: null, relationshipEntities: {} },
      propertyInfo: { propertyKeys: [] },
      uiState: {
        isNodeLabelsOpen: false,
        isRelationshipTypesOpen: false,
        isPropertyKeysOpen: false,
        searchQuery: '',
        filteredResults: {
          nodeEntities: [],
          relationshipEntities: [],
          propertyKeys: [],
        },
      },
      graphData: {
        graphNodes: [], // Nodes for the graph
        graphRelationships: [], // Relationships for the graph
        graphNodesBuffer: [],
        graphRelationshipsBuffer: [],
      },
    };

    setTabs((prevTabs) => [...prevTabs, newTab]);
    setActiveTab(newTabId);

    // Clear the current state after the new tab is active
    cleanUp();
  };

  const handleCloseTab = (tabId) => {
    if (tabId === activeTab) {
      saveCurrentTabState();
    }

    setTabs((prevTabs) => prevTabs.filter((tab) => tab.id !== tabId));

    if (activeTab === tabId && tabs.length > 1) {
      setActiveTab(tabs[0].id);
    } else if (tabs.length === 1) {
      setActiveTab(null);
    }
  };

  const handleSearch = (query) => {
    if (!query.trim()) {
      // If the query is empty, reset the filtered results to empty
      setFilteredResults({
        nodeEntities: [],
        relationshipEntities: [],
        propertyKeys: [],
      });
      return;
    }

    // Normalize query and prepare data
    const lowerCaseQuery = query.toLowerCase();

    // Filter node entities
    const filteredNodeEntities = Object.entries(nodePrimeEntities).flatMap(([label, entities]) =>
      searchData(
        entities, // Array of strings
        lowerCaseQuery, // Query
        (entity) => entity, // Directly use the string entity for filtering
        (entity, index) => `${label}-${index}` // Generate an ID based on the label and index
      )
    );
    console.log("Filtered nodeEntities:", filteredNodeEntities);

    // Filter relationship entities
    const filteredRelationshipEntities = Object.entries(relationshipPrimeEntities).flatMap(([type, entities]) =>
      searchData(
        entities,
        lowerCaseQuery,
        (entity) => entity.join(' '), // Accessor for combined entity properties
        (entity) => entity.id // Accessor for relationship id
      )
    );

    // Filter property keys
    const filteredPropertyKeys = searchData(
      propertyKeys,
      lowerCaseQuery,
      (key) => key // Accessor for property key
    );

    // Aggregate results
    const results = {
      nodeEntities: filteredNodeEntities,
      relationshipEntities: filteredRelationshipEntities,
      propertyKeys: filteredPropertyKeys,
    };

    // Update state
    setFilteredResults(results);
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const tabContentRef = useRef(null); // 用于获取 tabContent 的 DOM
  const [tabContentBounds, setTabContentBounds] = useState(null);

  useEffect(() => {
    if (tabContentRef.current) {
      setTabContentBounds(tabContentRef.current.getBoundingClientRect());
    }
    const handleResize = () => {
      if (tabContentRef.current) {
        setTabContentBounds(tabContentRef.current.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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

  const handleDatabaseSelect = (url) => {
    setSelectedDatabase(url);
  };

  const handleDatabaseInfoFetch = (dbInfo) => {
    // 一次性更新所有状态
    setNodeLabels(dbInfo.labels);
    setRelationshipTypes(dbInfo.relationshipTypes);
    setPropertyKeys(dbInfo.propertyKeys);
    setNodePrimeEntities(dbInfo.nodePrimeEntities);
    setNodeEntities(dbInfo.nodeEntities);
    setRelationshipPrimeEntities(dbInfo.relationshipPrimeEntities);
    setRelationshipEntities(dbInfo.relationshipEntities);

    // 更新当前标签页的数据库信息
    if (activeTab) {
      const updatedTabs = tabs.map(tab => {
        if (tab.id === activeTab) {
          return {
            ...tab,
            databaseInfo: {
              ...tab.databaseInfo,
              selectedDatabase: dbInfo.selectedDatabase
            }
          };
        }
        return tab;
      });
      setTabs(updatedTabs);
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

  const toggleNodeLabels = () => setIsNodeLabelsOpen(!isNodeLabelsOpen);
  const toggleRelationshipTypes = () => setIsRelationshipTypesOpen(!isRelationshipTypesOpen);
  const togglePropertyKeys = () => setIsPropertyKeysOpen(!isPropertyKeysOpen);
  const toggleExpandedLabel = (label) => {
    setExpandedLabel(expandedLabel === label ? null : label); // Toggle between expanded and collapsed
  };
  const toggleExpandedRelationship = (type) => {
    setExpandedRelationship(expandedRelationship === type ? null : type); // Toggle between expanded and collapsed
  };

  const [queryGenerator] = useState(new QueryParamsGenerator());

  // 处理节点标签点击
  const handleLabelClick = async (label) => {
    try {
      const query = queryGenerator.generateLabelQuery(label);
      const response = await fetch('http://localhost:8000/match_query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(query)
      });

      const data = await response.json();
      if (data.success) {
        // 更新图形显示
        const newNodes = data.data.map(record => ({
          id: record.n.properties.id || Math.random(),
          nodeLabel: Array.isArray(record.n.labels) ? record.n.labels[0] : record.n.labels,
          properties: record.n.properties
        }));
        setGraphNodes(prevNodes => [...prevNodes, ...newNodes]);
      }
    } catch (error) {
      console.error('Error executing query:', error);
    }
  };

  // 处理关系类型点击
  const handleRelationshipClick = async (relationType) => {
    try {
      // 这里假设我们知道起始节点的标签
      const query = queryGenerator.generateRelationshipQuery('Person', relationType, 'Person');
      const response = await fetch('http://localhost:8000/match_query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(query)
      });

      const data = await response.json();
      if (data.success) {
        // 更新图形显示
        const newNodes = new Set();
        const newRelationships = [];

        data.data.forEach(record => {
          // 添加起始节点
          newNodes.add({
            id: record.a.properties.id || Math.random(),
            nodeLabel: Array.isArray(record.a.labels) ? record.a.labels[0] : record.a.labels,
            properties: record.a.properties
          });

          // 添加终止节点
          newNodes.add({
            id: record.b.properties.id || Math.random(),
            nodeLabel: Array.isArray(record.b.labels) ? record.b.labels[0] : record.b.labels,
            properties: record.b.properties
          });

          // 添加关系
          newRelationships.push({
            startNode: record.a.properties.id,
            endNode: record.b.properties.id,
            type: relationType,
            properties: record.r ? record.r.properties : {}
          });
        });

        setGraphNodes(prevNodes => [...prevNodes, ...Array.from(newNodes)]);
        setGraphRelationships(prevRels => [...prevRels, ...newRelationships]);
      }
    } catch (error) {
      console.error('Error executing query:', error);
    }
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

                  {/* 数据库菜单部分，只有在 isDatabaseMenuOpen 为 true 时才显示 */}
                  <DatabaseManager 
                    onDatabaseSelect={handleDatabaseSelect}
                    onDatabaseInfoFetch={handleDatabaseInfoFetch}
                  />

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
                  {searchQuery.trim() && (
                    <div className={styles.searchResults}>
                      {Object.entries(filteredResults).map(([category, results]) => (
                        results.length > 0 && (
                          <div key={category} className={styles.searchCategory}>
                            <h4 className={styles.categoryTitle}>{category}</h4>
                            <ul className={styles.resultList}>
                              {results.map((result, idx) => (
                                <li key={idx} className={styles.searchResultItem}>
                                  <span className={styles.resultName}>{result.value || result}</span> {/* Render value */}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.flexRowGraphInfo}>
                  <GraphInfoDisplay graphNodes={graphNodes} graphRelationships={graphRelationships} />
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
                        <div 
                          className={styles.labelItem} 
                          onClick={() => {
                            toggleExpandedLabel(label);
                            handleLabelClick(label);
                          }}
                        >
                          {label}
                          <Image
                            className={`${styles.imageNodeLabelsExtra} ${expandedLabel === label ? styles.rotate : ''}`}
                            src="/assets/c1122939168fb69f50f3e2f253333e62.svg"
                            alt="expand"
                            width={20}
                            height={20}
                          />
                        </div>
                        {expandedLabel === label && nodePrimeEntities[label] && (
                        <div className={styles.entityList}>
                          {nodePrimeEntities[label].map((entity, idx) => (
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
                          <p 
                            className={styles.typeItem} 
                            onClick={() => {
                              toggleExpandedRelationship(type);
                              handleRelationshipClick(type);
                            }}
                          >
                            {type}
                            <Image
                              className={`${styles.imageRelationshipTypesExtra} ${expandedRelationship === type ? styles.rotate : ''}`}
                              src="/assets/c1122939168fb69f50f3e2f253333e62.svg"
                              alt="expand"
                              width={20}
                              height={20}
                            />
                          </p>
                          {expandedRelationship === type && relationshipPrimeEntities[type] && (
                            <div className={styles.entityList}>
                              {relationshipPrimeEntities[type].map((entity, idx) => (
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
            <div className={styles.tabContainer}>
              {/* 标签导航 */}
              <div className={styles.tabNav}>
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                    onClick={() => handleTabSwitch(tab.id)}
                  >
                    {tab.title}
                    <span className={styles.closeButton} onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}>
                      ×
                    </span>
                  </div>
                ))}
                <button className={styles.addTabButton} onClick={handleAddTab}>
                  + Add Tab
                </button>
              </div>

              {/* 标签内容 */}
              <div className={styles.tabContent} ref={tabContentRef}>
                {tabContentBounds && (
                <Filter
                  // 把graphNodes和graphNodeBuffer合并为graphNodes，组合成一个新的数组
                  graphRelationships = {graphRelationships}
                  graphNodes = {graphNodes}
                  setGraphNodes={setGraphNodes} // Pass state setter for graphNodes
                  setGraphRelationships={setGraphRelationships} // Pass state setter for graphRelationships
                  // buffer
                  graphNodesBuffer = {graphNodesBuffer}
                  graphRelationshipsBuffer = {graphRelationshipsBuffer}
                  setGraphNodesBuffer={setGraphNodesBuffer}
                  setGraphRelationshipsBuffer={setGraphRelationshipsBuffer}
                  tabContentBounds={tabContentBounds}
                />
                )}
                <div className={styles.tabGraph}>
                  {isDataClean && (
                    <DrawGraph
                      nodes={graphNodes}
                      relationships={graphRelationships}
                    />
                  )}
                </div>
                <div className={styles.flexRowGalleryImages}>
                  <div className={styles.iconContainer}>
                    <AddTab nodeEntities
                      AddTabNodeEntities = {nodeEntities}
                      AddTabRelationshipEntities = {relationshipEntities}
                    />
                  </div>
                  <div className={styles.iconContainer}>
                    <TbTrash size={50} className={styles.icon} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className={styles.flexColumnFeature}>
        <div className={styles.featureGroup}>
          <DatabaseManager 
            onDatabaseSelect={handleDatabaseSelect}
            onDatabaseInfoFetch={handleDatabaseInfoFetch}
          />

          <div className={styles.searchBox}>
            {/* ... 其他内容保持不变 ... */}
          </div>

          {/* ... 其他内容保持不变 ... */}
        </div>
      </div>
    </div>
  );
}

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
import TabManager from '../components/TabSystem/TabManager';
import { useTabManager } from '../hooks/useTabManager';

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
    { id: 1, nodeLabel: 'PERSON', properties: { name: 'Alice', age: 30, role: 'Engineer' } },
    { id: 2, nodeLabel: 'PERSON', properties: { name: 'Bob', age: 25, role: 'Designer' } },
    { id: 3, nodeLabel: 'KNOWLEDGE', properties: { title: 'Graph Database', type: 'Tutorial', category: 'Technology' } },
    { id: 4, nodeLabel: 'PERSON', properties: { name: 'Charlie', age: 35, role: 'Manager' } },
    { id: 5, nodeLabel: 'KNOWLEDGE', properties: { title: 'Graph Science', type: 'Tutorial', category: 'Technology' } },
  ]);
  const [graphRelationships, setGraphRelationships] = useState([
    { startNode: 1, endNode: 2, type: 'FRIEND', properties: { since: '2020', frequency: 'Weekly' } },
    { startNode: 1, endNode: 3, type: 'LIKES', properties: { since: '2019', frequency: 'Monthly' } },
    { startNode: 2, endNode: 3, type: 'LIKES', properties: { since: '2018', frequency: 'Daily' } },
    { startNode: 4, endNode: 5, type: 'LIKES', properties: { since: '2016', frequency: 'Monthly' } },
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

  // 使用tab管理hook
  const {
    tabs,
    activeTab,
    tabDatabases,
    saveTabState,
    getTabState,
    addTab,
    closeTab,
    switchTab,
    updateTabDatabase
  } = useTabManager({
    id: 1,
    title: 'Tab 1',
    nodeInfo: {
      nodeLabels: [],
      expandedLabel: null,
      nodeEntities: {},
      nodePrimeEntities: {}
    },
    relationshipInfo: {
      relationshipTypes: [],
      expandedRelationship: null,
      relationshipEntities: {},
      relationshipPrimeEntities: {}
    },
    propertyInfo: {
      propertyKeys: []
    },
    uiState: {
      isNodeLabelsOpen: false,
      isRelationshipTypesOpen: false,
      isPropertyKeysOpen: false,
      searchQuery: '',
      filteredResults: {
        nodeEntities: [],
        relationshipEntities: [],
        propertyKeys: [],
      }
    },
    graphData: {
      graphNodes: [],
      graphRelationships: [],
      graphNodesBuffer: [],
      graphRelationshipsBuffer: []
    }
  });

  // 处理tab状态变化
  const handleTabStateChange = (action) => {
    switch (action.type) {
      case 'ADD_TAB':
        saveCurrentTabState(); // 保存当前tab状态
        addTab(action.payload);
        cleanUp();
        break;
      case 'CLOSE_TAB':
        saveCurrentTabState();
        closeTab(action.payload.tabId);
        if (tabs.length > 1) {
          const nextTab = tabs.find(tab => tab.id !== action.payload.tabId);
          if (nextTab) {
            restoreTabState(nextTab.id);
          }
        } else {
          cleanUp();
        }
        break;
      case 'SWITCH_TAB':
        saveCurrentTabState(); // 保存当前tab的状态
        switchTab(action.payload.tabId);
        restoreTabState(action.payload.tabId); // 恢复目标tab的状态
        break;
      default:
        console.warn('Unknown tab action:', action);
    }
  };

  // 保存当前tab状态
  const saveCurrentTabState = () => {
    if (!activeTab) return;
    
    const currentState = {
      nodeInfo: {
        nodeLabels,
        expandedLabel,
        nodeEntities,
        nodePrimeEntities
      },
      relationshipInfo: {
        relationshipTypes,
        expandedRelationship,
        relationshipEntities,
        relationshipPrimeEntities
      },
      propertyInfo: {
        propertyKeys
      },
      uiState: {
        isNodeLabelsOpen,
        isRelationshipTypesOpen,
        isPropertyKeysOpen,
        searchQuery,
        filteredResults
      },
      graphData: {
        graphNodes,
        graphRelationships,
        graphNodesBuffer,
        graphRelationshipsBuffer
      }
    };

    saveTabState(activeTab, currentState);
  };

  // 恢复tab状态
  const restoreTabState = (tabId) => {
    const tabState = getTabState(tabId);
    if (!tabState) {
      console.warn(`No state found for tab ${tabId}`);
      return;
    }

    try {
      // 恢复节点信息
      setNodeLabels(tabState.nodeInfo?.nodeLabels || []);
      setExpandedLabel(tabState.nodeInfo?.expandedLabel || null);
      setNodeEntities(tabState.nodeInfo?.nodeEntities || {});
      setNodePrimeEntities(tabState.nodeInfo?.nodePrimeEntities || {});

      // 恢复关系信息
      setRelationshipTypes(tabState.relationshipInfo?.relationshipTypes || []);
      setExpandedRelationship(tabState.relationshipInfo?.expandedRelationship || null);
      setRelationshipEntities(tabState.relationshipInfo?.relationshipEntities || {});
      setRelationshipPrimeEntities(tabState.relationshipInfo?.relationshipPrimeEntities || {});

      // 恢复属性信息
      setPropertyKeys(tabState.propertyInfo?.propertyKeys || []);

      // 恢复UI状态
      setIsNodeLabelsOpen(tabState.uiState?.isNodeLabelsOpen || false);
      setIsRelationshipTypesOpen(tabState.uiState?.isRelationshipTypesOpen || false);
      setIsPropertyKeysOpen(tabState.uiState?.isPropertyKeysOpen || false);
      setSearchQuery(tabState.uiState?.searchQuery || '');
      setFilteredResults(tabState.uiState?.filteredResults || {
        nodeEntities: [],
        relationshipEntities: [],
        propertyKeys: [],
      });

      // 恢复图数据
      setGraphNodes(tabState.graphData?.graphNodes || []);
      setGraphRelationships(tabState.graphData?.graphRelationships || []);
      setGraphNodesBuffer(tabState.graphData?.graphNodesBuffer || []);
      setGraphRelationshipsBuffer(tabState.graphData?.graphRelationshipsBuffer || []);
    } catch (error) {
      console.error('Error restoring tab state:', error);
      cleanUp(); // 发生错误时清空状态
    }
  };

  // 修改数据库选择处理
  const handleDatabaseSelect = (url, tabId) => {
    updateTabDatabase(tabId, url);
  };

  // 处理数据库信息获取
  const handleDatabaseInfoFetch = (dbInfo) => {
    try {
      // 更新节点信息
      setNodeLabels(dbInfo.labels || []);
      setNodePrimeEntities(dbInfo.nodePrimeEntities || {});
      setNodeEntities(dbInfo.nodeEntities || {});

      // 更新关系信息
      setRelationshipTypes(dbInfo.relationshipTypes || []);
      setRelationshipPrimeEntities(dbInfo.relationshipPrimeEntities || {});
      setRelationshipEntities(dbInfo.relationshipEntities || {});

      // 更新属性信息
      setPropertyKeys(dbInfo.propertyKeys || []);

      // 更新当前tab的状态
      if (activeTab) {
        saveTabState(activeTab, {
          nodeInfo: {
            nodeLabels: dbInfo.labels || [],
            nodeEntities: dbInfo.nodeEntities || {},
            nodePrimeEntities: dbInfo.nodePrimeEntities || {}
          },
          relationshipInfo: {
            relationshipTypes: dbInfo.relationshipTypes || [],
            relationshipEntities: dbInfo.relationshipEntities || {},
            relationshipPrimeEntities: dbInfo.relationshipPrimeEntities || {}
          },
          propertyInfo: {
            propertyKeys: dbInfo.propertyKeys || []
          }
        });
      }
    } catch (error) {
      console.error('Error handling database info:', error);
      alert('Error updating database information');
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
                    activeTab={activeTab}
                    tabDatabases={tabDatabases}
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
              <TabManager 
                tabs={tabs}
                activeTab={activeTab}
                onStateChange={handleTabStateChange}
                tabDatabases={tabDatabases}
              />

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
    </div>
  );
}

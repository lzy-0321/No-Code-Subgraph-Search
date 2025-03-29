import { useRef, useState, useEffect } from 'react';
import styles from '../styles/playground.module.css';
import Image from 'next/image';
import { searchData } from '../utils/searchUtils';
import dynamic from 'next/dynamic';
import Filter from '../components/Filter.jsx';
import AddTab from "../components/AddQuery";
import GraphInfoDisplay from '../components/GraphInfoDisplay';
import { TbCrosshair, TbTrash } from 'react-icons/tb';
import DatabaseManager from '../components/Database/DatabaseManager';
import TabManager from '../components/TabSystem/TabManager';
import { useTabManager } from '../hooks/useTabManager';
import { QueryParamsGenerator, QueryManager } from '../utils/queryGenerator';
import AddQuery from '../components/AddQuery';
import Link from 'next/link';
import SearchBox from '../components/SearchBox';
import OnboardingTour from '../components/OnboardingTour';

// 动态加载 GraphComponent
const DrawGraph = dynamic(() => import('../components/DrawGraph'), { ssr: false });

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
  ]);
  const [graphRelationships, setGraphRelationships] = useState([
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

  const queryManager = new QueryManager();

  const handleQueryGenerated = async (queryData) => {
    //console.log('handleQueryGenerated received:', queryData);
    try {
      const result = await queryManager.executeQuery(queryData);
      if (result) {
        // 使用 updateGraphData 来更新图数据
        const newNodes = [...graphNodes, ...result.nodes];
        const newRelationships = [...graphRelationships, ...result.relationships];
        updateGraphData(newNodes, newRelationships);
      }
    } catch (error) {
      console.error('Error executing query:', error);
    }
  };

  
  // 获取当前 tab 的图数据
  const currentTabGraphData = activeTab ? getTabState(activeTab)?.graphData : {
    nodes: [],
    relationships: []
  };

  // 当 activeTab 改变时更新图数据
  useEffect(() => {
    if (activeTab && getTabState(activeTab)?.graphData) {
      setGraphNodes(getTabState(activeTab).graphData.nodes || []);
      setGraphRelationships(getTabState(activeTab).graphData.relationships || []);
    } else {
      setGraphNodes([]);
      setGraphRelationships([]);
    }
  }, [activeTab]);

  // 更新图数据时同时更新 tab 状态
  const updateGraphData = (newNodes, newRelationships) => {
    if (!activeTab) return;

    setGraphNodes(newNodes);
    setGraphRelationships(newRelationships);

    saveTabState(activeTab, {
      ...getTabState(activeTab),
      graphData: {
        nodes: newNodes,
        relationships: newRelationships,
        graphNodesBuffer,
        graphRelationshipsBuffer
      }
    });
  };

  const searchBoxRef = useRef(null);

  // 修改节点处理函数
  const handleNodeQuery = (label, entity) => {
    const displayValue = entity[0];
    const displayProperty = displayProperties[label]?.displayProperty;
    
    if (!displayProperty) {
      console.error(`No display property found for label: ${label}`);
      return;
    }

    // 构建查询数据
    const queryData = {
      type: 'node',
      params: {
        matchType: 'labelMatch',
        label: label,
        properties: {
          [displayProperty]: displayValue
        }
      }
    };

    //console.log('Generating query for node:', queryData);
    handleQueryGenerated(queryData);

    // 清除搜索框
    if (searchBoxRef.current) {
      searchBoxRef.current.clearSearch();
    }
  };

  // 修改关系处理函数，只处理查询
  const handleRelationshipQuery = (type, entity) => {
    const [startNode, endNode] = entity;
    const startDisplay = startNode[0];
    const endDisplay = endNode[0];
    
    const startNodeLabel = findNodeLabelById(startNode[1]);
    const endNodeLabel = findNodeLabelById(endNode[1]);
    
    if (!startNodeLabel || !endNodeLabel) {
      console.error('Could not find node labels for relationship');
      return;
    }

    const startDisplayProperty = displayProperties[startNodeLabel]?.displayProperty;
    const endDisplayProperty = displayProperties[endNodeLabel]?.displayProperty;

    if (!startDisplayProperty || !endDisplayProperty) {
      console.error('Display properties not found for nodes');
      return;
    }

    // 构建查询数据
    const queryData = {
      type: 'relationship',
      params: {
        matchType: 'relationshipMatch',
        relationType: type,
        startNodeProps: {
          [startDisplayProperty]: startDisplay
        },
        endNodeProps: {
          [endDisplayProperty]: endDisplay
        }
      }
    };

    //console.log('Generating query for relationship:', queryData);
    handleQueryGenerated(queryData);
  };

  // 辅助函数：通过ID查找节点标签
  const findNodeLabelById = (nodeId) => {
    // 遍历所有标签和它们的实体
    for (const [label, entities] of Object.entries(nodePrimeEntities)) {
      // 在每个标签的实体列表中查找匹配的ID
      const found = entities.some(entity => entity[1] === nodeId);
      if (found) {
        return label;
      }
    }
    return null;
  };

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
        
        // 切换tab之前，清空所有状态，包括缓冲区和过滤器状态
        setGraphNodes([]);
        setGraphRelationships([]);
        setGraphNodesBuffer([]);
        setGraphRelationshipsBuffer([]);
        setFilterState({
          activeFilterTab: "relationship",
          hiddenTypes: {},
          selectedNodes: [],
          relationshipTypeOrder: []
        });
        
        switchTab(action.payload.tabId);
        restoreTabState(action.payload.tabId); // 恢复目标tab的状态
        break;
      default:
        console.warn('未知的标签页操作:', action);
    }
  };

  // 在适当的位置添加以下状态
  const [filterState, setFilterState] = useState({
    activeFilterTab: "relationship",
    hiddenTypes: {},
    selectedNodes: [],
    relationshipTypeOrder: [],
  });

  // 修改 saveCurrentTabState 函数，确保缓冲区和过滤器状态正确保存
  const saveCurrentTabState = () => {
    if (!activeTab) return;
    
    const currentState = {
      nodeInfo: {
        nodeLabels,
        expandedLabel,
        nodeEntities,
        nodePrimeEntities,
        displayProperties // 确保保存显示属性
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
        nodes: graphNodes, // 使用一致的命名
        relationships: graphRelationships, // 使用一致的命名
        graphNodesBuffer, // 保存节点缓冲区
        graphRelationshipsBuffer // 保存关系缓冲区
      },
      filterState // 保存过滤器状态
    };

    saveTabState(activeTab, currentState);
  };

  // 修改 restoreTabState 函数，确保缓冲区和过滤器状态正确恢复
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
      setDisplayProperties(tabState.nodeInfo?.displayProperties || {});

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

      // 确保完全替换(而不是合并)图形和缓冲区数据
      setGraphNodes(tabState.graphData?.nodes || []);
      setGraphRelationships(tabState.graphData?.relationships || []);
      setGraphNodesBuffer(tabState.graphData?.graphNodesBuffer || []);
      setGraphRelationshipsBuffer(tabState.graphData?.graphRelationshipsBuffer || []);

      // 恢复过滤器状态
      setFilterState(tabState.filterState || {
        activeFilterTab: "relationship",
        hiddenTypes: {},
        selectedNodes: [],
        relationshipTypeOrder: []
      });
    } catch (error) {
      console.error('恢复标签页状态出错:', error);
      cleanUp();
    }
  };

  // 修改数据库选择处理
  const handleDatabaseSelect = (url, tabId) => {
    updateTabDatabase(tabId, url);
  };

  // 新增状态变量来存储显示属性信息
  const [displayProperties, setDisplayProperties] = useState({});
  
  // 处理数据库信息获取
  const handleDatabaseInfoFetch = (dbInfo) => {
    try {
      // 打印完整的数据库信息以便调试
      //console.log('Received database info:', {
      //   'Labels': dbInfo.labels,
      //   'Node Display Info': dbInfo.nodeDisplayInfo,
      //   'Node Prime Entities': dbInfo.nodePrimeEntities,
      //   'Node Entities': dbInfo.nodeEntities,
      //   'Relationship Types': dbInfo.relationshipTypes,
      //   'Relationship Prime Entities': dbInfo.relationshipPrimeEntities,
      //   'Relationship Entities': dbInfo.relationshipEntities,
      //   'Property Keys': dbInfo.propertyKeys
      // });

      // 更新节点信息
      setNodeLabels(dbInfo.labels || []);
      setNodePrimeEntities(dbInfo.nodePrimeEntities || {});
      setNodeEntities(dbInfo.nodeEntities || {});
      
      // 存储节点的显示属性和ID信息
      const nodeDisplayProperties = {};
      const nodeIdProperties = {};
      const displayProps = {};  // 新增：用于存储显示属性
      
      Object.keys(dbInfo.nodePrimeEntities || {}).forEach(label => {
        const displayInfo = dbInfo.nodeDisplayInfo?.[label];
        if (displayInfo) {
          nodeDisplayProperties[label] = displayInfo.displayProperty;
          nodeIdProperties[label] = displayInfo.idProperty;
          displayProps[label] = {
            displayProperty: displayInfo.displayProperty,
            idProperty: displayInfo.idProperty
          };
        }
      });
      
      // 更新显示属性状态
      setDisplayProperties(displayProps);

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
            nodePrimeEntities: dbInfo.nodePrimeEntities || {},
            nodeDisplayProperties,
            nodeIdProperties,
            displayProperties: displayProps  // 新增：保存到tab状态中
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

  // 修改处理关系类型点击的函数
  const handleRelationshipClick = async (relationType, entity) => {
    if (!entity) return;

    try {
      const [startNode, endNode] = entity;
      
      // 通过显示值查找节点实体
      const startNodeEntity = Object.entries(nodePrimeEntities).find(([label, entities]) => 
        entities.some(e => e[0] === startNode[0])  // 使用显示值匹配
      );
      
      const endNodeEntity = Object.entries(nodePrimeEntities).find(([label, entities]) => 
        entities.some(e => e[0] === endNode[0])    // 使用显示值匹配
      );

      if (startNodeEntity && endNodeEntity) {
        // 获取完整的节点信息
        const startNodeInfo = startNodeEntity[1].find(e => e[0] === startNode[0]);
        const endNodeInfo = endNodeEntity[1].find(e => e[0] === endNode[0]);

        const newNodes = new Set();
        const newRelationships = [];

        // 添加起始节点
        newNodes.add({
          id: startNodeInfo[1],  // 使用实际的节点ID
          nodeLabel: startNodeEntity[0],
          properties: {
            [displayProperties[startNodeEntity[0]]?.displayProperty]: startNode[0],
            id: startNodeInfo[1]
          }
        });

        // 添加终止节点
        newNodes.add({
          id: endNodeInfo[1],    // 使用实际的节点ID
          nodeLabel: endNodeEntity[0],
          properties: {
            [displayProperties[endNodeEntity[0]]?.displayProperty]: endNode[0],
            id: endNodeInfo[1]
          }
        });

        // 添加关系
        newRelationships.push({
          startNode: startNodeInfo[1],
          endNode: endNodeInfo[1],
          type: relationType,
          properties: {
            startNodeProperty: startNode[0],
            endNodeProperty: endNode[0],
            id: `${startNodeInfo[1]}_${endNodeInfo[1]}_${relationType}`
          }
        });

        // 更新图数据
        const updatedNodes = [...graphNodes, ...Array.from(newNodes)];
        const updatedRelationships = [...graphRelationships, ...newRelationships];
        updateGraphData(updatedNodes, updatedRelationships);
      } else {
        console.error('Could not find node entities for:', {
          startNode: startNode[0],
          endNode: endNode[0]
        });
      }

    } catch (error) {
      console.error('Error adding relationship:', error);
    }
  };

  // 添加新的搜索结果处理函数
  const handleSearchResults = (results) => {
    // 将 SearchBox 的搜索结果转换为 filteredResults 格式
    const convertedResults = {
      nodeEntities: results
        .find(category => category.category === 'NODEENTITIES')?.items || [],
      relationshipEntities: results
        .find(category => category.category === 'RELATIONSHIPENTITIES')?.items || [],
      propertyKeys: results
        .find(category => category.category === 'Property Keys')?.items || []
    };
    
    setFilteredResults(convertedResults);
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

  // 修改删除节点处理函数
  const handleDeleteNodeQuery = (nodeId) => {
    const newNodes = graphNodes.filter(node => node.id !== nodeId);
    const newRelationships = graphRelationships.filter(rel => 
      rel.startNode !== nodeId && rel.endNode !== nodeId
    );
    updateGraphData(newNodes, newRelationships);
  };

  // 修改删除关系处理函数
  const handleDeleteRelationshipQuery = (startNode, endNode, type) => {
    const newRelationships = graphRelationships.filter(rel => 
      !(rel.startNode === startNode && rel.endNode === endNode && rel.type === type)
    );
    updateGraphData(graphNodes, newRelationships);
  };

  // 修改清除所有处理函数
  const handleClearAll = () => {
    updateGraphData([], []);
  };

  // 获取当前激活的 tab 的搜索状态
  const currentTabSearchState = activeTab ? getTabState(activeTab)?.searchState : {
    searchQuery: '',
    searchResults: []
  };

  // 处理搜索状态变化
  const handleSearchStateChange = (newSearchState) => {
    if (!activeTab) return;
    
    saveTabState(activeTab, {
      ...getTabState(activeTab),
      searchState: newSearchState
    });
  };

  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    // 添加调试日志
    //console.log('Checking first visit status');
    const hasVisited = sessionStorage.getItem('hasVisitedPlayground');
    //console.log('hasVisited:', hasVisited);
    if (hasVisited) {
      setIsFirstVisit(false);
    }
  }, []);

  // 在渲染前添加调试日志
  //console.log('Current isFirstVisit state:', isFirstVisit);

  const handleTourComplete = () => {
    sessionStorage.setItem('hasVisitedPlayground', 'true');
    setIsFirstVisit(false);
  };

  // 添加处理过滤器状态变化的函数
  const handleFilterStateChange = (newFilterState) => {
    setFilterState(newFilterState);
  };

  return (
    <div className={styles.flexColumn}>
      <section className={`${styles.playground} ${styles.mainContentSection}`}>
        <div className={styles.contentBoxGroup}>
          <div className={styles.flexRowHeader}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className={styles.brandingContainer} data-tour="branding">
                <Image
                  className={styles.brandingImage}
                  src="/assets/0fbf1a91f14780ce3fa9a491a86c9449.svg"
                  alt="Branding"
                  width={28}
                  height={28}
                />
                <div className={styles.brandingTextContainer}>
                  <p className={styles.brandingNameText}>SMARTD</p>
                  <p className={styles.brandingStudioText}>STUDIO</p>
                </div>
              </div>

              <div className={styles.navigationContainer}>
                <Link href="/" className={styles.footerHomeText}>Home</Link>
                <Link href="/playground" className={styles.footerPlaygroundText}>Playground</Link>
                <Link href="/#tutorialsSection" className={styles.footerTutorialText}>Tutorial</Link>
                <Link href="/about" className={styles.footerAboutText}>About</Link>
              </div>
            </div>

            <div style={{ width: '200px' }}></div>
          </div>
        </div>

        <div className={styles.featureGroup}>
          <div className={styles.flexRowFeatures}>
            <div className={styles.featureContentBox} data-tour="feature-box">
              <div className={styles.featureColumnBox}>
                <DatabaseManager 
                  data-tour="database-manager"
                  onDatabaseSelect={handleDatabaseSelect}
                  onDatabaseInfoFetch={handleDatabaseInfoFetch}
                  activeTab={activeTab}
                  tabDatabases={tabDatabases}
                />

                <div className={styles.searchFeatureContentBox} data-tour="search-box">
                  <SearchBox 
                    ref={searchBoxRef}
                    data={{
                      nodeEntities: nodePrimeEntities,
                      relationshipEntities: relationshipPrimeEntities,
                      propertyKeys: propertyKeys
                    }}
                    onSearch={handleSearchResults}
                    onNodeQuery={handleNodeQuery}
                    onDeleteNodeQuery={handleDeleteNodeQuery}
                    onDeleteRelationshipQuery={handleDeleteRelationshipQuery}
                    handleRelationshipClick={handleRelationshipClick}
                    graphNodes={graphNodes}
                    graphRelationships={graphRelationships}
                    displayProperties={displayProperties}
                    searchState={currentTabSearchState}
                    onSearchStateChange={handleSearchStateChange}
                    activeTabId={activeTab}
                  />
                </div>
                
                <div data-tour="graph-info">
                  <GraphInfoDisplay 
                    graphNodes={graphNodes} 
                    graphRelationships={graphRelationships} 
                  />
                </div>

                <div data-tour="data-explorer" className={styles.dataExplorerGroup}>
                  <div className={styles.nodeLabelsContentBox}>
                    <div className={styles.flexRowNodeLabels} onClick={toggleNodeLabels}>
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
                                <div 
                                  className={styles.entityItem} 
                                  title={entity[0]}
                                >
                                  {entity[0]}
                                </div>
                                {graphNodes.some(node => node.id === entity[1]) ? (
                                  <Image
                                    src="/assets/delete.svg"
                                    alt="delete"
                                    width={20}
                                    height={20}
                                    className={styles.deleteButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNodeQuery(entity[1]);
                                    }}
                                  />
                                ) : (
                                  <Image
                                    src="/assets/add.svg"
                                    alt="add"
                                    width={20}
                                    height={20}
                                    className={styles.addButton}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleNodeQuery(label, entity);
                                    }}
                                  />
                                )}
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
                                handleRelationshipClick(type, null);
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
                                    <div 
                                      className={styles.entityItemContainer}
                                      title={`${entity[0][0]} → ${entity[1][0]}`}
                                    >
                                      <div className={styles.relationshipEntityItemContainer}>
                                        <p className={styles.entityItem}>
                                          {entity[0][0]}
                                        </p>
                                        <div className={styles.arrowContainer}>
                                          <Image
                                            src="/assets/cc-arrow-down.svg"
                                            alt="arrow right"
                                            width={16}
                                            height={16}
                                            className={`${styles.arrowIcon} rotate-90`}
                                            style={{ transform: 'rotate(-90deg)' }}
                                          />
                                        </div>
                                        <p className={styles.entityItem}>
                                          {entity[1][0]}
                                        </p>
                                      </div>
                                      {graphRelationships.some(rel => 
                                        rel.startNode === entity[0][1] && 
                                        rel.endNode === entity[1][1] && 
                                        rel.type === type
                                      ) ? (
                                        <Image
                                          src="/assets/delete.svg"
                                          alt="delete"
                                          width={16}
                                          height={16}
                                          className={styles.deleteButton}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteRelationshipQuery(entity[0][1], entity[1][1], type);
                                          }}
                                        />
                                      ) : (
                                        <Image
                                          src="/assets/add.svg"
                                          alt="add"
                                          width={16}
                                          height={16}
                                          className={styles.addButton}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRelationshipClick(type, entity);
                                          }}
                                        />
                                      )}
                                    </div>
                                    {idx < relationshipPrimeEntities[type].length - 1 && (
                                      <div className={styles.separator} />
                                    )}
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
                        {propertyKeys.map((key, index) => (
                          <div key={index} className={styles.entityItemContainer}>
                            <div 
                              className={styles.entityItem}
                              title={key}
                            >
                              {key}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.tabContainer}>
              <div data-tour="tab-system">
                <TabManager 
                  tabs={tabs}
                  activeTab={activeTab}
                  onStateChange={handleTabStateChange}
                  tabDatabases={tabDatabases}
                />
              </div>

              {/* 标签内容 */}
              <div className={styles.tabContent} ref={tabContentRef} style={{ position: 'relative', overflow: 'hidden' }}>
                <div className={styles.tabGraph} data-tour="graph-area">
                  {isDataClean && (
                    <DrawGraph
                      nodes={graphNodes}
                      relationships={graphRelationships}
                    />
                  )}
                </div>
                <div className={styles.flexRowGalleryImages}>
                  <div className={styles.iconContainer} data-tour="filter-button">
                    {tabContentBounds && (
                      <Filter
                        graphRelationships={graphRelationships}
                        graphNodes={graphNodes}
                        setGraphNodes={setGraphNodes}
                        setGraphRelationships={setGraphRelationships}
                        graphNodesBuffer={graphNodesBuffer}
                        graphRelationshipsBuffer={graphRelationshipsBuffer}
                        setGraphNodesBuffer={setGraphNodesBuffer}
                        setGraphRelationshipsBuffer={setGraphRelationshipsBuffer}
                        tabContentBounds={tabContentBounds}
                        activeTabId={activeTab}
                        onFilterStateChange={handleFilterStateChange}
                        initialFilterState={filterState}
                      />
                    )}
                  </div>
                  <div className={styles.rightControls}>
                    <div className={styles.iconContainer} data-tour="add-query">
                      <AddQuery
                        AddTabNodeEntities={nodeEntities}
                        AddTabRelationshipEntities={relationshipEntities}
                        onQueryGenerated={handleQueryGenerated}
                      />
                    </div>
                    <div 
                      className={styles.iconContainer}
                      onClick={handleClearAll}
                      title="Clear all nodes and relationships"
                      data-tour="clear-button"
                    >
                      <TbTrash 
                        size={50} 
                        className={styles.icon} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <OnboardingTour 
        isFirstVisit={isFirstVisit}
        onComplete={handleTourComplete}
      />
    </div>
  );
}

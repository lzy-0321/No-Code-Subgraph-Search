import React from 'react';
import styles from '../../styles/playground.module.css';

const TabManager = ({ 
  tabs, 
  activeTab,
  onStateChange, // 新增：用于通知父组件状态变化
  tabDatabases,
  ...props  // 添加这行以接收其他属性
}) => {
  // 创建新tab的默认状态
  const createNewTab = (id) => ({
    id,
    title: `Tab ${id}`,
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

  // 处理添加新tab
  const handleAddTab = () => {
    const newTabId = tabs.length > 0 ? tabs[tabs.length - 1].id + 1 : 1;
    const newTab = createNewTab(newTabId);
    onStateChange({
      type: 'ADD_TAB',
      payload: newTab
    });
  };

  // 处理关闭tab
  const handleCloseTab = (tabId, e) => {
    e.stopPropagation();
    onStateChange({
      type: 'CLOSE_TAB',
      payload: { tabId }
    });
  };

  // 处理切换tab
  const handleTabSwitch = (tabId) => {
    onStateChange({
      type: 'SWITCH_TAB',
      payload: { tabId }
    });
  };

  return (
    <div {...props} className={styles.tabNav}>  {/* 添加展开运算符以应用所有传入的属性 */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
          onClick={() => handleTabSwitch(tab.id)}
        >
          {tab.title}
          <span 
            className={styles.closeButton} 
            onClick={(e) => handleCloseTab(tab.id, e)}
          >
            ×
          </span>
        </div>
      ))}
      <button className={styles.addTabButton} onClick={handleAddTab}>
        +
      </button>
    </div>
  );
};

export default TabManager; 
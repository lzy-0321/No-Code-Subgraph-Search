import { useState, useEffect } from 'react';

export const useTabManager = (initialTab) => {
  const [tabs, setTabs] = useState([initialTab]);
  const [activeTab, setActiveTab] = useState(initialTab.id);
  const [tabDatabases, setTabDatabases] = useState({});

  // 保存当前tab状态
  const saveTabState = (tabId, newState) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId
          ? {
              ...tab,
              nodeInfo: {
                ...tab.nodeInfo,
                ...newState.nodeInfo
              },
              relationshipInfo: {
                ...tab.relationshipInfo,
                ...newState.relationshipInfo
              },
              propertyInfo: {
                ...tab.propertyInfo,
                ...newState.propertyInfo
              },
              uiState: {
                ...tab.uiState,
                ...newState.uiState
              },
              graphData: {
                ...tab.graphData,
                ...newState.graphData
              }
            }
          : tab
      )
    );
  };

  // 获取tab状态
  const getTabState = (tabId) => {
    return tabs.find(tab => tab.id === tabId);
  };

  // 添加新tab
  const addTab = (newTab) => {
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTab(newTab.id);
  };

  // 关闭tab
  const closeTab = (tabId) => {
    setTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));
    setTabDatabases(prev => {
      const newTabDatabases = { ...prev };
      delete newTabDatabases[tabId];
      return newTabDatabases;
    });

    if (activeTab === tabId && tabs.length > 1) {
      const firstTab = tabs.find(tab => tab.id !== tabId);
      if (firstTab) {
        setActiveTab(firstTab.id);
      }
    } else if (tabs.length === 1) {
      setActiveTab(null);
    }
  };

  // 切换tab
  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  // 更新tab的数据库选择
  const updateTabDatabase = (tabId, databaseUrl) => {
    setTabDatabases(prev => ({
      ...prev,
      [tabId]: databaseUrl
    }));
  };

  return {
    tabs,
    activeTab,
    tabDatabases,
    saveTabState,
    getTabState,
    addTab,
    closeTab,
    switchTab,
    updateTabDatabase
  };
}; 
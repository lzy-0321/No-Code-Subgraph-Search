import React, { useState } from 'react';
import GraphComponent from './GraphComponent';
import styles from '../styles/playground.module.css';

const Tab = ({ tabData, onUpdateTab, onClose }) => {
  const [selectedDatabase, setSelectedDatabase] = useState(tabData.databaseInfo.selectedDatabase || null);

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

        // 更新数据库信息并拉取图数据
        await fetchDatabaseInfo(url);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error selecting database:', error);
      alert('Error selecting database.');
    }
  };

  const fetchDatabaseInfo = async (url) => {
    try {
      const response = await fetch(`http://localhost:8000/get_database_info?url=${url}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        // 更新标签状态中的图信息
        onUpdateTab({
          ...tabData,
          nodeInfo: { ...tabData.nodeInfo, nodeEntities: data.nodes },
          relationshipInfo: { ...tabData.relationshipInfo, relationshipEntities: data.relationships },
        });
      } else {
        alert('Error fetching database info: ' + data.error);
      }
    } catch (error) {
      console.error('Error fetching database info:', error);
      alert('Error fetching database info.');
    }
  };

  return (
    <div className={styles.tabContainer}>
      <div className={styles.menu}>
        <button onClick={() => handleDatabaseSelection('bolt://localhost:7687')}>
          {selectedDatabase ? `Connected to ${selectedDatabase}` : 'Connect Database'}
        </button>
      </div>
      <div className={styles.graph}>
        <GraphComponent
          nodes={tabData.nodeInfo.nodeEntities}
          relationships={tabData.relationshipInfo.relationshipEntities}
          enableZoom={true}
        />
      </div>
      <button className={styles.closeButton} onClick={onClose}>
        Close Tab
      </button>
    </div>
  );
};

export default Tab;
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from '../../styles/DatabaseManager.module.css';
import API_ENDPOINTS from '../../services/apiConfig';
import apiService from '../../services/apiService';
import ErrorNotification from '../ErrorNotification';
import SuccessNotification from '../SuccessNotification';

const DatabaseManager = ({ 
  onDatabaseSelect, 
  onDatabaseInfoFetch,
  activeTab,  // 新增: 当前活动的tab id
  tabDatabases, // 新增: 存储每个tab的数据库URL {tabId: databaseUrl}
  ...props  // 添加这行以接收其他属性
}) => {
  const [databases, setDatabases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDatabaseMenuOpen, setIsDatabaseMenuOpen] = useState(false);
  const [openSettingsIndex, setOpenSettingsIndex] = useState(null);
  
  // 连接配置状态
  const [protocol, setProtocol] = useState('bolt://');
  const [isCustomProtocol, setIsCustomProtocol] = useState(false);
  const [customProtocol, setCustomProtocol] = useState('');
  const [connectUrl, setConnectUrl] = useState('');
  const [serverUsername, setServerUsername] = useState('');
  const [serverPassword, setServerPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const menuRef = useRef(null);

  // 初始化加载数据库列表
  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.getUserDatabases);
      
      if (response.data.success) {
        setDatabases(response.data.databases);
      } else {
        setError(response.data.error);
      }
    } catch (error) {
      // console.error('Error fetching databases:', error);
      setError(error.message || 'Failed to fetch databases');
    }
  };

  const handleProtocolChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setIsCustomProtocol(true);
      setProtocol('');
    } else {
      setIsCustomProtocol(false);
      setProtocol(value);
    }
  };

  // 选择数据库
  const handleDatabaseSelection = async (url) => {
    try {
      const result = await apiService.post(API_ENDPOINTS.selectDatabase, {
        selectedUrl: url
      });
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Failed to select database');
      }

      // 获取数据库信息
      const dbInfo = await apiService.get(API_ENDPOINTS.getDatabaseInfo);
      
      if (!dbInfo.data.success) {
        throw new Error(dbInfo.data.error || 'Failed to get database info');
      }

      // 创建一个状态对象来累积所有数据
      let fullDbInfo = {
        labels: dbInfo.data.labels || [],
        relationshipTypes: dbInfo.data.relationship_types || [],
        propertyKeys: dbInfo.data.property_keys || [],
        nodePrimeEntities: {},
        nodeEntities: {},
        nodeDisplayInfo: {},  // 新增: 存储显示属性信息
        relationshipPrimeEntities: {},
        relationshipEntities: {},
        relationshipDisplayInfo: {}  // 新增: 存储关系显示属性信息
      };

      // 第三步：获取实体信息
      const nodePromises = (dbInfo.data.labels || []).map(async (label) => {
        try {
          const response = await apiService.post(API_ENDPOINTS.getNodeEntities, {
            label
          });
          
          const data = response.data;
          if (data.success) {
            fullDbInfo.nodePrimeEntities[label] = data.nodeEntities[0];  // [display_value, id_value] 对的列表
            fullDbInfo.nodeEntities[label] = data.nodeEntities[1];       // 属性名列表
            fullDbInfo.nodeDisplayInfo[label] = data.nodeEntities[2]?.[label];  // 显示属性信息
          }
        } catch (error) {
          console.warn(`Failed to fetch entities for label ${label}:`, error);
        }
      });

      const relationshipPromises = (dbInfo.data.relationship_types || []).map(async (type) => {
        try {
          const response = await apiService.post(API_ENDPOINTS.getRelationshipEntities, {
            type
          });
          
          const data = response.data;
          if (data.success) {
            // 调试日志：检查返回的数据结构
            //console.log(`Relationship entities data for type ${type}:`, {
            //   'Prime Entities': data.relationshipEntities[0]?.slice(0, 3),
            //   'Display Info': data.relationshipEntities[2]?.[type],
            //   'Raw Response': data.relationshipEntities
            // });

            fullDbInfo.relationshipPrimeEntities[type] = data.relationshipEntities[0];  // [[start_display, start_id], [end_display, end_id]] 对的列表
            fullDbInfo.relationshipEntities[type] = data.relationshipEntities[1];       // 属性名列表
            fullDbInfo.relationshipDisplayInfo[type] = data.relationshipEntities[2]?.[type];  // 显示属性信息
          }
        } catch (error) {
          console.warn(`Failed to fetch entities for relationship type ${type}:`, error);
        }
      });

      // 等待所有请求完成
      await Promise.all([...nodePromises, ...relationshipPromises]);

      // 最终调试日志：检查完整的数据结构
      //console.log('Final database info:', {
      //   'Labels': fullDbInfo.labels,
      //   'Sample Node Prime Entities': Object.fromEntries(
      //     Object.entries(fullDbInfo.nodePrimeEntities)
      //       .map(([label, entities]) => [label, entities?.slice(0, 3)])
      //   ),
      //   'Node Display Info': fullDbInfo.nodeDisplayInfo,
      // });

      // 更新数据库选择状态
      onDatabaseSelect(url, activeTab);
      
      // 更新数据库信息
      onDatabaseInfoFetch(fullDbInfo);
      
      // 关闭数据库菜单
      setIsDatabaseMenuOpen(false);
      
      // 添加成功提示信息
      setSuccess('Database connected successfully');

    } catch (error) {
      // console.error('Error selecting database:', error);
      setError(error.message || 'Failed to select database');
    }
  };

  // 删除数据库
  const handleDeleteDatabase = async (url) => {
    // 检查剩余的不重复数据库数量
    const uniqueDatabases = new Set(databases.map(db => db.url));
    if (uniqueDatabases.size <= 1) {
      setError('You must have at least one database.');
      return;
    }

    try {
      // 获取 CSRF token
      const csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrftoken='))
        ?.split('=')[1];

      const response = await fetch(API_ENDPOINTS.deleteDatabase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ url }),
        credentials: 'include',
      });

      const result = await response.json();
      if (result.success) {
        setDatabases(prevDatabases => 
          prevDatabases.filter((db) => db.url !== url)
        );
        
        // 清除所有使用该数据库的tab的选择
        setTabDatabases(prev => {
          const newTabDatabases = { ...prev };
          Object.keys(newTabDatabases).forEach(tabId => {
            if (newTabDatabases[tabId] === url) {
              delete newTabDatabases[tabId];
            }
          });
          return newTabDatabases;
        });
        
        setSuccess('Database deleted successfully');
        setOpenSettingsIndex(null);
        fetchDatabases();
      } else {
        setError('Error: ' + result.error);
      }
    } catch (error) {
      // console.error('Error deleting database:', error);
      setError(error.message || 'Failed to delete database');
    }
  };

  // 添加新数据库
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const fullUrl = isCustomProtocol ? customProtocol + connectUrl : protocol + connectUrl;

    try {
      const response = await fetch(API_ENDPOINTS.addDatabase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.cookie
            .split('; ')
            .find((row) => row.startsWith('csrftoken='))
            ?.split('=')[1],
        },
        credentials: 'include',
        body: JSON.stringify({
          fullUrl,
          serverUsername,
          serverPassword,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('Database added successfully');
        setIsModalOpen(false);
        setConnectUrl('');
        setServerUsername('');
        setServerPassword('');
        fetchDatabases();
      } else {
        // 显示具体的错误信息
        setError(result.error || 'Failed to add database');
      }
    } catch (error) {
      // console.error('Error adding database:', error);
      setError(error.message || 'Failed to add database');
    }
  };

  return (
    <div {...props} className={styles.databaseManager}>
      {error && <ErrorNotification message={error} onClose={() => setError('')} />}
      {success && <SuccessNotification message={success} onClose={() => setSuccess('')} />}
      <div className={styles.flexRowInfoDatabase}>
        <div 
          className={styles.flexRowDatabaseImages} 
          onClick={() => setIsDatabaseMenuOpen(!isDatabaseMenuOpen)}
        >
          <Image
            className={styles.imageDatabase}
            src="/assets/b8cc5f09c290b9922de3d8a93473af01.svg"
            alt="database"
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

        {isDatabaseMenuOpen && (
          <div className={styles.databaseMenu}>
            <div className={styles.addDatabaseSection}>
              <button 
                className={styles.addDatabaseBtn}
                onClick={() => setIsModalOpen(true)}
              >
                + Add New Database
              </button>
            </div>

            {databases.map((db, index) => (
              <div
                key={index}
                className={`${styles.databaseItem} ${
                  tabDatabases[activeTab] === db.url ? styles.selected : ''
                }`}
                onClick={() => handleDatabaseSelection(db.url)}
              >
                <div className={styles.databaseInfo}>
                  <span className={styles.databaseUrl}>
                    {db.url.replace(/^(neo4j:\/\/|bolt:\/\/|neo4j\+s:\/\/|bolt\+s:\/\/)/, '')}
                  </span>
                  {tabDatabases[activeTab] === db.url && (
                    <span className={styles.selectedIndicator}></span>
                  )}
                </div>
                <Image
                  className={styles.settingsIcon}
                  src="/assets/e21aaacasc3469ef458c264147aer45c.svg"
                  alt="settings"
                  width={20}
                  height={20}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenSettingsIndex(openSettingsIndex === index ? null : index);
                  }}
                />
                
                {openSettingsIndex === index && (
                  <div className={styles.settingsMenu}>
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

        {isModalOpen && (
          <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleFormSubmit}>
                <div className={styles.inputGroup}>
                  <label>Connect URL</label>
                  <div className={styles.inputFlex}>
                    <select
                      value={isCustomProtocol ? 'custom' : protocol}
                      onChange={handleProtocolChange}
                    >
                      <option value="neo4j://">neo4j://</option>
                      <option value="bolt://">bolt://</option>
                      <option value="neo4j+s://">neo4j+s://</option>
                      <option value="bolt+s://">bolt+s://</option>
                      <option value="custom">custom</option>
                    </select>
                    {isCustomProtocol && (
                      <input
                        type="text"
                        value={customProtocol}
                        onChange={(e) => setCustomProtocol(e.target.value)}
                        placeholder="Custom protocol"
                        className={styles.customProtocolInput}
                        style={{marginRight: '5px'}}
                      />
                    )}
                    <input
                      type="text"
                      value={connectUrl}
                      onChange={(e) => setConnectUrl(e.target.value)}
                      placeholder="192.168.0.54:7687"
                      className={isCustomProtocol ? styles.customActive : ''}
                      required
                    />
                  </div>
                </div>
                <div className={styles.inputGroupHorizontal}>
                  <label>Server Username</label>
                  <input
                    type="text"
                    value={serverUsername}
                    onChange={(e) => setServerUsername(e.target.value)}
                    placeholder="Enter server username"
                    required
                  />
                </div>
                <div className={styles.inputGroupHorizontal}>
                  <label>Server Password</label>
                  <input
                    type="password"
                    value={serverPassword}
                    onChange={(e) => setServerPassword(e.target.value)}
                    placeholder="Enter server password"
                    required
                  />
                </div>
                <button type="submit" className={styles.submitBtn}>
                  Connect Database
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseManager; 
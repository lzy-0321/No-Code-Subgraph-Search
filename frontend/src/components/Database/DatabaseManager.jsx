import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '../../styles/DatabaseManager.module.css';

const DatabaseManager = ({ onDatabaseSelect, onDatabaseInfoFetch }) => {
  const [databases, setDatabases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDatabaseMenuOpen, setIsDatabaseMenuOpen] = useState(false);
  const [openSettingsIndex, setOpenSettingsIndex] = useState(null);
  const [selectedDatabaseUrl, setSelectedDatabaseUrl] = useState(null);
  
  // 连接配置状态
  const [protocol, setProtocol] = useState('bolt://');
  const [connectUrl, setConnectUrl] = useState('');
  const [serverUsername, setServerUsername] = useState('');
  const [serverPassword, setServerPassword] = useState('');

  // 初始化加载数据库列表
  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      const response = await fetch('http://localhost:8000/get_user_databases/', {
        method: 'GET',
        credentials: 'include',
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

  // 选择数据库
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
        setSelectedDatabaseUrl(url);
        onDatabaseSelect(url);
        
        // 获取数据库基本信息
        const dbInfoResponse = await fetch('http://localhost:8000/get_database_info/', {
          method: 'GET',
          credentials: 'include',
        });

        const dbInfo = await dbInfoResponse.json();
        if (dbInfo.success) {
          // 创建一个状态对象来累积所有数据
          let fullDbInfo = {
            labels: dbInfo.labels || [],
            relationshipTypes: dbInfo.relationship_types || [],
            propertyKeys: dbInfo.property_keys || [],
            nodePrimeEntities: {},
            nodeEntities: {},
            relationshipPrimeEntities: {},
            relationshipEntities: {}
          };

          // 获取所有节点标签的实体
          const nodePromises = dbInfo.labels.map(async (label) => {
            const response = await fetch('http://localhost:8000/get_nodeEntities/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ label }),
              credentials: 'include',
            });
            
            const data = await response.json();
            if (data.success) {
              fullDbInfo.nodePrimeEntities[label] = data.nodeEntities[0];
              fullDbInfo.nodeEntities[label] = data.nodeEntities[1];
            }
          });

          // 获取所有关系类型的实体
          const relationshipPromises = dbInfo.relationship_types.map(async (type) => {
            const response = await fetch('http://localhost:8000/get_relationshipEntities/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ type }),
              credentials: 'include',
            });
            
            const data = await response.json();
            if (data.success) {
              fullDbInfo.relationshipPrimeEntities[type] = data.relationshipEntities[0];
              fullDbInfo.relationshipEntities[type] = data.relationshipEntities[1];
            }
          });

          // 等待所有请求完成
          await Promise.all([...nodePromises, ...relationshipPromises]);

          // 一次性更新所有数据
          onDatabaseInfoFetch(fullDbInfo);
          
          // 成功后关闭数据库菜单
          setIsDatabaseMenuOpen(false);
        }
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error selecting database:', error);
      alert('Error selecting database.');
    }
  };

  // 删除数据库
  const handleDeleteDatabase = async (url) => {
    // 检查剩余的不重复数据库数量
    const uniqueDatabases = new Set(databases.map(db => db.url));
    if (uniqueDatabases.size <= 1) {
      alert('You must have at least one database.');
      return;
    }

    try {
      // 获取 CSRF token
      const csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrftoken='))
        ?.split('=')[1];

      const response = await fetch('http://localhost:8000/delete_database/', {
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
        // 更新本地状态，移除所有具有相同 URL 的数据库
        setDatabases(prevDatabases => 
          prevDatabases.filter((db) => db.url !== url)
        );
        
        // 如果删除的是当前选中的数据库，清除选中状态
        if (selectedDatabaseUrl === url) {
          setSelectedDatabaseUrl(null);
        }
        
        alert('Database deleted successfully.');
        
        // 关闭设置菜单
        setOpenSettingsIndex(null);
        
        // 刷新数据库列表
        fetchDatabases();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting database:', error);
      alert('Error deleting database: ' + error.message);
    }
  };

  // 添加新数据库
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const fullUrl = `${protocol}${connectUrl}`;

    try {
      const response = await fetch('http://localhost:8000/add_database/', {
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
        alert('Database added successfully!');
        setIsModalOpen(false);
        setConnectUrl('');
        setServerUsername('');
        setServerPassword('');
        fetchDatabases();
      } else {
        // 显示具体的错误信息
        alert(result.error || 'Failed to add database');
      }
    } catch (error) {
      console.error('Error adding database:', error);
      alert('Error adding database: ' + error.message);
    }
  };

  return (
    <div className={styles.databaseManager}>
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
                  selectedDatabaseUrl === db.url ? styles.selected : ''
                }`}
                onClick={() => handleDatabaseSelection(db.url)}
              >
                <div className={styles.databaseInfo}>
                  <span className={styles.databaseUrl}>
                    {db.url.replace(/^(neo4j:\/\/|bolt:\/\/|neo4j\+s:\/\/|bolt\+s:\/\/)/, '')}
                  </span>
                  {selectedDatabaseUrl === db.url && (
                    <span className={styles.selectedIndicator}>✓</span>
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
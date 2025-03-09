// components/SearchBox.js
import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import styles from '../styles/playground.module.css';
import Image from 'next/image';
import debounce from 'lodash/debounce'; // 添加 lodash 的 debounce 函数

const SearchBox = ({ 
  data, 
  onSearch,
  onNodeQuery,      // 添加节点查询处理函数
  onDeleteNodeQuery,      // 添加删除节点函数
  onDeleteRelationshipQuery,  // 添加删除关系函数
  handleRelationshipClick, // 添加这个属性
  graphNodes,       // 当前图中的节点
  graphRelationships, // 当前图中的关系
  displayProperties,  // 添加 displayProperties 参数
  searchState,
  onSearchStateChange,
  activeTabId
}, ref) => {
  // 使用 tab 的搜索状态
  const [searchQuery, setSearchQuery] = useState(searchState?.searchQuery || '');
  const [searchResults, setSearchResults] = useState(searchState?.searchResults || []);

  // 当 activeTabId 改变时更新搜索状态
  useEffect(() => {
    if (searchState) {
      setSearchQuery(searchState.searchQuery || '');
      setSearchResults(searchState.searchResults || []);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [activeTabId, searchState]);

  // 使用 useCallback 和 debounce 创建防抖的搜索处理函数
  const debouncedSearch = useCallback(
    debounce((query) => {
      if (!query.trim()) {
        clearSearch();
        return;
      }

      const results = [];
      const lowerCaseQuery = query.toLowerCase();

      // 搜索节点实体
      if (data.nodeEntities) {
        const nodeResults = [];
        Object.entries(data.nodeEntities).forEach(([label, entities]) => {
          entities.forEach((entity) => {
            if (entity[0].toLowerCase().includes(lowerCaseQuery)) {
              nodeResults.push({
                type: 'NODEENTITIES',
                value: entity[0],
                label: label
              });
              
              console.log('Found matching node entity:', {
                label,
                displayValue: entity[0]
              });
            }
          });
        });
        if (nodeResults.length > 0) {
          results.push({
            category: 'NODEENTITIES',
            items: nodeResults
          });
        }
      }

      // 搜索关系实体
      if (data.relationshipEntities) {
        const relationshipResults = [];
        Object.entries(data.relationshipEntities).forEach(([type, entities]) => {
          entities.forEach((entity) => {
            const [startNode, endNode] = entity;
            if (startNode[0].toLowerCase().includes(lowerCaseQuery) ||
                endNode[0].toLowerCase().includes(lowerCaseQuery)) {
              relationshipResults.push({
                type: 'RELATIONSHIPENTITIES',
                value: {
                  startNode: startNode[0],
                  endNode: endNode[0],
                  type: type
                }
              });
              
              console.log('Found matching relationship:', {
                type,
                startNode: startNode[0],
                endNode: endNode[0]
              });
            }
          });
        });
        if (relationshipResults.length > 0) {
          results.push({
            category: 'RELATIONSHIPENTITIES',
            items: relationshipResults
          });
        }
      }

      // 搜索属性键
      if (data.propertyKeys) {
        const propertyResults = data.propertyKeys
          .filter(key => key.toLowerCase().includes(lowerCaseQuery))
          .map(key => ({
            type: 'PROPERTY',
            value: key
          }));
        if (propertyResults.length > 0) {
          results.push({
            category: 'Property Keys',
            items: propertyResults
          });
          
          console.log('Found matching property keys:', propertyResults);
        }
      }

      setSearchResults(results);
      onSearchStateChange({
        searchQuery: query,
        searchResults: results
      });
      onSearch(results);
    }, 300), // 300ms 的延迟
    [data, onSearch, onSearchStateChange]
  );

  // 修改 handleSearch 函数
  const handleSearch = (query) => {
    setSearchQuery(query); // 立即更新输入框的值
    debouncedSearch(query); // 使用防抖的搜索函数
  };

  // 修改监听图数据变化的 useEffect
  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    }
  }, [graphNodes, graphRelationships]);

  // 修改清除搜索的方法
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    onSearchStateChange({
      searchQuery: '',
      searchResults: []
    });
    onSearch([]);
    debouncedSearch.cancel(); // 取消任何待处理的防抖搜索
  }, [onSearch, onSearchStateChange]);

  // 修改节点操作处理函数
  const handleNodeAction = (e, item, isDelete = false) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 在操作执行前取消任何待处理的搜索
    debouncedSearch.cancel();

    if (isDelete) {
      onDeleteNodeQuery(item.id);
    } else {
      onNodeQuery(item.label, [item.value], 'add');
    }
  };

  const handleSearchInput = (e) => {
    e.stopPropagation(); // 阻止事件冒泡
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const renderNodeEntity = (item) => {
    const matchingNode = graphNodes.find(node => 
      node.nodeLabel === item.label && 
      node.properties && 
      node.properties[displayProperties[item.label]?.displayProperty] === item.value
    );

    return (
      <div className={styles.labelItem}>
        <div className={styles.labelContent}>
          <span className={styles.labelText}>{item.value}</span>
        </div>
        <div className={styles.actionContainer}>
          {matchingNode ? (
            <Image
              src="/assets/delete.svg"
              alt="delete"
              width={24}
              height={24}
              className={styles.deleteButton}
              onClick={(e) => handleNodeAction(e, {...item, id: matchingNode.id}, true)}
            />
          ) : (
            <Image
              src="/assets/add.svg"
              alt="add"
              width={24}
              height={24}
              className={styles.addButton}
              onClick={(e) => handleNodeAction(e, item)}
            />
          )}
        </div>
      </div>
    );
  };

  const renderRelationshipEntity = (item) => {
    // 找到匹配的关系
    const matchingRel = graphRelationships.find(rel => {
      if (rel.type !== item.value.type) return false;
      
      // 找到起始节点
      const startNode = graphNodes.find(node => 
        node.id === rel.startNode && 
        node.properties && 
        node.properties[displayProperties[node.nodeLabel]?.displayProperty] === item.value.startNode
      );
      
      // 找到终止节点
      const endNode = graphNodes.find(node => 
        node.id === rel.endNode && 
        node.properties && 
        node.properties[displayProperties[node.nodeLabel]?.displayProperty] === item.value.endNode
      );
      
      return startNode && endNode;
    });

    return (
      <div className={styles.entityItemContainer}>
        <div 
          className={styles.relationshipEntityItemContainer}
          title={`${item.value.startNode} → ${item.value.endNode}`}
        >
          <span className={styles.entityItem}>
            {item.value.startNode.length > 10 
              ? `${item.value.startNode.substring(0, 10)}...` 
              : item.value.startNode}
          </span>
          <div className={styles.arrowContainer}>
            <Image
              src="/assets/cc-arrow-down.svg"
              alt="arrow right"
              width={16}
              height={16}
              className={styles.arrowIcon}
              style={{ transform: 'rotate(-90deg)' }}
            />
          </div>
          <span className={styles.entityItem}>
            {item.value.endNode.length > 10 
              ? `${item.value.endNode.substring(0, 10)}...` 
              : item.value.endNode}
          </span>
        </div>
        {matchingRel ? (
          <Image
            src="/assets/delete.svg"
            alt="delete"
            width={24}
            height={24}
            className={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRelationshipQuery(
                matchingRel.startNode,
                matchingRel.endNode,
                matchingRel.type
              );
            }}
          />
        ) : (
          <Image
            src="/assets/add.svg"
            alt="add"
            width={24}
            height={24}
            className={styles.addButton}
            onClick={(e) => {
              e.stopPropagation();
              // 创建一个模拟的实体数组，格式与 handleRelationshipClick 期望的一致
              const entity = [
                [item.value.startNode, generateTempId()], // 为起始节点生成临时ID
                [item.value.endNode, generateTempId()]    // 为终止节点生成临时ID
              ];
              handleRelationshipClick(item.value.type, entity);
            }}
          />
        )}
      </div>
    );
  };

  // 生成临时ID的辅助函数
  const generateTempId = () => `temp_${Math.random().toString(36).substr(2, 9)}`;

  const renderPropertyKey = (item) => (
    <div className={styles.entityItemContainer}>
      <span className={styles.entityItem}>{item.value}</span>
    </div>
  );

  // 在组件卸载时清理防抖函数
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // 在组件中暴露清除方法
  useImperativeHandle(ref, () => ({
    clearSearch
  }));

  return (
    <div className={styles.searchBox}>
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
        {searchQuery && (
          <Image
            src="/assets/delete.svg"
            alt="clear"
            width={16}
            height={16}
            className={styles.clearButton}
            onClick={clearSearch}
          />
        )}
      </div>
      {searchQuery && searchResults.length > 0 && (
        <div className={styles.searchResults}>
          {searchResults.map((category, categoryIndex) => (
            <div key={categoryIndex} className={styles.searchCategory}>
              <h4 className={styles.categoryTitle}>
                {category.category}
              </h4>
              <div className={
                category.category === 'NODEENTITIES' ? styles.nodeLabelsList :
                category.category === 'RELATIONSHIPENTITIES' ? styles.relationshipTypesList :
                styles.propertyKeysList
              }>
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    {item.type === 'NODEENTITIES' && renderNodeEntity(item)}
                    {item.type === 'RELATIONSHIPENTITIES' && renderRelationshipEntity(item)}
                    {item.type === 'PROPERTY' && renderPropertyKey(item)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default forwardRef(SearchBox);

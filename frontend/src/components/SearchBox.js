// components/SearchBox.js
import { useState } from 'react';
import styles from '../styles/playground.module.css';
import Image from 'next/image';

const SearchBox = ({ data, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (query) => {
    console.log('Search triggered with query:', query);
    console.log('Received data:', {
      nodeEntities: data.nodeEntities,
      relationshipEntities: data.relationshipEntities,
      propertyKeys: data.propertyKeys
    });

    if (!query.trim()) {
      setSearchResults([]);
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
    onSearch(results);
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const renderNodeEntity = (item) => (
    <div className={styles.labelItem}>
      <div className={styles.labelContent}>
        <span className={styles.labelText}>{item.value}</span>
      </div>
      <div className={styles.actionContainer}>
        <Image
          src="/assets/add.svg"
          alt="add"
          width={24}
          height={24}
          className={styles.addButton}
        />
      </div>
    </div>
  );

  const renderRelationshipEntity = (item) => (
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
      <Image
        src="/assets/add.svg"
        alt="add"
        width={24}
        height={24}
        className={styles.addButton}
      />
    </div>
  );

  const renderPropertyKey = (item) => (
    <div className={styles.entityItemContainer}>
      <span className={styles.entityItem}>{item.value}</span>
      <Image
        src="/assets/add.svg"
        alt="add"
        width={24}
        height={24}
        className={styles.addButton}
      />
    </div>
  );

  return (
    <div className={styles.searchBox}>
      <div className={styles.searchInputContainer}>
        <Image
          className={styles.searchIcon}
          src="/assets/5ef24176ffb1a63d056fe2471d9a3805.svg"
          alt="search icon"
          width={16}
          height={16}
        />
        <input
          type="text"
          placeholder="Search for..."
          value={searchQuery}
          onChange={handleSearchInput}
          className={styles.searchInput}
        />
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

export default SearchBox;

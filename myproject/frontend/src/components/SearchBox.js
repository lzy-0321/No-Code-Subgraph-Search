// components/SearchBox.js
import { useState } from 'react';
import styles from '../styles/playground.module.css';
import Image from 'next/image';

const SearchBox = ({ data, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query) => {
    if (!query.trim()) {
      onSearch([]);
      return;
    }
  
    const results = [];
    const lowerCaseQuery = query.toLowerCase();
  
    const addResult = (type, name) => {
      const isExactMatch = name.toLowerCase() === lowerCaseQuery;
      results.push({ type, name, isExactMatch });
    };
  
    // Search in node entities
    Object.keys(data.nodeEntities).forEach((label) => {
      data.nodeEntities[label].forEach((entity) => {
        if (entity.toLowerCase().includes(lowerCaseQuery)) {
          addResult('Node Entity', entity);
        }
      });
    });
  
    // Search in relationship entities
    Object.keys(data.relationshipEntities).forEach((type) => {
      data.relationshipEntities[type].forEach((entity) => {
        // Check each part of the relationship entity individually
        if (
          entity[0].toLowerCase().includes(lowerCaseQuery) ||
          entity[1].toLowerCase().includes(lowerCaseQuery)
        ) {
          addResult('Relationship Entity', `${entity[0]} → ${entity[1]}`);
        }
      });
    });
  
    // Search in property keys
    data.propertyKeys.forEach((key) => {
      if (key.toLowerCase().includes(lowerCaseQuery)) {
        addResult('Property Key', key);
      }
    });
  
    // Sort results to prioritize exact matches
    results.sort((a, b) => {
      if (a.isExactMatch && !b.isExactMatch) return -1;
      if (!a.isExactMatch && b.isExactMatch) return 1;
      return a.name.localeCompare(b.name);
    });
  
    onSearch(results);
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

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
      </div>
    </div>
  );
};

export default SearchBox;

// components/SearchResults.js
import styles from '../styles/playground.module.css';

const SearchResults = ({ results }) => {
  return (
    <div className={styles.searchResults}>
      {results.length > 0 ? (
        results.map((result, idx) => (
          <div key={idx} className={styles.searchResultItem}>
            <span className={styles.resultType}>{result.type}:</span>
            <span className={styles.resultName}>{result.name}</span>
          </div>
        ))
      ) : (
        <p className={styles.noResults}>No results found</p>
      )}
    </div>
  );
};

export default SearchResults;

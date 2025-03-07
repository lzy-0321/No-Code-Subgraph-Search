import { useEffect, useState } from 'react';
import styles from '../styles/GraphInfoDisplay.module.css';
import Image from 'next/image';

const GraphInfoDisplay = ({ graphNodes, graphRelationships }) => {
  const [nodeLabels, setNodeLabels] = useState([]);
  const [relationshipTypes, setRelationshipTypes] = useState([]);

  // Update node labels and relationship types based on the passed graphNodes and graphRelationships props
  useEffect(() => {
    // Extract unique node labels
    const labels = [...new Set(graphNodes.map(node => node.nodeLabel))];
    setNodeLabels(labels);

    // Extract unique relationship types
    const types = [...new Set(graphRelationships.map(relationship => relationship.type))];
    setRelationshipTypes(types);
  }, [graphNodes, graphRelationships]);

  return (
    <div className={styles.graphInfoContainer}>
      {/* In Graph 标题栏 */}
      <div className={styles.graphInfoContainerBackground}>
        <div className={styles.graphInfoHeader}>
          <Image
            className={styles.graphInfoIcon}
            src="/assets/93f66d49f8cec41f326c7bb705c4363e.svg"
            alt="graph info"
            width={18}
            height={18}
          />
          <span className={styles.graphInfoTitle}>In Graph</span>
        </div>

        {/* 节点和关系列表 */}
        <div className={styles.graphInfoList}>
          {/* 节点项 */}
          <div className={styles.graphInfoItem}>
            <div className={styles.itemHeader}>
              <Image
                className={styles.itemIcon}
                src="/assets/5c7bc533b46918472c06b5da9e3111a7.svg"
                alt="node"
                width={16}
                height={16}
              />
              <span className={styles.itemTitle}>Node ({nodeLabels.length})</span>
            </div>
            <div className={styles.itemContent}>
              {nodeLabels.length === 0 ? (
                <span className={styles.emptyMessage}>No nodes in the current graph</span>
              ) : (
                nodeLabels.map((label, index) => (
                  <div key={index} className={styles.itemTag}>
                    {label}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 关系项 */}
          <div className={styles.graphInfoItem}>
            <div className={styles.itemHeader}>
              <Image
                className={styles.itemIcon}
                src="/assets/461cd4b84fab404232553c25b46adbe5.svg"
                alt="relationship"
                width={16}
                height={16}
              />
              <span className={styles.itemTitle}>Relationship ({relationshipTypes.length})</span>
            </div>
            <div className={styles.itemContent}>
              {relationshipTypes.length === 0 ? (
                <span className={styles.emptyMessage}>No relationships in the current graph</span>
              ) : (
                relationshipTypes.map((type, index) => (
                  <div key={index} className={`${styles.itemTag} ${styles.relationshipTag}`}>
                    {type}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphInfoDisplay;


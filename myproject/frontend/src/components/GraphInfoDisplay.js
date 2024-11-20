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
      <div className={styles.flexRowGraphInfo}>
        <Image
          className={styles.imageGraphInfo}
          src="/assets/93f66d49f8cec41f326c7bb705c4363e.svg"
          alt="graph info"
          width={30}
          height={30}
        />
        <p className={styles.featureTextInGraph}>In Graph</p>
      </div>

      <div className={styles.nodeLabelContentBox}>
        <div className={styles.flexColumnNodeLabels}>
          <div className={styles.flexRowNodeImage}>
            <Image
              className={styles.imageNode}
              src="/assets/5c7bc533b46918472c06b5da9e3111a7.svg"
              alt="node"
              width={30}
              height={30}
            />
            <div className={styles.infoNodeCount}>Node ({nodeLabels.length})</div>
          </div>
          <div className={styles.nodeTypesList}>
            {nodeLabels.map((label, index) => (
              <div key={index} className={styles.nodeTypeItem}>
                <span className={styles.nodeTypeLabel}>{label}</span>
              </div>
            ))}
          </div>

          <div className={styles.flexRowRelationshipInfo}>
            <Image
              className={styles.imageRelationship}
              src="/assets/461cd4b84fab404232553c25b46adbe5.svg"
              alt="relationship"
              width={30}
              height={30}
            />
            <div className={styles.infoRelationshipCount}>Relationship ({relationshipTypes.length})</div>
          </div>
          <div className={styles.relationshipTypesList}>
            {relationshipTypes.map((type, index) => (
              <div key={index} className={styles.relationshipTypeItem}>
                <span className={styles.relationshipTypeLabel}>{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphInfoDisplay;

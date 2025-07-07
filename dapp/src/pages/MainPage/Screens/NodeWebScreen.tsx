import React from 'react';
import styles from './NodeWebScreen.module.css';
import NodeWebDashboard from '../../NodeWeb/components/NodeWebDashboard';

const NodeWebScreen: React.FC = () => {
  return (
    <div className={styles.nodeWebScreen}>
      <NodeWebDashboard />
    </div>
  );
};

export default NodeWebScreen;

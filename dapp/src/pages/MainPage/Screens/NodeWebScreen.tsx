import React from 'react';
import styles from './NodeWebScreen.module.css';

const NodeWebScreen: React.FC = () => {
  return (
    <div className={styles.nodeWebScreen}>
      <div className={styles.container}>
        <h1 className={styles.title}>Network Topology</h1>
        
        <div className={styles.content}>
          <div className={styles.networkVisualizer}>
            {/* Network graph visualization area */}
            <div className={styles.networkGraph}>
              <div className={styles.graphPlaceholder}>
                <div className={styles.graphIcon}>🕸️</div>
                <div className={styles.graphLabel}>Interactive network topology map</div>
              </div>
            </div>
            
            {/* Controls and filters */}
            <div className={styles.controlPanel}>
              <div className={styles.controlSection}>
                <h3 className={styles.sectionTitle}>Network Filters</h3>
                <div className={styles.filterOptions}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>
                      <input type="checkbox" defaultChecked className={styles.filterCheckbox} />
                      <span className={styles.checkboxCustom}></span>
                      <span>Known Threat Actors</span>
                    </label>
                    <label className={styles.filterLabel}>
                      <input type="checkbox" defaultChecked className={styles.filterCheckbox} />
                      <span className={styles.checkboxCustom}></span>
                      <span>Compromised Nodes</span>
                    </label>
                    <label className={styles.filterLabel}>
                      <input type="checkbox" defaultChecked className={styles.filterCheckbox} />
                      <span className={styles.checkboxCustom}></span>
                      <span>Critical Infrastructure</span>
                    </label>
                    <label className={styles.filterLabel}>
                      <input type="checkbox" className={styles.filterCheckbox} />
                      <span className={styles.checkboxCustom}></span>
                      <span>Unconfirmed Connections</span>
                    </label>
                  </div>
                  
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Connection Depth</label>
                    <div className={styles.sliderContainer}>
                      <input 
                        type="range" 
                        min="1" 
                        max="6" 
                        defaultValue="3" 
                        className={styles.slider} 
                      />
                      <span className={styles.sliderValue}>3</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.controlSection}>
                <h3 className={styles.sectionTitle}>View Options</h3>
                <div className={styles.viewOptions}>
                  <button className={styles.viewButton}>2D View</button>
                  <button className={`${styles.viewButton} ${styles.active}`}>3D View</button>
                  <button className={styles.viewButton}>Hierarchical</button>
                  <button className={styles.viewButton}>Force-Directed</button>
                </div>
              </div>
              
              <div className={styles.controlSection}>
                <h3 className={styles.sectionTitle}>Selected Node</h3>
                <div className={styles.selectedNode}>
                  <div className={styles.nodeInfo}>
                    <div className={styles.nodeHeader}>
                      <div className={styles.nodeName}>C2-Server-Alpha</div>
                      <div className={styles.nodeType}>Command & Control</div>
                    </div>
                    <div className={styles.nodeDetails}>
                      <div className={styles.nodeDetail}>
                        <span className={styles.detailLabel}>IP Address:</span>
                        <span className={styles.detailValue}>192.168.137.8</span>
                      </div>
                      <div className={styles.nodeDetail}>
                        <span className={styles.detailLabel}>Location:</span>
                        <span className={styles.detailValue}>Eastern Europe</span>
                      </div>
                      <div className={styles.nodeDetail}>
                        <span className={styles.detailLabel}>Connections:</span>
                        <span className={styles.detailValue}>17 outbound, 3 inbound</span>
                      </div>
                      <div className={styles.nodeDetail}>
                        <span className={styles.detailLabel}>Threat Level:</span>
                        <span className={`${styles.detailValue} ${styles.threatHigh}`}>High</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.nodeActions}>
                    <button className={styles.nodeButton}>Analyze</button>
                    <button className={styles.nodeButton}>Track</button>
                    <button className={styles.nodeButton}>Report</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.statBar}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>1,287</div>
              <div className={styles.statLabel}>Total Nodes</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>3,942</div>
              <div className={styles.statLabel}>Connections</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>47</div>
              <div className={styles.statLabel}>Threat Actors</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>86</div>
              <div className={styles.statLabel}>Critical Nodes</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>23</div>
              <div className={styles.statLabel}>Active Clusters</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeWebScreen;

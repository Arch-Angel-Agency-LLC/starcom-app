import React from 'react';
import styles from './AnalyzerScreen.module.css';

const AnalyzerScreen: React.FC = () => {
  return (
    <div className={styles.analyzerScreen}>
      <div className={styles.container}>
        <h1 className={styles.title}>Intelligence Analysis</h1>
        
        <div className={styles.content}>
          <div className={styles.dashboardGrid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Threat Analysis</h2>
                <span className={styles.badge}>12 Entries</span>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.chartPlaceholder}>
                  <div className={styles.chartIcon}>📊</div>
                  <div className={styles.chartLabel}>Threat distribution by region</div>
                </div>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <span className={styles.listItemName}>APT-Shadowbyte</span>
                    <span className={styles.listItemValue}>Level 8</span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listItemName}>Cerberus-Network</span>
                    <span className={styles.listItemValue}>Level 7</span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listItemName}>BlackMirror-Group</span>
                    <span className={styles.listItemValue}>Level 6</span>
                  </li>
                </ul>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.button}>View Full Report</button>
              </div>
            </div>
            
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Data Correlation</h2>
                <span className={styles.badge}>5 Active</span>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.correlationGraph}>
                  <div className={styles.chartIcon}>🔄</div>
                  <div className={styles.chartLabel}>Connection strength visualization</div>
                </div>
                <div className={styles.correlationStats}>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>87%</div>
                    <div className={styles.statLabel}>Pattern Match</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>24</div>
                    <div className={styles.statLabel}>Confirmed Links</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>8</div>
                    <div className={styles.statLabel}>Needs Review</div>
                  </div>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.button}>Run Analysis</button>
              </div>
            </div>
            
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Semantic Analysis</h2>
                <span className={styles.badge}>Real-time</span>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.semanticList}>
                  <div className={styles.semanticItem}>
                    <div className={styles.semanticTerm}>Financial Systems</div>
                    <div className={styles.semanticBar} style={{width: '85%'}}></div>
                    <div className={styles.semanticValue}>85%</div>
                  </div>
                  <div className={styles.semanticItem}>
                    <div className={styles.semanticTerm}>Infrastructure</div>
                    <div className={styles.semanticBar} style={{width: '65%'}}></div>
                    <div className={styles.semanticValue}>65%</div>
                  </div>
                  <div className={styles.semanticItem}>
                    <div className={styles.semanticTerm}>Government</div>
                    <div className={styles.semanticBar} style={{width: '45%'}}></div>
                    <div className={styles.semanticValue}>45%</div>
                  </div>
                  <div className={styles.semanticItem}>
                    <div className={styles.semanticTerm}>Healthcare</div>
                    <div className={styles.semanticBar} style={{width: '32%'}}></div>
                    <div className={styles.semanticValue}>32%</div>
                  </div>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.button}>Advanced Filters</button>
              </div>
            </div>
            
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Pattern Recognition</h2>
                <span className={styles.badge}>AI-Assisted</span>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.patternGrid}>
                  <div className={styles.patternCell} style={{backgroundColor: 'rgba(56, 189, 248, 0.2)'}}></div>
                  <div className={styles.patternCell} style={{backgroundColor: 'rgba(56, 189, 248, 0.3)'}}></div>
                  <div className={styles.patternCell} style={{backgroundColor: 'rgba(56, 189, 248, 0.1)'}}></div>
                  <div className={styles.patternCell} style={{backgroundColor: 'rgba(56, 189, 248, 0.4)'}}></div>
                  <div className={styles.patternCell} style={{backgroundColor: 'rgba(56, 189, 248, 0.5)'}}></div>
                  <div className={styles.patternCell} style={{backgroundColor: 'rgba(56, 189, 248, 0.2)'}}></div>
                  <div className={styles.patternCell} style={{backgroundColor: 'rgba(56, 189, 248, 0.6)'}}></div>
                  <div className={styles.patternCell} style={{backgroundColor: 'rgba(56, 189, 248, 0.3)'}}></div>
                  <div className={styles.patternCell} style={{backgroundColor: 'rgba(56, 189, 248, 0.1)'}}></div>
                </div>
                <div className={styles.patternInsight}>
                  <div className={styles.insightTitle}>AI Insight:</div>
                  <div className={styles.insightText}>
                    Pattern indicates coordinated activity across multiple sectors with 78% confidence.
                  </div>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.button}>Generate Report</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzerScreen;

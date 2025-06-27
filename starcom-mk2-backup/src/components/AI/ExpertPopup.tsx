import React, { useState } from 'react';
import styles from './ExpertPopup.module.css';

interface ExpertPopupProps {
  onClose: () => void;
}

const ExpertPopup: React.FC<ExpertPopupProps> = ({ onClose }) => {
  const [expertTab, setExpertTab] = useState<'builder' | 'training' | 'api' | 'system'>('builder');

  return (
    <div className={styles.expertPopup}>
      <div className={styles.expertHeader}>
        <h3 className={styles.expertTitle}>🔺 Expert Mode - System Administration</h3>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          title="Close Expert Mode"
        >
          ✕
        </button>
      </div>

      {/* Expert Sub-tabs */}
      <div className={styles.expertTabNavigation}>
        <button 
          className={`${styles.expertSubTab} ${expertTab === 'builder' ? styles.active : ''}`}
          onClick={() => setExpertTab('builder')}
        >
          🛠️ Command Builder
        </button>
        <button 
          className={`${styles.expertSubTab} ${expertTab === 'training' ? styles.active : ''}`}
          onClick={() => setExpertTab('training')}
        >
          🎓 AI Training
        </button>
        <button 
          className={`${styles.expertSubTab} ${expertTab === 'api' ? styles.active : ''}`}
          onClick={() => setExpertTab('api')}
        >
          🔌 Direct API
        </button>
        <button 
          className={`${styles.expertSubTab} ${expertTab === 'system' ? styles.active : ''}`}
          onClick={() => setExpertTab('system')}
        >
          ⚙️ System Diag
        </button>
      </div>

      <div className={styles.expertContent}>
        {expertTab === 'builder' && (
          <div className={styles.builderTab}>
            <div className={styles.expertSection}>
              <div className={styles.expertLabel}>Custom Command Builder</div>
              <p className={styles.expertDescription}>
                Create custom AI commands using JavaScript-like syntax. Define triggers, parameters, and execution logic.
              </p>
              <textarea 
                className={styles.commandBuilder}
                placeholder={`// Example: Custom threat analysis command
function customThreatScan(params) {
  return {
    name: "Advanced Threat Scanner",
    priority: "high",
    execute: async () => {
      // Custom logic here
      return analyzeThreats(params.sources);
    }
  };
}`}
                rows={8}
              ></textarea>
              <div className={styles.expertActions}>
                <button className={styles.expertButton}>Validate Syntax</button>
                <button className={styles.expertButton}>Deploy Command</button>
                <button className={styles.expertButton}>Test Run</button>
              </div>
            </div>
          </div>
        )}

        {expertTab === 'training' && (
          <div className={styles.trainingTab}>
            <div className={styles.expertSection}>
              <div className={styles.expertLabel}>AI Neural Network Training</div>
              <p className={styles.expertDescription}>
                Train and fine-tune AI models with custom datasets. Monitor learning progress and adjust parameters.
              </p>
              <div className={styles.trainingMetrics}>
                <div className={styles.metricRow}>
                  <span>Learning Rate:</span>
                  <input type="number" className={styles.metricInput} defaultValue="0.001" step="0.0001" />
                </div>
                <div className={styles.metricRow}>
                  <span>Batch Size:</span>
                  <input type="number" className={styles.metricInput} defaultValue="32" />
                </div>
                <div className={styles.metricRow}>
                  <span>Epochs:</span>
                  <input type="number" className={styles.metricInput} defaultValue="100" />
                </div>
                <div className={styles.metricRow}>
                  <span>Current Accuracy:</span>
                  <span className={styles.metricValue}>97.3%</span>
                </div>
              </div>
              <div className={styles.expertActions}>
                <button className={styles.expertButton}>Start Training</button>
                <button className={styles.expertButton}>Pause Training</button>
                <button className={styles.expertButton}>Export Model</button>
              </div>
            </div>
          </div>
        )}

        {expertTab === 'api' && (
          <div className={styles.apiTab}>
            <div className={styles.expertSection}>
              <div className={styles.expertLabel}>Direct API Access</div>
              <p className={styles.expertDescription}>
                Execute raw API calls directly against the AI system. For advanced users only.
              </p>
              <div className={styles.apiControls}>
                <div className={styles.apiEndpoint}>
                  <label>Endpoint:</label>
                  <select className={styles.endpointSelect}>
                    <option>/api/v2/ai/execute</option>
                    <option>/api/v2/ai/train</option>
                    <option>/api/v2/ai/status</option>
                    <option>/api/v2/ai/config</option>
                  </select>
                </div>
                <div className={styles.apiMethod}>
                  <label>Method:</label>
                  <select className={styles.methodSelect}>
                    <option>POST</option>
                    <option>GET</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                  </select>
                </div>
              </div>
              <textarea 
                className={styles.apiPayload}
                placeholder={`{
  "command": "custom_analysis",
  "parameters": {
    "target": "global_threats",
    "depth": "maximum",
    "priority": "critical"
  },
  "callback": "webhook_url"
}`}
                rows={6}
              ></textarea>
              <div className={styles.expertActions}>
                <button className={styles.expertButton}>Validate JSON</button>
                <button className={styles.expertButton}>Execute Call</button>
                <button className={styles.expertButton}>Save Template</button>
              </div>
            </div>
          </div>
        )}

        {expertTab === 'system' && (
          <div className={styles.systemTab}>
            <div className={styles.expertSection}>
              <div className={styles.expertLabel}>System Diagnostics & Monitoring</div>
              <p className={styles.expertDescription}>
                Monitor AI system health, performance metrics, and internal processes.
              </p>
              <div className={styles.systemMetrics}>
                <div className={styles.systemRow}>
                  <span>CPU Usage:</span>
                  <span className={styles.systemValue}>23%</span>
                  <div className={styles.systemBar}>
                    <div className={styles.systemFill} style={{width: '23%'}}></div>
                  </div>
                </div>
                <div className={styles.systemRow}>
                  <span>Memory:</span>
                  <span className={styles.systemValue}>1.2GB / 8GB</span>
                  <div className={styles.systemBar}>
                    <div className={styles.systemFill} style={{width: '15%'}}></div>
                  </div>
                </div>
                <div className={styles.systemRow}>
                  <span>Neural Network:</span>
                  <span className={styles.systemValue}>Online</span>
                  <div className={styles.statusDot} style={{backgroundColor: '#00ff88'}}></div>
                </div>
                <div className={styles.systemRow}>
                  <span>Quantum Core:</span>
                  <span className={styles.systemValue}>Stable</span>
                  <div className={styles.statusDot} style={{backgroundColor: '#00ff88'}}></div>
                </div>
                <div className={styles.systemRow}>
                  <span>API Latency:</span>
                  <span className={styles.systemValue}>23ms</span>
                  <div className={styles.statusDot} style={{backgroundColor: '#00ff88'}}></div>
                </div>
              </div>
              <div className={styles.expertActions}>
                <button className={styles.expertButton}>Run Full Diagnostic</button>
                <button className={styles.expertButton}>Export Logs</button>
                <button className={styles.expertButton}>Restart Services</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertPopup;

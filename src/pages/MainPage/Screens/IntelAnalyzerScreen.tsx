import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Container 
} from '@mui/material';
import { 
  Brain, 
  BarChart2, 
  Network, 
  FileSearch,
  TrendingUp
} from 'lucide-react';

// Lazy load the Intel Analysis Panel with error handling
const LazyIntelAnalysisPanel = React.lazy(() => {
  console.log('🔍 IntelAnalyzerScreen: Lazy loading IntelAnalysisPanel...');
  return import('../../NetRunner/components/IntelAnalysisPanel')
    .then(module => {
      console.log('✅ IntelAnalyzerScreen: IntelAnalysisPanel loaded successfully');
      return { default: module.default };
    })
    .catch(error => {
      console.error('❌ IntelAnalyzerScreen: Failed to load IntelAnalysisPanel:', error);
      // Return a fallback component instead of throwing
      return {
        default: () => (
          <div style={{ padding: '20px', color: 'red' }}>
            <Typography color="error">
              Failed to load IntelAnalysisPanel: {error.message}
            </Typography>
            <details style={{ marginTop: '10px' }}>
              <summary>Error Details</summary>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {error.stack}
              </pre>
            </details>
          </div>
        )
      };
    });
});
import styles from './IntelAnalyzerScreen.module.css';

// Simple error boundary component for debugging
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    console.error('🔍 IntelAnalyzerScreen ErrorBoundary: Error caught:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔍 IntelAnalyzerScreen ErrorBoundary: Full error details:', { error, errorInfo });
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: 'rgba(255,0,0,0.1)' }}>
          <Typography color="error" variant="h6">
            Error in Intel Analysis Panel
          </Typography>
          <Typography variant="body2" style={{ marginTop: '10px', fontFamily: 'monospace' }}>
            {this.state.error && this.state.error.toString()}
          </Typography>
          <details style={{ marginTop: '10px' }}>
            <summary>Error Details</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analyzer-tabpanel-${index}`}
      aria-labelledby={`analyzer-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const IntelAnalyzerScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Add basic lifecycle logging for debugging
  React.useEffect(() => {
    console.log('🔍 IntelAnalyzerScreen: Component mounted');
    return () => console.log('🔍 IntelAnalyzerScreen: Component unmounting');
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <div className={styles.analyzerScreen}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          fontWeight: 600, 
          color: 'text.primary',
          mb: 3
        }}>
          Information Analysis Dashboard
        </Typography>
        
        <Paper elevation={2} sx={{ bgcolor: 'background.paper' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="information analysis tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab 
                icon={<Brain size={20} />} 
                label="Intel Analysis" 
                id="analyzer-tab-0"
                aria-controls="analyzer-tabpanel-0"
              />
              <Tab 
                icon={<BarChart2 size={20} />} 
                label="Threat Analysis" 
                id="analyzer-tab-1"
                aria-controls="analyzer-tabpanel-1"
              />
              <Tab 
                icon={<Network size={20} />} 
                label="Data Correlation" 
                id="analyzer-tab-2"
                aria-controls="analyzer-tabpanel-2"
              />
              <Tab 
                icon={<FileSearch size={20} />} 
                label="Pattern Recognition" 
                id="analyzer-tab-3"
                aria-controls="analyzer-tabpanel-3"
              />
              <Tab 
                icon={<TrendingUp size={20} />} 
                label="Reports" 
                id="analyzer-tab-4"
                aria-controls="analyzer-tabpanel-4"
              />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <React.Suspense fallback={
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Typography>Loading Intel Analysis Panel...</Typography>
              </div>
            }>
              <ErrorBoundary>
                <LazyIntelAnalysisPanel 
                  onPackageCreated={(result) => {
                    console.log('🔍 IntelAnalyzerScreen: Analysis package created:', result);
                    // Handle analysis result - could save to database, notify user, etc.
                  }}
                />
              </ErrorBoundary>
            </React.Suspense>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box>
              <Typography variant="h6" gutterBottom>Threat Analysis</Typography>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>Active Threats</h2>
                  <span className={styles.badge}>12 Entries</span>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.chartPlaceholder}>
                    <div className={styles.chartIcon}>�</div>
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
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box>
              <Typography variant="h6" gutterBottom>Data Correlation</Typography>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>Connection Analysis</h2>
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
                  <button className={styles.button}>Advanced Filters</button>
                </div>
              </div>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Box>
              <Typography variant="h6" gutterBottom>Pattern Recognition</Typography>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>AI Pattern Detection</h2>
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
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <Box>
              <Typography variant="h6" gutterBottom>Analysis Reports</Typography>
              <div className={styles.dashboardGrid}>
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2>Recent Reports</h2>
                    <span className={styles.badge}>Latest</span>
                  </div>
                  <div className={styles.cardContent}>
                    <Typography variant="body2" color="text.secondary">
                      View and manage your intelligence analysis reports.
                    </Typography>
                  </div>
                  <div className={styles.cardFooter}>
                    <button className={styles.button}>View All Reports</button>
                  </div>
                </div>
              </div>
            </Box>
          </TabPanel>
        </Paper>
      </Container>
    </div>
  );
};

export default IntelAnalyzerScreen;

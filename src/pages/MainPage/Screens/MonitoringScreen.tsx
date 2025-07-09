import React from 'react';
import { 
  Box, 
  Typography, 
  Paper
} from '@mui/material';

// Import NetRunner monitoring components
import MonitoringDashboard from '../../NetRunner/components/MonitoringDashboard';
import MonitoringPanel from '../../NetRunner/components/MonitoringPanel';

/**
 * MonitoringScreen
 * 
 * Dedicated monitoring interface for continuous surveillance.
 * Extracted from NetRunner to provide focused monitoring capabilities.
 */
const MonitoringScreen: React.FC = () => {
  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          OSINT Monitoring
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Continuous surveillance and monitoring of targets and threats
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }}>
        {/* Use existing MonitoringDashboard but pass props for integrating the advanced panel */}
        <MonitoringDashboard 
          onCreateMonitor={(monitor) => console.log('Create monitor:', monitor)}
          onDeleteMonitor={(monitorId) => console.log('Delete monitor:', monitorId)}
          onToggleMonitor={(monitorId, active) => console.log('Toggle monitor:', monitorId, active)}
          renderAdvancedPanel={() => (
            <Box mt={4}>
              <Typography variant="h6" gutterBottom>Advanced Monitoring System</Typography>
              <Paper sx={{ p: 2 }}>
                <MonitoringPanel 
                  onTargetSelect={(targetId) => console.log('Target selected:', targetId)}
                />
              </Paper>
            </Box>
          )}
        />
      </Box>
    </Box>
  );
};

export default MonitoringScreen;

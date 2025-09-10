import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { ApplicationContext } from '../../components/Router/ApplicationRouter';

// Import the new Control Station layout components
import NetRunnerControlStation from './components/layout/NetRunnerControlStation';

// Import logging services
import { LoggerFactory } from './services/logging';

/**
 * NetRunner Application
 * 
 * Main entry point for the NetRunner OSINT platform.
 * Integrates with the Enhanced Application Router and renders within MainCenter.
 * Uses the new modular Control Station architecture adapted for embedded mode.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */
interface NetRunnerApplicationProps extends ApplicationContext {
  className?: string;
}

const NetRunnerApp: React.FC<NetRunnerApplicationProps> = ({ className, ...context }) => {
  // Initialize logger
  const logger = useMemo(() => LoggerFactory.getLogger('NetRunnerApplication'), []);

  // Log application startup
  React.useEffect(() => {
    logger.info('NetRunner Application started', {
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      architecture: 'Control Station (Embedded)',
      context
    });

    return () => {
      logger.info('NetRunner Application shutting down');
    };
  }, [logger, context]);

  return (
    <Box
      className={className}
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: 'Aldrich, monospace',
        // Ensure it fits within the MainCenter container without overflow
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <NetRunnerControlStation isEmbedded={true} />
    </Box>
  );
};

export default NetRunnerApp;

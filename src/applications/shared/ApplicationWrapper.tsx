import React from 'react';
import { Box, Typography } from '@mui/material';

interface ApplicationWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * Shared wrapper component for all consolidated applications
 * Provides consistent styling and layout structure
 */
export const ApplicationWrapper: React.FC<ApplicationWrapperProps> = ({ 
  children, 
  title, 
  subtitle 
}) => {
  return (
    <Box sx={{ 
      height: '100vh', 
      bgcolor: '#000', 
      color: '#00ff00',
      overflow: 'hidden'
    }}>
      {/* Application Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid #00ff00',
        background: 'linear-gradient(90deg, rgba(0,255,0,0.1) 0%, rgba(0,0,0,0.8) 100%)'
      }}>
        <Typography variant="h4" sx={{ 
          fontFamily: 'monospace', 
          fontWeight: 'bold',
          textShadow: '0 0 10px #00ff00'
        }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="subtitle1" sx={{ color: '#888', fontFamily: 'monospace' }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Application Content */}
      <Box sx={{ height: 'calc(100vh - 80px)', overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
};

export default ApplicationWrapper;

import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
// Use engine alias (helps avoid relative path resolution quirks in some environments)
import { NetRunnerScriptsUIService } from '@netrunner-engine';

/**
 * Debug component to test scripts engine functionality directly
 */
const ScriptsEngineDebugger: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const results: string[] = [];
    
    try {
      results.push('🔧 Testing Scripts Engine...');
      
      // Test 1: Can we get the service instance?
      results.push('📋 Getting service instance...');
      const service = NetRunnerScriptsUIService.getInstance();
      results.push('✅ Service instance created');
      
      // Test 2: Can we get default scripts?
      results.push('📋 Getting default scripts...');
      const defaultScripts = service.getDefaultScripts();
      results.push(`✅ Found ${defaultScripts.length} default scripts`);
      
      // Test 3: List script details
      if (defaultScripts.length > 0) {
        defaultScripts.forEach(script => {
          results.push(`   📝 ${script.metadata.id}: ${script.metadata.name}`);
        });
      } else {
        results.push('⚠️ No scripts found!');
      }
      
      // Test 4: Can we get UI state?
      results.push('📋 Getting UI state...');
      const uiState = service.getUIState();
      results.push(`✅ UI State - Available Scripts: ${uiState.availableScripts.length}`);
      
    } catch (error) {
      results.push(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('[ScriptsEngineDebugger] Error:', error);
    }
    
    setTestResults(results);
  }, []);

  return (
    <Box sx={{ 
      p: 2, 
      backgroundColor: '#1a1a1a', 
      border: '1px solid #333', 
      borderRadius: 1,
      maxWidth: 400
    }}>
      <Typography variant="h6" sx={{ color: '#00ff88', mb: 2 }}>
        Scripts Engine Debug
      </Typography>
      {testResults.map((result, index) => (
        <Typography 
          key={index} 
          variant="caption" 
          sx={{ 
            display: 'block', 
            fontFamily: 'monospace',
            color: result.includes('❌') ? '#ff4444' : 
                   result.includes('⚠️') ? '#ffaa00' : 
                   result.includes('✅') ? '#00ff88' : '#cccccc',
            mb: 0.5
          }}
        >
          {result}
        </Typography>
      ))}
    </Box>
  );
};

export default ScriptsEngineDebugger;

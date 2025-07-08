/**
 * PowerToolsPanel.tsx
 * 
 * Component for displaying and using OSINT power tools in the NetRunner dashboard.
 */

import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Button, 
  Divider, 
  Chip,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  Badge
} from '@mui/material';
import { 
  Briefcase, 
  Server, 
  Search, 
  DatabaseBackup, 
  BarChart2,
  CheckCircle,
  AlertTriangle,
  PlusCircle,
  Info,
  Bot
} from 'lucide-react';

import { NetRunnerTool, ToolCategory } from '../tools/NetRunnerPowerTools';

interface PowerToolsPanelProps {
  tools: NetRunnerTool[];
  selectedTools: string[];
  onToolSelect: (toolId: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

/**
 * PowerToolsPanel displays available OSINT tools organized by category
 */
const PowerToolsPanel: React.FC<PowerToolsPanelProps> = ({
  tools,
  selectedTools,
  onToolSelect,
  activeCategory,
  onCategoryChange
}) => {
  // Filter tools by category
  const filteredTools = tools.filter(tool => 
    activeCategory === 'all' || tool.category === activeCategory
  );
  
  // Category tab mapping
  const categories: Record<string, {label: string, icon: React.ReactNode}> = {
    all: { label: 'All Tools', icon: <Briefcase size={16} /> },
    discovery: { label: 'Discovery', icon: <Search size={16} /> },
    scraping: { label: 'Scraping', icon: <DatabaseBackup size={16} /> },
    aggregation: { label: 'Aggregation', icon: <Server size={16} /> },
    analysis: { label: 'Analysis', icon: <BarChart2 size={16} /> },
    verification: { label: 'Verification', icon: <CheckCircle size={16} /> },
    visualization: { label: 'Visualization', icon: <BarChart2 size={16} /> },
    automation: { label: 'Automation', icon: <Server size={16} /> }
  };
  
  // Get icon for tool category
  const getCategoryIcon = (category: ToolCategory) => {
    return categories[category]?.icon || <Briefcase size={16} />;
  };
  
  return (
    <Box>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
            <Briefcase size={20} style={{ marginRight: '8px' }} />
            OSINT Power Tools
            <Chip 
              label={`${selectedTools.length} Selected`} 
              size="small" 
              color={selectedTools.length > 0 ? "primary" : "default"}
              sx={{ ml: 2 }} 
            />
          </Typography>
          
          <Box>
            <Button 
              variant="outlined"
              size="small"
              disabled={selectedTools.length === 0}
              startIcon={<Server size={16} />}
            >
              Deploy Tools
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Select tools to use in your intelligence gathering operations.
          Combined tools can provide deeper insights and more comprehensive results.
        </Typography>
        
        {/* Category tabs */}
        <Tabs
          value={activeCategory}
          onChange={(_, newValue) => onCategoryChange(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          {Object.entries(categories).map(([category, { label, icon }]) => (
            <Tab 
              key={category}
              value={category}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {icon}
                  <Box sx={{ ml: 1 }}>{label}</Box>
                </Box>
              }
            />
          ))}
        </Tabs>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
          {filteredTools.map(tool => (
            <Box key={tool.id} sx={{ gridColumn: {xs: 'span 12', sm: 'span 6', md: 'span 4'} }}>
              <Card 
                elevation={selectedTools.includes(tool.id) ? 3 : 1}
                sx={{ 
                  borderLeft: selectedTools.includes(tool.id) ? '4px solid #1976d2' : 'none',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Badge 
                        color={tool.premium ? "error" : "success"} 
                        badgeContent={tool.premium ? "PRO" : "FREE"}
                      >
                        {getCategoryIcon(tool.category)}
                      </Badge>
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {tool.name}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small"
                      onClick={() => onToolSelect(tool.id)}
                      color={selectedTools.includes(tool.id) ? "primary" : "default"}
                    >
                      {selectedTools.includes(tool.id) ? 
                        <CheckCircle size={18} /> : 
                        <PlusCircle size={18} />
                      }
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {tool.description}
                  </Typography>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Capabilities:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {tool.capabilities.slice(0, 3).map((capability, index) => (
                        <Chip 
                          key={index}
                          label={capability}
                          size="small"
                          sx={{ mb: 0.5 }}
                        />
                      ))}
                      {tool.capabilities.length > 3 && (
                        <Tooltip title={tool.capabilities.slice(3).join(', ')}>
                          <Chip 
                            label={`+${tool.capabilities.length - 3}`}
                            size="small"
                            sx={{ mb: 0.5 }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Intel Types:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {tool.intelTypes.slice(0, 3).map((type, index) => (
                        <Chip 
                          key={index}
                          label={type}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 0.5 }}
                        />
                      ))}
                      {tool.intelTypes.length > 3 && (
                        <Tooltip title={tool.intelTypes.slice(3).join(', ')}>
                          <Chip 
                            label={`+${tool.intelTypes.length - 3}`}
                            size="small"
                            variant="outlined"
                            sx={{ mb: 0.5 }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </CardContent>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  bgcolor: 'rgba(0,0,0,0.03)', 
                  p: 1,
                  borderTop: '1px solid rgba(0,0,0,0.1)'
                }}>
                  <Chip 
                    size="small" 
                    label={tool.license}
                    icon={<Info size={14} />}
                  />
                  
                  <Tooltip title={tool.automationCompatible ? 
                    "Compatible with bot automation" : 
                    "Not compatible with bot automation"
                  }>
                    <Chip 
                      size="small"
                      label={tool.automationCompatible ? "Bot Compatible" : "Manual Only"}
                      icon={tool.automationCompatible ? <Bot size={14} /> : <AlertTriangle size={14} />}
                      color={tool.automationCompatible ? "success" : "default"}
                      variant="outlined"
                    />
                  </Tooltip>
                </Box>
              </Card>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default PowerToolsPanel;

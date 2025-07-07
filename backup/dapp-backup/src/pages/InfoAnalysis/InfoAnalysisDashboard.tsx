import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Divider, 
  Tab,
  Tabs,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  Network, 
  Fingerprint, 
  BarChart2, 
  Share2, 
  PieChart,
  FileText,
  GitCompare,
  Brain
} from 'lucide-react';

interface AnalysisTool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  path: string;
}

/**
 * Information Analysis Dashboard
 * 
 * A dashboard that provides access to various analysis tools and techniques
 * for processing and interpreting collected intelligence.
 */
const InfoAnalysisDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Analysis tool categories
  const categories = [
    "All Tools",
    "Entity Analysis",
    "Network Analysis",
    "Pattern Recognition",
    "Visualization",
    "Reports"
  ];
  
  // Collection of analysis tools
  const tools: AnalysisTool[] = [
    {
      id: 'entity-analysis',
      title: 'Entity Extraction & Analysis',
      description: 'Identify and analyze entities such as people, organizations, and locations',
      icon: <Fingerprint size={24} />,
      category: 'Entity Analysis',
      path: '/info-analysis/entity'
    },
    {
      id: 'network-analysis',
      title: 'Relationship Mapping',
      description: 'Visualize and analyze connections between entities',
      icon: <Network size={24} />,
      category: 'Network Analysis',
      path: '/node-web'
    },
    {
      id: 'temporal-analysis',
      title: 'Temporal Analysis',
      description: 'Analyze events and patterns over time',
      icon: <BarChart2 size={24} />,
      category: 'Pattern Recognition',
      path: '/timeline'
    },
    {
      id: 'data-visualization',
      title: 'Data Visualization',
      description: 'Create charts, graphs, and visualizations from intelligence data',
      icon: <PieChart size={24} />,
      category: 'Visualization',
      path: '/info-analysis/visualize'
    },
    {
      id: 'pattern-analysis',
      title: 'Pattern & Anomaly Detection',
      description: 'Identify patterns and anomalies in collected data',
      icon: <GitCompare size={24} />,
      category: 'Pattern Recognition',
      path: '/info-analysis/patterns'
    },
    {
      id: 'intelligence-reports',
      title: 'Intelligence Reports',
      description: 'Generate and manage intelligence reports',
      icon: <FileText size={24} />,
      category: 'Reports',
      path: '/intel'
    },
    {
      id: 'social-network-analysis',
      title: 'Social Network Analysis',
      description: 'Analyze social media connections and influence networks',
      icon: <Share2 size={24} />,
      category: 'Network Analysis',
      path: '/info-analysis/social'
    },
    {
      id: 'cognitive-analysis',
      title: 'Cognitive Intelligence Analysis',
      description: 'AI-assisted analysis of complex intelligence data',
      icon: <Brain size={24} />,
      category: 'Entity Analysis',
      path: '/info-analysis/cognitive'
    }
  ];
  
  // Filter tools based on the active tab
  const filteredTools = activeTab === 0 
    ? tools 
    : tools.filter(tool => tool.category === categories[activeTab]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Information Analysis
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Network />}
          href="/node-web"
        >
          Node Web
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Analysis Tools & Techniques
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Select an analysis tool to help interpret and visualize your intelligence data.
          Each tool provides specialized analysis capabilities.
        </Typography>
        
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable" 
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          {categories.map((category, index) => (
            <Tab key={index} label={category} />
          ))}
        </Tabs>
      </Paper>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Grid container spacing={3}>
          {filteredTools.map(tool => (
            <Grid item xs={12} sm={6} md={4} key={tool.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ 
                      backgroundColor: 'primary.main', 
                      borderRadius: '50%', 
                      p: 1, 
                      mr: 2,
                      color: 'white'
                    }}>
                      {tool.icon}
                    </Box>
                    <Typography variant="h6" component="h2">
                      {tool.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {tool.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" color="primary" href={tool.path}>
                    Open Tool
                  </Button>
                  <Button size="small" color="secondary">
                    Documentation
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default InfoAnalysisDashboard;

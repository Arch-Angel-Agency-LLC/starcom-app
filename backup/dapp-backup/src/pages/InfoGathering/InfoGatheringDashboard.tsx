import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Divider, 
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Search, 
  Globe, 
  Mail, 
  Database, 
  Image, 
  FileText, 
  Map, 
  Phone,
  User
} from 'lucide-react';

interface ToolCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

/**
 * Information Gathering Dashboard
 * 
 * A dashboard that provides access to various information gathering tools
 * and techniques for cyber investigations.
 */
const InfoGatheringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Tool categories
  const categories = [
    "All Tools",
    "Domain Intelligence",
    "Person Search",
    "Social Media",
    "Dark Web",
    "Business Intel",
    "Geolocation"
  ];
  
  // Collection of information gathering tools
  const tools: ToolCard[] = [
    {
      id: 'domain-search',
      title: 'Domain Intelligence',
      description: 'WHOIS, DNS, SSL certificate analysis, and website technology fingerprinting',
      icon: <Globe size={24} />,
      category: 'Domain Intelligence'
    },
    {
      id: 'email-search',
      title: 'Email Discovery & Validation',
      description: 'Find email addresses, verify them, and check for data breaches',
      icon: <Mail size={24} />,
      category: 'Person Search'
    },
    {
      id: 'social-media-search',
      title: 'Social Media Intelligence',
      description: 'Find social media profiles and analyze connections across platforms',
      icon: <User size={24} />,
      category: 'Social Media'
    },
    {
      id: 'image-search',
      title: 'Reverse Image Search',
      description: 'Find similar images and original sources across the web',
      icon: <Image size={24} />,
      category: 'Person Search'
    },
    {
      id: 'data-breach-search',
      title: 'Data Breach Analysis',
      description: 'Search for leaked credentials and sensitive information',
      icon: <Database size={24} />,
      category: 'Dark Web'
    },
    {
      id: 'document-search',
      title: 'Document Intelligence',
      description: 'Find and analyze documents related to your investigation',
      icon: <FileText size={24} />,
      category: 'Business Intel'
    },
    {
      id: 'geolocation-search',
      title: 'Geolocation Intelligence',
      description: 'Map and track locations from various data sources',
      icon: <Map size={24} />,
      category: 'Geolocation'
    },
    {
      id: 'phone-search',
      title: 'Phone Number Intelligence',
      description: 'Carrier lookup, owner information, and connection analysis',
      icon: <Phone size={24} />,
      category: 'Person Search'
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
          Information Gathering
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Search />}
          href="/netrunner"
        >
          Advanced Search
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          OSINT Tools & Techniques
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Select a tool category below to begin gathering information for your investigation.
          Each tool provides specialized intelligence gathering capabilities.
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
                  <Button size="small" color="primary">
                    Launch Tool
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

export default InfoGatheringDashboard;

/**
 * IntelResultsViewer.tsx
 * 
 * Component for displaying intelligence results from NetRunner tools.
 * Supports various visualization modes for different types of intel.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Alert,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse
} from '@mui/material';
import {
  Download,
  Share,
  FileText,
  Layers,
  Table as TableIcon,
  BarChart2,
  Map,
  Code,
  PackageOpen,
  User,
  Network,
  FileCheck,
  Laptop,
  Globe,
  Building,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  Mail,
  MapPin,
  DollarSign
} from 'lucide-react';

import ListItemWrapper from './ListItemWrapper';
import { IntelPackage, IntelType } from '../tools/NetRunnerPowerTools';
import { IntelEntity, IntelRelationship, Evidence } from '../models/IntelReport';

// Display modes for intel visualization
type DisplayMode = 'summary' | 'table' | 'graph' | 'map' | 'json';

// Helper functions for UI elements
const getIntelTypeColor = (type: IntelType | string): "primary" | "secondary" | "success" | "warning" | "error" | "info" | "default" => {
  switch (type) {
    case 'identity':
      return 'primary';
    case 'network':
      return 'info';
    case 'financial':
      return 'success';
    case 'geospatial':
      return 'warning';
    case 'social':
      return 'secondary';
    case 'infrastructure':
      return 'info';
    case 'vulnerability':
      return 'error';
    case 'darkweb':
      return 'error';
    case 'threat':
      return 'warning';
    case 'temporal':
      return 'default';
    default:
      return 'default';
  }
};

// Get color for confidence level
const getConfidenceColor = (confidence: number): "primary" | "secondary" | "success" | "warning" | "error" | "info" | "default" => {
  if (confidence >= 0.9 || confidence >= 90) return 'success';
  if (confidence >= 0.7 || confidence >= 70) return 'primary';
  if (confidence >= 0.5 || confidence >= 50) return 'info';
  if (confidence >= 0.3 || confidence >= 30) return 'warning';
  return 'error';
};

// Get color for entity type
const getEntityTypeColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'person':
      return '#2196f3'; // blue
    case 'organization':
      return '#4caf50'; // green
    case 'device':
    case 'server':
      return '#ff9800'; // orange
    case 'domain':
    case 'ip_address':
      return '#9c27b0'; // purple
    case 'email':
      return '#00bcd4'; // cyan
    case 'username':
      return '#3f51b5'; // indigo
    default:
      return '#757575'; // grey
  }
};

interface IntelResultsViewerProps {
  intelPackage?: IntelPackage | null;
  entities?: IntelEntity[];
  relationships?: IntelRelationship[];
  evidence?: Evidence[];
  packageType?: string;  // Added this prop
  isAnalyzerResults?: boolean;
  onSaveToLibrary?: (intelPackage: IntelPackage) => void;
  onExport?: (data: unknown, format: string) => void;
  showControls?: boolean;
}

/**
 * Component for viewing and interacting with intel results
 */
const IntelResultsViewer: React.FC<IntelResultsViewerProps> = ({
  intelPackage = null,
  entities = [],
  relationships = [],
  evidence = [],
  packageType = null,
  isAnalyzerResults = false,
  onSaveToLibrary,
  onExport,
  showControls = true
}) => {
  // Display state
  const [displayMode, setDisplayMode] = useState<DisplayMode>('summary');
  const [activeTab, setActiveTab] = useState(0);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);
  
  // Handle tab change for analyzer results
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Toggle entity details expansion
  const toggleEntityExpansion = (entityId: string) => {
    setExpandedEntity(prev => prev === entityId ? null : entityId);
  };
  
  // Toggle evidence details expansion
  const toggleEvidenceExpansion = (evidenceId: string) => {
    setExpandedEvidence(prev => prev === evidenceId ? null : evidenceId);
  };
  
  // Get icon for entity type
  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'person':
        return <User size={18} />;
      case 'organization':
        return <Building size={18} />;
      case 'device':
      case 'server':
        return <Laptop size={18} />;
      case 'domain':
      case 'ip_address':
        return <Globe size={18} />;
      case 'threat_actor':
        return <AlertTriangle size={18} />;
      case 'vulnerability':
      case 'cve':
        return <AlertTriangle size={18} />;
      case 'email':
        return <Mail size={18} />;
      case 'location':
      case 'coordinate':
        return <MapPin size={18} />;
      case 'financial':
      case 'transaction':
        return <DollarSign size={18} />;
      default:
        return <FileCheck size={18} />;
    }
  };
  
  // Format entity property values for display
  const formatPropertyValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (!intelPackage && entities.length === 0) {
    return (
      <Alert severity="info">
        No intelligence data available. Run a tool to gather intelligence.
      </Alert>
    );
  }
  
  // Check if we're displaying analyzer results or regular intel package
  // If isAnalyzerResults is explicitly provided, use that value
  // Otherwise, determine it based on the presence of entities and absence of intelPackage
  const effectiveIsAnalyzerResults = isAnalyzerResults || (entities.length > 0 && !intelPackage);
  
  // Extract packageType from metadata if available
  const effectivePackageType = packageType || (entities.length > 0 && entities[0].properties 
    ? entities[0].properties.packageType as string 
    : null);

  // Display the metadata for the intel package
  const renderMetadata = () => {
    if (isAnalyzerResults) {
      return (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Intelligence Analysis
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {effectivePackageType && (
              <Chip 
                label={effectivePackageType.replace('_', ' ')}
                color="primary"
                size="small"
                variant="outlined"
                sx={{ textTransform: 'capitalize' }}
              />
            )}
            {entities.length > 0 && (
              <Chip 
                label={`${entities.length} Entities`}
                color="info"
                size="small"
                variant="outlined"
              />
            )}
            {relationships.length > 0 && (
              <Chip 
                label={`${relationships.length} Relationships`}
                color="info"
                size="small"
                variant="outlined"
              />
            )}
            {evidence.length > 0 && (
              <Chip 
                label={`${evidence.length} Evidence Items`}
                color="info"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      );
    }
    
    if (!intelPackage) {
      return null;
    }
    
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Intelligence Package
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {intelPackage.metadata.intelTypes.map((type) => (
            <Chip 
              key={type} 
              label={type} 
              color={getIntelTypeColor(type)} 
              size="small"
              variant="outlined"
            />
          ))}
          <Chip 
            label={`Confidence: ${intelPackage.metadata.confidence}%`} 
            color={getConfidenceColor(intelPackage.metadata.confidence)} 
            size="small"
          />
          <Chip 
            label={intelPackage.metadata.classification} 
            color="secondary" 
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Created: {new Date(intelPackage.metadata.createdAt).toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last Updated: {new Date(intelPackage.metadata.updatedAt).toLocaleString()}
        </Typography>
      </Box>
    );
  };

  // Display the summary of the intel package
  const renderSummary = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          {intelPackage.name}
        </Typography>
        <Typography variant="body2" paragraph>
          {intelPackage.description}
        </Typography>
        
        <Typography variant="subtitle2" gutterBottom>
          Entities ({intelPackage.entities.length})
        </Typography>
        
        {intelPackage.entities.length > 0 ? (
          <List>
            {intelPackage.entities.slice(0, 5).map(entity => (
              <Card key={entity.id} sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">
                      {entity.name}
                    </Typography>
                    <Chip 
                      label={entity.type} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Source: {entity.source} | Confidence: {entity.confidence}%
                  </Typography>
                </CardContent>
              </Card>
            ))}
            
            {intelPackage.entities.length > 5 && (
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setDisplayMode('table')}
                sx={{ mt: 1 }}
                fullWidth
              >
                View all {intelPackage.entities.length} entities
              </Button>
            )}
          </List>
        ) : (
          <Alert severity="info" sx={{ mt: 1 }}>
            No entities found in this intelligence package.
          </Alert>
        )}
        
        {intelPackage.relationships.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Relationships ({intelPackage.relationships.length})
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => setDisplayMode('graph')}
              sx={{ mt: 1 }}
              fullWidth
            >
              View Relationship Graph
            </Button>
          </>
        )}
      </Box>
    );
  };

  // Display the table view of entities
  const renderTable = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Entity List
        </Typography>
        
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {intelPackage.entities.map(entity => (
            <ListItem 
              key={entity.id}
              divider 
              sx={{ 
                borderLeft: `4px solid ${getEntityTypeColor(entity.type)}`,
                borderRadius: '4px',
                mb: 1
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">
                      {entity.name}
                    </Typography>
                    <Box>
                      <Chip 
                        label={entity.type} 
                        size="small" 
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        label={`${entity.confidence}%`} 
                        size="small" 
                        color={getConfidenceColor(entity.confidence)}
                      />
                    </Box>
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" component="span" color="text.secondary">
                      Source: {entity.source}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {Object.entries(entity.attributes)
                        .filter(([key]) => !['id', 'name', 'type', 'source', 'confidence'].includes(key))
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <Box key={key} sx={{ display: 'flex', fontSize: '0.85rem' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>
                              {key}:
                            </Typography>
                            <Typography variant="caption">
                              {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : String(value).substring(0, 50)}
                              {typeof value === 'object' && JSON.stringify(value).length > 50 ? '...' : ''}
                              {typeof value === 'string' && value.length > 50 ? '...' : ''}
                            </Typography>
                          </Box>
                        ))
                      }
                      {Object.keys(entity.attributes).length > 3 && (
                        <Typography variant="caption" color="primary">
                          {Object.keys(entity.attributes).length - 3} more attributes...
                        </Typography>
                      )}
                    </Box>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  // Display the graph view (placeholder)
  const renderGraph = () => {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Layers size={48} opacity={0.5} />
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Relationship Graph Visualization
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Relationship graph visualization is not yet implemented.
          This will show connections between {intelPackage.entities.length} entities
          with {intelPackage.relationships.length} relationships.
        </Typography>
      </Box>
    );
  };

  // Display the map view (placeholder)
  const renderMap = () => {
    // Check if there are any geospatial entities
    const hasGeospatialData = intelPackage.entities.some(entity => 
      entity.metadata.intelType === 'geospatial' || 
      ('coordinates' in entity.attributes) ||
      ('latitude' in entity.attributes && 'longitude' in entity.attributes) ||
      ('lat' in entity.attributes && 'lon' in entity.attributes)
    );
    
    if (!hasGeospatialData) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No geospatial data available in this intelligence package.
        </Alert>
      );
    }
    
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Map size={48} opacity={0.5} />
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Geospatial Visualization
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Map visualization is not yet implemented.
          This will display the geographical distribution of entities.
        </Typography>
      </Box>
    );
  };

  // Display the raw JSON
  const renderJson = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Raw JSON Data
        </Typography>
        
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: 'rgba(0,0,0,0.05)', 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            overflow: 'auto',
            maxHeight: '400px'
          }}
        >
          <pre>{JSON.stringify(intelPackage, null, 2)}</pre>
        </Box>
      </Box>
    );
  };

  // Render the content based on display mode
  const renderContent = () => {
    switch (displayMode) {
      case 'summary':
        return renderSummary();
      case 'table':
        return renderTable();
      case 'graph':
        return renderGraph();
      case 'map':
        return renderMap();
      case 'json':
        return renderJson();
      default:
        return renderSummary();
    }
  };

  // Render analyzer results
  const renderAnalyzerResults = () => {
    // Render entity list
    const renderEntities = () => (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Entities ({entities.length})
        </Typography>
        
        <List>
          {entities.map(entity => (
            <React.Fragment key={entity.id}>
              <Paper variant="outlined" sx={{ mb: 1 }}>
                <ListItemWrapper
                  button
                  onClick={() => toggleEntityExpansion(entity.id)}
                  secondaryAction={
                    <IconButton edge="end">
                      {expandedEntity === entity.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getEntityIcon(entity.type)}
                        <Typography sx={{ ml: 1 }}>
                          {entity.name}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={entity.type}
                          sx={{ ml: 1, textTransform: 'capitalize' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Confidence: {(entity.confidence * 100).toFixed(0)}%
                      </Typography>
                    }
                  />
                </ListItemWrapper>
                
                <Collapse in={expandedEntity === entity.id} timeout="auto" unmountOnExit>
                  <Box sx={{ p: 2, pt: 0 }}>
                    {entity.identifiers && Object.keys(entity.identifiers).length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 1 }}>Identifiers</Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Type</TableCell>
                                <TableCell>Value</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.entries(entity.identifiers).map(([key, value]) => (
                                <TableRow key={key}>
                                  <TableCell component="th" scope="row">
                                    {key}
                                  </TableCell>
                                  <TableCell>{value}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    )}
                    
                    {entity.properties && Object.keys(entity.properties).length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 2 }}>Properties</Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Property</TableCell>
                                <TableCell>Value</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.entries(entity.properties).map(([key, value]) => (
                                <TableRow key={key}>
                                  <TableCell component="th" scope="row">
                                    {key}
                                  </TableCell>
                                  <TableCell>{formatPropertyValue(value)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            </React.Fragment>
          ))}
        </List>
      </Box>
    );
    
    // Render relationships
    const renderRelationships = () => (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Relationships ({relationships.length})
        </Typography>
        
        {relationships.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No relationships found
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Source</TableCell>
                  <TableCell>Relationship</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Confidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {relationships.map(rel => {
                  const sourceEntity = entities.find(e => e.id === rel.source);
                  const targetEntity = entities.find(e => e.id === rel.target);
                  
                  return (
                    <TableRow key={rel.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {sourceEntity ? (
                            <>
                              {getEntityIcon(sourceEntity.type)}
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {sourceEntity.name}
                              </Typography>
                            </>
                          ) : (
                            `Unknown (${rel.source.substring(0, 8)}...)`
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={rel.type.replace(/_/g, ' ')}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {targetEntity ? (
                            <>
                              {getEntityIcon(targetEntity.type)}
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {targetEntity.name}
                              </Typography>
                            </>
                          ) : (
                            `Unknown (${rel.target.substring(0, 8)}...)`
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{(rel.confidence * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {relationships.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Note: In a production environment, this would include an interactive graph visualization 
              of the relationships between entities.
            </Typography>
          </Box>
        )}
      </Box>
    );
    
    // Render evidence
    const renderEvidence = () => (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Evidence ({evidence.length})
        </Typography>
        
        <List>
          {evidence.map(item => (
            <React.Fragment key={item.id}>
              <Paper variant="outlined" sx={{ mb: 1 }}>
                <ListItemWrapper
                  button
                  onClick={() => toggleEvidenceExpansion(item.id)}
                  secondaryAction={
                    <IconButton edge="end">
                      {expandedEvidence === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FileCheck size={18} />
                        <Typography sx={{ ml: 1 }}>
                          {item.title}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={item.type}
                          sx={{ ml: 1, textTransform: 'capitalize' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {new Date(item.timestamp).toLocaleString()}
                      </Typography>
                    }
                  />
                </ListItemWrapper>
                
                <Collapse in={expandedEvidence === item.id} timeout="auto" unmountOnExit>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Typography variant="body2" paragraph>
                      {item.description}
                    </Typography>
                    
                    {item.url && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>Source:</Box>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            {item.url}
                            <ExternalLink size={14} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
                          </a>
                        </Typography>
                      </Box>
                    )}
                    
                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 1 }}>Metadata</Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Property</TableCell>
                                <TableCell>Value</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.entries(item.metadata).map(([key, value]) => (
                                <TableRow key={key}>
                                  <TableCell component="th" scope="row">
                                    {key}
                                  </TableCell>
                                  <TableCell>{formatPropertyValue(value)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            </React.Fragment>
          ))}
        </List>
      </Box>
    );
    
    return (
      <Box>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<User />} label="Entities" />
          <Tab icon={<Network />} label="Relationships" />
          <Tab icon={<FileCheck />} label="Evidence" />
        </Tabs>
        
        <Box sx={{ mt: 2 }}>
          {activeTab === 0 && renderEntities()}
          {activeTab === 1 && renderRelationships()}
          {activeTab === 2 && renderEvidence()}
        </Box>
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      {renderMetadata()}
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Tabs 
          value={displayMode} 
          onChange={(_, newValue) => setDisplayMode(newValue as DisplayMode)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Summary" value="summary" icon={<FileText size={16} />} iconPosition="start" />
          <Tab label="Table" value="table" icon={<TableIcon size={16} />} iconPosition="start" />
          <Tab label="Graph" value="graph" icon={<BarChart2 size={16} />} iconPosition="start" />
          <Tab label="Map" value="map" icon={<Map size={16} />} iconPosition="start" />
          <Tab label="JSON" value="json" icon={<Code size={16} />} iconPosition="start" />
        </Tabs>
        
        {showControls && (
          <Box>
            <Tooltip title="Save to Intelligence Library">
              <IconButton 
                color="primary" 
                onClick={() => onSaveToLibrary && onSaveToLibrary(intelPackage)}
                size="small"
              >
                <PackageOpen size={20} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Export Results">
              <IconButton 
                color="primary" 
                onClick={() => onExport && onExport(intelPackage, 'json')}
                size="small"
              >
                <Download size={20} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Share Intelligence">
              <IconButton 
                color="primary"
                size="small"
              >
                <Share size={20} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
      
      {effectiveIsAnalyzerResults ? renderAnalyzerResults() : renderContent()}
    </Paper>
  );
};

export default IntelResultsViewer;

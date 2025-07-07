import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  IconButton,
  Tooltip,
  Button,
  CircularProgress
} from '@mui/material';
import {
  User,
  Building,
  Globe,
  AtSign,
  Hash,
  Calendar,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  CreditCard,
  AlertTriangle,
  Info,
  Download,
  Link as LinkIcon
} from 'lucide-react';

import { SearchResult, EntityType } from '../types/netrunner';

// Entity definition
interface Entity {
  id: string;
  name: string;
  type: EntityType;
  confidence: number;
  source: string;
  occurrences: number;
  metadata?: Record<string, unknown>;
  relatedEntityIds?: string[];
}

interface EntityExtractorProps {
  searchResults: SearchResult[];
  onEntitySelect?: (entity: Entity) => void;
}

const EntityExtractor: React.FC<EntityExtractorProps> = ({ 
  searchResults,
  onEntitySelect
}) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedType, setExpandedType] = useState<EntityType | null>(null);
  
  // Domain/URL detection regex
  const domainRegex = /\b(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi;
  
  // Extract entities from search results
  useEffect(() => {
    const extractEntities = () => {
      setLoading(true);
      
      // Create a map to track unique entities
      const entityMap = new Map<string, Entity>();
      
      // Process each search result
      searchResults.forEach(result => {
        // Extract domains/URLs
        const domains = result.content.match(domainRegex) || [];
        domains.forEach(domain => {
          const entityId = `domain-${domain}`;
          
          if (entityMap.has(entityId)) {
            // Increment occurrences for existing entity
            const entity = entityMap.get(entityId)!;
            entity.occurrences += 1;
          } else {
            // Create new entity
            entityMap.set(entityId, {
              id: entityId,
              name: domain,
              type: 'domain',
              confidence: 0.9,
              source: result.source,
              occurrences: 1
            });
          }
        });
        
        // Extract emails using regex
        try {
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const emails = result.content.match(emailRegex) || [];
          
          emails.forEach(email => {
            const entityId = `email-${email}`;
            
            if (entityMap.has(entityId)) {
              const entity = entityMap.get(entityId)!;
              entity.occurrences += 1;
            } else {
              entityMap.set(entityId, {
                id: entityId,
                name: email,
                type: 'email',
                confidence: 0.95,
                source: result.source,
                occurrences: 1
              });
            }
          });
        } catch (error) {
          console.error('Error extracting emails:', error);
        }
        
        // Process any entities already included in the result
        if (result.entities) {
          result.entities.forEach(entity => {
            const entityId = `${entity.type}-${entity.name}`;
            
            if (entityMap.has(entityId)) {
              const existingEntity = entityMap.get(entityId)!;
              existingEntity.occurrences += 1;
              
              // Keep the highest confidence value
              if (entity.confidence > existingEntity.confidence) {
                existingEntity.confidence = entity.confidence;
              }
            } else {
              entityMap.set(entityId, {
                id: entityId,
                name: entity.name,
                type: entity.type,
                confidence: entity.confidence || 0.7,
                source: result.source,
                occurrences: 1,
                metadata: entity.metadata
              });
            }
          });
        }
      });
      
      // Convert map to array and sort by occurrences
      const extractedEntities = Array.from(entityMap.values())
        .sort((a, b) => b.occurrences - a.occurrences);
      
      setEntities(extractedEntities);
      setLoading(false);
    };
    
    if (searchResults.length > 0) {
      extractEntities();
    } else {
      setEntities([]);
    }
  }, [searchResults]);
  
  // Toggle expansion of entity type sections
  const toggleExpand = (type: EntityType) => {
    setExpandedType(expandedType === type ? null : type);
  };
  
  // Group entities by type
  const groupedEntities = entities.reduce((groups, entity) => {
    if (!groups[entity.type]) {
      groups[entity.type] = [];
    }
    groups[entity.type].push(entity);
    return groups;
  }, {} as Record<EntityType, Entity[]>);
  
  // Get icon based on entity type
  const getEntityIcon = (type: EntityType) => {
    switch(type) {
      case 'person':
        return <User size={18} />;
      case 'organization':
        return <Building size={18} />;
      case 'location':
        return <Globe size={18} />;
      case 'domain':
        return <Globe size={18} />;
      case 'email':
        return <AtSign size={18} />;
      case 'date':
        return <Calendar size={18} />;
      case 'hashtag':
        return <Hash size={18} />;
      case 'financial':
        return <CreditCard size={18} />;
      default:
        return <Info size={18} />;
    }
  };
  
  // Check if there are extracted entities
  const hasEntities = Object.keys(groupedEntities).length > 0;
  
  // Generate count badge for entity types
  const entityTypeCounts = Object.entries(groupedEntities).reduce((counts, [type, entities]) => {
    counts[type as EntityType] = entities.length;
    return counts;
  }, {} as Record<EntityType, number>);
  
  // Format entity type label
  const formatEntityType = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1) + 's';
  };
  
  // Handle entity selection
  const handleEntityClick = (entity: Entity) => {
    if (onEntitySelect) {
      onEntitySelect(entity);
    }
  };
  
  // Determine confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return '#4caf50';
    if (confidence >= 0.7) return '#ff9800';
    return '#f44336';
  };
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100%',
        p: 3
      }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography>Extracting entities...</Typography>
      </Box>
    );
  }
  
  return (
    <Paper sx={{ 
      p: 2, 
      height: '100%', 
      overflow: 'auto',
      backgroundColor: 'rgba(30, 40, 50, 0.6)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(100, 120, 140, 0.2)'
    }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Extracted Entities
        </Typography>
        
        {hasEntities && (
          <Tooltip title="Export entities">
            <IconButton size="small">
              <Download size={18} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      {!hasEntities && !loading && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: 'calc(100% - 40px)',
          opacity: 0.7
        }}>
          <AlertTriangle size={32} style={{ marginBottom: 16 }} />
          <Typography>No entities found</Typography>
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            Try adjusting your search terms or selecting different sources
          </Typography>
        </Box>
      )}
      
      {hasEntities && (
        <List sx={{ mt: 1 }}>
          {Object.entries(groupedEntities).map(([type, typeEntities]) => (
            <React.Fragment key={type}>
              <ListItem 
                button
                onClick={() => toggleExpand(type as EntityType)}
                sx={{ 
                  backgroundColor: 'rgba(40, 50, 60, 0.5)',
                  mb: 1,
                  borderRadius: 1
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getEntityIcon(type as EntityType)}
                </ListItemIcon>
                <ListItemText 
                  primary={formatEntityType(type)} 
                  secondary={`${typeEntities.length} found`}
                />
                <Chip 
                  label={typeEntities.length} 
                  size="small" 
                  sx={{ 
                    mr: 1, 
                    backgroundColor: 'rgba(70, 90, 110, 0.6)',
                    height: 24
                  }} 
                />
                {expandedType === type ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </ListItem>
              
              <Collapse in={expandedType === type} timeout="auto">
                <List component="div" disablePadding>
                  {typeEntities.map((entity) => (
                    <ListItem 
                      key={entity.id}
                      button
                      onClick={() => handleEntityClick(entity)}
                      sx={{ 
                        pl: 4, 
                        borderLeft: '1px solid rgba(100, 120, 140, 0.2)',
                        ml: 2,
                        mb: 0.5,
                        backgroundColor: 'rgba(50, 60, 70, 0.3)',
                        borderRadius: 1
                      }}
                    >
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              {entity.name}
                            </Typography>
                            {type === 'domain' && (
                              <Tooltip title="Open in new tab">
                                <IconButton 
                                  size="small" 
                                  component="a" 
                                  href={entity.name.startsWith('http') ? entity.name : `https://${entity.name}`}
                                  target="_blank"
                                  onClick={(e) => e.stopPropagation()}
                                  sx={{ p: 0.5 }}
                                >
                                  <ArrowUpRight size={14} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Tooltip title="Confidence score">
                              <Box 
                                sx={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%',
                                  backgroundColor: getConfidenceColor(entity.confidence),
                                  mr: 1
                                }}
                              />
                            </Tooltip>
                            <Typography variant="caption" sx={{ mr: 1 }}>
                              {Math.round(entity.confidence * 100)}%
                            </Typography>
                            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 12 }} />
                            <Typography variant="caption" sx={{ mr: 1 }}>
                              {entity.occurrences} {entity.occurrences === 1 ? 'mention' : 'mentions'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
              
              {Object.keys(groupedEntities).indexOf(type) < Object.keys(groupedEntities).length - 1 && (
                <Divider sx={{ my: 1 }} />
              )}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default EntityExtractor;

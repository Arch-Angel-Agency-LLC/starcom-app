/**
 * IntelReportBuilder.tsx
 * 
 * Component for building Intel Reports from collected data.
 * Serves as a bridge between NetRunner and IntelAnalyzer.
 */

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Button, 
  Divider, 
  Chip,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { 
  FileText, 
  CheckCircle, 
  PlusCircle,
  Clock,
  Tag,
  Lock,
  ChevronRight
} from 'lucide-react';

import { 
  IntelReport, 
  createIntelReport, 
  finalizeIntelReport, 
  ClassificationLevel 
} from '../models/IntelReport';
import { IntelType } from '../tools/NetRunnerPowerTools';
import { SearchResult } from '../types/netrunner';

interface IntelReportBuilderProps {
  searchResults?: SearchResult[];
  onCreateReport?: (report: IntelReport) => void;
  onSaveDraft?: (report: IntelReport) => void;
}

/**
 * IntelReportBuilder allows creating structured intelligence reports
 * from search results and other data sources
 */
const IntelReportBuilder: React.FC<IntelReportBuilderProps> = ({
  searchResults = [],
  onCreateReport,
  onSaveDraft
}) => {
  // Report state
  const [title, setTitle] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [classification, setClassification] = useState<ClassificationLevel>('UNCLASSIFIED');
  const [intelTypes, setIntelTypes] = useState<IntelType[]>(['identity']);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Helper to validate the form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!summary.trim()) newErrors.summary = 'Summary is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (intelTypes.length === 0) newErrors.intelTypes = 'At least one intel type is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Add a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  // Remove a tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  // Create a report
  const handleCreateReport = () => {
    if (!validateForm()) return;
    
    // Mock user data (would come from auth context in a real app)
    const userId = 'user-123';
    const userName = 'NetRunner Agent';
    
    // Create a new report
    const report = createIntelReport(
      title,
      summary,
      description,
      userId,
      userName,
      classification,
      intelTypes
    );
    
    // Add tags
    report.tags = tags;
    
    // Add evidence from search results
    if (searchResults.length > 0) {
      report.evidence = searchResults.map(result => ({
        id: result.id,
        type: 'document',
        title: result.title,
        description: result.snippet,
        url: result.url,
        timestamp: result.timestamp,
        metadata: result.metadata
      }));
    }
    
    // Add entities if available in search results
    if (searchResults.some(result => result.entityIds?.length)) {
      // This would be expanded in a real implementation to extract entities
      // from search results and add them to the report
    }
    
    // Call the callback with the finalized report
    if (onCreateReport) {
      onCreateReport(finalizeIntelReport(report));
    }
  };
  
  // Save as draft
  const handleSaveDraft = () => {
    if (!title.trim()) {
      setErrors({ title: 'Title is required for drafts' });
      return;
    }
    
    // Mock user data
    const userId = 'user-123';
    const userName = 'NetRunner Agent';
    
    // Create a draft report
    const report = createIntelReport(
      title,
      summary || 'Draft summary',
      description || 'Draft description',
      userId,
      userName,
      classification,
      intelTypes
    );
    
    // Add tags
    report.tags = tags;
    
    // Call the callback with the draft report
    if (onSaveDraft) {
      onSaveDraft(report);
    }
  };
  
  return (
    <Box>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
            <FileText size={20} style={{ marginRight: '8px' }} />
            Intel Report Builder
          </Typography>
          
          <Box>
            <Button 
              variant="outlined"
              size="small"
              onClick={handleSaveDraft}
              sx={{ mr: 1 }}
            >
              Save Draft
            </Button>
            <Button 
              variant="contained"
              size="small"
              color="primary"
              onClick={handleCreateReport}
              startIcon={<CheckCircle size={16} />}
            >
              Create Report
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create an intelligence report from gathered data. Reports can be analyzed further 
          and traded on the Intelligence Exchange Marketplace.
        </Typography>
        
        <Grid container spacing={3}>
          {/* Report Details */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Report Title"
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Summary"
              variant="outlined"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              error={!!errors.summary}
              helperText={errors.summary}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Detailed Description"
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={!!errors.description}
              helperText={errors.description}
              multiline
              rows={4}
              sx={{ mb: 2 }}
            />
          </Grid>
          
          {/* Classification and Intel Types */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Classification</InputLabel>
              <Select
                value={classification}
                label="Classification"
                onChange={(e) => setClassification(e.target.value as ClassificationLevel)}
              >
                <MenuItem value="UNCLASSIFIED">UNCLASSIFIED</MenuItem>
                <MenuItem value="CONFIDENTIAL">CONFIDENTIAL</MenuItem>
                <MenuItem value="SECRET">SECRET</MenuItem>
                <MenuItem value="TOP_SECRET">TOP SECRET</MenuItem>
                <MenuItem value="COSMIC">COSMIC</MenuItem>
              </Select>
              <FormHelperText>Security classification level</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.intelTypes}>
              <InputLabel>Intel Types</InputLabel>
              <Select
                multiple
                value={intelTypes}
                label="Intel Types"
                onChange={(e) => setIntelTypes(e.target.value as IntelType[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as IntelType[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="identity">Identity</MenuItem>
                <MenuItem value="network">Network</MenuItem>
                <MenuItem value="financial">Financial</MenuItem>
                <MenuItem value="geospatial">Geospatial</MenuItem>
                <MenuItem value="social">Social</MenuItem>
                <MenuItem value="infrastructure">Infrastructure</MenuItem>
                <MenuItem value="vulnerability">Vulnerability</MenuItem>
                <MenuItem value="darkweb">Dark Web</MenuItem>
                <MenuItem value="threat">Threat</MenuItem>
                <MenuItem value="temporal">Temporal</MenuItem>
              </Select>
              <FormHelperText>{errors.intelTypes || 'Types of intelligence included'}</FormHelperText>
            </FormControl>
          </Grid>
          
          {/* Tags */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <TextField
                label="Tags"
                variant="outlined"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                sx={{ flexGrow: 1, mr: 1 }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button 
                variant="outlined"
                onClick={handleAddTag}
                sx={{ height: '56px' }}
              >
                <PlusCircle size={20} />
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {tags.map(tag => (
                <Chip 
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                />
              ))}
              {tags.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No tags added yet
                </Typography>
              )}
            </Box>
          </Grid>
          
          {/* Evidence from Search Results */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Evidence from Search Results
            </Typography>
            
            {searchResults.length > 0 ? (
              <Box sx={{ maxHeight: '200px', overflow: 'auto' }}>
                {searchResults.map(result => (
                  <Card key={result.id} variant="outlined" sx={{ mb: 1 }}>
                    <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="bold">{result.title}</Typography>
                        <Chip 
                          size="small"
                          label={`${(result.confidence * 100).toFixed(0)}%`}
                          color={result.confidence > 0.7 ? 'success' : 'default'}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Source: {result.source} | {new Date(result.timestamp).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No search results available to add as evidence
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default IntelReportBuilder;

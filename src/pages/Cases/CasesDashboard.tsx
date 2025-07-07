import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tabs,
  Tab,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  FolderPlus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  Users, 
  AlertCircle, 
  Clock,
  Filter
} from 'lucide-react';

// Case interface
interface Case {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'closed' | 'archived' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  assignedTo: string[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

/**
 * Cases Dashboard
 * 
 * A dashboard for managing and tracking investigation cases.
 */
const CasesDashboard: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Load sample data
  useEffect(() => {
    const loadSampleData = async () => {
      setLoading(true);
      
      try {
        // In a real implementation, this would load from an API or service
        // For now, we'll create some sample data
        const sampleCases: Case[] = [
          {
            id: 'CASE-2025-001',
            title: 'Network Intrusion Investigation',
            description: 'Investigation into unauthorized access detected in corporate network',
            status: 'open',
            priority: 'high',
            category: 'Cyber Security',
            assignedTo: ['John Smith', 'Alice Johnson'],
            createdAt: '2025-06-20T14:30:00Z',
            updatedAt: '2025-07-05T09:15:00Z',
            tags: ['network-security', 'intrusion', 'data-theft']
          },
          {
            id: 'CASE-2025-002',
            title: 'Financial Fraud Analysis',
            description: 'Investigation into suspected financial fraud in accounts department',
            status: 'open',
            priority: 'critical',
            category: 'Financial Crime',
            assignedTo: ['Robert Chen'],
            createdAt: '2025-06-25T10:45:00Z',
            updatedAt: '2025-07-04T16:20:00Z',
            tags: ['fraud', 'financial', 'insider-threat']
          },
          {
            id: 'CASE-2025-003',
            title: 'Malware Analysis',
            description: 'Analysis of new malware strain detected in marketing department',
            status: 'pending',
            priority: 'medium',
            category: 'Cyber Security',
            assignedTo: ['Alice Johnson', 'David Lee'],
            createdAt: '2025-06-30T09:15:00Z',
            updatedAt: '2025-07-02T11:30:00Z',
            tags: ['malware', 'ransomware', 'threat-analysis']
          },
          {
            id: 'CASE-2025-004',
            title: 'Data Leak Investigation',
            description: 'Investigation into potential data leak of customer information',
            status: 'closed',
            priority: 'high',
            category: 'Data Security',
            assignedTo: ['John Smith'],
            createdAt: '2025-06-15T08:30:00Z',
            updatedAt: '2025-06-28T14:45:00Z',
            tags: ['data-leak', 'customer-data', 'compliance']
          },
          {
            id: 'CASE-2025-005',
            title: 'Suspicious Activity Analysis',
            description: 'Analysis of suspicious login patterns from overseas IPs',
            status: 'open',
            priority: 'medium',
            category: 'Cyber Security',
            assignedTo: ['Robert Chen', 'Alice Johnson'],
            createdAt: '2025-07-01T11:20:00Z',
            updatedAt: '2025-07-03T09:45:00Z',
            tags: ['login-security', 'unauthorized-access']
          },
          {
            id: 'CASE-2025-006',
            title: 'Supply Chain Security Review',
            description: 'Comprehensive security review of key supply chain vendors',
            status: 'pending',
            priority: 'low',
            category: 'Vendor Security',
            assignedTo: ['David Lee'],
            createdAt: '2025-06-18T13:10:00Z',
            updatedAt: '2025-06-25T16:30:00Z',
            tags: ['supply-chain', 'vendor-assessment', 'third-party-risk']
          },
          {
            id: 'CASE-2025-007',
            title: 'Employee Threat Assessment',
            description: 'Assessment of potential insider threat from terminated employee',
            status: 'archived',
            priority: 'medium',
            category: 'Personnel Security',
            assignedTo: ['John Smith', 'Sarah Wong'],
            createdAt: '2025-05-30T10:00:00Z',
            updatedAt: '2025-06-15T12:15:00Z',
            tags: ['insider-threat', 'employee', 'access-control']
          }
        ];
        
        setCases(sampleCases);
      } catch (error) {
        console.error('Error loading case data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSampleData();
  }, []);
  
  // Filter cases based on tab and search term
  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = searchTerm === '' || 
      caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesTab = true;
    
    // Filter based on tab selection
    switch(tabValue) {
      case 0: // All Cases
        break;
      case 1: // Open Cases
        matchesTab = caseItem.status === 'open';
        break;
      case 2: // Pending Cases
        matchesTab = caseItem.status === 'pending';
        break;
      case 3: // Closed Cases
        matchesTab = caseItem.status === 'closed';
        break;
      case 4: // Archived Cases
        matchesTab = caseItem.status === 'archived';
        break;
      default:
        break;
    }
    
    return matchesSearch && matchesTab;
  });
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };
  
  // Status chip color mapping
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'open': return 'primary';
      case 'pending': return 'warning';
      case 'closed': return 'success';
      case 'archived': return 'default';
      default: return 'default';
    }
  };
  
  // Priority chip color mapping
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'low': return '#41c7e4';
      case 'medium': return '#e4c641';
      case 'high': return '#e49a41';
      case 'critical': return '#e44141';
      default: return '#999';
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Cases
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<FolderPlus />}
        >
          New Case
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Cases" />
            <Tab label="Open" />
            <Tab label="Pending" />
            <Tab label="Closed" />
            <Tab label="Archived" />
          </Tabs>
          
          <TextField
            placeholder="Search cases..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ width: '300px' }}
          />
        </Box>
      </Paper>
      
      <Paper elevation={3} sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : filteredCases.length > 0 ? (
          <>
            <TableContainer sx={{ flex: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Case ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCases
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((caseItem) => (
                      <TableRow key={caseItem.id} hover>
                        <TableCell>{caseItem.id}</TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">{caseItem.title}</Typography>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>
                            {caseItem.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={caseItem.status} 
                            color={getStatusColor(caseItem.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={caseItem.priority} 
                            size="small"
                            sx={{ 
                              bgcolor: getPriorityColor(caseItem.priority),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>{caseItem.category}</TableCell>
                        <TableCell>
                          {caseItem.assignedTo.length > 1 ? (
                            <Chip
                              label={`${caseItem.assignedTo[0]} +${caseItem.assignedTo.length - 1}`}
                              size="small"
                              icon={<Users size={14} />}
                            />
                          ) : (
                            caseItem.assignedTo[0]
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Clock size={14} style={{ marginRight: 4 }} />
                            <Typography variant="body2">
                              {new Date(caseItem.updatedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex' }}>
                            <IconButton size="small" color="primary">
                              <Eye size={18} />
                            </IconButton>
                            <IconButton size="small" color="secondary">
                              <Edit size={18} />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <Trash2 size={18} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredCases.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            p: 4
          }}>
            <Filter size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <Typography variant="h6">No cases match your search criteria</Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<Search />} 
              sx={{ mt: 2 }}
              onClick={() => {
                setSearchTerm('');
                setTabValue(0);
              }}
            >
              Clear Filters
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CasesDashboard;

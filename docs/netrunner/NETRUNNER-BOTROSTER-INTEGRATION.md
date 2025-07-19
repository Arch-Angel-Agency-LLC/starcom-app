# NetRunner-BotRoster Integration

## 1. Introduction

This document outlines the integration between the NetRunner intelligence platform and the BotRoster system. This integration enables automated intelligence gathering, processing, and analysis through configurable bot tasks. The BotRoster system provides a registry of specialized bots that can leverage NetRunner's power tools to perform various intelligence operations autonomously.

## 2. Integration Overview

### 2.1 System Relationship

```
┌───────────────────────┐                 ┌───────────────────────┐
│                       │                 │                       │
│      NetRunner        │◄───Interface────┤      BotRoster        │
│                       │                 │                       │
└───────────┬───────────┘                 └───────────┬───────────┘
            │                                         │
            │                                         │
            ▼                                         ▼
┌───────────────────────┐                 ┌───────────────────────┐
│                       │                 │                       │
│    Power Tools        │◄───Utilizes─────┤       Bots           │
│                       │                 │                       │
└───────────────────────┘                 └───────────────────────┘
```

### 2.2 Integration Points

1. **Bot Registry Access**: NetRunner accesses the BotRoster registry to retrieve available bots
2. **Tool Compatibility**: Bots are tagged with compatible NetRunner tools
3. **Task Assignment**: NetRunner assigns tasks to bots through the BotRoster API
4. **Result Retrieval**: NetRunner retrieves and processes bot task results
5. **Monitoring**: NetRunner monitors bot task status and performance

## 3. Data Models

### 3.1 Bot Model

```typescript
interface Bot {
  id: string;                 // Unique identifier
  name: string;               // Bot name
  description: string;        // Bot description
  capabilities: string[];     // List of capabilities
  compatibleTools: string[];  // IDs of compatible NetRunnerTools
  intelTypes: IntelType[];    // Types of intelligence the bot can gather
  premium: boolean;           // Whether this is a premium bot
  status: 'idle' | 'active' | 'maintenance'; // Current bot status
  performance?: {             // Performance metrics
    accuracy: number;         // Accuracy rating (0-1)
    speed: number;            // Speed rating (0-1)
    reliability: number;      // Reliability rating (0-1)
  };
  config?: Record<string, unknown>; // Bot-specific configuration
}
```

### 3.2 Bot Task Model

```typescript
interface BotTask {
  id: string;                 // Unique identifier
  botId: string;              // Bot identifier
  type: string;               // Task type
  parameters: Record<string, unknown>; // Task parameters
  status: 'pending' | 'running' | 'completed' | 'failed'; // Task status
  created: string;            // Creation timestamp (ISO date)
  started?: string;           // Start timestamp (ISO date)
  completed?: string;         // Completion timestamp (ISO date)
  progress?: number;          // Progress percentage (0-100)
  results?: any;              // Task results
  toolsToUse: string[];       // IDs of NetRunnerTools to use
  priority: 'low' | 'medium' | 'high'; // Task priority
  schedule?: {                // Optional scheduling
    recurrence: string;       // Cron expression
    nextRun: string;          // Next run timestamp (ISO date)
  };
}
```

### 3.3 Bot Task Result Model

```typescript
interface BotTaskResult {
  taskId: string;             // Task identifier
  botId: string;              // Bot identifier
  timestamp: string;          // Result timestamp (ISO date)
  status: 'success' | 'partial' | 'failed'; // Result status
  data: any;                  // Result data
  metadata: {                 // Result metadata
    confidence: number;       // Confidence score (0-1)
    processingTime: number;   // Processing time in ms
    dataSize: number;         // Data size in bytes
    toolsUsed: string[];      // IDs of NetRunnerTools used
  };
  errors?: {                  // Optional errors
    code: string;             // Error code
    message: string;          // Error message
    details?: any;            // Error details
  }[];
}
```

## 4. API Endpoints

### 4.1 Bot Registry Endpoints

#### 4.1.1 Get Available Bots

```
GET /api/botroster/bots
```

**Query Parameters:**
- `intelType` (optional): Filter by intelligence type
- `status` (optional): Filter by bot status
- `premium` (optional): Filter by premium status

**Response:**
```json
{
  "bots": [
    {
      "id": "bot123",
      "name": "IdentityHunter",
      "description": "Specialized in identity intelligence gathering",
      "capabilities": ["identity_discovery", "social_analysis"],
      "compatibleTools": ["tool1", "tool2"],
      "intelTypes": ["identity", "social"],
      "premium": false,
      "status": "idle"
    },
    // Additional bots...
  ]
}
```

#### 4.1.2 Get Bot Details

```
GET /api/botroster/bots/{botId}
```

**Response:**
```json
{
  "id": "bot123",
  "name": "IdentityHunter",
  "description": "Specialized in identity intelligence gathering",
  "capabilities": ["identity_discovery", "social_analysis"],
  "compatibleTools": ["tool1", "tool2"],
  "intelTypes": ["identity", "social"],
  "premium": false,
  "status": "idle",
  "performance": {
    "accuracy": 0.92,
    "speed": 0.85,
    "reliability": 0.95
  },
  "config": {
    "maxDepth": 3,
    "useProxy": true
  }
}
```

### 4.2 Task Management Endpoints

#### 4.2.1 Create Bot Task

```
POST /api/botroster/tasks
```

**Request Body:**
```json
{
  "botId": "bot123",
  "type": "intelligence_gathering",
  "parameters": {
    "target": "example.com",
    "depth": 2,
    "includeSocial": true
  },
  "toolsToUse": ["tool1", "tool2"],
  "priority": "medium",
  "schedule": {
    "recurrence": "0 0 * * *",
    "nextRun": "2025-07-15T00:00:00Z"
  }
}
```

**Response:**
```json
{
  "taskId": "task456",
  "botId": "bot123",
  "status": "pending",
  "created": "2025-07-10T14:30:00Z"
}
```

#### 4.2.2 Get Task Status

```
GET /api/botroster/tasks/{taskId}
```

**Response:**
```json
{
  "id": "task456",
  "botId": "bot123",
  "type": "intelligence_gathering",
  "status": "running",
  "created": "2025-07-10T14:30:00Z",
  "started": "2025-07-10T14:31:00Z",
  "progress": 45,
  "toolsToUse": ["tool1", "tool2"],
  "priority": "medium"
}
```

#### 4.2.3 Get Task Results

```
GET /api/botroster/tasks/{taskId}/results
```

**Response:**
```json
{
  "taskId": "task456",
  "botId": "bot123",
  "timestamp": "2025-07-10T14:45:00Z",
  "status": "success",
  "data": {
    "entities": [
      {
        "type": "domain",
        "value": "example.com",
        "confidence": 0.98
      },
      {
        "type": "email",
        "value": "contact@example.com",
        "confidence": 0.95
      }
    ],
    "relationships": [
      {
        "source": "example.com",
        "target": "contact@example.com",
        "type": "contains",
        "confidence": 0.95
      }
    ]
  },
  "metadata": {
    "confidence": 0.92,
    "processingTime": 840,
    "dataSize": 15360,
    "toolsUsed": ["tool1", "tool2"]
  }
}
```

#### 4.2.4 Cancel Task

```
POST /api/botroster/tasks/{taskId}/cancel
```

**Response:**
```json
{
  "taskId": "task456",
  "status": "cancelled",
  "message": "Task successfully cancelled"
}
```

### 4.3 Bot Control Endpoints

#### 4.3.1 Activate Bot

```
POST /api/botroster/bots/{botId}/activate
```

**Response:**
```json
{
  "botId": "bot123",
  "status": "active",
  "message": "Bot successfully activated"
}
```

#### 4.3.2 Deactivate Bot

```
POST /api/botroster/bots/{botId}/deactivate
```

**Response:**
```json
{
  "botId": "bot123",
  "status": "idle",
  "message": "Bot successfully deactivated"
}
```

## 5. Integration Components

### 5.1 BotRosterIntegration.ts

The `BotRosterIntegration.ts` file serves as the main interface between NetRunner and the BotRoster system. It provides functions for accessing bots, managing tasks, and processing results.

```typescript
/**
 * This module defines the integration between NetRunner and BotRoster,
 * enabling automated intelligence gathering using bots.
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { NetRunnerTool, IntelType } from '../tools/NetRunnerPowerTools';

// Bot definition interface
export interface Bot {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  compatibleTools: string[];      // IDs of compatible NetRunnerTools
  intelTypes: IntelType[];
  premium: boolean;
  status: 'idle' | 'active' | 'maintenance';
  performance?: {
    accuracy: number;
    speed: number;
    reliability: number;
  };
  config?: Record<string, unknown>;
}

// Bot task definition
export interface BotTask {
  id: string;
  botId: string;
  type: string;
  parameters: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created: string;
  started?: string;
  completed?: string;
  progress?: number;
  results?: any;
  toolsToUse: string[];            // IDs of NetRunnerTools to use
  priority: 'low' | 'medium' | 'high';
  schedule?: {
    recurrence: string;
    nextRun: string;
  };
}

// Bot task result
export interface BotTaskResult {
  taskId: string;
  botId: string;
  timestamp: string;
  status: 'success' | 'partial' | 'failed';
  data: any;
  metadata: {
    confidence: number;
    processingTime: number;
    dataSize: number;
    toolsUsed: string[];             // IDs of NetRunnerTools used
  };
  errors?: {
    code: string;
    message: string;
    details?: any;
  }[];
}

// Sample bots for development purposes
export const sampleBots: Bot[] = [
  {
    id: 'identity-hunter-1',
    name: 'Identity Hunter',
    description: 'Specialized in discovering identity information from various sources.',
    capabilities: ['identity_discovery', 'social_analysis', 'entity_extraction'],
    compatibleTools: ['maltego', 'spiderfoot', 'shodan', 'theHarvester'],
    intelTypes: ['identity', 'social'],
    premium: false,
    status: 'idle',
    performance: {
      accuracy: 0.92,
      speed: 0.85,
      reliability: 0.9
    }
  },
  {
    id: 'network-scout-1',
    name: 'Network Scout',
    description: 'Specialized in network infrastructure reconnaissance and mapping.',
    capabilities: ['network_discovery', 'port_scanning', 'service_identification'],
    compatibleTools: ['shodan', 'censys', 'networkMapper', 'threatMapper'],
    intelTypes: ['network', 'infrastructure'],
    premium: false,
    status: 'idle',
    performance: {
      accuracy: 0.95,
      speed: 0.8,
      reliability: 0.93
    }
  },
  {
    id: 'dark-infiltrator-1',
    name: 'Dark Infiltrator',
    description: 'Specialized in dark web intelligence gathering and monitoring.',
    capabilities: ['darkweb_crawling', 'marketplace_monitoring', 'credential_discovery'],
    compatibleTools: ['torMapper', 'darkSearch', 'credentialMonitor'],
    intelTypes: ['darkweb', 'identity', 'threat'],
    premium: true,
    status: 'idle',
    performance: {
      accuracy: 0.85,
      speed: 0.7,
      reliability: 0.8
    }
  },
  {
    id: 'finance-tracker-1',
    name: 'Finance Tracker',
    description: 'Specialized in financial intelligence gathering and transaction analysis.',
    capabilities: ['financial_discovery', 'transaction_analysis', 'pattern_detection'],
    compatibleTools: ['financialAnalyzer', 'blockchainExplorer', 'transactionMapper'],
    intelTypes: ['financial', 'temporal'],
    premium: true,
    status: 'idle',
    performance: {
      accuracy: 0.9,
      speed: 0.75,
      reliability: 0.85
    }
  },
  {
    id: 'geo-locator-1',
    name: 'Geo Locator',
    description: 'Specialized in geospatial intelligence gathering and location analysis.',
    capabilities: ['geolocation', 'mapping', 'pattern_analysis'],
    compatibleTools: ['geoLocator', 'imageryAnalyzer', 'patternMapper'],
    intelTypes: ['geospatial', 'temporal'],
    premium: false,
    status: 'idle',
    performance: {
      accuracy: 0.88,
      speed: 0.82,
      reliability: 0.9
    }
  }
];

// BotRoster Integration Class
export class BotRosterIntegration {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  // Get available bots
  async getBots(filters?: {
    intelType?: IntelType;
    status?: string;
    premium?: boolean;
  }): Promise<Bot[]> {
    try {
      // For development, return sample bots with filtering
      if (process.env.NODE_ENV === 'development') {
        let filteredBots = [...sampleBots];
        
        if (filters?.intelType) {
          filteredBots = filteredBots.filter(bot => 
            bot.intelTypes.includes(filters.intelType as IntelType)
          );
        }
        
        if (filters?.status) {
          filteredBots = filteredBots.filter(bot => 
            bot.status === filters.status
          );
        }
        
        if (filters?.premium !== undefined) {
          filteredBots = filteredBots.filter(bot => 
            bot.premium === filters.premium
          );
        }
        
        return filteredBots;
      }

      // Production API call
      const response = await axios.get(`${this.apiUrl}/bots`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        params: filters
      });
      
      return response.data.bots;
    } catch (error) {
      console.error('Error fetching bots:', error);
      throw new Error('Failed to fetch bots from BotRoster');
    }
  }

  // Get bot details
  async getBotDetails(botId: string): Promise<Bot> {
    try {
      // For development, return sample bot
      if (process.env.NODE_ENV === 'development') {
        const bot = sampleBots.find(b => b.id === botId);
        if (!bot) {
          throw new Error(`Bot with ID ${botId} not found`);
        }
        return bot;
      }

      // Production API call
      const response = await axios.get(`${this.apiUrl}/bots/${botId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching bot ${botId}:`, error);
      throw new Error(`Failed to fetch bot details for ${botId}`);
    }
  }

  // Create a new bot task
  async createTask(task: Omit<BotTask, 'id' | 'status' | 'created'>): Promise<{taskId: string}> {
    try {
      // For development, return mock task ID
      if (process.env.NODE_ENV === 'development') {
        return { taskId: uuidv4() };
      }

      // Production API call
      const response = await axios.post(`${this.apiUrl}/tasks`, task, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create bot task');
    }
  }

  // Get task status
  async getTaskStatus(taskId: string): Promise<BotTask> {
    try {
      // For development, return mock task status
      if (process.env.NODE_ENV === 'development') {
        return {
          id: taskId,
          botId: 'mock-bot-id',
          type: 'intelligence_gathering',
          parameters: {},
          status: 'running',
          created: new Date().toISOString(),
          started: new Date().toISOString(),
          progress: 45,
          toolsToUse: [],
          priority: 'medium'
        };
      }

      // Production API call
      const response = await axios.get(`${this.apiUrl}/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching task status for ${taskId}:`, error);
      throw new Error(`Failed to fetch task status for ${taskId}`);
    }
  }

  // Get task results
  async getTaskResults(taskId: string): Promise<BotTaskResult> {
    try {
      // For development, return mock task results
      if (process.env.NODE_ENV === 'development') {
        return {
          taskId,
          botId: 'mock-bot-id',
          timestamp: new Date().toISOString(),
          status: 'success',
          data: {
            entities: [
              { type: 'domain', value: 'example.com', confidence: 0.98 },
              { type: 'email', value: 'contact@example.com', confidence: 0.95 }
            ],
            relationships: [
              { source: 'example.com', target: 'contact@example.com', type: 'contains', confidence: 0.95 }
            ]
          },
          metadata: {
            confidence: 0.92,
            processingTime: 840,
            dataSize: 15360,
            toolsUsed: []
          }
        };
      }

      // Production API call
      const response = await axios.get(`${this.apiUrl}/tasks/${taskId}/results`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching results for task ${taskId}:`, error);
      throw new Error(`Failed to fetch task results for ${taskId}`);
    }
  }

  // Cancel a task
  async cancelTask(taskId: string): Promise<{status: string; message: string}> {
    try {
      // For development, return mock response
      if (process.env.NODE_ENV === 'development') {
        return {
          status: 'cancelled',
          message: 'Task successfully cancelled'
        };
      }

      // Production API call
      const response = await axios.post(`${this.apiUrl}/tasks/${taskId}/cancel`, {}, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error cancelling task ${taskId}:`, error);
      throw new Error(`Failed to cancel task ${taskId}`);
    }
  }

  // Activate a bot
  async activateBot(botId: string): Promise<{status: string; message: string}> {
    try {
      // For development, return mock response
      if (process.env.NODE_ENV === 'development') {
        return {
          status: 'active',
          message: 'Bot successfully activated'
        };
      }

      // Production API call
      const response = await axios.post(`${this.apiUrl}/bots/${botId}/activate`, {}, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error activating bot ${botId}:`, error);
      throw new Error(`Failed to activate bot ${botId}`);
    }
  }

  // Deactivate a bot
  async deactivateBot(botId: string): Promise<{status: string; message: string}> {
    try {
      // For development, return mock response
      if (process.env.NODE_ENV === 'development') {
        return {
          status: 'idle',
          message: 'Bot successfully deactivated'
        };
      }

      // Production API call
      const response = await axios.post(`${this.apiUrl}/bots/${botId}/deactivate`, {}, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error deactivating bot ${botId}:`, error);
      throw new Error(`Failed to deactivate bot ${botId}`);
    }
  }

  // Find compatible tools for a bot
  async findCompatibleTools(botId: string, availableTools: NetRunnerTool[]): Promise<NetRunnerTool[]> {
    try {
      const bot = await this.getBotDetails(botId);
      return availableTools.filter(tool => bot.compatibleTools.includes(tool.id));
    } catch (error) {
      console.error(`Error finding compatible tools for bot ${botId}:`, error);
      throw new Error(`Failed to find compatible tools for bot ${botId}`);
    }
  }

  // Find bots compatible with a specific tool
  async findCompatibleBots(toolId: string): Promise<Bot[]> {
    try {
      const allBots = await this.getBots();
      return allBots.filter(bot => bot.compatibleTools.includes(toolId));
    } catch (error) {
      console.error(`Error finding compatible bots for tool ${toolId}:`, error);
      throw new Error(`Failed to find compatible bots for tool ${toolId}`);
    }
  }

  // Find bots by intelligence type
  async findBotsByIntelType(intelType: IntelType): Promise<Bot[]> {
    try {
      return await this.getBots({ intelType });
    } catch (error) {
      console.error(`Error finding bots for intel type ${intelType}:`, error);
      throw new Error(`Failed to find bots for intel type ${intelType}`);
    }
  }
}

// Create and export a default instance
export const botRosterApi = new BotRosterIntegration(
  process.env.BOT_ROSTER_API_URL || 'https://api.botroster.starcom.io',
  process.env.BOT_ROSTER_API_KEY || 'development-key'
);

export default botRosterApi;
```

### 5.2 BotControlPanel.tsx

The `BotControlPanel.tsx` component provides the user interface for managing bots and bot tasks within the NetRunner dashboard.

```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Bot,
  Play,
  Pause,
  Settings,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Activity,
  BarChart
} from 'lucide-react';

import { Bot as BotType, BotTask } from '../integration/BotRosterIntegration';
import { NetRunnerTool } from '../tools/NetRunnerPowerTools';

interface BotControlPanelProps {
  bots: BotType[];
  activeBots: string[];
  onBotActivate: (botId: string) => void;
  tools: NetRunnerTool[];
}

const BotControlPanel: React.FC<BotControlPanelProps> = ({
  bots,
  activeBots,
  onBotActivate,
  tools
}) => {
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [botView, setBotView] = useState<'grid' | 'list'>('grid');
  const [showConfigDialog, setShowConfigDialog] = useState<boolean>(false);
  const [taskConfig, setTaskConfig] = useState<Record<string, any>>({});
  
  // Group tools by category for easier selection
  const toolsByCategory = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, NetRunnerTool[]>);
  
  // Get selected bot
  const selectedBot = selectedBotId ? bots.find(bot => bot.id === selectedBotId) : null;
  
  // Filter tools that are compatible with the selected bot
  const compatibleTools = selectedBot
    ? tools.filter(tool => selectedBot.compatibleTools.includes(tool.id))
    : [];
  
  // Handle bot selection
  const handleSelectBot = (botId: string) => {
    setSelectedBotId(botId);
  };
  
  // Handle task configuration
  const handleOpenConfig = () => {
    setTaskConfig({
      target: '',
      depth: 2,
      schedule: false,
      recurrence: '0 0 * * *',
      priority: 'medium',
      selectedTools: []
    });
    setShowConfigDialog(true);
  };
  
  // Handle task configuration changes
  const handleConfigChange = (field: string, value: any) => {
    setTaskConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle task submission
  const handleSubmitTask = () => {
    console.log('Submitting task:', {
      botId: selectedBotId,
      config: taskConfig
    });
    setShowConfigDialog(false);
    // In a real implementation, this would call the API to create a task
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle bot view change
  const handleViewChange = (view: 'grid' | 'list') => {
    setBotView(view);
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Bot Control Panel
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={botView === 'grid' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleViewChange('grid')}
          >
            Grid
          </Button>
          <Button
            variant={botView === 'list' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleViewChange('list')}
          >
            List
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Filter size={16} />}
          >
            Filter
          </Button>
          <TextField
            size="small"
            placeholder="Search bots..."
            InputProps={{
              startAdornment: <Search size={16} style={{ marginRight: 8, color: 'gray' }} />
            }}
            sx={{ ml: 1 }}
          />
        </Box>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Available Bots" />
          <Tab label="Active Tasks" />
          <Tab label="Task History" />
          <Tab label="Performance" />
        </Tabs>
      </Box>
      
      {activeTab === 0 && (
        <Box>
          {botView === 'grid' ? (
            <Grid container spacing={2}>
              {bots.map(bot => (
                <Grid item xs={12} sm={6} md={4} key={bot.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedBotId === bot.id ? '2px solid #1976d2' : 'none',
                      bgcolor: activeBots.includes(bot.id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                    }}
                    onClick={() => handleSelectBot(bot.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ mr: 1, bgcolor: bot.premium ? 'secondary.main' : 'primary.main' }}>
                          <Bot size={20} />
                        </Avatar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                          {bot.name}
                        </Typography>
                        <Chip 
                          size="small" 
                          color={bot.status === 'active' ? 'success' : bot.status === 'maintenance' ? 'warning' : 'default'}
                          label={bot.status}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {bot.description}
                      </Typography>
                      <Box sx={{ mb: 1 }}>
                        {bot.intelTypes.slice(0, 3).map(type => (
                          <Chip key={type} label={type} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                        {bot.intelTypes.length > 3 && (
                          <Chip label={`+${bot.intelTypes.length - 3}`} size="small" variant="outlined" />
                        )}
                      </Box>
                      {bot.performance && (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ width: 80 }}>Accuracy:</Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={bot.performance.accuracy * 100} 
                              sx={{ flexGrow: 1, mr: 1 }}
                            />
                            <Typography variant="caption">{Math.round(bot.performance.accuracy * 100)}%</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ width: 80 }}>Speed:</Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={bot.performance.speed * 100} 
                              color="secondary"
                              sx={{ flexGrow: 1, mr: 1 }}
                            />
                            <Typography variant="caption">{Math.round(bot.performance.speed * 100)}%</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ width: 80 }}>Reliability:</Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={bot.performance.reliability * 100} 
                              color="success"
                              sx={{ flexGrow: 1, mr: 1 }}
                            />
                            <Typography variant="caption">{Math.round(bot.performance.reliability * 100)}%</Typography>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        variant={activeBots.includes(bot.id) ? 'contained' : 'outlined'}
                        startIcon={activeBots.includes(bot.id) ? <Pause size={16} /> : <Play size={16} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBotActivate(bot.id);
                        }}
                      >
                        {activeBots.includes(bot.id) ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined"
                        startIcon={<Settings size={16} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectBot(bot.id);
                          handleOpenConfig();
                        }}
                      >
                        Configure
                      </Button>
                      {bot.premium && (
                        <Chip 
                          size="small" 
                          label="Premium" 
                          color="secondary" 
                          sx={{ ml: 'auto' }}
                        />
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper>
              {bots.map(bot => (
                <Box 
                  key={bot.id}
                  sx={{ 
                    p: 2, 
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    bgcolor: selectedBotId === bot.id ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                  }}
                  onClick={() => handleSelectBot(bot.id)}
                >
                  <Avatar sx={{ mr: 2, bgcolor: bot.premium ? 'secondary.main' : 'primary.main' }}>
                    <Bot size={20} />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {bot.name}
                      </Typography>
                      <Chip 
                        size="small" 
                        color={bot.status === 'active' ? 'success' : bot.status === 'maintenance' ? 'warning' : 'default'}
                        label={bot.status}
                        sx={{ ml: 1 }}
                      />
                      {bot.premium && (
                        <Chip 
                          size="small" 
                          label="Premium" 
                          color="secondary" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {bot.description}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      variant={activeBots.includes(bot.id) ? 'contained' : 'outlined'}
                      startIcon={activeBots.includes(bot.id) ? <Pause size={16} /> : <Play size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBotActivate(bot.id);
                      }}
                    >
                      {activeBots.includes(bot.id) ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined"
                      startIcon={<Settings size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectBot(bot.id);
                        handleOpenConfig();
                      }}
                    >
                      Configure
                    </Button>
                  </Box>
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      )}
      
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Active Tasks</Typography>
          <Typography color="text.secondary">No active tasks. Configure a bot to create a new task.</Typography>
        </Paper>
      )}
      
      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Task History</Typography>
          <Typography color="text.secondary">No task history available.</Typography>
        </Paper>
      )}
      
      {activeTab === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Bot Performance</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Card sx={{ flex: 1, p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Accuracy</Typography>
              <Typography variant="h4">92%</Typography>
              <Typography variant="caption" color="success.main">+2.5% this week</Typography>
            </Card>
            <Card sx={{ flex: 1, p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Tasks Completed</Typography>
              <Typography variant="h4">124</Typography>
              <Typography variant="caption" color="success.main">+12 this week</Typography>
            </Card>
            <Card sx={{ flex: 1, p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Avg. Processing Time</Typography>
              <Typography variant="h4">2.3m</Typography>
              <Typography variant="caption" color="error.main">+0.2m this week</Typography>
            </Card>
            <Card sx={{ flex: 1, p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Intel Reports Generated</Typography>
              <Typography variant="h4">42</Typography>
              <Typography variant="caption" color="success.main">+5 this week</Typography>
            </Card>
          </Box>
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <BarChart size={20} style={{ marginRight: 8 }} />
              Performance charts will be displayed here
            </Typography>
          </Box>
        </Paper>
      )}
      
      {/* Bot Configuration Dialog */}
      <Dialog open={showConfigDialog} onClose={() => setShowConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Configure Bot Task
          {selectedBot && (
            <Typography variant="subtitle1" color="text.secondary">
              {selectedBot.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Task Configuration</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Target"
                  value={taskConfig.target || ''}
                  onChange={(e) => handleConfigChange('target', e.target.value)}
                  helperText="Domain, IP, username, email, etc."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={taskConfig.priority || 'medium'}
                    label="Priority"
                    onChange={(e) => handleConfigChange('priority', e.target.value)}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Depth"
                  type="number"
                  value={taskConfig.depth || 2}
                  onChange={(e) => handleConfigChange('depth', parseInt(e.target.value))}
                  helperText="Search depth (higher values take longer)"
                  inputProps={{ min: 1, max: 5 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={taskConfig.schedule || false}
                      onChange={(e) => handleConfigChange('schedule', e.target.checked)}
                    />
                  }
                  label="Schedule task"
                />
                {taskConfig.schedule && (
                  <TextField
                    fullWidth
                    label="Cron Schedule"
                    value={taskConfig.recurrence || '0 0 * * *'}
                    onChange={(e) => handleConfigChange('recurrence', e.target.value)}
                    helperText="Cron expression (e.g., '0 0 * * *' for daily at midnight)"
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Tool Selection</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Select the tools this bot should use for the task.
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
              {Object.entries(toolsByCategory).map(([category, categoryTools]) => {
                const filteredTools = categoryTools.filter(tool => 
                  selectedBot?.compatibleTools.includes(tool.id)
                );
                
                if (filteredTools.length === 0) return null;
                
                return (
                  <Box key={category} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize' }}>
                      {category}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {filteredTools.map(tool => (
                        <Chip
                          key={tool.id}
                          label={tool.name}
                          onClick={() => {
                            const selectedTools = taskConfig.selectedTools || [];
                            if (selectedTools.includes(tool.id)) {
                              handleConfigChange(
                                'selectedTools',
                                selectedTools.filter(id => id !== tool.id)
                              );
                            } else {
                              handleConfigChange(
                                'selectedTools',
                                [...selectedTools, tool.id]
                              );
                            }
                          }}
                          color={(taskConfig.selectedTools || []).includes(tool.id) ? 'primary' : 'default'}
                          variant={(taskConfig.selectedTools || []).includes(tool.id) ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  </Box>
                );
              })}
              
              {compatibleTools.length === 0 && (
                <Typography color="text.secondary">
                  No compatible tools available for this bot.
                </Typography>
              )}
            </Paper>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>Advanced Settings</Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={taskConfig.useProxy || false}
                    onChange={(e) => handleConfigChange('useProxy', e.target.checked)}
                  />
                }
                label="Use proxy for anonymity"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={taskConfig.followRedirects || true}
                    onChange={(e) => handleConfigChange('followRedirects', e.target.checked)}
                  />
                }
                label="Follow redirects"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={taskConfig.collectImages || false}
                    onChange={(e) => handleConfigChange('collectImages', e.target.checked)}
                  />
                }
                label="Collect images"
              />
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfigDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitTask}
            disabled={!taskConfig.target || !(taskConfig.selectedTools || []).length}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BotControlPanel;
```

### 5.3 Integration with NetRunnerDashboard

The NetRunner dashboard integrates with the BotRoster system to provide bot management capabilities directly within the main interface:

```typescript
// Excerpt from NetRunnerDashboard.tsx

import { useState } from 'react';
import { Box, Button } from '@mui/material';
import { Bot } from 'lucide-react';
import BotControlPanel from './components/BotControlPanel';
import { sampleBots } from './integration/BotRosterIntegration';
import { netRunnerPowerTools } from './tools/NetRunnerPowerTools';

const NetRunnerDashboard: React.FC = () => {
  // State management
  const [activeMode, setActiveMode] = useState<DashboardMode>('search');
  const [activeBots, setActiveBots] = useState<string[]>([]);
  
  // Handle bot activation/deactivation
  const handleBotActivate = (botId: string) => {
    setActiveBots(prev => 
      prev.includes(botId) ? prev.filter(id => id !== botId) : [...prev, botId]
    );
  };
  
  // Handle mode change
  const handleModeChange = (mode: DashboardMode) => {
    setActiveMode(mode);
  };

  return (
    <Box>
      {/* Dashboard navigation */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* Other mode buttons */}
        <Button 
          variant={activeMode === 'bots' ? 'contained' : 'outlined'}
          color="primary"
          onClick={() => handleModeChange('bots')}
          startIcon={<Bot size={16} />}
        >
          Bots
        </Button>
        {/* Other mode buttons */}
      </Box>
      
      {/* Bot Control Panel */}
      {activeMode === 'bots' && (
        <Box sx={{ flex: 1 }}>
          <BotControlPanel 
            bots={sampleBots}
            activeBots={activeBots}
            onBotActivate={handleBotActivate}
            tools={netRunnerPowerTools}
          />
        </Box>
      )}
      
      {/* Other dashboard content */}
    </Box>
  );
};
```

## 6. Implementation Guidelines

### 6.1 Authentication

- Use JWT tokens for API authentication
- Store API keys securely using environment variables
- Implement proper error handling for authentication failures
- Log authentication issues for security monitoring

### 6.2 Error Handling

- Implement comprehensive error handling for all API calls
- Provide user-friendly error messages
- Log detailed error information for troubleshooting
- Implement retry logic for transient failures

### 6.3 Performance Considerations

- Implement caching for bot listings and details
- Use pagination for large result sets
- Implement request batching where appropriate
- Monitor API call frequency and optimize as needed

### 6.4 Security Considerations

- Encrypt sensitive data in transit and at rest
- Validate all input data before sending to API
- Implement rate limiting for API requests
- Use proper authentication and authorization checks

## 7. Testing Strategy

### 7.1 Unit Testing

- Test integration utility functions in isolation
- Mock API responses for predictable testing
- Verify error handling works as expected
- Test data transformation logic

### 7.2 Integration Testing

- Test communication between NetRunner and BotRoster
- Verify authentication works correctly
- Test task creation and monitoring workflow
- Verify result retrieval and processing

### 7.3 UI Testing

- Test bot listing and filtering
- Verify bot activation/deactivation
- Test task configuration workflow
- Verify result display

## 8. Deployment Considerations

### 8.1 Environment Configuration

- Configure API endpoints for different environments
- Set up proper API keys for each environment
- Implement feature flags for phased rollout
- Configure logging appropriately for each environment

### 8.2 Monitoring

- Set up API call monitoring
- Track bot performance metrics
- Monitor error rates
- Set up alerts for critical failures

## 9. Future Enhancements

### 9.1 Advanced Bot Management

- Bot creation and customization
- Bot performance optimization
- Bot scheduling and resource allocation
- Bot collaboration capabilities

### 9.2 Enhanced Task Management

- Complex multi-step tasks
- Task templates
- Task chaining and dependencies
- Task result aggregation

### 9.3 AI-Driven Automation

- AI-assisted bot selection
- Automated task configuration
- Self-optimizing bot tasks
- Anomaly detection in results

## 10. Conclusion

The integration between NetRunner and BotRoster provides a powerful framework for automated intelligence gathering and processing. By combining NetRunner's extensive tool collection with BotRoster's automation capabilities, users can create sophisticated intelligence operations that run autonomously and deliver valuable insights.

This integration is a key component of the NetRunner redesign, enabling more efficient intelligence gathering and allowing users to focus on analysis and decision-making rather than manual data collection.

# NetRunnerLeftSideBar Component

## Overview

The NetRunnerLeftSideBar houses the AI Agent Commander and PowerTools management interfaces, serving as the primary control panel for both autonomous and manual operations.

## Component Specification

### Purpose
- AI Agent Commander interface and status monitoring
- PowerTools grid and manual tool execution
- Scripts management and automation controls
- Quick action buttons and tool shortcuts

### Props Interface
```typescript
interface NetRunnerLeftSideBarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeMode: 'ai-agent' | 'power-tools' | 'scripts';
  onModeChange?: (mode: string) => void;
  aiAgentStatus?: AIAgentStatus;
  availableTools?: PowerTool[];
  activeScripts?: Script[];
}
```

### State Management
```typescript
interface LeftSideBarState {
  selectedTool: string | null;
  agentCommands: AgentCommand[];
  toolConfiguration: ToolConfig;
  scriptExecutionStatus: ExecutionStatus[];
}
```

## Key Features

### 1. **AI Agent Commander Integration**
- Real-time agent status display
- Command interface for agent control
- Autonomous operation monitoring
- Agent task queue management

### 2. **PowerTools Management**
- Tool grid with categorization
- Quick tool selection and execution
- Tool configuration and settings
- Usage statistics and performance metrics

### 3. **Scripts Management**
- Script library and execution
- Custom script creation interface
- Scheduled task management
- Script debugging and testing

### 4. **Responsive Design**
- Collapsible sidebar functionality
- Mobile-optimized touch controls
- Adaptive content layout
- Gesture-based navigation

## Implementation Details

### Component Structure
```typescript
export const NetRunnerLeftSideBar: React.FC<NetRunnerLeftSideBarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  activeMode = 'ai-agent',
  onModeChange,
  aiAgentStatus,
  availableTools = [],
  activeScripts = []
}) => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [agentCommands, setAgentCommands] = useState<AgentCommand[]>([]);
  
  return (
    <SideBarContainer collapsed={isCollapsed}>
      <SideBarHeader>
        <ModeSelector 
          activeMode={activeMode}
          onModeChange={onModeChange}
        />
        <CollapseButton onClick={onToggleCollapse} />
      </SideBarHeader>
      
      <SideBarContent>
        {activeMode === 'ai-agent' && (
          <AIAgentCommanderSquare 
            status={aiAgentStatus}
            commands={agentCommands}
            onCommandExecute={handleAgentCommand}
          />
        )}
        
        {activeMode === 'power-tools' && (
          <PowerToolsPanel
            tools={availableTools}
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
            onToolExecute={handleToolExecution}
          />
        )}
        
        {activeMode === 'scripts' && (
          <ScriptsManager
            scripts={activeScripts}
            onScriptExecute={handleScriptExecution}
            onScriptCreate={handleScriptCreation}
          />
        )}
      </SideBarContent>
    </SideBarContainer>
  );
};
```

### AI Agent Commander Integration
```typescript
const handleAgentCommand = async (command: AgentCommand) => {
  try {
    const result = await aiAgentController.executeCommand(command);
    setAgentCommands(prev => [...prev, { ...command, result }]);
    
    // Update agent status
    if (onAgentStatusChange) {
      onAgentStatusChange(result.status);
    }
  } catch (error) {
    console.error('Agent command execution failed:', error);
    // Handle error state
  }
};
```

### PowerTools Management
```typescript
const handleToolExecution = async (toolId: string, config: ToolConfig) => {
  try {
    const tool = availableTools.find(t => t.id === toolId);
    if (!tool) throw new Error(`Tool ${toolId} not found`);
    
    const result = await tool.execute(config);
    
    // Update tool usage statistics
    updateToolStats(toolId, result);
    
    // Notify parent component
    if (onToolExecuted) {
      onToolExecuted(toolId, result);
    }
  } catch (error) {
    console.error('Tool execution failed:', error);
    // Handle execution error
  }
};
```

## Widget Component Integration

### AIAgentCommanderSquare
- Agent status visualization
- Command input interface
- Task queue display
- Performance metrics

### PowerToolsPanel
- Tool grid layout
- Category filtering
- Search functionality
- Tool configuration

### ScriptsManager
- Script library interface
- Code editor integration
- Execution monitoring
- Debug console

## Hook Integrations

### Custom Hooks Used
- `useAIAgent()`: AI agent state and control
- `usePowerTools()`: Tool management and execution
- `useScriptManager()`: Script execution and management
- `useSideBarState()`: Sidebar collapse and configuration

### Service Integrations
- **AI Agent Service**: Autonomous operation control
- **PowerTools Service**: Manual tool execution
- **Script Service**: Automation and custom script execution
- **Configuration Service**: User preferences and tool settings

## Responsive Behavior

### Desktop Layout
- Full sidebar width (300-400px)
- Expanded tool grids
- Detailed status displays
- Multi-column layouts

### Tablet Layout
- Medium sidebar width (250-300px)
- Compact tool grids
- Condensed status displays
- Single-column layouts

### Mobile Layout
- Overlay sidebar mode
- Touch-optimized controls
- Minimal status displays
- Gesture navigation

## Styling and Theme

### Military Cyberpunk Theme
```typescript
const sideBarStyles = {
  backgroundColor: 'rgba(0, 20, 40, 0.95)',
  borderRight: '2px solid #ff6b35',
  color: '#00ff9f',
  fontFamily: 'Orbitron, monospace',
  
  '&.collapsed': {
    width: '60px',
    '& .content': {
      display: 'none'
    }
  }
};
```

### Interactive Elements
- Glow effects on hover
- Military-style button animations
- Status indicator pulsing
- Smooth transition animations

## Performance Optimizations

### Rendering Optimizations
- Virtual scrolling for tool lists
- Lazy loading of tool configurations
- Memoized component renders
- Debounced search inputs

### Memory Management
- Cleanup tool execution subscriptions
- Garbage collection for large tool results
- Efficient state updates
- Resource pooling for heavy operations

## Error Handling

### Tool Execution Errors
```typescript
const handleToolError = (toolId: string, error: Error) => {
  // Log error details
  console.error(`Tool ${toolId} execution failed:`, error);
  
  // Update UI with error state
  setToolErrors(prev => ({
    ...prev,
    [toolId]: {
      message: error.message,
      timestamp: Date.now(),
      recoverable: isRecoverableError(error)
    }
  }));
  
  // Attempt recovery if possible
  if (isRecoverableError(error)) {
    scheduleRetry(toolId);
  }
};
```

### Network and Service Errors
- Service availability checks
- Graceful degradation for offline mode
- Retry mechanisms for transient failures
- User notification for persistent errors

## Testing Strategy

### Unit Tests
- Component rendering with different props
- State management verification
- Event handler testing
- Error boundary testing

### Integration Tests
- Tool execution workflows
- AI agent communication
- Script management functionality
- Responsive behavior testing

## Usage Examples

```typescript
// Basic usage
<NetRunnerLeftSideBar
  activeMode="ai-agent"
  aiAgentStatus={agentStatus}
  availableTools={powerTools}
/>

// Advanced configuration
<NetRunnerLeftSideBar
  isCollapsed={isMobile}
  onToggleCollapse={handleSidebarToggle}
  activeMode={currentMode}
  onModeChange={handleModeChange}
  aiAgentStatus={agentStatus}
  availableTools={filteredTools}
  activeScripts={userScripts}
  onToolExecuted={handleToolResult}
  onAgentStatusChange={handleAgentUpdate}
/>
```

## Dependencies

### External Dependencies
- React 18+
- Material-UI components
- Lucide React icons
- TypeScript

### Internal Dependencies
- AIAgentCommanderSquare widget
- PowerToolsPanel widget
- ScriptsManager widget
- Custom hooks and services

## Maintenance Notes

### Performance Monitoring
- Tool execution time tracking
- Memory usage monitoring
- Render performance analysis
- User interaction metrics

### Future Enhancements
- Plugin architecture for custom tools
- Advanced script debugging features
- Real-time collaboration for team operations
- Enhanced AI agent capabilities

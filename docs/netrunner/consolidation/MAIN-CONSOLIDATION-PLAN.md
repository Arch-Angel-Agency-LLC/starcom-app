# NetRunner Sub-Application Consolidation Plan

**Document Date**: July 10, 2025  
**Author**: GitHub Copilot  
**Status**: Draft  

## 1. Executive Summary

This document outlines a comprehensive plan to consolidate, refactor, and enhance the NetRunner sub-application within the Starcom app. The NetRunner module is responsible for OSINT (Open-Source Intelligence) operations and intelligence gathering, but currently suffers from code duplication, inconsistent implementations, and inadequate error handling. 

**CRITICAL CLARIFICATION**: NetRunner is exclusively responsible for OSINT collection and does NOT perform intelligence analysis. The intell      };
      
      return {
        workflowId: workflow.id,
        status: workflowStatus,
        stepResults: results,
        correlationId
      };

## 10. Application Boundary Enforcement

### 10.1 Critical Separation of NetRunner and IntelAnalyzer

It is absolutely critical to maintain the separation between NetRunner and IntelAnalyzer applications:

1. **NetRunner Responsibilities**:
   - OSINT data collection only
   - Tool integration for data gathering
   - Data normalization and initial processing
   - Sending collected data to IntelAnalyzer via adapter

2. **NOT NetRunner Responsibilities**:
   - Intelligence analysis (this belongs to IntelAnalyzer)
   - Entity extraction and relationship mapping (IntelAnalyzer)
   - Intelligence report generation (IntelAnalyzer)
   - Pattern recognition and threat assessment (IntelAnalyzer)

3. **Implementation Guidelines**:
   - Any code or feature that performs analysis must be implemented in IntelAnalyzer, not NetRunner
   - The adapter between the applications must be the only communication channel
   - Models must be clearly separated and interfaces well-defined
   - Documentation must reinforce this separation

4. **Consolidation Focus**:
   - This consolidation plan addresses NetRunner only
   - IntelAnalyzer has its own separate consolidation plan
   - The boundary enforcement is a key success metric for both consolidation efforts

For more detailed information on the application boundaries, refer to the comprehensive documentation in `/docs/netrunner-consolidation/APPLICATION-BOUNDARY-CLARIFICATION.md`.

## 11. Comprehensive Documentation Reference

### 11.1 Core NetRunner Documentation

**Primary Specifications**:
- `/docs/NETRUNNER-POWER-TOOLS-SPEC.md` - Complete specification of 40+ OSINT tools across 7 categories
- `/docs/NETRUNNER-BOTROSTER-INTEGRATION.md` - Comprehensive bot automation framework (1504 lines)
- `/docs/NETRUNNER-BOT-AUTOMATION-SPEC.md` - Bot automation capabilities and autonomous agent specifications
- `/docs/NETRUNNER-UI-DESIGN-GUIDE.md` - Complete UI design guidelines, color systems, and component specifications
- `/docs/NETRUNNER-TECHNICAL-SPECIFICATION.md` - Technical architecture and implementation details
- `/docs/NETRUNNER-TESTING-STRATEGY.md` - Comprehensive testing strategy for all NetRunner components

**Implementation and Planning**:
- `/docs/NETRUNNER-IMPLEMENTATION-PLAN.md` - Implementation roadmap and timeline
- `/docs/NETRUNNER-REDESIGN-MASTER-PLAN.md` - Master plan for NetRunner redesign and enhancement
- `/docs/NETRUNNER-IMPLEMENTATION-ROADMAP.md` - Detailed implementation roadmap with milestones
- `/docs/NETRUNNER-DATA-FLOW-DIAGRAM.md` - Data flow and system integration diagrams
- `/docs/NETRUNNER-ARCHITECTURE-OVERVIEW.md` - High-level architecture overview

**Integration and Marketplace**:
- `/docs/NETRUNNER-MARKETPLACE-INTEGRATION.md` - Intelligence marketplace integration specifications
- `/docs/NETRUNNER-INTEL-ANALYZER-INTEGRATION-COMPLETE.md` - Integration with IntelAnalyzer application
- `/docs/NETRUNNER-MONITORING-IMPLEMENTATION-COMPLETE.md` - Monitoring and observability implementation

**Testing and Quality Assurance**:
- `/docs/NETRUNNER-TEST-COVERAGE-SUMMARY.md` - Test coverage analysis and summary
- `/docs/NETRUNNER-TDD-PLAN.md` - Test-driven development plan
- `/docs/NETRUNNER-RISK-ASSESSMENT.md` - Risk assessment and mitigation strategies

### 11.2 OSINT-Specific Documentation

**Core OSINT Documentation** (52+ files):
- `/docs/OSINT-TECHNICAL-REFERENCE.md` - Technical reference for OSINT components
- `/docs/OSINT-INTEGRATION-GUIDE.md` - OSINT integration guidelines
- `/docs/OSINT-IMPLEMENTATION-PLAN.md` - OSINT implementation plan and roadmap
- `/docs/OSINT-DEVELOPMENT-ROADMAP.md` - Comprehensive development roadmap
- `/docs/OSINT-DEVELOPMENT-STATUS.md` - Current development status and progress
- `/docs/OSINT-DATA-INTEGRATION-PLAN.md` - Data integration architecture and planning

**Project Planning OSINT Documentation**:
- `/docs/project-planning/osint/OSINT-ERROR-HANDLING-SUMMARY.md` - Error handling implementation
- `/docs/project-planning/osint/OSINT-ERROR-HANDLING-DEVELOPER-GUIDE.md` - Developer guide for error handling
- `/docs/project-planning/osint/OSINT-UIUX-TESTING-STRATEGY.md` - UI/UX testing strategy
- `/docs/project-planning/osint/OSINT-RESULTSPANEL-ENHANCEMENT-REPORT.md` - Results panel enhancements
- `/docs/project-planning/osint/OSINT-PROGRESS-REPORT-20250704.md` - Latest progress reports

### 11.3 UI Design and User Experience Documentation

**UI Overhaul and Design**:
- `/docs/ui-overhaul/screens/netrunner-screen.md` - NetRunner screen specifications and layout
- `/docs/ui-overhaul/screens/netrunner-dashboard.md` - NetRunner dashboard design and implementation
- `/docs/ui-overhaul/implementation/netrunner-implementation-plan.md` - UI implementation plan

**Page Consolidation Documentation**:
- `/docs/page-consolidation/netrunner/page-overview.md` - NetRunner page overview and consolidation
- `/docs/page-consolidation/netrunner/screen-structure.md` - Screen structure and navigation design
- `/docs/page-consolidation/PHASE-2-FINAL-COMPLETION-REPORT.md` - Phase 2 completion with NetRunner consolidation

### 11.4 AI Agent Integration Documentation

**AI Agent Development**:
- `/docs/AI_AGENT_DEVELOPMENT_CRITIQUE.md` - AI agent development critique and improvement plan
- `/docs/archived/june-24-25-analysis-phase/AI-AGENT-PROGRESS-REPORT.md` - AI agent progress and implementation

### 11.5 Legacy and Archived Documentation

**Workflow and Collaboration**:
- `/docs/archived/2025-06-22-multi-agency-collaboration-workflows.md` - Multi-agency collaboration workflows

### 11.6 Integration Points with Existing Documentation

**Key Integration References**:
1. **Power Tools**: The existing Power Tools specification (672 lines) contains complete tool categorization, capabilities, and integration patterns that must be preserved during consolidation
2. **Bot Roster**: The BotRoster integration documentation (1504 lines) provides comprehensive automation framework that integrates with Power Tools
3. **OSINT Search**: Extensive OSINT documentation (52+ files) covers search services, error handling, UI components, and testing strategies
4. **AI Agents**: AI agent system documentation covers autonomous operations, personality definitions, and integration hooks
5. **UI Design**: Complete UI design guide with color systems, component specifications, and design principles
6. **Testing Strategy**: Comprehensive testing documentation (712 lines) covers unit, integration, and end-to-end testing approaches

### 11.7 Documentation Gaps Identified

**Missing Documentation**:
- Real-time integration testing documentation for Power Tools + OSINT Search + Bot Roster
- Performance benchmarking documentation for AI Agent + NetRunner integration
- Security assessment documentation for autonomous bot operations
- Migration guide documentation for consolidating duplicate implementations

### 11.8 Consolidation Documentation Validation

**Validation Against Existing Documentation**:
- ✅ Power Tools consolidation aligns with existing 40+ tool specifications
- ✅ OSINT Search integration matches comprehensive error handling and testing documentation
- ✅ Bot Roster integration follows established automation framework patterns
- ✅ AI Agent integration respects autonomous operation specifications
- ✅ UI consolidation follows established design guidelines and screen specifications
- ✅ Testing approach aligns with existing testing strategy documentation

This comprehensive documentation reference ensures that the consolidation plan is fully informed by and aligned with the extensive existing documentation ecosystem.nalysis is performed by a completely separate application called IntelAnalyzer. These are distinct applications with different responsibilities that communicate through defined adapters.

The consolidation effort will focus on:
1. Centralizing code around the existing routing structure
2. Implementing comprehensive error handling and logging
3. Standardizing component interfaces and data models
4. Ensuring proper integration with the rest of the Starcom application

## 2. Current State Assessment

### 2.1 Code Structure Issues

- **Duplicate Implementations**: Code exists in both `/src/applications/netrunner/` and `/src/pages/NetRunner/`
- **Empty/Partial Files**: Some files like `NetRunnerApp.tsx` exist but are empty
- **Inconsistent Naming**: Mixed use of "OSINT" and "NetRunner" for similar functionality
- **Mock Implementations**: Many sophisticated mock components without real API connections
- **Missing Model References**: The `IntelAnalyzerAdapter` references models that may not exist
- **Analysis Code in Wrong Location**: Any intelligence analysis code found in NetRunner must be moved to IntelAnalyzer

### 2.2 Functional Components to Preserve

- **Routing Integration**: The MainBottomBar navigation to NetRunner is functioning correctly
- **Power Tools Framework**: The comprehensive OSINT tool collection and categorization system is well-designed and central to NetRunner's mission
  - Complete implementation in `/src/applications/netrunner/tools/NetRunnerPowerTools.ts` with 40+ OSINT tools
  - Organized across 7 categories: discovery, scraping, aggregation, analysis, verification, visualization, automation
  - PowerToolsPanel component provides complete UI for tool selection and deployment
- **OSINT Search Integration**: Comprehensive search functionality implemented
  - `/src/pages/OSINT/hooks/useOSINTSearch.ts` - complete search hook with error handling
  - `/src/pages/OSINT/services/search/searchService.ts` - search backend integration
  - `/src/applications/netrunner/hooks/useNetRunnerSearch.ts` - NetRunner-specific search operations
- **Tool Adapter System**: The adapter pattern for integrating external OSINT tools is architecturally sound
- **Workflow Engine**: The workflow orchestration system has a solid architecture for tool chaining
- **Bot Integration**: The bot roster system provides excellent automation capabilities for power tool execution
  - Complete interface definitions in `/src/applications/netrunner/integration/BotRosterIntegration.ts`
  - Bot Control Panel UI implemented in `/src/applications/netrunner/components/BotControlPanel.tsx`
  - Supports bot capabilities, autonomy levels, task scheduling, and performance monitoring
- **AI Agent Integration**: Comprehensive AI agent system for automation
  - AI Agent View in `/src/components/Views/AIAgentView.tsx` with multiple AI personalities
  - Supports strategic analysis, threat detection, predictive intelligence, and network coordination
  - Integration hooks for automated OSINT operations
- **IntelAnalyzer Adapter**: The integration with the separate IntelAnalyzer application is established

## 3. Consolidation Strategy

### 3.0 Application Boundaries

To ensure clear separation between components, the following boundaries must be maintained throughout the consolidation process:

1. **NetRunner vs. IntelAnalyzer**:
   - NetRunner is exclusively responsible for OSINT data collection
   - IntelAnalyzer is a separate application that handles all intelligence analysis
   - These applications must not share responsibilities
   - Communication occurs only through the defined IntelAnalyzerAdapter

2. **Responsibility Scope**:
   - NetRunner's scope ends at data collection and normalization
   - Any analytical functions must be delegated to IntelAnalyzer
   - Integration must respect these boundaries

3. **Data Flow**:
   - Data collected by NetRunner → Sent via adapter → Analyzed by IntelAnalyzer → Sent to Intelligence Marketplace

This consolidation plan focuses solely on the NetRunner application. The IntelAnalyzer application has its own separate consolidation plan.

### 3.1 Code Organization

1. **Centralized Structure**:
   - Standardize on `/src/applications/netrunner/` as the primary location
   - Remove duplicate code from `/src/pages/NetRunner/`
   - Create clear module boundaries within the NetRunner application

2. **Directory Structure**:
   ```
   src/applications/netrunner/
   ├── NetRunnerApplication.tsx   # Main application component
   ├── components/                # UI components for OSINT collection
   ├── hooks/                     # React hooks for data collection
   ├── services/                  # Service layer
   │   ├── api/                   # API clients for OSINT sources
   │   ├── logging/               # Logging services
   │   └── error/                 # Error handling
   ├── store/                     # State management
   ├── tools/                     # OSINT collection tools only
   │   ├── adapters/              # Tool adapters for data collection
   │   └── core/                  # Core collection functionality
   ├── models/                    # Data models for collected OSINT data
   ├── types/                     # TypeScript type definitions
   ├── utils/                     # Utility functions
   ├── integration/               # Integration with other systems
   │   └── adapters/              # IntelAnalyzerAdapter for data transfer
   └── constants/                 # Constants and configuration
   
   # NOTE: No analysis code should exist in the NetRunner directory
   # All analysis functionality belongs in the IntelAnalyzer application
   ```

### 3.2 Logging Implementation

1. **Logging Service**:
   - Create a dedicated logging service in `services/logging/`
   - Implement multiple log levels (debug, info, warn, error, critical)
   - Add context-aware logging with component/module information
   - Include correlation IDs for tracking operations across components

2. **Log Categories**:
   - Application lifecycle logs
   - User interaction logs
   - Tool execution logs
   - Network request/response logs
   - Performance metrics logs
   - Error and exception logs

3. **Sample Logging Interface**:
   ```typescript
   interface LogEntry {
     timestamp: string;
     level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
     component: string;
     message: string;
     correlationId?: string;
     data?: Record<string, unknown>;
     error?: Error;
   }
   
   interface Logger {
     debug(message: string, data?: Record<string, unknown>): void;
     info(message: string, data?: Record<string, unknown>): void;
     warn(message: string, data?: Record<string, unknown>): void;
     error(message: string, error?: Error, data?: Record<string, unknown>): void;
     critical(message: string, error?: Error, data?: Record<string, unknown>): void;
   }
   ```

### 3.3 Error Handling Framework

1. **Error Hierarchy**:
   - Create a comprehensive error hierarchy in `services/error/`
   - Implement base error classes with standardized properties
   - Define specific error categories and types

2. **Error Categories**:
   - API errors (connection, authentication, rate limiting)
   - Validation errors (input validation, schema validation)
   - Business logic errors (workflow errors, tool execution errors)
   - Integration errors (communication with other modules)
   - Runtime errors (unexpected conditions, timeouts)

3. **Sample Error Structure**:
   ```typescript
   // Base Error
   class NetRunnerError extends Error {
     code: string;
     component: string;
     timestamp: string;
     details?: Record<string, unknown>;
     cause?: Error;
     
     constructor(message: string, options: {
       code: string;
       component: string;
       details?: Record<string, unknown>;
       cause?: Error;
     }) {
       super(message);
       this.name = this.constructor.name;
       this.code = options.code;
       this.component = options.component;
       this.timestamp = new Date().toISOString();
       this.details = options.details;
       this.cause = options.cause;
     }
   }
   
   // Example derived errors
   class ApiError extends NetRunnerError {}
   class ToolExecutionError extends NetRunnerError {}
   class ValidationError extends NetRunnerError {}
   ```

## 4. Implementation Plan

### 4.1 Phase 1: Foundation (Week 1)

1. **Code Audit and Cleanup**:
   - Remove duplicate code between directories
   - Identify and preserve valuable implementations
   - Establish the new directory structure

2. **Logging and Error Framework**:
   - Implement the NetRunnerLogger service
   - Create the error hierarchy
   - Add logging and error handling to core components

3. **Model Consolidation**:
   - Define and implement consistent data models specific to OSINT collection (not analysis)
   - Ensure proper TypeScript typing throughout the NetRunner application
   - Create model validation utilities for data collected by NetRunner
   - Clearly differentiate between NetRunner data models and IntelAnalyzer data models
   - Implement transfer objects (DTOs) for data passed between applications
   - Document the model boundaries to prevent responsibility overlap

### 4.2 Phase 2: Core Functionality (Week 2)

1. **UI Components**:
   - Complete NetRunnerApplication.tsx implementation
   - Refactor all UI components to use the new error and logging frameworks
   - Implement consistent styling and UX patterns

2. **Search Functionality**:
   - Consolidate search hooks (useNetRunnerSearch)
   - Implement real search service with API connections
   - Add comprehensive error handling and validation

3. **Tool Integration**:
   - Refactor tool adapters to use the new error framework
   - Implement real API connections for previously mocked services
   - Add detailed logging for tool execution
   - Consolidate Power Tools implementation between directories
   - Enhance the tool categorization and filtering system
   - Strengthen the adapter registry for better tool management

### 4.3 Phase 3: Advanced Features (Week 3)

1. **Power Tools Consolidation**:
   - Consolidate Power Tools implementations between `/src/applications/netrunner/` and `/src/pages/NetRunner/`
   - Enhance the existing 40+ tool collection with improved categorization
   - Strengthen tool adapter registry and management for external integrations
   - Implement comprehensive tool execution logging and error handling
   - Add tool chaining capabilities for complex OSINT workflows
   - Enhance integration with Bot Roster for automated tool execution

2. **OSINT Search Integration**:
   - Consolidate search functionality from `/src/pages/OSINT/hooks/useOSINTSearch.ts` 
   - Integrate with existing NetRunner search service `/src/applications/netrunner/hooks/useNetRunnerSearch.ts`
   - Enhance error handling and retry logic already implemented in OSINT search
   - Add comprehensive search history and result management
   - Implement search result visualization and filtering

3. **Bot Roster Integration**:
   - Complete the bot roster implementation using existing framework in `/src/applications/netrunner/integration/BotRosterIntegration.ts`
   - Enhance Bot Control Panel UI in `/src/applications/netrunner/components/BotControlPanel.tsx`
   - Implement bot task scheduling and management systems
   - Add detailed logging for bot activities and performance monitoring
   - Implement error handling for autonomous operations
   - Enable bots to execute Power Tools automatically with supervision controls

4. **AI Agent Integration**:
   - Integrate AI Agent system from `/src/components/Views/AIAgentView.tsx`
   - Implement AI personalities (ATLAS, GUARDIAN, ORACLE, NEXUS) for OSINT automation
   - Add AI-driven tool selection and workflow optimization
   - Implement AI agent coordination for complex intelligence operations
   - Add AI-powered error detection and recovery mechanisms

5. **Workflow Engine Enhancement**:
   - Enhance workflow error handling and validation
   - Implement step-by-step logging for workflow execution
   - Add error recovery mechanisms for workflows
   - Integrate Power Tools, OSINT Search, Bot Roster, and AI Agents into unified workflows

6. **IntelAnalyzer Integration**:
   - Enhance the IntelAnalyzerAdapter for proper communication with the IntelAnalyzer application
   - Implement standardized data formats for transferring OSINT data to IntelAnalyzer
   - Add detailed logging for inter-application communication
   - Ensure clear boundary separation by restricting functionality to data transfer only
   - Document the exact interface contract between NetRunner and IntelAnalyzer
   - Implement robust error handling at the boundary to prevent cascading failures

### 4.4 Phase 4: Testing and Refinement (Week 4)

1. **Test Coverage**:
   - Implement unit tests for all components
   - Create integration tests for workflows
   - Add end-to-end tests for common user journeys

2. **Performance Optimization**:
   - Identify and resolve performance bottlenecks
   - Implement caching where appropriate
   - Add performance logging and metrics

3. **Documentation**:
   - Create comprehensive API documentation
   - Document error codes and troubleshooting
   - Create user guides for NetRunner features

## 5. Technical Specifications

### 5.1 Logging Specifications

```typescript
// Log Levels
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Log Output Destinations
type LogDestination = 'console' | 'file' | 'remote';

// Logger Configuration
interface LoggerConfig {
  level: LogLevel;
  component: string;
  destinations: LogDestination[];
  includeTimestamp: boolean;
  includeCorrelationId: boolean;
}

// Example Debug Log
// [2025-07-10T15:30:45.123Z][DEBUG][NetRunner:ToolExecution][cor-id:abc123] Executing Shodan tool with parameters: {"query":"example.com"}

// Example Error Log
// [2025-07-10T15:32:12.456Z][ERROR][NetRunner:ApiClient][cor-id:abc123] Failed to connect to Shodan API: Connection timeout after 30000ms
// Error Details: {
//   "code": "API_TIMEOUT",
//   "url": "https://api.shodan.io/shodan/host/search",
//   "attempt": 2,
//   "maxRetries": 3
// }
```

### 5.2 Error Handling Specifications

```typescript
// Error Codes Structure
// NET-<CATEGORY>-<SPECIFIC>
// Examples:
// NET-API-TIMEOUT
// NET-TOOL-EXECUTION-FAILED
// NET-VALIDATION-INVALID-INPUT

// Error Categories
enum ErrorCategory {
  API = 'API',
  TOOL = 'TOOL',
  WORKFLOW = 'WORKFLOW',
  VALIDATION = 'VALIDATION',
  INTEGRATION = 'INTEGRATION',
  SYSTEM = 'SYSTEM'
}

// Error Severity
enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error Details Interface
interface ErrorDetails {
  category: ErrorCategory;
  code: string;
  component: string;
  severity: ErrorSeverity;
  timestamp: string;
  message: string;
  userMessage?: string; // User-friendly message
  details?: Record<string, unknown>;
  stack?: string;
  cause?: ErrorDetails; // For nested errors
}

// Example Error Object
// {
//   category: 'API',
//   code: 'NET-API-AUTHENTICATION-FAILED',
//   component: 'ShodanAdapter',
//   severity: 'high',
//   timestamp: '2025-07-10T15:35:22.789Z',
//   message: 'Failed to authenticate with Shodan API',
//   userMessage: 'Unable to connect to intelligence source. Please check your credentials.',
//   details: {
//     httpStatus: 401,
//     endpoint: '/api/v1/search',
//     requestId: 'req-456'
//   }
// }
```

### 5.3 UI Error Presentation

1. **Error Notification Types**:
   - Toast notifications for non-critical errors
   - Modal dialogs for critical errors requiring user action
   - Inline error messages within forms and components
   - Status indicators in the application header

2. **Error Recovery Actions**:
   - Retry operations with exponential backoff
   - Fallback to alternative data sources
   - Graceful degradation of functionality
   - Clear user guidance on resolving errors

3. **Error Aggregation**:
   - Group related errors in the UI
   - Show error summaries for complex operations
   - Provide detailed error logs for troubleshooting

## 6. Integration with Existing Systems

### 6.1 MainBottomBar Integration

- Preserve existing routing to the NetRunner sub-application
- Enhance with error status indicators
- Add notification badges for important alerts

### 6.2 Authentication Integration

- Properly integrate with the existing authentication system
- Add feature-level access control
- Implement proper error handling for authentication failures

### 6.3 Data Store Integration

- Connect to the appropriate data stores
- Implement error handling for data access
- Add logging for data operations

## 7. Testing Strategy

### 7.1 Unit Testing

- Test all individual components
- Mock external dependencies
- Focus on error handling paths
- Verify logging behavior

### 7.2 Integration Testing

- Test interactions between components
- Verify workflow execution
- Test error propagation across components
- Validate logging consistency

### 7.3 End-to-End Testing

- Test complete user journeys
- Verify UI error presentations
- Test recovery mechanisms
- Validate performance under load

## 8. Success Criteria

1. **Code Quality**:
   - No duplicate implementations
   - Consistent naming and structure
   - Comprehensive TypeScript typing
   - High test coverage

2. **Error Handling**:
   - All possible error conditions handled
   - Consistent error presentation in UI
   - Proper error logging and tracking
   - Clear recovery paths for common errors

3. **Logging**:
   - Comprehensive logging across all components
   - Appropriate log levels for different operations
   - Correlation IDs for tracking operations
   - Performance metrics logging

4. **User Experience**:
   - Clear error messages for users
   - Intuitive recovery options
   - Consistent UI behavior during errors
   - Appropriate feedback during operations

5. **Application Boundary Compliance**:
   - Strict separation between NetRunner and IntelAnalyzer functionalities
   - All analysis-related code removed from NetRunner
   - Adapter-based communication only between applications
   - Clear interface contracts between applications
   - Documentation accurately reflects the application boundaries

## 9. Appendix

### 9.1 Sample Tool Adapter with Error Handling

```typescript
class EnhancedShodanAdapter extends BaseAdapter {
  private logger: Logger;
  
  constructor(config: AdapterConfig) {
    super('shodan', shodanSchema);
    this.logger = getLogger('NetRunner:ShodanAdapter');
  }
  
  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResponse> {
    const correlationId = request.correlationId || uuidv4();
    
    this.logger.info('Executing Shodan tool request', {
      correlationId,
      parameters: request.parameters
    });
    
    try {
      // Validate parameters
      if (!this.validateParameters(request.parameters)) {
        const error = new ValidationError('Invalid parameters for Shodan tool', {
          code: 'NET-TOOL-INVALID-PARAMS',
          component: 'ShodanAdapter',
          details: { parameters: request.parameters }
        });
        
        this.logger.error('Parameter validation failed', error, {
          correlationId,
          parameters: request.parameters
        });
        
        return {
          success: false,
          error: {
            message: 'Invalid parameters for Shodan tool',
            code: 'NET-TOOL-INVALID-PARAMS',
            details: { parameters: request.parameters }
          },
          correlationId
        };
      }
      
      // Execute tool logic
      this.logger.debug('Connecting to Shodan API', {
        correlationId,
        query: request.parameters.query
      });
      
      const result = await this.client.search(
        request.parameters.query,
        request.parameters.limit
      );
      
      this.logger.info('Shodan search completed successfully', {
        correlationId,
        resultCount: result.matches?.length || 0
      });
      
      return {
        success: true,
        data: result,
        correlationId
      };
      
    } catch (error) {
      // Handle API errors
      if (error instanceof ApiError) {
        this.logger.error('Shodan API error', error, {
          correlationId,
          request: request.parameters
        });
        
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            details: error.details
          },
          correlationId
        };
      }
      
      // Handle unexpected errors
      const unexpectedError = new ToolExecutionError(
        'Unexpected error executing Shodan tool',
        {
          code: 'NET-TOOL-EXECUTION-FAILED',
          component: 'ShodanAdapter',
          details: { parameters: request.parameters },
          cause: error instanceof Error ? error : new Error(String(error))
        }
      );
      
      this.logger.critical('Unexpected error in Shodan adapter', unexpectedError, {
        correlationId,
        parameters: request.parameters
      });
      
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while executing the Shodan tool',
          code: 'NET-TOOL-EXECUTION-FAILED',
          details: { originalError: error instanceof Error ? error.message : String(error) }
        },
        correlationId
      };
    }
  }
}
```

### 9.2 Sample Workflow with Enhanced Logging

```typescript
class EnhancedWorkflowEngine {
  private logger: Logger;
  
  constructor() {
    this.logger = getLogger('NetRunner:WorkflowEngine');
  }
  
  async executeWorkflow(workflow: Workflow): Promise<WorkflowResult> {
    const correlationId = uuidv4();
    
    this.logger.info('Starting workflow execution', {
      correlationId,
      workflowId: workflow.id,
      workflowName: workflow.name
    });
    
    try {
      // Validate workflow
      this.validateWorkflow(workflow);
      
      // Execute steps
      const results: Record<string, StepResult> = {};
      const workflowContext: WorkflowContext = {
        variables: {},
        stepResults: {}
      };
      
      for (const step of this.getOrderedSteps(workflow)) {
        this.logger.debug(`Executing workflow step: ${step.name}`, {
          correlationId,
          stepId: step.id,
          stepName: step.name,
          toolId: step.toolId
        });
        
        try {
          // Check step dependencies
          if (!this.areDependenciesFulfilled(step, results)) {
            this.logger.warn(`Skipping step due to unfulfilled dependencies: ${step.name}`, {
              correlationId,
              stepId: step.id,
              dependencies: step.dependsOn
            });
            
            results[step.id] = {
              status: 'skipped',
              reason: 'Dependencies not fulfilled'
            };
            continue;
          }
          
          // Execute step
          const stepResult = await this.executeStep(step, workflowContext, correlationId);
          results[step.id] = stepResult;
          workflowContext.stepResults[step.id] = stepResult;
          
          this.logger.info(`Workflow step completed: ${step.name}`, {
            correlationId,
            stepId: step.id,
            status: stepResult.status
          });
          
        } catch (error) {
          const stepError = new WorkflowError(`Error executing step: ${step.name}`, {
            code: 'NET-WORKFLOW-STEP-FAILED',
            component: 'WorkflowEngine',
            details: {
              stepId: step.id,
              stepName: step.name,
              toolId: step.toolId
            },
            cause: error instanceof Error ? error : new Error(String(error))
          });
          
          this.logger.error(`Workflow step failed: ${step.name}`, stepError, {
            correlationId,
            stepId: step.id
          });
          
          results[step.id] = {
            status: 'failed',
            error: stepError
          };
          
          // Handle step failure based on workflow configuration
          if (workflow.configuration.errorHandling === 'stop') {
            this.logger.warn('Stopping workflow due to step failure', {
              correlationId,
              workflowId: workflow.id,
              stepId: step.id
            });
            break;
          }
        }
      }
      
      // Compile workflow result
      const workflowStatus = this.determineWorkflowStatus(results);
      
      this.logger.info(`Workflow execution completed: ${workflow.name}`, {
        correlationId,
        workflowId: workflow.id,
        status: workflowStatus
      });
      
      return {
        workflowId: workflow.id,
        status: workflowStatus,
        stepResults: results,
        correlationId
      };
      
    } catch (error) {
      const workflowError = new WorkflowError(`Error executing workflow: ${workflow.name}`, {
        code: 'NET-WORKFLOW-EXECUTION-FAILED',
        component: 'WorkflowEngine',
        details: {
          workflowId: workflow.id,
          workflowName: workflow.name
        },
        cause: error instanceof Error ? error : new Error(String(error))
      });
      
      this.logger.critical('Workflow execution failed', workflowError, {
        correlationId,
        workflowId: workflow.id
      });
      
      return {
        workflowId: workflow.id,
        status: 'failed',
        error: workflowError,
        correlationId
      };
    }
  }
}
```

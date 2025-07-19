# IntelDataCore Testing and Quality Assurance

## Overview

This document outlines the comprehensive testing and quality assurance strategy for the IntelDataCore system. It provides a structured approach to ensuring the reliability, performance, and security of the central intelligence data system across all STARCOM modules.

## Testing Principles

1. **Layered Testing**: Tests at all levels from unit to end-to-end
2. **Test-Driven Development**: Tests first approach for core functionality
3. **Automated Coverage**: Extensive automated test coverage
4. **Performance Testing**: Rigorous performance benchmarking
5. **Security Focus**: Security-centric testing approach
6. **Integration Emphasis**: Thorough testing of module integrations
7. **Chaos Engineering**: Resilience testing under failure conditions

## Testing Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                     Test Management                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐   │
│  │ Test Planning  │  │ Test Execution │  │ Results Analysis   │   │
│  └────────────────┘  └────────────────┘  └────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼───────────┐
                 │            │           │
                 ▼            ▼           ▼
┌───────────────────┐ ┌──────────────┐ ┌───────────────────┐
│   Unit Testing    │ │ Integration  │ │    End-to-End     │
│  ┌─────────────┐  │ │  Testing     │ │     Testing       │
│  │ Data Models │  │ │ ┌──────────┐ │ │ ┌───────────────┐ │
│  ├─────────────┤  │ │ │ Module   │ │ │ │ User Flows    │ │
│  │ Storage     │  │ │ │ Interface│ │ │ ├───────────────┤ │
│  ├─────────────┤  │ │ ├──────────┤ │ │ │ Visual Regress│ │
│  │ Events      │  │ │ │ API      │ │ │ ├───────────────┤ │
│  ├─────────────┤  │ │ │ Contract │ │ │ │ Cross-Browser │ │
│  │ Queries     │  │ │ └──────────┘ │ │ └───────────────┘ │
│  └─────────────┘  │ └──────────────┘ └───────────────────┘
└───────────────────┘                           │
         │                                      │
         ▼                                      ▼
┌────────────────────────┐ ┌────────────────────────────────┐
│ Performance Testing    │ │ Security Testing                │
│ ┌──────────────────┐  │ │ ┌──────────────┐ ┌────────────┐ │
│ │ Load Testing     │  │ │ │ Penetration  │ │ Security   │ │
│ ├──────────────────┤  │ │ │ Testing      │ │ Scanning   │ │
│ │ Stress Testing   │  │ │ ├──────────────┤ ├────────────┤ │
│ ├──────────────────┤  │ │ │ Vulnerability│ │ Dependency │ │
│ │ Scalability      │  │ │ │ Assessment   │ │ Checking   │ │
│ └──────────────────┘  │ │ └──────────────┘ └────────────┘ │
└────────────────────────┘ └────────────────────────────────┘
```

## Test Types and Approaches

### 1. Unit Testing

Testing individual components in isolation:

- **Frameworks**: Jest for JavaScript/TypeScript
- **Approach**: Test-driven development (TDD)
- **Coverage Target**: 90%+ for core functionality
- **Mock Strategy**: Mock external dependencies

#### Key Unit Test Areas

1. **Data Models**
   - Type validation
   - Default values
   - Method functionality
   - Serialization/deserialization

2. **Storage Layer**
   - CRUD operations
   - Transaction management
   - Error handling
   - Cache behavior

3. **Event System**
   - Event publication
   - Subscription management
   - Event filtering
   - Event propagation

4. **Query System**
   - Filter execution
   - Sort functionality
   - Pagination
   - Query optimization

#### Example Unit Test

```typescript
// Example unit test for NodeEntity model
import { NodeEntity, NodeCategory } from '@core/models';
import { validateEntity } from '@core/validation';

describe('NodeEntity', () => {
  it('should validate a correctly structured node', () => {
    // Arrange
    const node: NodeEntity = {
      id: 'node-1234',
      type: 'node',
      category: NodeCategory.PERSON,
      name: 'Test Person',
      attributes: {
        age: 30,
        occupation: 'Developer'
      },
      confidence: 85,
      createdAt: '2025-07-01T12:00:00Z',
      updatedAt: '2025-07-01T12:00:00Z',
      metadata: {},
      tags: ['test']
    };
    
    // Act
    const result = validateEntity(node);
    
    // Assert
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should detect missing required fields', () => {
    // Arrange
    const invalidNode = {
      id: 'node-1234',
      type: 'node',
      // Missing category and name
      attributes: {},
      confidence: 85,
      createdAt: '2025-07-01T12:00:00Z',
      updatedAt: '2025-07-01T12:00:00Z',
      metadata: {},
      tags: []
    };
    
    // Act
    const result = validateEntity(invalidNode as NodeEntity);
    
    // Assert
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'category',
        message: expect.stringContaining('required')
      })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'name',
        message: expect.stringContaining('required')
      })
    );
  });
  
  // Additional tests for specific behavior
});
```

### 2. Integration Testing

Testing interactions between components:

- **Frameworks**: Jest + Testing Library
- **Approach**: Component integration
- **Coverage Target**: 80%+ for integration points
- **Mock Strategy**: Mock external systems, use real inter-component interactions

#### Key Integration Test Areas

1. **Module Interfaces**
   - Hook behavior
   - Service interactions
   - Event handling

2. **API Contracts**
   - Parameter validation
   - Response structure
   - Error handling

3. **Storage Integration**
   - Persistence across components
   - Transaction behavior
   - Cache consistency

4. **Event Propagation**
   - Cross-component event flow
   - Event-driven updates

#### Example Integration Test

```typescript
// Example integration test for NodeWeb adapter
import { NodeWebAdapter } from '@modules/nodeWeb/adapters';
import { IntelDataCore } from '@core/intel-data-core';
import { NodeCategory } from '@core/models';

// Mock IntelDataCore
jest.mock('@core/intel-data-core', () => ({
  queryEntities: jest.fn()
}));

describe('NodeWebAdapter', () => {
  let adapter: NodeWebAdapter;
  
  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new NodeWebAdapter();
  });
  
  it('should retrieve nodes by category', async () => {
    // Arrange
    const mockNodes = [
      { id: 'node1', type: 'node', category: NodeCategory.PERSON },
      { id: 'node2', type: 'node', category: NodeCategory.PERSON }
    ];
    
    IntelDataCore.queryEntities.mockResolvedValue(mockNodes);
    
    // Act
    const result = await adapter.getNodesByCategory([NodeCategory.PERSON]);
    
    // Assert
    expect(IntelDataCore.queryEntities).toHaveBeenCalledWith({
      type: 'node',
      filter: [
        { property: 'category', operator: 'in', value: [NodeCategory.PERSON] }
      ]
    });
    
    expect(result).toEqual(mockNodes);
  });
  
  it('should add additional filters when provided', async () => {
    // Arrange
    const mockNodes = [
      { id: 'node1', type: 'node', category: NodeCategory.PERSON, confidence: 90 }
    ];
    
    IntelDataCore.queryEntities.mockResolvedValue(mockNodes);
    
    const additionalFilter = {
      property: 'confidence',
      operator: 'gte',
      value: 80
    };
    
    // Act
    const result = await adapter.getNodesByCategory(
      [NodeCategory.PERSON],
      additionalFilter
    );
    
    // Assert
    expect(IntelDataCore.queryEntities).toHaveBeenCalledWith({
      type: 'node',
      filter: [
        { property: 'category', operator: 'in', value: [NodeCategory.PERSON] },
        additionalFilter
      ]
    });
    
    expect(result).toEqual(mockNodes);
  });
  
  // Additional integration tests
});
```

### 3. End-to-End Testing

Testing complete user flows:

- **Frameworks**: Playwright or Cypress
- **Approach**: User journey simulation
- **Coverage Target**: All critical user flows
- **Mock Strategy**: Minimal mocking, use test data

#### Key E2E Test Areas

1. **User Flows**
   - Intelligence data entry
   - Analysis workflows
   - Visualization interactions
   - Search and filtering

2. **Visual Regression**
   - UI component appearance
   - Visualization rendering
   - Responsive behavior

3. **Cross-Browser Testing**
   - Chrome, Firefox, Safari
   - Desktop and mobile views

#### Example E2E Test

```typescript
// Example Playwright E2E test for node creation flow
import { test, expect } from '@playwright/test';

test.describe('Node Creation Flow', () => {
  test('should create a new person node', async ({ page }) => {
    // Navigate to the NodeWeb dashboard
    await page.goto('/node-web');
    
    // Click the "Add Node" button
    await page.click('button:text("Add Node")');
    
    // Fill out the node creation form
    await page.selectOption('select[name="category"]', 'person');
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('textarea[name="description"]', 'Test person node');
    
    // Add attributes
    await page.click('button:text("Add Attribute")');
    await page.fill('input[name="attributeKey"]', 'age');
    await page.fill('input[name="attributeValue"]', '30');
    
    // Submit the form
    await page.click('button:text("Save")');
    
    // Verify success message
    await expect(page.locator('.toast-success')).toContainText('Node created');
    
    // Verify node appears in the visualization
    await expect(page.locator('.node-label:text("John Doe")')).toBeVisible();
    
    // Verify node details are accessible
    await page.click('.node-label:text("John Doe")');
    await expect(page.locator('.node-details')).toContainText('John Doe');
    await expect(page.locator('.node-details')).toContainText('age: 30');
  });
});
```

### 4. Performance Testing

Evaluating system performance under various conditions:

- **Frameworks**: k6, custom benchmarking tools
- **Approach**: Scenario-based load testing
- **Coverage Target**: All critical operations
- **Environment**: Staging environment with production-like data

#### Key Performance Test Areas

1. **Load Testing**
   - Concurrent user operations
   - Data volume handling
   - Response time metrics

2. **Stress Testing**
   - System behavior under extreme load
   - Resource utilization
   - Recovery from overload

3. **Scalability Testing**
   - Performance with increasing data volume
   - Memory consumption patterns
   - Storage optimization

#### Example Performance Test

```typescript
// Example k6 performance test script
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users for 3 minutes
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
    'http_req_duration{staticAsset:yes}': ['p(95)<100'], // 95% of static asset requests must complete within 100ms
    errors: ['rate<0.1'],             // Error rate must be less than 10%
  },
};

// Simulated user behavior
export default function() {
  // 1. Fetch Node Web dashboard
  let response = http.get('https://test-app.example.com/node-web', {
    tags: { staticAsset: 'yes' },
  });
  
  // Check if the request was successful
  const success1 = check(response, {
    'dashboard loaded': (r) => r.status === 200,
  });
  
  // Record errors
  if (!success1) {
    errorRate.add(1);
  }
  
  // Simulate user thinking time
  sleep(Math.random() * 3 + 2);
  
  // 2. Query nodes (API call)
  response = http.post('https://test-app.example.com/api/intel/query', JSON.stringify({
    type: 'node',
    filter: {
      property: 'category',
      operator: 'eq',
      value: 'person'
    }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  // Check if the API request was successful
  const success2 = check(response, {
    'nodes query successful': (r) => r.status === 200,
    'nodes returned': (r) => JSON.parse(r.body).length > 0,
  });
  
  // Record errors
  if (!success2) {
    errorRate.add(1);
  }
  
  // Simulate user thinking time
  sleep(Math.random() * 5 + 3);
  
  // 3. Create a new node (API call)
  const newNode = {
    type: 'node',
    category: 'person',
    name: `Test Person ${Math.floor(Math.random() * 10000)}`,
    attributes: {
      test: 'value'
    },
    confidence: 85,
    metadata: {},
    tags: ['test', 'performance']
  };
  
  response = http.post('https://test-app.example.com/api/intel/entities', JSON.stringify(newNode), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  // Check if the node creation was successful
  const success3 = check(response, {
    'node creation successful': (r) => r.status === 201,
    'node has id': (r) => JSON.parse(r.body).id !== undefined,
  });
  
  // Record errors
  if (!success3) {
    errorRate.add(1);
  }
  
  // Simulate user thinking time
  sleep(Math.random() * 3 + 2);
}
```

### 5. Security Testing

Evaluating system security and identifying vulnerabilities:

- **Frameworks**: OWASP ZAP, SonarQube, npm audit
- **Approach**: Automated scanning + manual penetration testing
- **Coverage Target**: All external interfaces and data storage
- **Frequency**: Continuous automated, quarterly manual

#### Key Security Test Areas

1. **Penetration Testing**
   - API security
   - Authentication bypass attempts
   - Access control validation

2. **Vulnerability Assessment**
   - Common vulnerability scanning
   - Business logic flaws
   - Sensitive data exposure

3. **Dependency Checking**
   - Known vulnerability scanning
   - Outdated dependency identification
   - License compliance

#### Security Test Approach

```typescript
// Example security testing configuration (pseudo-code)
const securityTestConfig = {
  // OWASP ZAP configuration
  zapScan: {
    target: 'https://test-app.example.com',
    maxDuration: 120, // minutes
    authScript: './auth-script.js',
    alertFilters: [
      { 'id': 10038, 'action': 'ignore' }, // CSRF - handled separately
    ],
    reportPath: './security-reports/zap-report.html'
  },
  
  // SonarQube configuration
  sonarqube: {
    projectKey: 'starcom:intel-data-core',
    sources: './src',
    exclusions: '**/node_modules/**,**/tests/**',
    securityRules: true
  },
  
  // Dependency checking
  dependencyCheck: {
    command: 'npm audit --production',
    failOnCritical: true,
    reportPath: './security-reports/dependency-report.json'
  },
  
  // Manual testing checklist
  manualChecklist: [
    'Data encryption at rest validation',
    'Authentication token inspection',
    'Cross-site scripting attempts',
    'SQL/NoSQL injection testing',
    'Local storage inspection',
    'Network traffic analysis'
  ]
};
```

## Testing Infrastructure

### 1. Continuous Integration Pipeline

```
┌─────────────────┐
│ Code Commit     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Lint & Format   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Unit Tests      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Integration     │
│ Tests           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy to       │
│ Test Environment│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ E2E Tests       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Security Scan   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Performance     │
│ Tests           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deployment      │
│ Approval        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy to       │
│ Production      │
└─────────────────┘
```

### 2. Test Environments

| Environment | Purpose | Data | Access |
|-------------|---------|------|--------|
| **Development** | Daily development work | Mock data | Developers |
| **Integration** | CI pipeline tests | Test fixtures | Automated tests |
| **Staging** | Pre-production validation | Anonymized production data | QA team |
| **Production** | Live system | Real data | End users |

### 3. Test Data Management

- **Synthetic Data Generation**: Realistic test data creation
- **Data Seeding**: Consistent test fixtures
- **Data Masking**: Production data anonymization
- **State Management**: Test state reset between runs

```typescript
// Example test data generator
class TestDataGenerator {
  /**
   * Generate a network of interconnected nodes
   */
  generateNetwork(params: NetworkParams): TestNetwork {
    const nodes = this.generateNodes(params.nodeCount, params.categories);
    const edges = this.generateEdges(nodes, params.edgeDensity);
    
    return { nodes, edges };
  }
  
  /**
   * Generate test case with full intelligence context
   */
  generateTestCase(): TestCase {
    const network = this.generateNetwork({
      nodeCount: 20,
      categories: ['person', 'organization', 'device'],
      edgeDensity: 0.3
    });
    
    const timelineEvents = this.generateTimelineEvents(
      network.nodes,
      10
    );
    
    const intelReports = this.generateIntelReports(
      network.nodes,
      network.edges,
      3
    );
    
    const caseRecord = this.generateCaseRecord(
      network.nodes,
      timelineEvents,
      intelReports
    );
    
    return {
      network,
      timelineEvents,
      intelReports,
      caseRecord
    };
  }
  
  // Implementation of specific generation methods
}
```

## Quality Metrics and Monitoring

### 1. Code Quality Metrics

- **Complexity**: Cyclomatic complexity < 15
- **Maintainability**: Maintainability index > 70
- **Duplication**: < 3% duplicated code
- **Comments**: > 20% comment ratio
- **TypeScript**: Strict mode compliance

### 2. Test Coverage Metrics

- **Line Coverage**: > 90% for core, > 80% for modules
- **Branch Coverage**: > 85% for core, > 75% for modules
- **Function Coverage**: > 95% for core, > 85% for modules
- **Integration Coverage**: All public APIs tested
- **User Flow Coverage**: All critical paths tested

### 3. Performance Metrics

- **Query Response Time**: < 100ms for 95% of queries
- **Mutation Operations**: < 200ms for 95% of operations
- **Rendering Time**: < 50ms for data visualizations
- **Memory Usage**: < 100MB in browser
- **Network Payload**: < 500KB initial load, < 50KB updates

### 4. Monitoring and Alerting

- **Error Tracking**: Capture and classify all runtime errors
- **Performance Monitoring**: Track operation timing
- **Usage Analytics**: Monitor feature usage patterns
- **Resource Utilization**: Track memory and CPU usage
- **Alerting**: Notify on anomalies and threshold violations

## Testing Roles and Responsibilities

### 1. Developers

- Write unit and integration tests
- Maintain test fixtures
- Fix test failures
- Perform code reviews with test focus

### 2. QA Engineers

- Design end-to-end test scenarios
- Create performance test plans
- Execute manual testing
- Validate user acceptance criteria

### 3. Security Team

- Conduct security assessments
- Review security-critical code
- Perform penetration testing
- Recommend security improvements

### 4. DevOps

- Maintain test infrastructure
- Configure CI/CD pipelines
- Monitor test execution
- Manage test environments

## Testing Documentation

### 1. Test Plans

- **Scope**: Features and components to test
- **Resources**: Personnel, tools, environments
- **Schedule**: Timeline and milestones
- **Risks**: Identified test risks and mitigations

### 2. Test Cases

- **Objective**: What is being tested
- **Prerequisites**: Required setup
- **Steps**: Detailed test procedures
- **Expected Results**: Success criteria
- **Data**: Test data requirements

### 3. Test Reports

- **Summary**: Overall test status
- **Metrics**: Coverage and quality metrics
- **Issues**: Found defects and status
- **Recommendations**: Next steps

## Module-Specific Testing Strategies

### 1. NetRunner Testing

- **Focus Areas**: 
  - Data collection accuracy
  - Integration with IntelDataCore
  - Performance under load
  - Visualization correctness

- **Custom Approaches**:
  - Network data simulation
  - Mock external scan targets
  - Capture/replay test data

### 2. Analyzer Testing

- **Focus Areas**:
  - Analysis algorithm accuracy
  - Data transformation correctness
  - Visualization of results
  - Performance with large datasets

- **Custom Approaches**:
  - Golden test sets with known results
  - Algorithm unit testing
  - Visual regression testing

### 3. Node Web Testing

- **Focus Areas**:
  - Graph visualization accuracy
  - Interactive filtering
  - Performance with large graphs
  - Data editing workflows

- **Custom Approaches**:
  - Graph structure validation
  - Visual comparison testing
  - User interaction simulation

### 4. Timeline Testing

- **Focus Areas**:
  - Event ordering and filtering
  - Time-based operations
  - Visualization accuracy
  - Integration with other modules

- **Custom Approaches**:
  - Time-series data validation
  - Time manipulation testing
  - Cross-module correlation testing

### 5. Case Manager Testing

- **Focus Areas**:
  - Case workflow accuracy
  - Entity linking operations
  - Permissions and access control
  - Collaboration features

- **Custom Approaches**:
  - Workflow simulation
  - Multi-user testing
  - Data relationship validation

## Test-Driven Development Process

### 1. Feature Development Workflow

```
┌─────────────────┐
│ Write Feature   │
│ Requirements    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Write           │
│ Failing Tests   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Implement       │
│ Feature Code    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pass Unit &     │
│ Integration     │
│ Tests           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Refactor        │
│ Code            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Write           │
│ E2E Tests       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Code Review     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Merge to        │
│ Main Branch     │
└─────────────────┘
```

### 2. Bug Fix Workflow

```
┌─────────────────┐
│ Reproduce Bug   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Write           │
│ Failing Test    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fix Bug         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify All      │
│ Tests Pass      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Add Regression  │
│ Test            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Code Review     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Merge to        │
│ Main Branch     │
└─────────────────┘
```

## Implementation Roadmap

The testing strategy will be implemented in phases:

### Phase 1: Foundation
- Core unit testing framework
- Basic integration tests
- CI pipeline setup
- Test coverage reporting

### Phase 2: Advanced Testing
- End-to-end test framework
- Performance test suite
- Security scanning integration
- Visual regression testing

### Phase 3: Continuous Improvement
- Automated anomaly detection
- Advanced test data generation
- Cross-module integration testing
- Chaos engineering implementation

## Conclusion

This comprehensive testing strategy ensures the reliability, performance, and security of the IntelDataCore system. By implementing this multi-layered approach to quality assurance, we can deliver a robust intelligence data system that meets the needs of cyber investigation teams while maintaining the highest standards of software quality.

---

*See related documentation for architecture, data models, and implementation details.*

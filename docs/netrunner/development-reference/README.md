# NetRunner Development Reference

This directory contains essential development documentation for the NetRunner OSINT platform.

## Quick Navigation

### 🔧 Core Development
- [`architecture-mapping.md`](./architecture-mapping.md) - Complete system architecture and component relationships
- [`integration-gaps.md`](./integration-gaps.md) - Identified disconnections between UI and services
- [`service-api-reference.md`](./service-api-reference.md) - Complete API documentation for all services

### 🎯 Implementation Guides
- [`center-view-integration.md`](./center-view-integration.md) - How to connect scanning to the center view
- [`bot-service-bridge.md`](./bot-service-bridge.md) - Connecting bots to actual OSINT operations
- [`powertools-wiring.md`](./powertools-wiring.md) - Implementing real functionality for scripts/powertools

### 🏗️ Component References
- [`component-hierarchy.md`](./component-hierarchy.md) - Complete component tree and data flow
- [`state-management.md`](./state-management.md) - State management patterns and data flow
- [`ui-service-mapping.md`](./ui-service-mapping.md) - Which UI components should connect to which services

### 🚀 Quick Start
- [`development-checklist.md`](./development-checklist.md) - Step-by-step implementation checklist
- [`testing-scenarios.md`](./testing-scenarios.md) - Test cases for validating functionality
- [`troubleshooting.md`](./troubleshooting.md) - Common issues and solutions

## Development Status

**Current State:** 85% Complete Infrastructure, 15% Functional Integration
- ✅ All services implemented and working
- ✅ Professional UI components complete
- ❌ Missing integration layer between UI and services
- ❌ Center view source code visualization not connected
- ❌ Bot automation not wired to services

## Priority Implementation Order

1. **Center View Integration** - Connect scanning to source code display
2. **PowerTools Execution** - Wire left sidebar tools to real services
3. **Bot Service Bridge** - Connect bot roster to automation services
4. **AI Agent Coordination** - Implement real AI-driven operation control

---
*Last Updated: July 13, 2025*

# Starcom Documentation Hub

**AI-Agent-Optimized Documentation Structure**

Welcome to the clean, organized Starcom documentation system designed for efficient AI agent navigation and human reference.

---

## 🚀 **Quick Start for AI Agents**

1. **Read**: `.onboarding` for immediate project context
2. **Check**: `cache/code-summary.json` and `cache/code-health.json` for current state
3. **Navigate**: Use sections below for specific documentation needs
4. **Reference**: `.primer` for project conventions and glossary

---

## 📚 **Documentation Structure**

### **Core References** 
- **[API Documentation](./api/)** - Components, hooks, services, interfaces
- **[Development Guide](./development/)** - Setup, architecture, testing, contributing
- **[User Documentation](./user/)** - Getting started, features, troubleshooting
- **[Deployment Guide](./deployment/)** - Production, staging, monitoring

### **Historical Archive**
- **[Project Reports](./project-reports/)** - Phase reports, status updates, analysis
- **[Archived Documentation](./archived/)** - Legacy docs and deprecated content

---

## 🎯 **AI Agent Navigation Guide**

### **For Code Changes**
1. Check **API docs** for existing components/services
2. Review **development/architecture.md** for patterns
3. Use **development/testing.md** for safe test protocols

### **For Feature Development**
1. Check **user/** for feature requirements
2. Review **api/** for existing interfaces
3. Update relevant docs after implementation

### **For Troubleshooting**
1. Check **development/troubleshooting.md**
2. Review **project-reports/** for known issues
3. Use safe test runner protocols

---

## 📋 **Documentation Standards**

- **Artifact-Driven**: All docs linked to code artifacts
- **AI-NOTE Comments**: Context for future agents
- **Structured TODOs**: `TODO: [QUESTION] — [FILE/ARTIFACT]`
- **Consistent Naming**: Follow `.primer` conventions
- **Regular Updates**: Maintained by onboarding automation

---

## 🔧 **Maintenance**

This documentation structure is maintained through:
- Automated onboarding script (`scripts/onboard.cjs`)
- Regular consolidation of scattered docs
- AI agent protocols for updates
- Artifact-driven development patterns

*Last Updated: June 22, 2025*  
*AI-NOTE: This index provides efficient navigation for both AI agents and humans while maintaining clean organization*

---

## 📚 Documentation Structure

### 👥 [User Documentation](./user/)
Documentation for end users of the application.

- **[User Guide](./user/guide.md)** - Complete guide to using the application
- **[Getting Started](./user/getting-started.md)** - Quick start guide (planned)
- **[Troubleshooting](./user/troubleshooting.md)** - Common issues and solutions (planned)

### 🛠️ [Development Documentation](./development/)
Technical documentation for developers working on the project.

- **[Architecture](./development/architecture.md)** - System architecture overview
- **[Features](./development/features.md)** - Detailed feature implementation guide
- **[Implementation History](./development/implementation-history.md)** - Project timeline and decisions
- **[Testing Guide](./development/testing.md)** - Testing strategies and procedures (planned)
- **[Contributing](./development/contributing.md)** - Guidelines for contributors (planned)

### 🔧 [API Documentation](./api/)
Reference documentation for developers integrating with or extending the application.

- **[API Reference](./api/reference.md)** - Complete API documentation
- **[Component API](./api/components.md)** - React component interfaces (planned)
- **[Hooks API](./api/hooks.md)** - Custom React hooks documentation (planned)

### 🚀 [Deployment Documentation](./deployment/)
Guides for deploying and operating the application.

- **[Production Deployment](./deployment/production.md)** - Production deployment guide
- **[Staging Environment](./deployment/staging.md)** - Staging setup and procedures (planned)
- **[Monitoring](./deployment/monitoring.md)** - Operations and monitoring guide (planned)

### 📁 [Archived Documentation](./archived/)
Historical documentation preserved for reference.

- Implementation reports from various development phases
- Recent bug fixes and implementation summaries (Solar Flare, Context Persistence, UI Modernization)
- Migration guides for completed transitions
- Deprecated feature documentation
- Legacy system documentation

*See [`archived/README.md`](./archived/README.md) for complete index*

---

## 🔍 Quick Navigation

### I want to...

#### **Use the Application**
→ Start with [User Guide](./user/guide.md)

#### **Understand the System**
→ Read [Architecture Overview](./development/architecture.md)

#### **Implement a Feature**
→ Check [Features Guide](./development/features.md)

#### **Integrate or Extend**
→ Browse [API Reference](./api/reference.md)

#### **Deploy to Production**
→ Follow [Deployment Guide](./deployment/production.md)

#### **Debug an Issue**
→ Use [User Guide Troubleshooting](./user/guide.md#troubleshooting) or [Development Testing](./development/features.md#ai-testing-framework)

#### **Understand Project History**
→ Review [Implementation History](./development/implementation-history.md)

---

## 🎯 Key Features

### Core Application Features
- **3D Globe Visualization** - Interactive globe with real-time data overlays
- **HUD Interface** - Sophisticated heads-up display with contextual information
- **Space Weather Integration** - Real-time NOAA space weather data and visualization
- **Financial Data Feeds** - Live market data, commodities, and cryptocurrency prices
- **AI Testing Framework** - Autonomous UI testing with safety monitoring
- **Feature Flag System** - Safe feature rollout and configuration management

### Development Features
- **TypeScript Throughout** - Full type safety and excellent developer experience
- **Comprehensive Testing** - Unit, integration, E2E, and AI-powered testing
- **Performance Monitoring** - Real-time performance metrics and optimization
- **Security Hardening** - Enterprise-grade security measures and monitoring
- **Diagnostics Mode** - Toggle for development tools and testing UI

---

## 🔧 Quick Reference

### Essential Commands
```bash
# Development
npm run dev                    # Start development server
npm run build                 # Production build
npm run test                  # Run all tests
npm run test:ai-agent         # Run AI testing framework

# Development Tools
Ctrl+Shift+D                  # Toggle diagnostics mode
npm run type-check            # TypeScript validation
npm run lint                  # Code quality check
```

### Key Directories in Source Code
```
src/
├── components/HUD/           # User interface components
├── components/Globe/         # 3D visualization
├── testing/ai-agent/         # AI testing framework
├── utils/featureFlags.ts     # Feature flag management
└── layouts/HUDLayout/        # Main application layout
```

### Important Configuration
- **Feature Flags**: Managed in `src/utils/featureFlags.ts`
- **Build Config**: `vite.config.ts` and `package.json`
- **TypeScript**: `tsconfig.json` with strict mode enabled
- **Testing**: Vitest + Playwright configuration

---

## 📋 Documentation Standards

### Writing Guidelines
- **Clear Purpose**: Each document states its purpose at the top
- **Living Documents**: Regular updates rather than creating new files
- **Cross-References**: Link to related documentation
- **Code Examples**: Include practical usage examples
- **Date Stamps**: Keep track of when documents were last updated

### Naming Conventions
- **Kebab Case**: `feature-implementation-guide.md`
- **Descriptive Names**: Avoid abbreviations and codes
- **Categorized Structure**: Directory organization indicates content type
- **Archived Files**: Date-prefixed for historical documents

### Maintenance
- **Quarterly Review**: Check for outdated information
- **Link Validation**: Ensure all internal links work
- **Content Consolidation**: Merge redundant information
- **Archive Management**: Move completed project docs to archive

---

## 🤝 Contributing to Documentation

### Before Adding New Documentation
1. **Check Existing Docs**: Can current documentation be updated instead?
2. **Clear Purpose**: Ensure the document solves a specific problem
3. **Proper Location**: Place in the appropriate directory
4. **Follow Standards**: Use established formatting and naming conventions

### When Updating Documentation
1. **Update Date Stamps**: Modify "Last Updated" dates
2. **Cross-Reference Updates**: Update related documents if needed
3. **Version Control**: Commit documentation changes with descriptive messages
4. **Review Process**: Have changes reviewed like code changes

---

## 📞 Getting Help

### Documentation Issues
- **Missing Information**: Check if it exists in archived documentation
- **Outdated Content**: Submit an issue or pull request to update
- **Organization Problems**: Suggest improvements to the structure

### Technical Support
- **Development Issues**: See [Features Guide](./development/features.md) and [API Reference](./api/reference.md)
- **Deployment Problems**: Check [Deployment Guide](./deployment/production.md)
- **User Questions**: Start with [User Guide](./user/guide.md)

### Project Resources
- **Source Code**: Main application repository
- **Issue Tracker**: Report bugs and request features
- **Discussions**: Community discussions and Q&A
- **Documentation Repository**: This documentation source

---

## 📊 Documentation Health

### Current Status
- ✅ **Well Organized**: Clear structure and navigation
- ✅ **Comprehensive Coverage**: All major features documented
- ✅ **Regular Maintenance**: Quarterly review process established
- ✅ **User Focused**: Both end-user and developer documentation
- ✅ **Quality Standards**: Consistent formatting and naming

### Metrics
- **Total Documents**: ~12 core documents (down from 135+ scattered files)
- **Coverage**: All major features and APIs documented
- **Maintenance**: Quarterly review schedule established
- **Accessibility**: Clear navigation and search-friendly structure

---

*This documentation hub is designed to be the single source of truth for all Starcom MK2 information. If you can't find what you're looking for, please suggest improvements or additions.*

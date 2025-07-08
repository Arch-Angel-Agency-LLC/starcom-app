# NetRunner Real Implementation Task Plan

**Created:** July 8, 2025  
**Status:** Ready for Implementation

## Overview
This document outlines the specific mock implementations that need to be replaced with real functionality in the NetRunner system. All identified mock data and placeholder implementations are catalogued with implementation priorities.

## 🚨 Critical Issues Found

### **1. Tool Adapters Using Mock Data**

#### **ShodanAdapter** - HIGH PRIORITY ⚠️
- **File:** `src/pages/NetRunner/tools/adapters/ShodanAdapter.ts`
- **Issue:** Uses `mockShodanApiClient` instead of real Shodan API
- **Lines:** 20-98 (entire mock client)
- **Impact:** No real OSINT data collection
- **Fix Required:** Implement real Shodan API integration

#### **TheHarvesterAdapter** - HIGH PRIORITY ⚠️  
- **File:** `src/pages/NetRunner/tools/adapters/TheHarvesterAdapter.ts`
- **Issue:** Uses `mockHarvesterClient` instead of real theHarvester CLI/API
- **Lines:** 21-85 (entire mock client)
- **Impact:** No real email/subdomain harvesting
- **Fix Required:** Implement real theHarvester CLI integration

#### **IntelAnalyzerAdapter** - HIGH PRIORITY ⚠️
- **File:** `src/pages/NetRunner/tools/adapters/IntelAnalyzerAdapter.ts`  
- **Issue:** Entire analysis engine is mocked with `generateMockAnalysisResult()`
- **Lines:** 273-560 (mock analysis logic)
- **Impact:** No real intel analysis capabilities
- **Fix Required:** Integrate with actual IntelAnalyzer system

### **2. Marketplace Mock Implementations**

#### **TransactionService** - MEDIUM PRIORITY ⚠️
- **File:** `src/pages/NetRunner/marketplace/TransactionService.ts`
- **Issues:** 
  - Mock payment processing (line 104)
  - No real blockchain integration (lines 120-154)
  - Fake transaction history (line 154)
- **Fix Required:** Implement real payment and blockchain integration

#### **ListingManager** - MEDIUM PRIORITY ⚠️
- **File:** `src/pages/NetRunner/marketplace/ListingManager.ts`
- **Issues:**
  - Mock database operations (lines 82, 133)
  - No real data persistence
- **Fix Required:** Implement database integration

### **3. Security & Cryptography Issues**

#### **IntelReport Hash Calculation** - HIGH PRIORITY ⚠️
- **File:** `src/pages/NetRunner/models/IntelReport.ts`
- **Issue:** Uses simple string concatenation instead of cryptographic hash (line 189)
- **Security Risk:** Data integrity cannot be verified
- **Fix Required:** Implement proper cryptographic hashing

#### **WorkflowEngine Code Execution** - CRITICAL PRIORITY 🚨
- **File:** `src/pages/NetRunner/integration/WorkflowEngine.ts`
- **Issue:** Unsafe code execution in step conditions (line 638)
- **Security Risk:** Arbitrary code execution vulnerability
- **Fix Required:** Implement sandboxed execution environment

### **4. Data Persistence Issues**

#### **No Database Integration** - MEDIUM PRIORITY ⚠️
- **Files:** All NetRunner components
- **Issue:** All data stored in memory, lost on refresh
- **Missing:** 
  - Workflow persistence
  - Monitoring target storage
  - User data persistence
  - Intel report storage
- **Fix Required:** Implement database layer

## 📋 Implementation Plan

### **Phase 1: Critical Security Fixes (Immediate)**
1. **WorkflowEngine Security** - Implement sandboxed execution
2. **IntelReport Cryptography** - Add real cryptographic hashing
3. **Input Validation** - Add comprehensive validation across all adapters

### **Phase 2: Real API Integrations (High Priority)**
1. **ShodanAdapter** - Replace mock with real Shodan API
2. **TheHarvesterAdapter** - Replace mock with real CLI integration  
3. **IntelAnalyzerAdapter** - Connect to actual IntelAnalyzer system

### **Phase 3: Data Persistence (Medium Priority)**
1. **Database Schema** - Design and implement database structure
2. **ORM Integration** - Add database abstraction layer
3. **Data Migration** - Convert in-memory data to persistent storage

### **Phase 4: Marketplace Integration (Medium Priority)**
1. **Payment Processing** - Implement real payment gateway
2. **Blockchain Integration** - Add real tokenization and smart contracts
3. **Transaction Management** - Real transaction processing and history

## 🔧 Technical Requirements

### **Dependencies Needed**
```json
{
  "axios": "^1.4.0",           // HTTP client for API calls
  "crypto": "node crypto",      // Cryptographic functions  
  "vm2": "^3.9.19",            // Sandboxed code execution
  "sqlite3": "^5.1.6",        // Database for development
  "bcrypt": "^5.1.0",          // Password hashing
  "jsonwebtoken": "^9.0.0"     // JWT tokens
}
```

### **Environment Variables Required**
```env
SHODAN_API_KEY=your_shodan_api_key
INTEL_ANALYZER_URL=http://localhost:3001
INTEL_ANALYZER_API_KEY=your_analyzer_key
DATABASE_URL=sqlite:./netrunner.db
JWT_SECRET=your_jwt_secret
PAYMENT_GATEWAY_KEY=your_payment_key
```

### **API Integrations Required**
1. **Shodan API** - Official Python/REST API
2. **theHarvester CLI** - Command-line integration
3. **IntelAnalyzer** - Internal service integration
4. **Payment Gateway** - Stripe/PayPal integration
5. **Blockchain RPC** - Ethereum/Polygon integration

## 🎯 Success Criteria

### **Phase 1 Complete When:**
- [ ] No eval() or unsafe code execution
- [ ] Cryptographic hashing implemented
- [ ] All inputs properly validated

### **Phase 2 Complete When:**
- [ ] Real Shodan data retrieved successfully
- [ ] Real theHarvester results processed
- [ ] Actual intel analysis performed

### **Phase 3 Complete When:**
- [ ] Data persists across browser refreshes
- [ ] User workflows saved to database
- [ ] Monitoring targets stored permanently

### **Phase 4 Complete When:**
- [ ] Real payments processed
- [ ] Intel tokenized on blockchain
- [ ] Transaction history tracked

## 🚀 Getting Started

### **Immediate Actions Required:**
1. **Security Audit** - Review WorkflowEngine execution safety
2. **API Key Setup** - Obtain real API keys for Shodan
3. **Environment Config** - Set up development environment variables
4. **Database Setup** - Initialize development database schema

### **Implementation Order:**
1. Start with **WorkflowEngine security fix** (critical)
2. Move to **ShodanAdapter real API** (high impact)
3. Add **database persistence** (foundation for everything else)
4. Complete **remaining adapter integrations**

This plan provides a clear roadmap to eliminate all mock data and implement real functionality across the NetRunner system.

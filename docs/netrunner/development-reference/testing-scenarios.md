# Testing Scenarios

## Test Environment Setup

### Prerequisites
- Development server running (`npm run dev`)
- All NetRunner services accessible
- Test targets available (httpbin.org, example.com, etc.)
- Browser dev tools open for monitoring

### Test Data Sources
- **Safe Testing URLs:**
  - `https://httpbin.org` - HTTP testing service
  - `https://example.com` - Basic example site
  - `https://httpstat.us/200` - Status code testing
  - `https://jsonplaceholder.typicode.com` - API testing

- **Error Testing URLs:**
  - `invalid-url` - Invalid URL format
  - `https://nonexistent-domain-12345.com` - Non-existent domain
  - `https://httpstat.us/500` - Server error simulation

## Phase 1: Center View Integration Tests

### Test 1.1: Basic Website Scanning

**Objective:** Verify basic website scanning functionality

**Steps:**
1. Navigate to NetRunner application
2. Ensure Center View is visible and responsive
3. Enter target: `https://httpbin.org`
4. Select "Basic Scan" mode
5. Click "SCAN" button

**Expected Results:**
- ✅ Scan button becomes disabled with "SCANNING..." text
- ✅ Progress bar appears with real-time updates (0-100%)
- ✅ Status messages update (e.g., "Establishing connection...", "Parsing HTML...")
- ✅ Source code appears in Monaco Editor with syntax highlighting
- ✅ Intel tab shows vulnerability and OSINT data
- ✅ Scan completes with status "Scan completed"

**Failure Conditions:**
- ❌ Mock timeout (3 seconds) instead of real scanning
- ❌ No source code display
- ❌ No progress updates
- ❌ Console errors related to missing services

### Test 1.2: Advanced OSINT Crawling

**Objective:** Verify advanced crawling functionality

**Steps:**
1. Enter target: `https://example.com`
2. Select "Deep Crawl" mode
3. Click "SCAN" button

**Expected Results:**
- ✅ Extended scanning time (30+ seconds)
- ✅ Progress updates with URL discovery counts
- ✅ Intel tab shows crawl intelligence data:
  - URLs discovered count
  - Admin panels found
  - API endpoints discovered
  - Hidden directories
- ✅ Right sidebar updates with crawl results

**Failure Conditions:**
- ❌ Same 3-second timeout as basic scan
- ❌ No discovery data in intel tab
- ❌ No updates to right sidebar

### Test 1.3: Source Code Display

**Objective:** Verify Monaco Editor integration

**Steps:**
1. Complete a successful scan of `https://httpbin.org`
2. Examine source code display area

**Expected Results:**
- ✅ Monaco Editor loads with dark theme
- ✅ HTML syntax highlighting active
- ✅ Line numbers visible
- ✅ Code is scrollable and readable
- ✅ Read-only mode (no editing possible)
- ✅ Minimap disabled for clean view

**Failure Conditions:**
- ❌ Plain text display instead of Monaco Editor
- ❌ No syntax highlighting
- ❌ Blank or placeholder text

### Test 1.4: Error Handling

**Objective:** Verify proper error handling

**Steps:**
1. Enter invalid target: `invalid-url`
2. Click "SCAN" button
3. Enter non-existent domain: `https://nonexistent-domain-12345.com`
4. Click "SCAN" button

**Expected Results:**
- ✅ Error message displays in red alert box
- ✅ Scan status changes to "Scan failed"
- ✅ Loading indicators stop
- ✅ Scan button re-enables for retry
- ✅ Error logged to console with proper context

**Failure Conditions:**
- ❌ No error message display
- ❌ App crash or frozen state
- ❌ Generic "scan failed" without details

## Phase 2: PowerTools Integration Tests

### Test 2.1: Tool Availability

**Objective:** Verify tools load from registry

**Steps:**
1. Open NetRunner left sidebar
2. Examine Scripts & PowerTools section

**Expected Results:**
- ✅ Tools display with proper icons
- ✅ Tool categories represented (Discovery, Analysis, etc.)
- ✅ Tool tooltips show name and description
- ✅ Tools respond to hover states

**Failure Conditions:**
- ❌ Empty or placeholder tools
- ❌ Missing tool descriptions
- ❌ Broken tool icons

### Test 2.2: Tool Execution

**Objective:** Verify tools actually execute

**Steps:**
1. Set target in center view: `example.com`
2. Click a Discovery tool (e.g., Shodan icon)
3. If parameter dialog appears, fill and submit
4. Monitor tool execution

**Expected Results:**
- ✅ Tool button shows executing state (progress bar)
- ✅ Tool execution doesn't block UI
- ✅ Tool completes with success indicator (green dot)
- ✅ Results appear in center view or right sidebar
- ✅ Multiple tools can execute concurrently

**Failure Conditions:**
- ❌ Tool only changes visual selection
- ❌ No execution progress indicators
- ❌ No results generated

### Test 2.3: Tool Error Handling

**Objective:** Verify tool error scenarios

**Steps:**
1. Execute tool with no target set
2. Execute tool requiring API key (without key)
3. Execute tool with invalid parameters

**Expected Results:**
- ✅ Clear error messages for each scenario
- ✅ Tool shows error state (red indicator)
- ✅ Error details in tooltip
- ✅ Other tools remain functional

**Failure Conditions:**
- ❌ Silent failures
- ❌ App crashes on tool errors
- ❌ Vague error messages

### Test 2.4: Tool Categories

**Objective:** Test different tool categories

**Test Matrix:**
- **Discovery Tools:** Shodan, theHarvester, SpiderFoot
- **Analysis Tools:** BuiltWith, ThreatMapper, Wappalyzer  
- **Scraping Tools:** DataSweeper, Beautiful Soup
- **Verification Tools:** VirusTotal, URLVoid

**Expected Results:**
- ✅ Each category executes with appropriate parameters
- ✅ Results format correctly for tool type
- ✅ Tool-specific capabilities function

## Phase 3: Bot Service Integration Tests

### Test 3.1: Bot Deployment

**Objective:** Verify bot deployment functionality

**Steps:**
1. Open NetRunner bottom bar (Bot Roster)
2. Select "WebSpider Alpha" bot
3. Click deploy/start button

**Expected Results:**
- ✅ Bot status changes to "active"
- ✅ Bot shows real uptime counter
- ✅ Tasks completed counter updates
- ✅ Bot appears in monitoring dashboard

**Failure Conditions:**
- ❌ Only visual status change
- ❌ Mock static data display
- ❌ No actual bot functionality

### Test 3.2: Bot Task Assignment

**Objective:** Verify bots can execute tasks

**Steps:**
1. Deploy multiple bots
2. Assign scanning task to WebSpider bot
3. Assign reconnaissance task to ReconBot
4. Monitor task execution

**Expected Results:**
- ✅ Bots execute assigned tasks
- ✅ Task progress visible in bot status
- ✅ Task results integrate with main interface
- ✅ Bot performance metrics update

### Test 3.3: Custom Bot Creation

**Objective:** Test custom bot functionality

**Steps:**
1. Click "Create Bot" button in bot roster
2. Fill bot configuration form
3. Deploy custom bot
4. Assign task to custom bot

**Expected Results:**
- ✅ Custom bot appears in roster
- ✅ Custom bot can execute tasks
- ✅ Custom bot shows proper status
- ✅ Custom bot can be deleted/modified

## Phase 4: Integration Flow Tests

### Test 4.1: End-to-End Workflow

**Objective:** Test complete NetRunner workflow

**Scenario:** Comprehensive domain investigation

**Steps:**
1. **Center View:** Start basic scan of `https://example.com`
2. **PowerTools:** Execute Shodan search on domain
3. **PowerTools:** Execute theHarvester email enumeration
4. **Bot Roster:** Deploy WebSpider for deep crawling
5. **Right Sidebar:** Monitor all results in real-time

**Expected Results:**
- ✅ All components work together seamlessly
- ✅ Results correlate across different tools
- ✅ No conflicts between concurrent operations
- ✅ Data flows properly between components
- ✅ Unified result display in right sidebar

### Test 4.2: AI Agent Coordination

**Objective:** Test AI agent functionality (if implemented)

**Steps:**
1. Set complex target requiring multiple approaches
2. Enable AI agent coordination
3. Let AI agent plan and execute strategy

**Expected Results:**
- ✅ AI agent analyzes target and creates plan
- ✅ AI agent deploys appropriate bots
- ✅ AI agent executes relevant tools
- ✅ AI agent coordinates resource usage
- ✅ AI agent adapts strategy based on results

### Test 4.3: Real-time Updates

**Objective:** Test live data streaming (if implemented)

**Steps:**
1. Start long-running scan/crawl operation
2. Monitor real-time updates across all components
3. Check update frequency and accuracy

**Expected Results:**
- ✅ Progress updates every 1-2 seconds
- ✅ Results appear immediately when discovered
- ✅ Status indicators update in real-time
- ✅ No UI lag or performance issues

## Performance Tests

### Test P.1: Large File Handling

**Steps:**
1. Scan website with very large HTML file (>1MB)
2. Monitor Monaco Editor performance
3. Check memory usage

**Expected Results:**
- ✅ Large files display without freezing
- ✅ Monaco Editor remains responsive
- ✅ Memory usage stays reasonable

### Test P.2: Concurrent Operations

**Steps:**
1. Execute 5+ tools simultaneously
2. Deploy multiple bots
3. Start advanced crawl operation
4. Monitor overall performance

**Expected Results:**
- ✅ UI remains responsive
- ✅ Operations don't interfere with each other
- ✅ No memory leaks or performance degradation

### Test P.3: Error Recovery

**Steps:**
1. Trigger various error conditions
2. Verify graceful recovery
3. Test continued functionality

**Expected Results:**
- ✅ Errors don't crash the application
- ✅ Failed operations can be retried
- ✅ Other operations continue normally

## Browser Compatibility Tests

### Test B.1: Cross-Browser Testing

**Browsers to Test:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Expected Results:**
- ✅ All functionality works across browsers
- ✅ Monaco Editor loads properly
- ✅ WebSocket connections work (if implemented)
- ✅ No browser-specific errors

## Security Tests

### Test S.1: Input Validation

**Steps:**
1. Test various malicious inputs
2. Test XSS prevention
3. Test CORS handling

**Expected Results:**
- ✅ Malicious inputs properly sanitized
- ✅ No XSS vulnerabilities
- ✅ CORS proxy security maintained

## Regression Test Checklist

After each update, verify:
- [ ] Basic scanning still works
- [ ] Source code display functional
- [ ] Tool execution working
- [ ] Bot deployment successful
- [ ] Error handling intact
- [ ] Performance acceptable
- [ ] No console errors
- [ ] All components responsive

## Test Automation Scripts

### Quick Integration Test
```bash
# Run in browser console
window.netrunnerTests = {
  async basicScan() {
    // Simulate basic scan test
    console.log('Testing basic scan...');
    // Implementation
  },
  
  async toolExecution() {
    // Test tool execution
    console.log('Testing tool execution...');
    // Implementation
  }
};

// Run all tests
Object.values(window.netrunnerTests).forEach(test => test());
```

### Performance Monitoring
```javascript
// Monitor component performance
const perfObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('netrunner')) {
      console.log(`${entry.name}: ${entry.duration}ms`);
    }
  });
});
perfObserver.observe({ entryTypes: ['measure'] });
```

---

**Test Priority:** Phase 1 → Phase 2 → Phase 3 → Phase 4

**Critical Tests:** 1.1, 1.3, 1.4, 2.2, 4.1

**Performance Baseline:** All operations < 100ms UI response time

**Success Criteria:** 95% of tests passing, no critical failures

---
*Comprehensive testing scenarios for NetRunner integration validation*

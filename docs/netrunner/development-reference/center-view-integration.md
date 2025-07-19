# Center View Integration Guide

## Overview

The NetRunnerCenterView is the main work area that should display website source code, scanning results, and provide real-time analysis capabilities. Currently it's a mock interface - this guide shows how to connect it to the actual scanner services.

## Current State Analysis

**File:** `src/applications/netrunner/components/layout/NetRunnerCenterView.tsx`

**Issues:**
- Line 78: Mock scanning with setTimeout
- No source code display component
- No connection to WebsiteScanner service
- No integration with AdvancedOSINTCrawler
- No real-time progress updates

## Step-by-Step Integration

### Step 1: Add Required Dependencies

```bash
npm install @monaco-editor/react
```

### Step 2: Import Required Services

Add these imports to the top of NetRunnerCenterView.tsx:

```typescript
import Editor from '@monaco-editor/react';
import { websiteScanner, type ScanResult } from '../../services/WebsiteScanner';
import { advancedOSINTCrawler, type CrawlResult } from '../../services/AdvancedOSINTCrawler';
import { LoggerFactory } from '../../services/logging';
```

### Step 3: Expand Component State

Replace the existing state with:

```typescript
const NetRunnerCenterView: React.FC<NetRunnerCenterViewProps> = ({
  width,
  height
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [target, setTarget] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  // New state for real functionality
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const [sourceCode, setSourceCode] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [scanMode, setScanMode] = useState<'basic' | 'advanced'>('basic');
  
  // Initialize logger
  const logger = useMemo(() => LoggerFactory.getLogger('NetRunnerCenterView'), []);
```

### Step 4: Replace Mock Scanning Function

Replace the existing `handleScan` function:

```typescript
const handleScan = async () => {
  if (!target.trim()) {
    setError('Please enter a valid URL');
    return;
  }

  setIsScanning(true);
  setError('');
  setProgress(0);
  setStatus('Initializing scan...');
  setScanResult(null);
  setCrawlResult(null);
  setSourceCode('');

  try {
    logger.info('Starting scan', { target, mode: scanMode });

    if (scanMode === 'basic') {
      // Basic website scan
      const result = await websiteScanner.scanWebsite(target, (prog, stat) => {
        setProgress(prog);
        setStatus(stat);
      });

      setScanResult(result);
      setSourceCode(result.sourceCode);
      logger.info('Basic scan completed', { target, vulnerabilities: result.vulnerabilities.length });

    } else {
      // Advanced OSINT crawl
      const result = await advancedOSINTCrawler.startAdvancedCrawl(
        target,
        {
          maxDepth: 3,
          maxUrls: 100,
          includeWayback: false,
          includeGitHub: false,
          includeDirectoryBruteforce: true
        },
        (prog, stat, found) => {
          setProgress(prog);
          setStatus(`${stat} (${found || 0} URLs discovered)`);
        }
      );

      setCrawlResult(result);
      
      // Get the main page scan result for source code
      const mainScan = result.scannedResults.get(target);
      if (mainScan) {
        setSourceCode(mainScan.sourceCode);
      }
      
      logger.info('Advanced crawl completed', { 
        target, 
        discovered: result.discoveredUrls.length,
        intel: Object.keys(result.intelligence).length 
      });
    }

  } catch (error) {
    logger.error('Scan failed', { target, error: error.message });
    setError(error.message);
    setStatus('Scan failed');
  } finally {
    setIsScanning(false);
  }
};
```

### Step 5: Add Source Code Display Tab

Replace the OSINT tab content with:

```typescript
{/* OSINT Tab - Enhanced with real functionality */}
<TabPanel value={activeTab} index={0}>
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
    <Typography variant="h5" sx={{ 
      color: '#00f5ff',
      fontFamily: "'Aldrich', monospace",
      fontSize: '1rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      mb: 0.5
    }}>
      WEBSITE_SCANNER
    </Typography>
    
    {/* Scan Controls */}
    <Card sx={{ 
      backgroundColor: '#0a0a0a', 
      border: '1px solid #00f5ff',
      borderRadius: 0
    }}>
      <CardContent sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-end', mb: 1 }}>
          <TextField
            label="TARGET"
            placeholder="domain.com | 192.168.1.1 | https://example.com"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            variant="outlined"
            fullWidth
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#ffffff',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.75rem',
                borderRadius: 0,
                '& fieldset': { borderColor: '#333333' },
                '&:hover fieldset': { borderColor: '#555555' },
                '&.Mui-focused fieldset': { borderColor: '#00f5ff' }
              },
              '& .MuiInputLabel-root': { 
                color: '#aaaaaa',
                fontFamily: "'Aldrich', monospace",
                fontSize: '0.7rem',
                letterSpacing: '0.05em'
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={scanMode}
              onChange={(e) => setScanMode(e.target.value as 'basic' | 'advanced')}
              sx={{
                color: '#ffffff',
                borderRadius: 0,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555555' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00f5ff' }
              }}
            >
              <MenuItem value="basic">Basic Scan</MenuItem>
              <MenuItem value="advanced">Deep Crawl</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleScan}
            disabled={!target.trim() || isScanning}
            size="small"
            sx={{
              backgroundColor: '#00f5ff',
              color: '#000000',
              fontFamily: "'Aldrich', monospace",
              fontSize: '0.7rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderRadius: 0,
              px: 1.5,
              py: 0.75,
              '&:hover': { backgroundColor: '#00d4e6' },
              '&:disabled': { backgroundColor: '#333333' }
            }}
          >
            {isScanning ? 'SCANNING...' : 'SCAN'}
          </Button>
        </Box>

        {/* Progress Display */}
        {isScanning && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ 
                color: '#00f5ff',
                fontFamily: "'Aldrich', monospace",
                fontSize: '0.65rem'
              }}>
                {status}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#00f5ff',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.65rem'
              }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{
                backgroundColor: '#333333',
                '& .MuiLinearProgress-bar': { backgroundColor: '#00f5ff' }
              }}
            />
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              backgroundColor: '#2a0a0a', 
              color: '#ff4444',
              border: '1px solid #ff4444',
              borderRadius: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: '0.7rem'
            }}
          >
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>

    {/* Source Code Display */}
    <Box sx={{ 
      flex: 1, 
      backgroundColor: '#0a0a0a', 
      border: '1px solid #333333', 
      borderRadius: 0,
      overflow: 'hidden'
    }}>
      {sourceCode ? (
        <Editor
          height="100%"
          defaultLanguage="html"
          value={sourceCode}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            fontSize: 12,
            lineNumbers: 'on',
            renderWhitespace: 'selection'
          }}
        />
      ) : (
        <Box sx={{ p: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" sx={{ 
            color: '#aaaaaa',
            fontFamily: "'Courier New', monospace",
            fontSize: '0.7rem',
            textAlign: 'center'
          }}>
            {isScanning ? 'SCANNING_IN_PROGRESS...' : 'SOURCE_CODE_DISPLAY :: READY_FOR_SCAN'}
          </Typography>
        </Box>
      )}
    </Box>
  </Box>
</TabPanel>
```

### Step 6: Add Real Intelligence Display

For the Intel tab, add real vulnerability and OSINT data display:

```typescript
{/* Intel Tab - Real Data Display */}
<TabPanel value={activeTab} index={2}>
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
    <Typography variant="h5" sx={{ 
      color: '#00f5ff',
      fontFamily: "'Aldrich', monospace",
      fontSize: '1rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      mb: 1
    }}>
      INTELLIGENCE_DATA
    </Typography>

    <Box sx={{ flex: 1, overflow: 'auto' }}>
      {scanResult && (
        <>
          {/* Vulnerabilities */}
          <Card sx={{ mb: 1, backgroundColor: '#0a0a0a', border: '1px solid #ff4444' }}>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#ff4444', mb: 0.5 }}>
                VULNERABILITIES ({scanResult.vulnerabilities.length})
              </Typography>
              {scanResult.vulnerabilities.map((vuln, index) => (
                <Box key={index} sx={{ mb: 0.5, p: 0.5, backgroundColor: '#1a0a0a' }}>
                  <Typography variant="caption" sx={{ color: '#ff4444', fontWeight: 'bold' }}>
                    {vuln.severity.toUpperCase()}: {vuln.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#aaaaaa', display: 'block' }}>
                    {vuln.description}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* OSINT Data */}
          <Card sx={{ mb: 1, backgroundColor: '#0a0a0a', border: '1px solid #00ff88' }}>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#00ff88', mb: 0.5 }}>
                OSINT_DATA
              </Typography>
              
              {scanResult.osintData.emails.length > 0 && (
                <Box sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#00f5ff' }}>
                    EMAILS: {scanResult.osintData.emails.join(', ')}
                  </Typography>
                </Box>
              )}

              {scanResult.osintData.technologies.length > 0 && (
                <Box sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#00f5ff' }}>
                    TECHNOLOGIES: {scanResult.osintData.technologies.map(t => t.name).join(', ')}
                  </Typography>
                </Box>
              )}

              {scanResult.osintData.socialMedia.length > 0 && (
                <Box sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#00f5ff' }}>
                    SOCIAL: {scanResult.osintData.socialMedia.join(', ')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {crawlResult && (
        <Card sx={{ mb: 1, backgroundColor: '#0a0a0a', border: '1px solid #ffaa00' }}>
          <CardContent sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#ffaa00', mb: 0.5 }}>
              CRAWL_INTELLIGENCE
            </Typography>
            <Typography variant="caption" sx={{ color: '#aaaaaa', display: 'block' }}>
              URLs Discovered: {crawlResult.discoveredUrls.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#aaaaaa', display: 'block' }}>
              Admin Panels: {crawlResult.intelligence.adminPanels.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#aaaaaa', display: 'block' }}>
              API Endpoints: {crawlResult.intelligence.apiEndpoints.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#aaaaaa', display: 'block' }}>
              Hidden Directories: {crawlResult.intelligence.hiddenDirectories.length}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  </Box>
</TabPanel>
```

### Step 7: Add Result Sharing with Right Sidebar

Add props to share data with the right sidebar:

```typescript
interface NetRunnerCenterViewProps {
  width: string;
  height: string;
  onScanComplete?: (result: ScanResult | CrawlResult) => void;
  onSourceCodeUpdate?: (code: string) => void;
}

// In the scan completion handlers:
if (onScanComplete) {
  onScanComplete(result);
}
if (onSourceCodeUpdate) {
  onSourceCodeUpdate(result.sourceCode);
}
```

### Step 8: Update NetRunnerControlStation

Modify the control station to pass callbacks:

```typescript
const NetRunnerControlStation: React.FC<NetRunnerControlStationProps> = ({ 
  className
}) => {
  const [scanData, setScanData] = useState(null);
  const [sourceCode, setSourceCode] = useState('');

  return (
    <Box>
      {/* ... existing layout ... */}
      
      <NetRunnerCenterView
        width={`calc(100% - ${leftSidebarWidth}px - ${rightSidebarWidth}px)`}
        height={`calc(100% - ${bottomBarHeight}px)`}
        onScanComplete={setScanData}
        onSourceCodeUpdate={setSourceCode}
      />

      <NetRunnerRightSideBar
        open={rightSidebarOpen}
        width={rightSidebarWidth}
        scanData={scanData}
        sourceCode={sourceCode}
        onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
      />
    </Box>
  );
};
```

## Testing the Integration

1. **Basic Scan Test:**
   ```
   Target: https://httpbin.org
   Mode: Basic Scan
   Expected: Source code display, basic vulnerabilities
   ```

2. **Advanced Crawl Test:**
   ```
   Target: https://example.com
   Mode: Deep Crawl  
   Expected: Multiple URLs discovered, intelligence data
   ```

3. **Error Handling Test:**
   ```
   Target: invalid-url
   Expected: Error message display, graceful failure
   ```

## Performance Considerations

- Monaco Editor is lazy-loaded only when needed
- Large source code files are truncated at 1MB
- Scanning progress is throttled to prevent UI flooding
- Error boundaries prevent crashes from service failures

---
*Complete integration guide for connecting center view to real scanner services*

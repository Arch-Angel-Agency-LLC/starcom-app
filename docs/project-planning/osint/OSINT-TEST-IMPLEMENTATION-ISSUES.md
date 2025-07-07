# OSINT Test Implementation Issues and Resolutions

## Overview

During the implementation of comprehensive tests for the OSINT error handling system, several issues were encountered. This document outlines these issues and provides resolution steps for the development team.

## Issues and Resolutions

### 1. ResultsPanel Test Issues

**Issue**: The `panelId` prop is required in the ResultsPanel component, but was not included in the tests.

**Resolution**: Update all tests to include the required `panelId` prop:

```tsx
// Before
render(<ResultsPanel data={{ query: 'test query' }} />);

// After
render(<ResultsPanel data={{ query: 'test query' }} panelId="results-panel-1" />);
```

### 2. React Hooks Testing Approach for React 18

**Issue**: The `@testing-library/react-hooks` package is not compatible with React 18+, which is used in this project (React 18.3.1).

**Resolution**: Instead of using `@testing-library/react-hooks`, use the modern approach for testing hooks with React 18+:

```tsx
// Before (React 16/17 approach with @testing-library/react-hooks)
import { renderHook } from '@testing-library/react-hooks';
const { result } = renderHook(() => useMyHook());

// After (React 18+ approach with standard React Testing Library)
import { renderHook } from '@testing-library/react';
const { result } = renderHook(() => useMyHook());
```

This requires:
```bash
npm install --save-dev @testing-library/react
```

The native React Testing Library now includes the functionality previously provided by react-hooks testing library.

## React 18 Hook Testing Migration Guide

If you're seeing errors related to `waitForNextUpdate` in your tests, here's a comprehensive migration guide for updating to React 18 hook testing:

### Importing from React Testing Library

```tsx
// Before (React 16/17)
import { renderHook, act } from '@testing-library/react-hooks';

// After (React 18+)
import { renderHook, act, waitFor } from '@testing-library/react';
import { expect, jest, describe, it, beforeEach } from '@jest/globals'; // Add if needed
```

### Waiting for Hook Updates

```tsx
// Before (React 16/17)
const { result, waitForNextUpdate } = renderHook(() => useMyHook());
await waitForNextUpdate();

// After (React 18+)
const { result } = renderHook(() => useMyHook());
await waitFor(() => {
  // Add an expectation that will be true when the async operation completes
  expect(result.current.loading).toBe(false); 
  // Or check for some other state change that indicates completion
});
```

### Properly Typing Jest Mocks

```tsx
// Before
const mockFn = jest.fn();

// After (with better typing)
const mockFn = jest.fn().mockImplementation(() => Promise.resolve([]));
```

### Running Multiple Updates

```tsx
// Before
await waitForNextUpdate();
act(() => { /* do something */ });
await waitForNextUpdate();

// After
await waitFor(() => { /* check for first update completion */ });
act(() => { /* do something */ });
await waitFor(() => { /* check for second update completion */ });
```

This approach ensures compatibility with React 18's concurrent rendering features.

### 3. Type Issues with Search Results

**Issue**: The type 'person' is not assignable to the expected result types in the SearchResult interface.

**Resolution**: Update the mock data in tests to use the correct types as defined in the application:

```tsx
// Before
type: 'person',

// After
type: 'entity', // Use the valid types from the SearchResult interface
```

### 4. Jest Configuration Issues

**Issue**: The project has multiple Jest configuration files (`jest.config.js` and `jest.config.ts`) which causes confusion when running tests.

**Resolution**: Specify which config file to use when running Jest:

```bash
# Use the TypeScript config which already has CSS module handling
npx jest --config=jest.config.ts
```

Alternatively, remove one of the config files to avoid the conflict. The `jest.config.ts` file already includes the CSS module handling:

```typescript
moduleNameMapper: {
  '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports
},
```

### 5. OPSEC Panel Import Issue

**Issue**: The OPSECPanel component import is failing.

**Resolution**: Verify that the component exists at the specified path and fix any path issues:

```tsx
// Check if the correct path is:
import OPSECPanel from '../components/panels/OPSECPanel';
// Or if it should be:
import OPSECPanel from '../../components/panels/OPSECPanel';
```

### 6. Multiple Jest Configuration Files

**Issue**: There are both `jest.config.js` and `jest.config.ts` files in the project, causing confusion about which configuration is used when running tests.

**Resolution**: Standardize on the TypeScript-based configuration file, which is more modern and provides better type safety:

```bash
# Run tests with the TypeScript config explicitly
npm test -- --config=jest.config.ts
```

The TypeScript configuration (`jest.config.ts`) is more complete and includes CSS module handling. Consider removing `jest.config.js` to avoid confusion.

### 7. CSS Module Type Declarations

**Issue**: TypeScript errors related to CSS modules (TS2307: Cannot find module '*.module.css' or its corresponding type declarations).

**Resolution**: There are two approaches to resolve this:

1. **Add type declarations for CSS modules**:
   Create a file `src/types/global.d.ts` with:

   ```typescript
   declare module '*.module.css' {
     const classes: { [key: string]: string };
     export default classes;
   }
   ```

2. **Configure Jest to properly handle CSS modules**:
   Ensure the TypeScript Jest configuration includes:

   ```typescript
   // In jest.config.ts
   moduleNameMapper: {
     '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
   },
   ```

   And install the required package:
   ```bash
   npm install --save-dev identity-obj-proxy
   ```

The first approach is recommended for general development, while the second is specifically for testing.

### 8. Implementation Status Summary

Based on a thorough audit of the existing code, the following items from this document still need to be implemented:

1. **Remove duplicate Jest config file**: The project contains both `jest.config.js` and `jest.config.ts`. Remove `jest.config.js` and standardize on the TypeScript version.

2. **Update all useOSINTSearch.test.tsx references**: The hook tests still use the outdated `@testing-library/react-hooks` approach. Update all instances to use the React 18 approach documented above.

3. **Check all ResultsPanel test files**: Ensure that all test files using ResultsPanel include the required panelId prop.

4. **Verify all mock data types**: Ensure all mock data in tests uses the correct types (e.g., 'entity' instead of 'person').

5. **Install identity-obj-proxy**: Ensure this package is installed for proper CSS module handling in tests:
   ```bash
   npm install --save-dev identity-obj-proxy
   ```

Implementation priority should be:
1. First fix configuration issues (Jest config, global.d.ts for CSS modules)
2. Then update hook testing approach
3. Finally fix component test issues (panelId, mock data types)

## Implementation Progress

The following fixes have been implemented:

1. ✅ **Created CSS Module type declarations**: Added `src/types/global.d.ts` with proper type declarations for CSS modules and other assets.

2. ✅ **Standardized Jest configuration**: Removed duplicate `jest.config.js` and standardized on `jest.config.ts`.

3. ✅ **Installed identity-obj-proxy**: Added this package for proper CSS module handling in tests.

4. ✅ **Fixed some type issues**: Updated several instances of `type: 'person'` to `type: 'entity'` in tests.

5. ✅ **Added panelId prop to ResultsPanel integration test**: Updated integration test to include the required prop.

6. ✅ **Created automation script**: Added `scripts/fix-osint-test-issues.sh` to automatically detect and fix common issues.

7. ✅ **Documented React 18 hook testing approach**: Added comprehensive migration guide for updating from `@testing-library/react-hooks` to the React 18 approach.

### Still To Do:

1. ❌ **Update useOSINTSearch.test.tsx**: Need to fully update the hook test file to use React 18 testing approach.

2. ❌ **Check remaining ResultsPanel tests**: Verify all instances include the panelId prop.

3. ❌ **Run full test suite**: Execute tests with `npm test -- --config=jest.config.ts` to validate all fixes.

The most critical infrastructure issues have been resolved, and the remaining tasks are well-documented with clear steps to follow.

## Implementation Strategy

Due to the complexity of the application and the need for careful integration of tests, the following approach is recommended:

1. **Incremental Testing**: Address one component at a time, starting with ErrorDisplay, then searchService, useOSINTSearch, and finally ResultsPanel.

2. **Mock Dependencies**: Use extensive mocking to isolate components during testing.

3. **Type Consistency**: Ensure mock data matches the exact types defined in the application.

4. **Configuration First**: Resolve all configuration issues (CSS modules, paths) before attempting to run tests.

## Next Steps

1. Update test files to address the identified issues
2. Install missing dependencies
3. Configure Jest properly for the project structure
4. Run tests incrementally to validate fixes

Once these issues are resolved, the comprehensive test suite will provide robust validation for the error handling system.

## Action Plan and Automation

To simplify the implementation of these fixes, a helper script has been created: `scripts/fix-osint-test-issues.sh`. This script:

1. Removes the duplicate Jest config file
2. Installs the identity-obj-proxy package if missing
3. Creates or verifies the CSS module type declarations
4. Checks for React Hooks Testing Library compatibility issues
5. Finds ResultsPanel test files to review
6. Identifies any 'person' type occurrences that need to be updated to 'entity'

### Running the Script

```bash
cd /Users/jono/Documents/GitHub/starcom-app/dapp
./scripts/fix-osint-test-issues.sh
```

### Manual Steps After Running the Script

1. Update the `useOSINTSearch.test.tsx` file:
   - Replace `import { renderHook, act } from '@testing-library/react-hooks';` 
   - With `import { renderHook, act, waitFor } from '@testing-library/react';`
   - Replace all instances of `waitForNextUpdate` with `waitFor`

2. Check all ResultsPanel test files to ensure they include the panelId prop:
   ```tsx
   <ResultsPanel data={{ query: 'test query' }} panelId="results-panel-1" />
   ```

3. Run the tests with the TypeScript config:
   ```bash
   npm test -- --config=jest.config.ts
   ```

4. Update any remaining type issues identified by the tests

This combination of automated and manual steps will ensure a smooth transition to a fully functional test suite.

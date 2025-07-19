# NetRunner System TypeScript Fixes

## Overview

This document outlines TypeScript compatibility issues encountered during the development of the NetRunner system and the solutions implemented to resolve them.

## Issues Addressed

1. **JSX Compilation Issues**: 
   - Problem: TypeScript compiler was not properly configured to handle JSX syntax in `.tsx` files.
   - Solution: Ensure the `--jsx react-jsx` flag is set in the TypeScript configuration.

2. **Module Import Issues**: 
   - Problem: Default imports from CommonJS modules (using `export =`) were failing.
   - Solution: Enable `esModuleInterop` flag in TypeScript configuration.

3. **MUI Component Prop Type Issues**:
   - Problem: MUI Grid and ListItem components required specific prop formats that weren't compatible with our TypeScript version.
   - Solution: Created wrapper components (`GridWrapper.tsx` and `ListItemWrapper.tsx`) that properly handle the props for these components.

4. **Type Definition Conflicts**:
   - Problem: Conflicts between Jest and Mocha type definitions in node_modules.
   - Solution: Use `skipLibCheck` flag when compiling to avoid errors from library definitions.

## Component Wrappers

### GridWrapper

The `GridWrapper` component handles compatibility issues with the MUI Grid component. Use this instead of directly using MUI Grid in NetRunner components.

```tsx
import GridWrapper from '../components/GridWrapper';

// Instead of:
<Grid item xs={12} md={6}>...</Grid>

// Use:
<GridWrapper item xs={12} md={6}>...</GridWrapper>
```

### ListItemWrapper

The `ListItemWrapper` component handles compatibility issues with the MUI ListItem component. Use this instead of directly using MUI ListItem in NetRunner components.

```tsx
import ListItemWrapper from '../components/ListItemWrapper';

// Instead of:
<ListItem button onClick={handleClick}>...</ListItem>

// Use:
<ListItemWrapper button onClick={handleClick}>...</ListItemWrapper>
```

## TypeScript Configuration

When developing NetRunner components, ensure your TypeScript compilation includes these flags:

```bash
tsc --jsx react-jsx --esModuleInterop --skipLibCheck
```

Or in your tsconfig.json:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## Testing NetRunner Components

Use the `test-netrunner-tools.sh` script to verify that NetRunner components compile correctly. This script checks file existence and performs TypeScript compilation with the correct flags.

```bash
./test-netrunner-tools.sh
```

## Future Development

When adding new NetRunner components:

1. Use the provided wrapper components for MUI Grid and ListItem
2. Import React with `import React from 'react'` and ensure esModuleInterop is enabled
3. Test compilation with the test script before committing changes
4. Consider creating additional wrapper components for other MUI components if similar issues arise

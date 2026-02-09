# Terminal Command Optimization Guide
## VS Code + Copilot + macOS Best Practices

**Date**: July 10, 2025  
**Purpose**: Optimize terminal command execution for NetRunner development

## 🚨 Common Issues & Solutions

### Issue 1: Quote Escaping Problems
```bash
# ❌ PROBLEMATIC (causes cmdand dquote> prompt):
echo "✅ Build successful || echo "❌ Build failed"

# ✅ SOLUTION:
echo "✅ Build successful" || echo "❌ Build failed"

# or using single quotes:
echo '✅ Build successful' || echo '❌ Build failed'

# or escaping properly:
echo "✅ Build successful" || echo "❌ Build failed"
```

### Issue 2: Complex Command Chaining
```bash
# ❌ PROBLEMATIC:
cd /path && npm run build > /dev/null 2>&1 && echo "success" || echo "failed"

# ✅ SOLUTION - Break into steps:
cd /Users/jono/Documents/GitHub/starcom-app
npm run build
if [ $? -eq 0 ]; then echo "✅ Build successful"; else echo "❌ Build failed"; fi
```

### Issue 3: macOS zsh Shell Specifics
```bash
# ✅ ZSH-FRIENDLY patterns:
npm run build && echo "✅ Success" || echo "❌ Failed"

# ✅ Better error handling:
if npm run build; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed with exit code $?"
fi

# ✅ Using zsh-specific features:
npm run build
local exit_code=$?
[[ $exit_code -eq 0 ]] && echo "✅ Success" || echo "❌ Failed ($exit_code)"
```

## 🛠️ VS Code Integration Improvements

### 1. Use Tasks Instead of Raw Commands
Press `Cmd+Shift+P` → "Tasks: Run Task" → Select NetRunner tasks

### 2. Keyboard Shortcuts
Add to `keybindings.json`:
```json
[
  {
    "key": "cmd+shift+b",
    "command": "workbench.action.tasks.runTask",
    "args": "NetRunner: Build Check"
  },
  {
    "key": "cmd+shift+t", 
    "command": "workbench.action.tasks.runTask",
    "args": "Starcom: Type Check"
  }
]
```

### 3. Terminal Profiles
Add to VS Code settings.json:
```json
{
  "terminal.integrated.profiles.osx": {
    "NetRunner Dev": {
      "path": "zsh",
      "args": ["-l"],
      "env": {
        "NODE_ENV": "development",
        "VITE_DEV_MODE": "true"
      }
    }
  },
  "terminal.integrated.defaultProfile.osx": "NetRunner Dev"
}
```

## 🎯 Copilot Terminal Best Practices

### For AI Assistants:
1. **Use simple, atomic commands**
2. **Avoid complex chaining**
3. **Use proper quoting**
4. **Test commands in small steps**
5. **Prefer tasks over raw terminal commands**

### Command Templates:
```bash
# ✅ Build check template:
npm run build

# ✅ Type check template:
npx tsc --noEmit --project tsconfig.starcom.json

# ✅ Status check template:
echo "Checking NetRunner components..."
find src/applications/netrunner -name "*.tsx" -type f | wc -l

# ✅ Error check template:
npx tsc --noEmit | grep -E "(error|Error)" || echo "No TypeScript errors found"
```

## 🔧 Automated Solutions

### Shell Functions (add to ~/.zshrc):
```bash
# NetRunner development helpers
function nr-build() {
    echo "🔨 Building NetRunner..."
    cd /Users/jono/Documents/GitHub/starcom-app
    npm run build
    if [ $? -eq 0 ]; then
        echo "✅ Build successful"
    else
        echo "❌ Build failed"
        return 1
    fi
}

function nr-typecheck() {
    echo "🔍 Type checking NetRunner..."
    cd /Users/jono/Documents/GitHub/starcom-app
  npx tsc --noEmit --project tsconfig.starcom.json
}

function nr-status() {
    echo "📊 NetRunner Status:"
    echo "Components: $(find src/applications/netrunner/components -name "*.tsx" | wc -l | tr -d ' ')"
    echo "Services: $(find src/applications/netrunner/services -name "*.ts" | wc -l | tr -d ' ')"
    echo "Types: $(find src/applications/netrunner/types -name "*.ts" | wc -l | tr -d ' ')"
}
```

### VS Code Snippets
Add to TypeScript snippets:
```json
{
  "NetRunner Component": {
    "prefix": "nr-component",
    "body": [
      "/**",
      " * NetRunner ${1:ComponentName}",
      " * ",
      " * ${2:Description}",
      " * ",
      " * @author GitHub Copilot",
      " * @date ${CURRENT_DATE}",
      " */",
      "",
      "import React from 'react';",
      "import { Box } from '@mui/material';",
      "",
      "interface ${1:ComponentName}Props {",
      "  ${3:// Props here}",
      "}",
      "",
      "const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({",
      "  ${4:// Destructured props}",
      "}) => {",
      "  return (",
      "    <Box sx={{ p: 2 }}>",
      "      ${5:// Component content}",
      "    </Box>",
      "  );",
      "};",
      "",
      "export default ${1:ComponentName};"
    ],
    "description": "Create a new NetRunner component"
  }
}
```

## 📋 Quick Reference Commands

### Safe Commands for AI Use:
```bash
# Build check (simple):
npm run build

# Type check:
npx tsc --noEmit

# Component count:
find src/applications/netrunner -name "*.tsx" | wc -l

# Service count:
find src/applications/netrunner -name "*.ts" | grep -v ".test.ts" | wc -l

# Error search:
npx tsc --noEmit 2>&1 | grep -i error

# File status:
ls -la src/applications/netrunner/components/layout/
```

### Status Checks:
```bash
# Git status:
git status --porcelain

# Node modules check:
ls node_modules/.bin/tsc > /dev/null && echo "✅ TypeScript available" || echo "❌ TypeScript missing"

# Package.json scripts:
npm run --silent 2>/dev/null | grep -E "(build|dev|test)"
```

## 🎯 Implementation for This Session

Based on the successful build, here's what we accomplished:

1. ✅ **Fixed all TypeScript errors** in layout components
2. ✅ **Removed unused imports** and variables  
3. ✅ **Created functional modular layout** system
4. ✅ **Verified build success** with clean compilation

### Next Steps:
1. Use VS Code tasks instead of complex terminal commands
2. Test the NetRunner Control Station in development mode
3. Implement the layout components integration
4. Add keyboard shortcuts for common operations

### Lesson Learned:
- Simple atomic commands work better than complex chained ones
- Always test command syntax before running in production
- Use VS Code tasks for repeated operations
- Break complex operations into smaller steps

---

**Status**: ✅ Terminal optimization strategies implemented  
**Build Status**: ✅ Successful (5,382.28 kB main bundle)  
**TypeScript**: ✅ No compilation errors  
**NetRunner Layout**: ✅ Ready for integration testing

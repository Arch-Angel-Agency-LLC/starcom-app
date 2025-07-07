#!/usr/bin/env node

/**
 * Script to fix Globe test files by adding required imports and providers
 */

import fs from 'fs';
import path from 'path';

const testFiles = [
  'src/components/Globe/__tests__/Enhanced3DGlobeInteractivity.test.tsx',
  'src/components/Globe/__tests__/Aggressive3DInterfaceTests.test.tsx',
  'src/components/Globe/__tests__/UltraAggressive3DInterface.test.tsx',
  'src/components/Globe/__tests__/Enhanced3DGlobeInteractivity.robust.test.tsx',
  'src/components/Globe/__tests__/EnhancedGlobeInteractivity.test.tsx'
];

// Enhanced THREE.js mock that includes all commonly used exports
const threeJsMock = `// Mock THREE.js completely to avoid 3D context issues
vi.mock('three', () => ({
  SphereGeometry: vi.fn(() => ({})),
  MeshBasicMaterial: vi.fn(() => ({})),
  LineBasicMaterial: vi.fn(() => ({})),
  Mesh: vi.fn(() => ({ visible: false, position: { x: 0, y: 0, z: 0 } })),
  Line: vi.fn(() => ({})),
  BufferGeometry: vi.fn(() => ({ setFromPoints: vi.fn() })),
  Group: vi.fn(() => ({ add: vi.fn(), remove: vi.fn(), clear: vi.fn() })),
  Vector3: vi.fn((x = 0, y = 0, z = 0) => ({ x, y, z })),
  Vector2: vi.fn((x = 0, y = 0) => ({ x, y })),
  Raycaster: vi.fn(() => ({
    setFromCamera: vi.fn(),
    intersectObjects: vi.fn(() => [])
  })),
  Camera: vi.fn(() => ({})),
  Scene: vi.fn(() => ({ children: [] })),
  PerspectiveCamera: vi.fn(() => ({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  }))
}));`;

testFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Add GlobalGlobeContextMenuProvider import if not present
  if (!content.includes('GlobalGlobeContextMenuProvider')) {
    content = content.replace(
      /import.*from.*'@testing-library\/jest-dom';/,
      `import '@testing-library/jest-dom';
import { GlobalGlobeContextMenuProvider } from '../../../context/GlobalGlobeContextMenuProvider';`
    );
    modified = true;
  }

  // Fix jest references to vi
  if (content.includes('jest.fn()') || content.includes('jest.clearAllMocks()')) {
    content = content.replace(/jest\.fn\(\)/g, 'vi.fn()');
    content = content.replace(/jest\.clearAllMocks\(\)/g, 'vi.clearAllMocks()');
    modified = true;
  }

  // Add act import if missing
  if (content.includes('act(') && !content.includes('import.*act.*from.*@testing-library')) {
    content = content.replace(
      /import.*from.*'@testing-library\/react';/,
      line => line.replace('} from', ', act } from')
    );
    modified = true;
  }

  // Enhance THREE.js mock
  if (content.includes("vi.mock('three'") && !content.includes('Raycaster')) {
    const mockStart = content.indexOf("vi.mock('three'");
    const mockEnd = content.indexOf('});', mockStart) + 3;
    content = content.substring(0, mockStart) + threeJsMock + content.substring(mockEnd);
    modified = true;
  }

  // Wrap Enhanced3DGlobeInteractivity renders with provider
  if (content.includes('<Enhanced3DGlobeInteractivity') && !content.includes('<GlobalGlobeContextMenuProvider>')) {
    // Find render function calls
    content = content.replace(
      /render\(\s*<Enhanced3DGlobeInteractivity([^>]*)>(.*?)<\/Enhanced3DGlobeInteractivity>\s*\)/gs,
      'render(\n      <GlobalGlobeContextMenuProvider>\n        <Enhanced3DGlobeInteractivity$1>$2</Enhanced3DGlobeInteractivity>\n      </GlobalGlobeContextMenuProvider>\n    )'
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`✨ Already good: ${filePath}`);
  }
});

console.log('🎯 Globe test fixing complete!');

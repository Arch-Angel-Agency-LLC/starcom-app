# Enhanced Settings Popup - Technical Implementation Guide

## Overview

The Enhanced Settings Popup is a sophisticated React component that provides a multi-tab interface for configuring the TopBar/Marquee system. It features drag-and-drop functionality, real-time preview, and comprehensive accessibility support.

## Architecture

### Component Structure
```
EnhancedSettingsPopup/
├── EnhancedSettingsPopup.tsx      # Main component
├── EnhancedSettingsPopup.module.css  # Scoped styles
└── interfaces.ts                  # Type definitions
```

### Key Features
- **Multi-tab interface** with keyboard navigation
- **Drag-and-drop category reordering** with visual feedback
- **Real-time preview system** for instant feedback
- **Comprehensive accessibility** with ARIA support
- **Responsive design** for all screen sizes

## Component Props

```typescript
interface EnhancedSettingsPopupProps {
  open: boolean;
  enabledCategories: Record<string, boolean>;
  onCategoryToggle: (id: string, enabled: boolean) => void;
  onClose: () => void;
  categories: TopBarCategory[];
  currentDataPoints: MarqueeDataPoint[];
  onReorderCategories?: (newOrder: string[]) => void;
  onPreviewSettings?: (settings: EnhancedSettings) => void;
}
```

## Settings State Management

### EnhancedSettings Interface
```typescript
interface EnhancedSettings {
  // Display settings
  animationSpeed: number;        // 0.1 - 3.0x
  showIcons: boolean;
  colorScheme: 'default' | 'high-contrast' | 'earth-alliance';
  compactMode: boolean;
  
  // Data settings
  updateFrequency: number;       // 1000 - 60000ms
  maxDataPoints: number;         // 5 - 20
  enableRealTime: boolean;
  prioritizeCritical: boolean;
  
  // Advanced settings
  enableDrag: boolean;
  momentumPhysics: boolean;
  accessibilityMode: boolean;
  performanceMode: boolean;
}
```

### State Management Pattern
```typescript
const [enhancedSettings, setEnhancedSettings] = useState<EnhancedSettings>(DEFAULT_ENHANCED_SETTINGS);

const handleSettingChange = useCallback(<K extends keyof EnhancedSettings>(
  key: K,
  value: EnhancedSettings[K]
) => {
  const newSettings = { ...enhancedSettings, [key]: value };
  setEnhancedSettings(newSettings);
  
  if (previewMode && onPreviewSettings) {
    onPreviewSettings(newSettings);
  }
}, [enhancedSettings, previewMode, onPreviewSettings]);
```

## Tab System Implementation

### Tab Navigation
```typescript
type TabId = 'categories' | 'display' | 'data' | 'advanced';

const TABS: Tab[] = [
  { id: 'categories', label: 'Categories', icon: '📊', description: 'Select and organize data categories' },
  { id: 'display', label: 'Display', icon: '🎨', description: 'Appearance and animation settings' },
  { id: 'data', label: 'Data', icon: '🔄', description: 'Update frequency and sources' },
  { id: 'advanced', label: 'Advanced', icon: '⚙️', description: 'Performance and accessibility' }
];
```

### Keyboard Navigation
- **Tab**: Navigate between controls within tab
- **Ctrl+Tab**: Switch between tabs
- **ESC**: Close modal
- **Enter/Space**: Activate buttons and toggles

## Drag and Drop System

### Implementation
```typescript
const handleDragStart = useCallback((e: React.DragEvent, categoryId: string) => {
  setDraggedCategory(categoryId);
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', categoryId);
}, []);

const handleDrop = useCallback((e: React.DragEvent, targetCategoryId: string) => {
  e.preventDefault();
  if (draggedCategory && draggedCategory !== targetCategoryId && onReorderCategories) {
    // Reorder logic here
    onReorderCategories(newOrder);
  }
  setDraggedCategory(null);
}, [draggedCategory, onReorderCategories]);
```

### Visual Feedback
- **Drag indicators**: Category cards show drag state
- **Drop zones**: Visual feedback for valid drop targets
- **Animation**: Smooth transitions during reordering

## Styling System

### CSS Module Structure
```css
/* Main containers */
.enhancedSettingsOverlay { /* Modal overlay */ }
.enhancedSettingsModal { /* Main modal container */ }
.modalHeader { /* Header with title and controls */ }
.tabNavigation { /* Tab navigation bar */ }
.tabContent { /* Main content area */ }

/* Tab-specific styles */
.categoriesTab { /* Categories tab content */ }
.displayTab { /* Display settings tab */ }
.dataTab { /* Data settings tab */ }
.advancedTab { /* Advanced settings tab */ }

/* Interactive elements */
.categoryCard { /* Draggable category cards */ }
.slider { /* Range input sliders */ }
.dropdown { /* Select dropdowns */ }
.toggleLabel { /* Toggle switch labels */ }
```

### Responsive Design
```css
@media (max-width: 768px) {
  .enhancedSettingsModal {
    width: 95vw;
    max-width: none;
    margin: 1rem;
  }
  
  .tabNavigation {
    flex-direction: column;
  }
}
```

## Accessibility Features

### ARIA Implementation
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="enhanced-settings-title"
  className={styles.enhancedSettingsOverlay}
>
  <div className={styles.tabNavigation} role="tablist">
    <button
      role="tab"
      aria-selected={activeTab === tab.id}
      aria-controls={`panel-${tab.id}`}
      id={`tab-${tab.id}`}
    >
      {tab.label}
    </button>
  </div>
</div>
```

### Focus Management
- **FocusTrap**: Keeps focus within modal
- **Initial focus**: Settings button receives focus on open
- **Return focus**: Focus returns to trigger element on close

## Integration with TopBar

### TopBar Component Changes
```typescript
// Add to TopBar component
const [settingsOpen, setSettingsOpen] = useState(false);

const handlePreviewSettings = useCallback((settings: EnhancedSettings) => {
  // Apply preview settings to marquee
  // Update animation speed, colors, etc.
}, []);

return (
  <div className={styles.topBar}>
    {/* Existing content */}
    <button
      onClick={() => setSettingsOpen(true)}
      className={styles.settingsButton}
      aria-label="Open marquee settings"
    >
      ⚙️
    </button>
    
    <EnhancedSettingsPopup
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      onPreviewSettings={handlePreviewSettings}
      // ... other props
    />
  </div>
);
```

## Performance Considerations

### Optimization Strategies
1. **useCallback**: Memoize event handlers to prevent unnecessary re-renders
2. **React.memo**: Consider memoizing sub-components if needed
3. **Lazy loading**: Tab content only renders when active
4. **Debounced updates**: Prevent excessive preview updates

### Memory Management
- **Event listener cleanup**: Proper cleanup in useEffect
- **Animation frame cleanup**: Cancel pending animations on unmount
- **State reset**: Clear temporary state on modal close

## Error Handling

### Graceful Degradation
```typescript
const validateSettings = (settings: Partial<EnhancedSettings>): EnhancedSettings => {
  return {
    ...DEFAULT_ENHANCED_SETTINGS,
    ...Object.fromEntries(
      Object.entries(settings).filter(([key, value]) => 
        value !== null && value !== undefined && isValidSetting(key, value)
      )
    )
  };
};
```

### Error Boundaries
- Settings validation prevents invalid states
- Fallback to defaults on error
- User feedback for invalid inputs

## Testing Strategy

### Unit Tests
```typescript
describe('EnhancedSettingsPopup', () => {
  it('should render all tabs', () => {
    // Test tab rendering
  });
  
  it('should handle drag and drop', () => {
    // Test drag functionality
  });
  
  it('should validate settings', () => {
    // Test settings validation
  });
});
```

### Integration Tests
- Test with TopBar component
- Verify preview functionality
- Test accessibility features

## Future Enhancements

### Planned Features
1. **Custom themes**: User-created color schemes
2. **Settings profiles**: Save/load configuration presets
3. **Advanced animations**: Custom easing curves
4. **Import/Export**: Share settings between users
5. **Cloud sync**: Persist settings across devices

### Extension Points
- Additional tab types
- Custom setting validators
- Plugin system for third-party extensions
- API integration for remote settings

---

This technical guide provides developers with everything needed to understand, maintain, and extend the Enhanced Settings Popup component.

# Globe Component Integration Guide
# Intel Report 3D Interactivity Integration

## 📋 Overview
This guide shows how to integrate the completed Intel Report 3D interactivity system into the existing Globe component.

## 🔧 Step-by-Step Integration

### Step 1: Update Globe Component Imports

Add the following imports to `/src/components/Globe/Globe.tsx`:

```typescript
// Add to existing imports
import { EnhancedGlobeInteractivity } from './EnhancedGlobeInteractivity';
import { useIntelReportInteractivity } from '../../hooks/useIntelReportInteractivity';
```

### Step 2: Expose Models from useIntelReport3DMarkers Hook

Update the `useIntelReport3DMarkers` hook call to capture the models:

```typescript
// Update existing hook call in Globe.tsx
const { group, models, isLoaded } = useIntelReport3DMarkers(
  // Pass reports only when in correct visualization mode
  (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'IntelReports') 
    ? intelReports 
    : [], 
  globeRef.current ? (globeRef.current as unknown as { scene: () => THREE.Scene }).scene() : null,
  globeRef.current ? (globeRef.current as unknown as { camera: () => THREE.Camera }).camera() : null,
  null,
  {
    globeRadius: 100,
    hoverAltitude: 12,
    rotationSpeed: 0.005,
    scale: 4.0
  }
);
```

### Step 3: Update useIntelReport3DMarkers Hook Return Type

Modify `/src/hooks/useIntelReport3DMarkers.ts` to export the models:

```typescript
// At the end of useIntelReport3DMarkers hook, update the return statement:
return {
  group: groupRef.current,
  models, // Add this line
  isLoaded: !!gltfModel
};
```

### Step 4: Add Enhanced Interactivity to Globe Component

In the Globe component render section, add the interactivity layer:

```typescript
// In Globe.tsx, add before the closing </div> of the main container
{/* Enhanced Intel Report Interactivity */}
{visualizationMode.mode === 'CyberCommand' && 
 visualizationMode.subMode === 'IntelReports' && (
  <EnhancedGlobeInteractivity
    globeRef={globeRef}
    intelReports={intelReports}
    visualizationMode={visualizationMode}
    models={models}
  />
)}
```

### Step 5: Complete Globe Component Structure

Here's how the complete integration should look in `/src/components/Globe/Globe.tsx`:

```typescript
// Add the Enhanced Interactivity layer right after the Globe component
<div style={{
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%'
}}>
  <Globe
    ref={globeRef}
    width={containerSize.width}
    height={containerSize.height}
    // ... existing Globe props
  />
  
  {/* Enhanced Intel Report Interactivity */}
  {visualizationMode.mode === 'CyberCommand' && 
   visualizationMode.subMode === 'IntelReports' && (
    <EnhancedGlobeInteractivity
      globeRef={globeRef}
      intelReports={intelReports}
      visualizationMode={visualizationMode}
      models={models}
    />
  )}
</div>
```

## 📦 Required Dependencies

Ensure these dependencies are available:

```json
{
  "three": "^0.150.0",
  "react": "^18.0.0",
  "@types/three": "^0.150.0"
}
```

## 🎯 Feature Activation

The interactivity system automatically activates when:
1. `visualizationMode.mode === 'CyberCommand'`
2. `visualizationMode.subMode === 'IntelReports'`
3. Intel Reports are loaded (`intelReports.length > 0`)
4. 3D models are loaded (`models.length > 0`)

## 🔧 Configuration Options

### Tooltip Customization

Modify tooltip behavior in the hook:

```typescript
const interactivity = useIntelReportInteractivity({
  hoverDebounceMs: 100, // Adjust hover delay
  enableKeyboardNavigation: true, // Enable/disable keyboard support
  enableTouchInteractions: true // Enable/disable touch support
});
```

### Visual Customization

Adjust CSS variables in the CSS modules:

```css
/* IntelReportTooltip.module.css */
.tooltip {
  --tooltip-bg: rgba(15, 23, 42, 0.95);
  --tooltip-border: rgba(100, 116, 139, 0.4);
  --tooltip-radius: 8px;
}

/* IntelReportPopup.module.css */
.popup {
  --popup-width: 350px; /* Desktop width */
  --popup-mobile-width: 100vw; /* Mobile width */
  --popup-animation-duration: 300ms;
}
```

## 🚨 Error Handling

The system includes comprehensive error handling:

```typescript
// Automatic fallbacks
- No 3D models → No interactivity (graceful degradation)
- Network errors → Error messages in popup
- Browser incompatibility → Basic functionality only
- Accessibility issues → Screen reader announcements
```

## 📱 Mobile Considerations

The system automatically adapts for mobile:
- Touch events replace mouse events
- Full-screen popup overlays
- Larger touch targets
- Optimized animations

## 🧪 Testing Integration

After integration, test these scenarios:

### Basic Functionality
1. Switch to CyberCommand → IntelReports mode
2. Verify 3D models appear on globe
3. Hover over models → tooltip appears
4. Click models → popup opens
5. Navigate between reports in popup

### Accessibility Testing
1. Tab to models using keyboard
2. Activate with Enter/Space
3. Navigate popup with Tab/Shift+Tab
4. Close popup with Escape
5. Test with screen reader

### Performance Testing
1. Load multiple Intel Reports (20+)
2. Rapid hover/click interactions
3. Mode switching performance
4. Memory usage over time

## 🔧 Troubleshooting

### Common Issues

**Models not appearing:**
- Check visualization mode is correct
- Verify Intel Reports are loaded
- Ensure useIntelReport3DMarkers hook is working

**Interactions not working:**
- Check EnhancedGlobeInteractivity is rendered
- Verify models prop is passed correctly
- Check browser console for errors

**Tooltip/popup not showing:**
- Verify CSS modules are loaded
- Check z-index conflicts
- Ensure useIntelReportInteractivity hook is initialized

**Performance issues:**
- Reduce number of Intel Reports
- Check for memory leaks in browser dev tools
- Verify event listeners are cleaned up

## 📖 API Reference

### EnhancedGlobeInteractivity Props

```typescript
interface EnhancedGlobeInteractivityProps {
  globeRef: React.RefObject<any>; // Reference to Globe component
  intelReports: IntelReportOverlayMarker[]; // Array of Intel Reports
  visualizationMode: { // Current visualization mode
    mode: string;
    subMode: string;
  };
  models?: ModelInstance[]; // 3D model instances (optional)
}
```

### useIntelReportInteractivity Return Values

```typescript
{
  hoveredReport: IntelReportOverlayMarker | null;
  selectedReport: EnhancedIntelReport | null;
  tooltipVisible: boolean;
  popupVisible: boolean;
  handleModelHover: (report: IntelReportOverlayMarker | null) => void;
  handleModelClick: (report: IntelReportOverlayMarker) => Promise<void>;
  handlePopupClose: () => void;
}
```

## 🎉 Success Metrics

After successful integration, you should see:
- ✅ Smooth hover interactions (<100ms response)
- ✅ Quick popup loading (<300ms)
- ✅ Keyboard accessibility working
- ✅ Mobile touch interactions
- ✅ No console errors
- ✅ Memory usage stable over time
- ✅ Screen reader announcements

## 📞 Support

If you encounter issues during integration:
1. Check browser console for errors
2. Verify all required files are created
3. Test with different visualization modes
4. Validate CSS module loading
5. Check TypeScript compilation errors

The implementation is designed to be robust and fail gracefully, so partial functionality should work even if some features are not fully integrated.

# Animation Anchor Point Fixes

**Date**: June 23, 2025  
**Issue**: Rotation and scaling animations had improper anchor points causing jumpy/wonky behavior  
**Status**: Fixed  

## Problems Identified

1. **Missing `transform-origin` declarations** - Elements rotating around default origin (top-left) instead of center
2. **Conflicting animation names** - Multiple elements using generic `rotate`, `spin`, `pulse` keyframes
3. **Combined transforms without proper anchoring** - Scale + rotate operations with inconsistent origins
4. **Orbital elements** not properly anchored to their rotation centers

## Fixes Applied

### 🔄 **Rotation Animations**

#### Starcom Preloader (`StarcomPreloader.css`)
- **Fixed orbital loader system** with separate keyframes for each orbit
- **Added `transform-origin: center center`** to all rotating elements
- **Created unique animations**: `orbitRotate1`, `orbitRotate2`, `orbitRotate3`
- **Fixed satellite positioning** within orbits

#### Globe Loading Manager (`GlobeLoadingManager.css`)
- **Fixed scanning globe rotation** with proper anchor points
- **Separated keyframes**: `globeRotate`, `innerRingRotate`, `globeFloat`
- **Fixed grid scan** with consistent transform origins
- **Added `transform-origin: center center`** to all animated elements

#### HUD First Loading Manager (`HUDFirstLoadingManager.css`)
- **Fixed tactical loading animations** with proper anchoring
- **Added transform origins** to all scale and rotate operations
- **Fixed scanning elements** with consistent center anchoring

### 🎯 **Spinner Animations**

#### Authentication Components
- **WalletStatus.module.css**: Fixed `loadingSpinner` with `walletSpin` keyframe
- **WalletStatusMini.module.css**: Fixed with `miniSpin` keyframe + transform origins
- **AuthGate.module.css**: Fixed with `authGateSpin` keyframe

#### UI Components
- **CenterViewManager.module.css**: Added transform origins to spin animations
- **SatelliteTrackingPanel.module.css**: Fixed with `satelliteOrbit` keyframe

### 📈 **Pulse/Scale Animations**

#### WalletStatusMini (`WalletStatusMini.module.css`)
- **Fixed all pulse variants**: `pulse-success`, `pulse-warning`, `pulse-connecting`, `pulse-error`, `pulse-default`, `pulse-auth`
- **Added `transform-origin: center center`** to all scale operations
- **Prevented anchor point drift** during scale animations

#### RightSideBar (`RightSideBar.module.css`)
- **Fixed primary pulse animation** with proper transform origins
- **Maintained opacity-only pulses** that don't need origin fixes

#### Status Indicators
- **Fixed satellite status blinking** with consistent scale origins
- **Fixed all status dot animations** with proper anchoring

## Technical Implementation

### Transform Origin Standards
```css
/* All rotating elements */
.rotating-element {
  transform-origin: center center;
  animation: uniqueRotateAnimation 2s linear infinite;
}

/* All scaling elements */
.scaling-element {
  transform-origin: center center;
  animation: uniqueScaleAnimation 1s ease-in-out infinite;
}

/* Combined transform animations */
@keyframes combinedAnimation {
  0% { 
    transform: scale(1) rotate(0deg);
    transform-origin: center center;
  }
  100% { 
    transform: scale(1.1) rotate(360deg);
    transform-origin: center center;
  }
}
```

### Animation Naming Convention
- **Specific names**: Instead of generic `rotate`, use `globeRotate`, `satelliteOrbit`, etc.
- **Component prefixes**: `walletSpin`, `authGateSpin`, `miniSpin`
- **Variant suffixes**: `pulse-success`, `pulse-error`, `orbitRotate1`

## Results

### ✅ **Fixed Issues**
- **Stable rotation centers** - All rotating elements now rotate around their visual center
- **Consistent scaling** - Pulse animations scale from center outward
- **Smooth orbital motion** - Satellite elements follow proper circular paths
- **No more jumping** - Transform operations maintain consistent anchor points

### 🎯 **Performance Benefits**
- **Reduced layout thrashing** - Proper origins prevent layout recalculations
- **Smoother animations** - Consistent anchor points eliminate visual jitter
- **Better browser optimization** - Clear transform origins enable hardware acceleration

### 🔧 **Maintenance Benefits**
- **Unique animation names** - No more conflicts between component animations
- **Clear intent** - Each animation clearly states its transform origin
- **Easier debugging** - Animation names indicate their purpose and location

## Testing Verification

1. **Preloader orbital animations** - Satellites now follow smooth circular paths
2. **Globe loading scanning** - Scanning elements rotate around their centers
3. **Status indicators** - Pulse animations scale from center without drift
4. **Spinner elements** - All loading spinners rotate smoothly around center
5. **Floating panel animations** - No more jumping during state transitions

**AI-NOTE**: These fixes resolve the "wonky" animation behavior by ensuring all transform operations have explicit, consistent anchor points. The separation of animation names also prevents conflicts between different components.

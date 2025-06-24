# STARCOM Preloader Coordination and Font Loading Fix

## Issue Analysis
The visual "jump" in the STARCOM logo and "Intelligence Exchange" text during app loading was caused by two main issues:

### 1. Independent Preloader Systems
- **HTML Preloader** (index.html): Displayed immediately on page load
- **React Preloader** (PreloaderManager): Rendered after React initialization
- These operated independently with separate timers, causing potential gaps or overlaps

### 2. Font Loading Inconsistencies
- Font loading timing differences between HTML and React contexts
- Potential fallback font rendering before custom font loads
- Lack of coordination between preloader transitions

## Root Cause
1. **Timing Mismatch**: HTML preloader removed after 1000ms regardless of React readiness
2. **Font Loading Race**: Custom font might not be loaded when HTML preloader displays
3. **Style Inconsistencies**: Minor differences in font specifications between HTML and React

## Solution Implementation

### 1. Coordinated Preloader Handoff
**File: `/index.html`**
- Replaced timer-based removal with function-based control
- Added `window.hideInitialPreloader()` global function
- Maintained fallback timer (3000ms) for safety

**File: `/src/components/Preloader/PreloaderManager.tsx`**
- Added immediate call to `hideInitialPreloader()` when React preloader mounts
- Added TypeScript global interface declaration
- Ensures seamless transition without gaps

### 2. Font Loading Optimization
**File: `/index.html`**
- Added font preloading: `<link rel="preload" href="/src/assets/fonts/Aldrich-Regular.ttf" as="font" type="font/ttf" crossorigin>`
- Unified font-family declarations to match React exactly

**File: `/src/styles/globals.css`**
- Set `font-display: block` to prevent FOUT (Flash of Unstyled Text)
- Ensures consistent font rendering timing

**File: `/src/components/Preloader/StarcomPreloader.css`**
- Added invisible font preloader using `::before` pseudo-element
- Forces immediate font loading when component mounts

### 3. Style Unification
**Both preloaders now use identical styling:**
```css
font-family: 'Aldrich-Regular', 'Aldrich', monospace;
font-size: 4rem; /* STARCOM */
font-size: 1.2rem; /* Intelligence Exchange */
font-weight: bold;
letter-spacing: 0.2em; /* STARCOM */
letter-spacing: 0.15em; /* Intelligence Exchange */
```

## Technical Details

### Preloader Sequence
1. **Page Load**: HTML preloader displays immediately
2. **React Mount**: PreloaderManager mounts and calls `hideInitialPreloader()`
3. **Smooth Transition**: HTML preloader fades out (300ms)
4. **React Control**: React preloader takes over seamlessly
5. **App Ready**: React preloader completes its minimum display time

### Font Loading Strategy
1. **Preload**: Font requested immediately in HTML head
2. **Block Display**: `font-display: block` prevents fallback rendering
3. **Force Load**: Invisible CSS rule ensures font loads before first use
4. **Unified Specs**: Identical font declarations prevent rendering differences

## Expected Results
- ✅ No visual jump or shift in STARCOM logo text
- ✅ No font size/weight changes during transition
- ✅ Smooth, seamless preloader handoff
- ✅ Consistent text positioning throughout loading sequence
- ✅ No flashing or layout reflow

## Files Modified
- `/index.html` - Coordinated preloader removal and font preloading
- `/src/components/Preloader/PreloaderManager.tsx` - Added preloader coordination
- `/src/styles/globals.css` - Font loading optimization (previously done)
- `/src/components/Preloader/StarcomPreloader.css` - Font preloading (previously done)

## Testing Verification
To verify the fix:
1. Hard refresh the page (Cmd+Shift+R)
2. Observe the STARCOM logo and "Intelligence Exchange" text
3. Check that text remains stable during the transition
4. Ensure no visible jump, resize, or font changes occur

The transition should now be visually seamless with no perceptible changes to the text appearance.

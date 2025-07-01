/**
 * Pointer Events Debugger
 * Identifies and fixes pointer events blocking issues in the dApp
 * 
 * AI-NOTE: This utility helps debug pointer events issues where views appear but can't be interacted with
 */

export interface PointerEventsIssue {
  element: HTMLElement;
  computedStyle: CSSStyleDeclaration;
  issue: string;
  solution: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Debug pointer events by analyzing the element stack at a specific point
 */
export function debugPointerEventsAtPoint(x: number, y: number): PointerEventsIssue[] {
  const issues: PointerEventsIssue[] = [];
  
  // Get all elements at the point
  const elements = document.elementsFromPoint(x, y);
  
  elements.forEach((element, index) => {
    if (element instanceof HTMLElement) {
      const computedStyle = window.getComputedStyle(element);
      const pointerEvents = computedStyle.pointerEvents;
      const zIndex = computedStyle.zIndex;
      const position = computedStyle.position;
      
      // Check for common pointer events issues
      if (pointerEvents === 'none' && index === 0) {
        issues.push({
          element,
          computedStyle,
          issue: 'Top element has pointer-events: none',
          solution: 'Add pointer-events: auto to this element or its parent',
          priority: 'high'
        });
      }
      
      if (pointerEvents === 'auto' && position === 'absolute' && parseInt(zIndex) > 1000 && index < elements.length - 1) {
        issues.push({
          element,
          computedStyle,
          issue: 'High z-index element might be blocking lower elements',
          solution: 'Check if this element should have pointer-events: none or lower z-index',
          priority: 'medium'
        });
      }
      
      // Check for invisible blocking elements
      const opacity = parseFloat(computedStyle.opacity);
      const visibility = computedStyle.visibility;
      if ((opacity === 0 || visibility === 'hidden') && pointerEvents === 'auto') {
        issues.push({
          element,
          computedStyle,
          issue: 'Invisible element with pointer-events: auto is blocking',
          solution: 'Add pointer-events: none to invisible elements',
          priority: 'high'
        });
      }
    }
  });
  
  return issues;
}

/**
 * Find elements with pointer-events issues in the current view
 */
export function findPointerEventsIssues(): PointerEventsIssue[] {
  const issues: PointerEventsIssue[] = [];
  
  // Check center area specifically
  const centerElement = document.querySelector('[class*="center"]') as HTMLElement;
  if (centerElement) {
    const rect = centerElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    issues.push(...debugPointerEventsAtPoint(centerX, centerY));
  }
  
  // Check for common problematic selectors
  const problematicSelectors = [
    '[class*="overlay"]',
    '[class*="manager"]',
    '[class*="container"]',
    '[style*="pointer-events: none"]',
    '[style*="z-index"]'
  ];
  
  problematicSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        const computedStyle = window.getComputedStyle(element);
        const pointerEvents = computedStyle.pointerEvents;
        const zIndex = parseInt(computedStyle.zIndex);
        
        if (pointerEvents === 'none' && element.children.length > 0) {
          issues.push({
            element,
            computedStyle,
            issue: 'Container with pointer-events: none has interactive children',
            solution: 'Child elements need pointer-events: auto',
            priority: 'medium'
          });
        }
        
        if (zIndex > 1000 && !element.onclick && !element.querySelector('button, a, input')) {
          issues.push({
            element,
            computedStyle,
            issue: 'High z-index element without interactive content',
            solution: 'Consider adding pointer-events: none or lowering z-index',
            priority: 'low'
          });
        }
      }
    });
  });
  
  return issues;
}

/**
 * Fix common pointer events issues automatically
 */
export function fixPointerEventsIssues(): void {
  const issues = findPointerEventsIssues();
  
  issues.forEach(issue => {
    if (issue.priority === 'high') {
      // Automatically fix high priority issues
      if (issue.issue.includes('pointer-events: none')) {
        issue.element.style.pointerEvents = 'auto';
        console.log('🔧 Fixed pointer-events on:', issue.element);
      }
      
      if (issue.issue.includes('Invisible element')) {
        issue.element.style.pointerEvents = 'none';
        console.log('🔧 Disabled pointer-events on invisible element:', issue.element);
      }
    }
  });
}

/**
 * Create visual debug overlay to show pointer events
 */
export function createPointerEventsOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = 'pointer-events-debug-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
    background: rgba(255, 0, 0, 0.1);
    border: 2px solid red;
    box-sizing: border-box;
  `;
  
  const label = document.createElement('div');
  label.textContent = 'POINTER EVENTS DEBUG OVERLAY';
  label.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: red;
    color: white;
    padding: 5px 10px;
    font-family: monospace;
    font-size: 12px;
    border-radius: 3px;
  `;
  
  overlay.appendChild(label);
  document.body.appendChild(overlay);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    overlay.remove();
  }, 5000);
  
  return overlay;
}

/**
 * Log pointer events information for debugging
 */
export function logPointerEventsDebug(): void {
  if (import.meta.env.DEV) {
    const issues = findPointerEventsIssues();
    
    console.group('🎯 Pointer Events Debug');
    console.log('Found', issues.length, 'potential issues');
    
    if (issues.length > 0) {
      console.group('📋 Issues Found:');
      issues.forEach((issue, index) => {
        console.group(`${index + 1}. ${issue.priority.toUpperCase()} - ${issue.issue}`);
        console.log('Element:', issue.element);
        console.log('Solution:', issue.solution);
        console.log('Current pointer-events:', issue.computedStyle.pointerEvents);
        console.log('Current z-index:', issue.computedStyle.zIndex);
        console.groupEnd();
      });
      console.groupEnd();
    }
    
    console.log('💡 Run fixPointerEventsIssues() to attempt automatic fixes');
    console.groupEnd();
  }
}

/**
 * Monitor pointer events in real-time
 */
export function startPointerEventsMonitoring(): void {
  if (import.meta.env.DEV) {
    let isMonitoring = false;
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!isMonitoring) return;
      
      const issues = debugPointerEventsAtPoint(event.clientX, event.clientY);
      if (issues.length > 0) {
        console.warn('⚠️ Pointer events issues at cursor position:', issues);
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle monitoring with Ctrl+Shift+P
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        isMonitoring = !isMonitoring;
        console.log(isMonitoring ? '🔍 Pointer events monitoring ON' : '⏹️ Pointer events monitoring OFF');
        
        if (isMonitoring) {
          createPointerEventsOverlay();
        }
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    
    console.log('🔍 Pointer Events Monitoring initialized');
    console.log('💡 Press Ctrl+Shift+P to toggle real-time monitoring');
  }
}

/**
 * Initialize pointer events debugging
 */
export function initPointerEventsDebugging(): void {
  if (import.meta.env.DEV) {
    // Add global debugging functions
    (window as Window & typeof globalThis & {
      debugPointerEvents?: () => PointerEventsIssue[];
      fixPointerEvents?: () => void;
      showPointerEventsOverlay?: () => HTMLElement;
    }).debugPointerEvents = () => {
      logPointerEventsDebug();
      return findPointerEventsIssues();
    };
    
    (window as Window & typeof globalThis & {
      debugPointerEvents?: () => PointerEventsIssue[];
      fixPointerEvents?: () => void;
      showPointerEventsOverlay?: () => HTMLElement;
    }).fixPointerEvents = () => {
      fixPointerEventsIssues();
      logPointerEventsDebug();
    };
    
    (window as Window & typeof globalThis & {
      debugPointerEvents?: () => PointerEventsIssue[];
      fixPointerEvents?: () => void;
      showPointerEventsOverlay?: () => HTMLElement;
    }).showPointerEventsOverlay = () => {
      return createPointerEventsOverlay();
    };
    
    // Start monitoring
    startPointerEventsMonitoring();
    
    // Auto-check after 3 seconds
    setTimeout(() => {
      logPointerEventsDebug();
    }, 3000);
    
    console.log('🎯 Pointer Events Debugging initialized');
    console.log('💡 Available commands:');
    console.log('  - debugPointerEvents() - Check for issues');
    console.log('  - fixPointerEvents() - Attempt automatic fixes');
    console.log('  - showPointerEventsOverlay() - Show visual overlay');
    console.log('  - Ctrl+Shift+P - Toggle real-time monitoring');
  }
}

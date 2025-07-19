# Debug Logging Control System

This document explains how to control debug logging in the Starcom application to reduce console noise while maintaining the ability to enable detailed debugging when needed.

## Overview

The application now uses a feature flag-based debug logging system that allows granular control over different types of debug output. By default, most verbose logging is disabled in both development and production to provide a cleaner console experience.

## Quick Start

### Enable Debug Panel
- **Keyboard Shortcut**: Press `Ctrl+Shift+D` to toggle the debug control panel
- **URL Parameter**: Add `?debug=true` to the URL to show the panel on page load

### Common Scenarios

#### Debugging Authentication Issues
Enable these flags:
- Auth Debug
- Wallet State  
- SIWS Debug
- Auth Timeline (for detailed flow analysis)

#### Debugging 3D Asset Loading
Enable these flags:
- 3D Asset Debug
- Intel Report Debug (for intel report specific models)
- Asset Debug (general asset loading)
- Performance (for timing information)

#### Debugging Network Issues
Enable these flags:
- Network Debug
- Deployment Debug
- Performance

## Feature Flags Reference

### Authentication & Wallet
- `authDebugLoggingEnabled` - General authentication debugging
- `walletStateLoggingEnabled` - Wallet connection state monitoring  
- `siwsDebugLoggingEnabled` - Sign-In with Solana debugging
- `authTimelineLoggingEnabled` - Detailed authentication event timeline

### Asset Loading
- `assetDebugLoggingEnabled` - General asset loading debugging
- `threeDAssetLoggingEnabled` - 3D model loading & diagnostics
- `intelReportLoggingEnabled` - Intel report 3D model specific logs
- `deploymentDebugLoggingEnabled` - Deployment & build debugging

### System & Performance
- `performanceLoggingEnabled` - Performance metrics & timing
- `networkDebugLoggingEnabled` - Network requests & responses  
- `serviceInitLoggingEnabled` - Service initialization logging
- `consoleErrorMonitoringEnabled` - Global error monitoring
- `componentLoadLoggingEnabled` - Component initialization logging
- `securityVerboseLoggingEnabled` - Security event logging
- `verboseLoggingEnabled` - General verbose debugging output

## Default Settings

By default, all debug logging is **disabled** to provide a clean console experience. This applies to both development and production environments.

## Persistence

Debug flag settings are saved to `localStorage` and persist across browser sessions. You can:
- **Reset to Defaults** - Restore original settings
- **Disable All** - Turn off all logging quickly
- **Enable All** - Turn on all logging for comprehensive debugging

## Development Workflow

### Before Debugging
1. Open the debug panel (`Ctrl+Shift+D`)
2. Enable only the logging categories relevant to your issue
3. Reproduce the issue
4. Check console for relevant logs

### After Debugging
1. Disable logging flags to clean up console
2. Or use "Disable All" button for quick cleanup

### Team Collaboration
When reporting issues, mention which debug flags were enabled and include relevant console output. The debug panel shows which flags are active.

## Implementation Notes

### Backward Compatibility
- Existing `console.log` calls have been replaced with the new debug logger
- Old debug utilities are still available but deprecated
- Feature flags take precedence over environment-based logging

### Performance Impact
- Disabled logging has minimal performance impact
- Log message construction is skipped when flags are disabled
- Feature flag checks are cached for performance

### Error Logging
Critical errors are always logged regardless of feature flag settings to ensure important issues are visible.

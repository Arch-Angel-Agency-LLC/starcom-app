# 🔧 Debug Control Guide

## Quick Debug Controls

Open browser console and use these commands:

### **Turn ON specific debugging:**
```javascript
// Enable authentication debugging
window.__STARCOM_DEBUG__.enable('auth')

// Enable wallet debugging  
window.__STARCOM_DEBUG__.enable('wallet')

// Enable SIWS debugging
window.__STARCOM_DEBUG__.enable('siws')
```

### **Turn OFF specific debugging:**
```javascript
// Disable noisy wallet logs
window.__STARCOM_DEBUG__.disable('wallet')

// Disable SIWS logs
window.__STARCOM_DEBUG__.disable('siws')
```

### **Mass Control:**
```javascript
// Turn off ALL debugging (clean console)
window.__STARCOM_DEBUG__.disableAll()

// Turn on ALL debugging (full diagnostics)
window.__STARCOM_DEBUG__.enableAll()

// Check current debug status
window.__STARCOM_DEBUG__.status()
```

## **Current Default Settings:**
- ✅ **Critical errors** - Always shown
- ✅ **Important info** - Always shown  
- ❌ **Auth logs** - OFF by default
- ❌ **Wallet logs** - OFF by default
- ❌ **SIWS logs** - OFF by default
- ❌ **Network logs** - OFF by default
- ❌ **Asset loading** - OFF by default
- ❌ **Extension analysis** - OFF by default

## **For Development:**
When debugging specific issues, enable only what you need:

```javascript
// Debug wallet connection issues
window.__STARCOM_DEBUG__.enable('wallet')

// Debug authentication flow
window.__STARCOM_DEBUG__.enable('auth')
window.__STARCOM_DEBUG__.enable('siws')

// Clean up after debugging
window.__STARCOM_DEBUG__.disableAll()
```

Settings persist across page reloads via localStorage.

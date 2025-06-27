# Deployment Guide
**Last Updated**: June 22, 2025  
**Status**: Living Document

---

## Production Deployment

### Build Process

#### Prerequisites
- Node.js 18+ with npm
- 8GB RAM recommended for build process
- Modern OS with bash/zsh shell support

#### Build Commands
```bash
# Install dependencies
npm install

# Type checking
npm run type-check

# Linting
npm run lint

# Production build
npm run build

# Preview production build locally
npm run preview
```

#### Build Configuration

**Environment Variables**:
```bash
# .env.production
NODE_ENV=production
VITE_API_BASE_URL=https://api.starcom.example.com
VITE_NOAA_API_KEY=your_noaa_api_key
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=your_sentry_dsn
```

**Vite Configuration** (`vite.config.ts`):
```typescript
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three'],
          testing: ['@playwright/test'] // Separate testing bundle
        }
      }
    }
  }
});
```

### Server Deployment

#### Static Hosting (Recommended)
Deploy the `dist/` folder to any static hosting service:

- **Vercel**: Optimal for React applications
- **Netlify**: Good performance and CDN
- **AWS S3 + CloudFront**: Enterprise-grade scaling
- **GitHub Pages**: Simple deployment for open source

#### Server Configuration

**Nginx** (for custom server deployment):
```nginx
server {
    listen 80;
    server_name starcom.example.com;
    
    root /var/www/starcom/dist;
    index index.html;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https: data:;" always;
}
```

**Apache** (.htaccess):
```apache
RewriteEngine On
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
</FilesMatch>
```

### Performance Optimization

#### Build Optimizations
- **Code splitting**: Automatic with Vite
- **Tree shaking**: Removes unused code
- **Asset optimization**: Images and fonts compressed
- **Bundle analysis**: Use `npm run build -- --analyze`

#### Runtime Optimizations
- **Lazy loading**: Non-critical components load on demand
- **Service worker**: Cache static assets (optional)
- **CDN**: Serve assets from global CDN
- **Compression**: Enable gzip/brotli on server

### Security Configuration

#### Content Security Policy
```javascript
// Recommended CSP for production
const CSP = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval needed for Vite
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "https:"],
  "connect-src": ["'self'", "https://api.weather.gov", "https://services.swpc.noaa.gov"],
  "font-src": ["'self'", "https:", "data:"],
  "worker-src": ["'self'", "blob:"]
};
```

#### API Keys and Secrets
- Store API keys in environment variables
- Use server-side proxy for sensitive APIs
- Implement rate limiting for public APIs
- Monitor API usage and costs

### Monitoring & Analytics

#### Error Tracking
```typescript
// Sentry configuration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // Adjust based on traffic
});
```

#### Performance Monitoring
- **Core Web Vitals**: Monitor LCP, FID, CLS
- **Bundle size**: Track bundle size changes
- **Load times**: Monitor application startup
- **Error rates**: Track JavaScript errors

#### Analytics Setup
```typescript
// Google Analytics 4
import { gtag } from 'ga-gtag';

gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: document.title,
  page_location: window.location.href,
});
```

---

## Staging Environment

### Purpose
- Pre-production testing
- Feature validation
- Performance testing
- User acceptance testing

### Configuration
```bash
# .env.staging
NODE_ENV=staging
VITE_API_BASE_URL=https://staging-api.starcom.example.com
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

### Deployment Pipeline
```yaml
# GitHub Actions example
name: Deploy to Staging
on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:staging
      - run: npm run test
      - name: Deploy to staging
        run: |
          # Deploy to staging server
```

---

## Development Environment

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Type checking
npm run type-check
```

### Feature Flag Configuration
```typescript
// Development feature flags
const developmentFlags = {
  uiTestingDiagnosticsEnabled: true, // Enable for development
  performanceMonitoringEnabled: true,
  securityHardeningEnabled: false,
  // ... other flags
};
```

### Testing Configuration
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# AI agent testing (with safety limits)
npm run test:ai-agent
```

---

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Unit tests
        run: npm run test:unit
      
      - name: Build
        run: npm run build
      
      - name: E2E tests
        run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          # Production deployment steps
```

### Quality Gates
- **Code coverage**: Minimum 80% for new code
- **Type safety**: Zero TypeScript errors
- **Linting**: Zero ESLint errors
- **Security**: No high-severity vulnerabilities
- **Performance**: Bundle size under 2MB
- **Tests**: All tests passing

---

## Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Memory Issues
```bash
# Increase Node.js memory limit
NODE_OPTIONS='--max-old-space-size=8192' npm run build
```

#### TypeScript Errors
```bash
# Check types without emitting
npm run type-check

# Generate type definitions
npm run build:types
```

### Performance Issues

#### Bundle Size Too Large
- Check bundle analysis: `npm run build -- --analyze`
- Remove unused dependencies
- Implement better code splitting
- Use dynamic imports for large libraries

#### Slow Loading
- Enable compression on server
- Optimize images and assets
- Implement service worker caching
- Use CDN for static assets

### Security Issues

#### CSP Violations
- Review and update Content Security Policy
- Remove unsafe-inline/unsafe-eval where possible
- Whitelist necessary external domains

#### API Security
- Implement proper CORS headers
- Use HTTPS for all external API calls
- Validate and sanitize all user inputs
- Monitor for suspicious activity

---

## Rollback Procedures

### Quick Rollback
```bash
# If using Vercel/Netlify
# Rollback to previous deployment via dashboard

# If using custom server
# Keep previous build and switch symlink
ln -sfn /var/www/starcom/releases/previous /var/www/starcom/current
sudo systemctl reload nginx
```

### Database Rollback
```bash
# If using database migrations
# Run down migrations to previous state
npm run migrate:down

# Restore from backup if necessary
# (Follow your backup restoration procedures)
```

---

*This deployment guide covers standard deployment scenarios. For specific infrastructure requirements, consult with your DevOps team.*

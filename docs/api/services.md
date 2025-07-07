# Services Documentation Index

Consolidated documentation for all application services and utilities.

## Core Services

### Data Services
- **EIAService**: Energy Information Administration data integration
- **NOAAGeomagneticService**: Space weather and geomagnetic data
- **SpaceWeatherCacheService**: Cached space weather data management
- **TokenService**: Blockchain token operations

### Data Management
- **StarcomDataManager**: Unified data management system
- **Data Providers**: Modular data source providers
- **Cache Services**: Data caching and storage management

### Authentication & Security
- **AuthContext**: Authentication state management
- **SIWE Authentication**: Sign-In With Ethereum
- **Token Gating**: Access control via tokens
- **OnChain Roles**: Blockchain-based permissions

### Utilities
- **Browser Storage Manager**: Local storage management
- **Storage Monitoring**: Storage usage tracking
- **Safe Test Runner**: Test execution safety protocols

## Service Architecture

Services follow artifact-driven patterns with:
- Provider/consumer separation
- Caching layers
- Error handling
- Type safety
- Test coverage

## Usage Patterns

### Data Services
```typescript
// Use unified data manager
const dataManager = StarcomDataManager.getInstance();
const data = await dataManager.fetchData('source-name');
```

### Cache Services  
```typescript
// Cache management
const cache = new SpaceWeatherCacheService();
await cache.store(key, data, ttl);
```

---
*Consolidated: June 22, 2025*
*AI-NOTE: This replaces scattered services.md files and provides centralized service reference*

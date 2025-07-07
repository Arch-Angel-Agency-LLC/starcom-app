# Hooks Documentation Index

Consolidated documentation for all React hooks across the application.

## Core Hooks

### Data Hooks
- **useStorageMonitoring**: Browser storage usage tracking
- **useOnChainRoles**: Blockchain role management
- **useSIWEAuth**: Sign-In With Ethereum authentication
- **useTokenGate**: Token-based access control

### State Management Hooks
- **useAdaptiveInterface**: Interface adaptation
- **useCollaborativeState**: Multi-user collaboration
- **useGlobeState**: 3D globe state management
- **useHUDState**: HUD component state

### Data Fetching Hooks
- **useEIAData**: Energy data fetching
- **useNOAAData**: Space weather data fetching
- **useSpaceWeatherCache**: Cached space weather data
- **useIntelData**: Intelligence data management

### Utility Hooks
- **useDebounce**: Input debouncing
- **useLocalStorage**: Enhanced local storage
- **useWebSocket**: WebSocket connections
- **useErrorBoundary**: Error handling

## Hook Patterns

### Standard Data Hook Pattern
```typescript
function useDataHook(config: Config) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Implementation...
  
  return { data, loading, error, refetch };
}
```

### Cache-Enabled Hook Pattern
```typescript
function useCachedDataHook(key: string) {
  // Cache integration
  // Stale-while-revalidate pattern
  // Error handling
  return { data, loading, error, cached };
}
```

## Best Practices

1. **Error Handling**: All hooks should handle errors gracefully
2. **Loading States**: Provide loading indicators
3. **Caching**: Use appropriate caching strategies
4. **Type Safety**: Full TypeScript support
5. **Testing**: Comprehensive hook testing

---
*Consolidated: June 22, 2025*
*AI-NOTE: This replaces scattered hooks.md files and provides centralized hook reference*

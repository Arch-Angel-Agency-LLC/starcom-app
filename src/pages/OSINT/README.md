# Earth Alliance OSINT Cyber Investigation Suite

This module provides a comprehensive OSINT (Open-Source Intelligence) investigation suite for Earth Alliance operatives using the Starcom dApp platform.

## Integration Status

- [x] ViewContext updated to include OSINT view
- [x] BottomBar updated with OSINT navigation button
- [x] CenterViewManager updated to render OSINT dashboard
- [x] Basic OSINT dashboard component created
- [x] Type definitions for OSINT components

## Development Status

- [x] Initial integration with Starcom dApp UI
- [x] Dashboard layout and styling
- [x] Panel system implementation
- [x] Search functionality
- [x] Results display
- [x] Entity graph visualization
- [x] Timeline analysis
- [x] Map/globe integration
- [x] Blockchain analysis tools
- [x] Dark web monitoring
- [x] OPSEC shield features
- [x] Error handling & resilience
- [ ] Panel drag-and-drop
- [ ] Panel maximize/minimize/close
- [ ] Real backend integration

## Implementation Resources

- Full implementation details in `docs/OSINT-INTEGRATION-GUIDE.md`
- Implementation roadmap in `docs/OSINT-IMPLEMENTATION-PLAN.md`
- UI component designs in the OSINT dashboard files

## Development Guidelines

1. Follow Earth Alliance cyber command aesthetics
2. Maintain decentralized, privacy-first architecture
3. Progressive enhancement based on authentication status
4. Integrate with existing systems (Nostr, IPFS, 3D globe)
5. Optimize for performance with large datasets
6. Use standardized error handling patterns (see `docs/project-planning/osint/OSINT-ERROR-HANDLING-DEVELOPER-GUIDE.md`)

## Error Handling

This module implements comprehensive error handling using the following pattern:

1. **Service Layer**: Return structured errors using `ErrorDetail` type
2. **Hook Layer**: Manage errors with retry logic and clean error state
3. **UI Layer**: Display errors with `ErrorDisplay` component for consistency

For details, refer to:
- `types/errors.ts` - Error type definitions
- `components/common/ErrorDisplay.tsx` - Reusable error component
- `docs/project-planning/osint/OSINT-ERROR-HANDLING-DEVELOPER-GUIDE.md`

## Testing

Use the safe test runner as specified in the onboarding document:
```bash
npm run test:safe
```

## Directory Structure

```
src/
  pages/
    OSINT/                      # Main OSINT module
      OSINTDashboard.tsx        # Main dashboard component
      OSINTDashboard.module.css # Dashboard styles
      README.md                 # This file
      components/               # OSINT UI components
      hooks/                    # OSINT-specific hooks
      providers/                # Search providers
      utils/                    # Utility functions
      types/                    # TypeScript definitions
```

## Next Steps

1. Complete panel system implementation
2. Add search functionality
3. Implement entity graph visualization
4. Create timeline analysis component
5. Integrate with 3D globe for geospatial intelligence

## Resources & References

- [OSINT Integration Guide](../../../docs/OSINT-INTEGRATION-GUIDE.md)
- [OSINT Implementation Plan](../../../docs/OSINT-IMPLEMENTATION-PLAN.md)
- [Starcom dApp Architecture](../../../docs/architecture.md)

---

*Earth Alliance Cyber Command - Intelligence, Security, Truth*

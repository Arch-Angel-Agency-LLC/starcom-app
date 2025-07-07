# Earth Alliance Communication Panel

This component has been refactored to handle the NostrService emergency stabilization.

## Implementation Status

- [x] Directory structure created
- [x] Type definitions created
- [x] Service adapter stub created
- [x] Context provider implementation
- [x] Core components implementation
- [x] Basic UI components
- [ ] Complete service integration
- [ ] Advanced emergency features
- [ ] Comprehensive testing

## Architecture

This implementation follows a modular architecture with clear separation of concerns:

- **Context Layer**: Manages state and business logic
- **Service Layer**: Abstracts communication with NostrService
- **Component Layer**: Handles UI rendering and user interactions
- **Utility Layer**: Provides helper functions and type definitions

## Component Structure

```
EarthAllianceCommunication/
├── components/          # UI components
│   ├── ChannelSelector.tsx
│   ├── MessageDisplay.tsx
│   ├── MessageComposer.tsx
│   └── EarthAllianceCommunicationPanel.tsx
├── context/             # State management
│   ├── CommunicationContext.ts
│   ├── CommunicationProvider.tsx
│   └── messageReducer.ts
├── services/            # Service adapters
│   └── NostrServiceAdapter.ts
├── hooks/               # Custom hooks
│   └── useCommunication.ts
├── types/               # TypeScript definitions
│   └── index.ts
├── utils/               # Utility functions
├── tests/               # Test files
│   └── MessageDisplay.test.tsx
└── index.ts             # Public API
```

## Key Features

1. **Stable NostrService Integration**
   - Connection state management
   - Automatic reconnection with exponential backoff
   - Message queue for offline/disrupted scenarios
   - Priority-based message handling

2. **Emergency Mode**
   - Emergency channel prioritization
   - High-visibility UI for emergency communications
   - Priority messaging system
   - Emergency declaration and resolution

3. **Optimized Performance**
   - Efficient message rendering
   - Proper state management with React Context
   - Memoization of expensive operations
   - Clean component architecture

## Usage

```tsx
import { EarthAllianceCommunicationPanel } from './components/EarthAllianceCommunication';

const MyComponent = () => {
  return (
    <div className="communication-container">
      <EarthAllianceCommunicationPanel 
        endpoints={['wss://my-relay.example.com']} 
      />
    </div>
  );
};
```

## Implementation Guide

For further development, please refer to:
- `/docs/project-planning/communication-panel/EARTH-ALLIANCE-COMMUNICATION-PANEL-IMPLEMENTATION.md`
- `/docs/project-planning/communication-panel/EARTH-ALLIANCE-COMMUNICATION-PANEL-SPEC.md`

## Testing

Run tests with:

```
cd dapp
npm test -- --testPathPattern=EarthAllianceCommunication
```

## Future Improvements

- Add message search functionality
- Implement file attachments
- Add support for rich text messages
- Implement read receipts
- Add user presence indicators
- Create mobile-responsive version

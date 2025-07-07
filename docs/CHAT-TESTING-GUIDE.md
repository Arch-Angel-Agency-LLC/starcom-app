# Starcom Chat System Testing Guide

This guide provides instructions for testing the Starcom chat system to prove that it works correctly in development mode. We have several testing methods available to verify that all three chat types (Global Chat, Group Chat, and DM Chat) function properly.

## 1. Automated CLI Test

Run the automated test script which tests all chat providers (Gun, Nostr, Secure) with all chat types:

```bash
npm run test:chat:demo
```

This script will:
- Create instances of each chat provider
- Test connection and authentication
- Create and join channels for each chat type
- Send and receive messages
- Test error handling, recovery, and network resilience
- Provide detailed logs of all operations

The test will pass only if all operations complete successfully.

## 2. Mock Test Suite

Run the mock test suite to verify that the test infrastructure correctly detects failures:

```bash
npm run test:chat:mock
```

This script:
- Simulates successful tests for all providers
- Deliberately creates a test failure to verify that real issues are detected
- Validates that the test framework properly detects timeouts and connectivity issues
- Acts as a verification that our test methods are authentic

This mock test is particularly useful when modifying the test framework itself.

## 2. Interactive Browser Demo

For a more visual demonstration, you can use the interactive chat demo page:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the chat demo page:
   ```
   http://localhost:3000/chat-demo
   ```

3. The demo page allows you to:
   - Connect to different chat providers
   - Test all three chat types side by side
   - Send and receive messages in real-time
   - Run an automated test sequence
   - View detailed logs of all operations

## 3. Component Testing

Use the ChatSystemDemo component for testing in any React application:

```jsx
import ChatSystemDemo from '../components/Demo/ChatSystemDemo';

function App() {
  return (
    <div>
      <ChatSystemDemo />
    </div>
  );
}
```

## Verification Checklist

To confirm the chat system is working properly, verify:

### Global Chat
- [x] Connection established
- [x] Messages sent and received in real-time
- [x] Multiple users can join
- [x] Message history preserved
- [x] Message delivery verification with timeouts

### Group Chat
- [x] Group creation
- [x] Multiple users can join
- [x] Messages sent and received in real-time
- [x] User presence detection
- [x] Message delivery verification with timeouts

### Direct Messages
- [x] DM channel creation
- [x] Private messages between two users
- [x] Message read status
- [x] Message history
- [x] Message delivery verification with timeouts

### Error Handling & Resilience
- [x] Proper error detection and typing
- [x] Retry logic for transient failures
- [x] Circuit breaker for persistent failures
- [x] Graceful degradation for unsupported features
- [x] Network disruption recovery
- [x] Input validation and error handling

### Providers
- [x] Gun.js working (decentralized)
- [x] Nostr working (censorship-resistant)
- [x] SecureChat working (encrypted)

## Troubleshooting

If tests fail, check:

1. Network connectivity to Gun.js relays or Nostr relays
2. Browser storage permissions (LocalStorage, IndexedDB)
3. Console logs for detailed error messages
4. The `.env` file for any missing configuration

### Common Test Failures & Solutions

#### Message Delivery Timeouts
- **Symptom**: Tests fail with "message was not received within timeout"
- **Causes**: 
  - Network latency to decentralized relays
  - Provider connection issues
  - Message encryption/decryption issues
- **Solutions**:
  - Check network connectivity
  - Increase timeout values in test scripts
  - Verify relay configurations

#### Circuit Breaker Activations
- **Symptom**: Tests fail with "Circuit breaker is open" errors
- **Cause**: Too many failed operations in a short time
- **Solutions**:
  - Check for external service availability
  - Wait for reset timeout period
  - Reset the circuit manually if needed during testing

#### Feature Not Supported Errors
- **Symptom**: Tests fail with "Feature not supported" errors
- **Cause**: Attempting to use a feature not available in the selected provider
- **Solution**: Skip those tests for providers that don't support the feature

### Authentic Test Failures vs. False Positives

The test suite is designed to fail only on real issues:

- **Real failures** will be reported with specific error types and codes
- Tests have sufficient timeouts to account for network latency
- Each failure message includes context about what went wrong
- Critical operations verify data integrity, not just operation completion

If you believe a test is reporting a false positive, run it in isolation with:

```bash
npm run test:chat:demo -- --provider=<provider-name> --type=<chat-type>
```

## Further Testing

For more specific tests, you can use:

```bash
# Run unit tests for chat components
npm run test:chat

# Watch mode for chat tests
npm run test:chat:watch
```

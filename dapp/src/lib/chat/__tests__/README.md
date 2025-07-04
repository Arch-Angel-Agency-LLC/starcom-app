# Chat Test Suite

This directory contains unit tests for the chat system components.

## Quick Guide for Testing Chat in Development

For quick development testing, run:

```bash
npm run test:chat:dev
```

This runs a simplified test script that verifies basic chat functionality.

## Full Test Suite

To run all the chat-related unit tests:

```bash
npm run test:chat
```

## Test Files

- `ChatErrorHandling.test.ts` - Tests for error handling utilities
- `EnhancedErrorHandling.test.ts` - Tests for enhanced error handling
- `GunChatAdapter.test.ts` - Tests for Gun adapter
- `NostrChatAdapter.test.ts` - Tests for Nostr adapter
- `SecureChatAdapter.test.ts` - Tests for SecureChat adapter
- `EnhancedChatProvider.test.ts` - Tests for enhanced provider
- `ChatAdaptersCommon.test.ts` - Common test utilities

For more detailed documentation, see `/docs/CHAT-TESTING-GUIDE.md`

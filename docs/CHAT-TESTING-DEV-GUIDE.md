# Chat Testing in Development Guide

This guide provides instructions for testing the chat functionality during development.

## Quick Start

For a very basic test that verifies Gun DB connectivity and messaging functionality:

```bash
npm run test:chat:basic
```

For a more comprehensive test that doesn't require browser APIs:

```bash
npm run test:chat:mock:dev
```

For a comprehensive test of Gun DB features including global chat:

```bash
npm run test:chat:dev:new
```

## Available Test Scripts

| Script | Description |
|--------|-------------|
| `npm run test:chat:basic` | Basic connectivity test using Gun DB directly |
| `npm run test:chat:dev:new` | Comprehensive test with error handling, Gun DB features, and global chat |
| `npm run test:chat:mock:dev` | Mock provider test that works without external dependencies |
| `npm run test:chat` | Run all unit tests for chat components |
| `npm run test:chat:watch` | Run chat tests in watch mode |

## What Works Now

- Basic Gun DB connectivity and messaging (via `test:chat:basic`)
- Error handling utilities (via unit tests)
- Mock provider testing (via `test:chat:mock:dev`)
- Comprehensive Gun DB testing (via `test:chat:dev:new`)

## What's Being Fixed

We're working on resolving issues with:
- Adapter tests for specific chat providers (Gun, Nostr, Secure)
- Enhanced provider tests
- Developer experience with chat testing

## Troubleshooting

If you encounter issues with the tests:

1. Start with the basic test (`test:chat:basic`) to verify Gun DB functionality
2. Try the mock provider test (`test:chat:mock:dev`) to isolate from external dependencies
3. Check network connectivity
4. Ensure Gun server is running
5. Check for console errors

### Common Issues

#### "window is not defined" Error

This occurs when browser-specific APIs are used in Node.js tests:

- Use conditional checks before accessing browser APIs
- Create Node.js compatible alternatives for tests
- Use proper mocking in test files

#### Connection Issues

If you can't connect to Gun DB:

- Verify network connectivity
- Check if Gun DB peers are available
- Ensure proper configuration of Gun instances

#### Unhandled Promise Rejections

If you see unhandled promise rejection warnings:

- Add proper error handling to all async functions
- Ensure promises have catch blocks
- Use try/catch in async/await functions

## Development Tips

- The basic test validates the core messaging infrastructure without relying on adapters
- During development, focus on one adapter at a time
- Use `npm run test:chat:basic` as a quick sanity check
- Use `npm run test:chat:mock:dev` when working with error handling or events
- Use `npm run test:chat:dev:new` for more comprehensive Gun DB testing

## Testing Sequence for Developers

When developing chat features, follow this testing sequence:

1. Run basic connectivity test: `npm run test:chat:basic`
2. Run mock provider test: `npm run test:chat:mock:dev` 
3. Run comprehensive Gun DB test: `npm run test:chat:dev:new`
4. Run specific unit tests for the component you're working on

## Recent Fixes

- Added new dev-friendly test scripts that work in Node.js environment
- Created mock provider for testing without external dependencies
- Enhanced error handling testing
- Added comprehensive Gun DB feature testing

- Fixed syntax errors in EnhancedChatProvider.ts
- Created a basic test script that directly uses Gun DB
- Fixed import issues in error handling utilities

## Next Steps

1. Fix adapter-specific test files
2. Improve test coverage for all chat providers
3. Enhance end-to-end test scripts

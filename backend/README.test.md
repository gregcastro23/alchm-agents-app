# Quick Test Guide

## TL;DR

```bash
# Unit tests (fast, no setup)
yarn test:unit

# Integration tests (needs Docker)
yarn docker:test:up
yarn test:integration
yarn docker:test:down

# All tests
yarn test
```

## What's the Difference?

### Unit Tests 🏃‍♂️
- **Fast** (2-5 seconds)
- **No setup** required
- Uses **mocks** for dependencies
- Tests **logic in isolation**

### Integration Tests 🔗
- **Slower** (10-30 seconds)
- **Requires Docker** services
- Uses **real Redis, APIs**
- Tests **full system behavior**

## Directory Structure

```
tests/
├── unit/                    # ✅ Mocked, isolated tests
│   ├── routes/
│   └── services/
├── integration/             # ✅ Real services, full stack
│   ├── routes/
│   └── services/
└── helpers/                 # Shared test utilities
```

## When to Use Each

### Write Unit Tests When:
- Testing business logic
- Testing data transformations
- Testing utility functions
- Quick feedback during development

### Write Integration Tests When:
- Testing API endpoints
- Testing caching behavior
- Testing error handling with real failures
- Verifying service interactions

## Common Commands

```bash
# Development workflow
yarn test:unit              # Run unit tests
yarn test:watch             # Watch mode

# Before committing
yarn test                   # Run all tests

# Debugging
yarn docker:test:logs       # View service logs
yarn test:integration --verbose  # Verbose output
```

See [TESTING.md](TESTING.md) for complete documentation.

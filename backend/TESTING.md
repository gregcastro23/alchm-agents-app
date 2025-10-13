# Planetary Agents Backend - Testing Guide

## Overview

This project implements a comprehensive testing strategy with **unit tests** and **integration tests** running independently. This approach provides fast, isolated unit testing alongside full-stack integration testing with real services.

## Test Structure

```
backend/
├── tests/
│   ├── unit/                    # Unit tests with mocks
│   │   ├── routes/              # Route handler unit tests
│   │   └── services/            # Service layer unit tests
│   ├── integration/             # Integration tests with real services
│   │   ├── routes/              # Full API integration tests
│   │   └── services/            # Service integration tests
│   ├── e2e/                     # End-to-end tests (future)
│   ├── fixtures/                # Test data and mock servers
│   │   └── mock-api/            # Mock external API server
│   ├── helpers/                 # Test utilities
│   │   ├── test-server.ts       # Test server management
│   │   └── fixtures.ts          # Test data generators
│   ├── setup.ts                 # Unit test setup
│   └── setup.integration.ts     # Integration test setup
├── jest.config.unit.js          # Unit test configuration
├── jest.config.integration.js   # Integration test configuration
├── docker-compose.test.yml      # Test services (Redis, PostgreSQL, Mock API)
└── .env.test                    # Test environment variables
```

## Test Types

### Unit Tests

**Purpose:** Fast, isolated tests that verify individual components work correctly.

**Characteristics:**
- ✅ Use mocks for external dependencies
- ✅ Run in milliseconds
- ✅ Test logic in isolation
- ✅ No external service dependencies

**Run unit tests:**
```bash
# Run all unit tests
yarn test:unit

# Watch mode for development
yarn test:watch

# With coverage
yarn test:unit --coverage
```

**Example:** [tests/unit/routes/alchemy.test.ts:1](tests/unit/routes/alchemy.test.ts#L1)

### Integration Tests

**Purpose:** Verify that components work together correctly with real services.

**Characteristics:**
- ✅ Use real Redis, PostgreSQL, external APIs
- ✅ Test full request/response cycles
- ✅ Verify caching behavior
- ✅ Test error handling with real failures

**Run integration tests:**
```bash
# Start test services
yarn docker:test:up

# Wait for services to be ready (check health)
docker-compose -f docker-compose.test.yml ps

# Run integration tests
yarn test:integration

# Stop test services when done
yarn docker:test:down
```

**Example:** [tests/integration/routes/alchemy.integration.test.ts:1](tests/integration/routes/alchemy.integration.test.ts#L1)

## Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Run Unit Tests (No Setup Required)

```bash
yarn test:unit
```

Unit tests use mocks and require no external services.

### 3. Run Integration Tests

```bash
# Start required services (Redis, Mock API)
yarn docker:test:up

# Verify services are running
docker-compose -f docker-compose.test.yml ps

# Run integration tests
yarn test:integration

# Stop services
yarn docker:test:down
```

### 4. Run All Tests

```bash
# Starts services, runs all tests, generates coverage
yarn test
```

## Docker Test Services

The `docker-compose.test.yml` provides isolated test services:

### Redis (Port 6380)
- Purpose: Cache testing
- Memory limit: 256MB
- Health check enabled

### PostgreSQL (Port 5433)
- Purpose: Database integration tests
- Database: `planetary_agents_test`
- Credentials: test_user/test_password

### Mock API (Port 9000)
- Purpose: Simulates external alchm-backend API
- Endpoints: `/horoscope`, `/planetary`, `/alchemy/calculate`
- Returns deterministic test data

**Service Management:**

```bash
# Start all test services
yarn docker:test:up

# View logs
yarn docker:test:logs

# Check service health
docker-compose -f docker-compose.test.yml ps

# Stop services
yarn docker:test:down

# Remove volumes (clean slate)
docker-compose -f docker-compose.test.yml down -v
```

## Test Scripts

| Script | Description |
|--------|-------------|
| `yarn test` | Run all tests (unit + integration) |
| `yarn test:unit` | Run only unit tests |
| `yarn test:integration` | Run only integration tests |
| `yarn test:watch` | Run unit tests in watch mode |
| `yarn test:coverage` | Generate coverage reports |
| `yarn test:ci` | CI-optimized test run |
| `yarn docker:test:up` | Start test services |
| `yarn docker:test:down` | Stop test services |
| `yarn docker:test:logs` | View test service logs |

## Writing Tests

### Unit Test Example

```typescript
// tests/unit/services/example.test.ts
import { describe, it, expect, jest } from '@jest/globals'
import { myService } from '../../../src/services/my-service.js'

// Mock external dependencies
jest.mock('../../../src/services/cache.js', () => ({
  cacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
  },
}))

describe('My Service', () => {
  it('should perform calculation', () => {
    const result = myService.calculate(10, 20)
    expect(result).toBe(30)
  })
})
```

### Integration Test Example

```typescript
// tests/integration/routes/example.integration.test.ts
import request from 'supertest'
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import {
  TestServer,
  setupIntegrationTestEnv,
  cleanupIntegrationTestEnv,
  generateTestToken,
} from '../../helpers/test-server.js'
import app from '../../../src/app.js'

describe('Example API Integration', () => {
  let testServer: TestServer
  let authToken: string

  beforeAll(async () => {
    await setupIntegrationTestEnv()
    testServer = new TestServer(app)
    await testServer.start()
    authToken = generateTestToken()
  })

  afterAll(async () => {
    await testServer.stop()
    await cleanupIntegrationTestEnv()
  })

  it('should process request with real services', async () => {
    const response = await request(testServer.getUrl())
      .post('/api/endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ data: 'test' })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })
})
```

## Test Helpers

### TestServer

Manages server lifecycle for integration tests:

```typescript
const testServer = new TestServer(app, port)
await testServer.start() // Returns base URL
await testServer.stop()
```

### setupIntegrationTestEnv()

Prepares environment for integration tests:
- Connects to Redis
- Sets test environment variables
- Configures external API URLs

### cleanupIntegrationTestEnv()

Cleans up after integration tests:
- Flushes Redis cache
- Disconnects services

### generateTestToken()

Creates JWT tokens for authenticated requests:

```typescript
const token = generateTestToken({ userId: 'test-user' })
```

## Test Fixtures

Pre-defined test data in [tests/helpers/fixtures.ts:1](tests/helpers/fixtures.ts#L1):

```typescript
import { validBirthInfo, validLocation, validTokens } from '../../helpers/fixtures.js'

// Use in tests
const birthData = generateBirthData({ year: 2000 })
const location = generateLocation({ lat: 51.5074 })
```

## Continuous Integration

### GitHub Actions / GitLab CI

```yaml
test:
  script:
    # Start test services
    - docker-compose -f docker-compose.test.yml up -d

    # Wait for services to be ready
    - sleep 10

    # Run tests
    - yarn test:ci

    # Cleanup
    - docker-compose -f docker-compose.test.yml down
  artifacts:
    reports:
      junit: junit-*.xml
      coverage: coverage/
```

## Coverage Reports

Generate coverage reports:

```bash
yarn test:coverage
```

Coverage reports are generated in:
- `coverage/unit/` - Unit test coverage
- `coverage/integration/` - Integration test coverage

Open HTML reports:
```bash
open coverage/unit/lcov-report/index.html
open coverage/integration/lcov-report/index.html
```

## Troubleshooting

### Integration Tests Fail to Connect

**Problem:** Tests timeout or fail to connect to services.

**Solution:**
```bash
# Check service status
docker-compose -f docker-compose.test.yml ps

# View service logs
yarn docker:test:logs

# Restart services
yarn docker:test:down
yarn docker:test:up
```

### Port Conflicts

**Problem:** Ports 6380, 5433, or 9000 already in use.

**Solution:**
```bash
# Find processes using ports
lsof -i :6380
lsof -i :5433
lsof -i :9000

# Kill processes or change ports in docker-compose.test.yml
```

### Redis Connection Issues

**Problem:** Integration tests can't connect to Redis.

**Solution:**
1. Check Redis is running: `docker-compose -f docker-compose.test.yml ps`
2. Verify environment variable: `echo $REDIS_TEST_URL`
3. Update `.env.test` if needed

### Mock API Not Responding

**Problem:** Integration tests fail with external API errors.

**Solution:**
```bash
# Check mock API health
curl http://localhost:9000/health

# View mock API logs
docker-compose -f docker-compose.test.yml logs mock-alchm-backend

# Restart mock API
docker-compose -f docker-compose.test.yml restart mock-alchm-backend
```

## Best Practices

### ✅ DO

- Write unit tests for business logic
- Write integration tests for API endpoints
- Use fixtures for test data
- Clean up resources in `afterAll()`
- Test error cases
- Test edge cases
- Use descriptive test names

### ❌ DON'T

- Make external API calls in unit tests
- Share state between tests
- Use hardcoded ports (use 0 for auto-assignment)
- Skip cleanup in `afterAll()`
- Test implementation details
- Write flaky tests with race conditions

## Performance Benchmarks

**Unit Tests:** ~2-5 seconds for full suite
**Integration Tests:** ~10-30 seconds (includes Docker startup)

Target:
- Unit tests: < 5s
- Integration tests: < 60s
- E2E tests: < 5 minutes

## Next Steps

1. **Add more integration tests** for remaining routes
2. **Implement E2E tests** with Playwright
3. **Add performance tests** for load testing
4. **Set up CI/CD pipeline** with automated testing
5. **Add mutation testing** to verify test quality

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Questions?** Open an issue or check the [CLAUDE.md](../CLAUDE.md) for project context.

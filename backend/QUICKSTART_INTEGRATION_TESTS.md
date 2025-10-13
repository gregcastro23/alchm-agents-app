# Quick Start - Integration Tests

## 🎯 Goal

Run integration tests that use **real services** (Redis, PostgreSQL, Mock APIs) instead of mocks.

## ⚡ Quick Commands

### Run Unit Tests (No Setup)
```bash
yarn test:unit
```
**Time:** ~5 seconds
**No Docker needed**

### Run Integration Tests (With Docker)
```bash
# 1. Start services
yarn docker:test:up

# 2. Wait 10 seconds for services to start
# (Check: docker-compose -f docker-compose.test.yml ps)

# 3. Run tests
yarn test:integration

# 4. Stop services
yarn docker:test:down
```
**Time:** ~30 seconds
**Docker required**

## 🔍 What's the Difference?

| Feature | Unit Tests | Integration Tests |
|---------|-----------|-------------------|
| **Speed** | 🚀 Fast (2-5s) | 🐢 Slower (10-30s) |
| **Setup** | ✅ None | 🐳 Docker required |
| **Dependencies** | 🎭 Mocked | ✅ Real services |
| **Use Case** | Quick feedback | Full verification |

## 🐳 Docker Services

The integration tests use:

- **Redis** (port 6380) - Cache testing
- **PostgreSQL** (port 5433) - Database testing
- **Mock API** (port 9000) - External API simulation

## 📝 Examples

### Integration Test Example
```typescript
// tests/integration/services/cache.integration.test.ts
it('should set and get values from real Redis', async () => {
  const key = 'test:key'
  const value = { data: 'test-value' }

  await cacheService.set(key, value, 60) // Real Redis call
  const retrieved = await cacheService.get(key) // Real Redis call

  expect(retrieved).toEqual(value)
})
```

### Unit Test Example (Compare)
```typescript
// tests/unit/services/cache.test.ts
jest.mock('redis') // <-- Mocked, not real

it('should set and get values', () => {
  // Tests logic, not real Redis
})
```

## 🔧 Troubleshooting

### Services Won't Start
```bash
# Check ports aren't in use
lsof -i :6380
lsof -i :5433
lsof -i :9000

# View logs
yarn docker:test:logs
```

### Tests Timeout
```bash
# Verify services are healthy
docker-compose -f docker-compose.test.yml ps

# Restart services
yarn docker:test:down
yarn docker:test:up
```

## 📚 Full Documentation

See [TESTING.md](TESTING.md) for complete documentation.

## ✅ Success Criteria

```bash
# Should see:
Test Suites: X passed, X total
Tests:       X passed, X total
```

All tests green = ✅ Ready for production!

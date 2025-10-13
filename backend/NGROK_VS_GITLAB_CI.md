# ngrok vs GitLab CI - Integration Guide

## TL;DR

**For local development:** ✅ Use ngrok
**For CI/CD testing:** ✅ Use GitLab services (Docker)
**For production:** ✅ Use proper hosting (Render, Vercel, etc.)

## Current Setup

### ✅ Local Development (Using ngrok)

**Backend Server:**
- Local: http://localhost:8000
- Public: https://idiodynamic-quadrilaterally-roberta.ngrok-free.dev
- Status: Running

**Use cases:**
- Testing from mobile devices
- Sharing with team members
- Webhook testing
- External API integration testing

**Start ngrok:**
```bash
cd backend
yarn dev  # or: npx tsx src/index.ts

# In another terminal
ngrok http 8000
```

### ✅ GitLab CI (Using Docker Services)

**Test Infrastructure:**
- Redis (in-memory cache)
- PostgreSQL (database)
- Mock API servers
- Full integration testing

**Configuration:** [.gitlab-ci.yml:88](.gitlab-ci.yml#L88)

```yaml
backend:test:integration:
  services:
    - name: redis:7-alpine
      alias: redis
    - name: postgres:15-alpine
      alias: postgres
```

## Why NOT Use ngrok in GitLab CI?

### ❌ Problems with ngrok in CI/CD

1. **Temporary URLs**
   - Every CI run gets a new URL
   - URLs expire after the session
   - Can't hardcode URLs in tests

2. **Authentication Required**
   - Need ngrok auth token in CI
   - Exposes credentials
   - Rate limits on free tier

3. **Network Overhead**
   - Adds latency to tests
   - External dependency (ngrok servers)
   - Can cause test failures

4. **Security Concerns**
   - Exposes CI environment publicly
   - Potential attack surface
   - Not necessary for testing

5. **Cost**
   - Free tier limited
   - CI minutes wasted on tunnel setup
   - No business value

## ✅ Correct Approach: GitLab Services

### How GitLab Services Work

GitLab creates isolated Docker containers for each CI job:

```
┌─────────────────────────────────────┐
│  GitLab CI Runner                   │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │ Your Tests   │──│   Redis     │ │
│  │ (backend)    │  │   :6379     │ │
│  └──────────────┘  └─────────────┘ │
│         │                           │
│         │          ┌─────────────┐  │
│         └──────────│  PostgreSQL │  │
│                    │   :5432     │  │
│                    └─────────────┘  │
└─────────────────────────────────────┘
```

### Benefits

✅ **Fast** - Local containers, no network overhead
✅ **Reliable** - No external dependencies
✅ **Free** - Included in GitLab
✅ **Isolated** - Clean state for each test
✅ **Secure** - No public exposure

## Updated GitLab CI Configuration

### Unit Tests (Fast, No Services)

```yaml
backend:test:unit:
  stage: test
  script:
    - cd backend
    - yarn test:unit --ci
```

**Time:** ~5-10 seconds
**Dependencies:** None
**Uses:** Mocks

### Integration Tests (With Real Services)

```yaml
backend:test:integration:
  stage: test
  services:
    - name: redis:7-alpine
      alias: redis
    - name: postgres:15-alpine
      alias: postgres
  variables:
    REDIS_TEST_URL: 'redis://redis:6379'
  script:
    - cd backend
    - yarn test:integration --ci
```

**Time:** ~30-60 seconds
**Dependencies:** Redis, PostgreSQL, Mock API
**Uses:** Real services

## When to Use ngrok

### ✅ Good Use Cases

1. **Local Development**
   ```bash
   # Share your local server with team
   ngrok http 8000
   ```

2. **Mobile Testing**
   ```bash
   # Test on physical devices
   ngrok http 3000
   ```

3. **Webhook Development**
   ```bash
   # Test webhooks from external services
   ngrok http 8000
   curl https://your-url.ngrok.io/webhook
   ```

4. **Demo to Clients**
   ```bash
   # Quick demo without deployment
   ngrok http 3000
   ```

### ❌ Bad Use Cases

1. **CI/CD Testing** - Use GitLab services
2. **Production** - Use proper hosting
3. **Long-term URLs** - Use custom domains
4. **High traffic** - Use scalable hosting

## Current Integration Test Flow

### Local (Docker Compose)

```bash
# Start test services
yarn docker:test:up

# Run integration tests
yarn test:integration

# Stop services
yarn docker:test:down
```

**Services:**
- Redis: localhost:6380
- PostgreSQL: localhost:5433
- Mock API: localhost:9000

### GitLab CI (Automatic)

```yaml
# GitLab automatically:
# 1. Starts Redis container
# 2. Starts PostgreSQL container
# 3. Starts mock API
# 4. Runs tests
# 5. Cleans up
```

**No ngrok needed!**

## Comparison Table

| Feature | ngrok | GitLab Services | Docker Compose |
|---------|-------|-----------------|----------------|
| **Speed** | Slow | Fast | Fast |
| **Setup** | Easy | Automatic | Manual |
| **Cost** | Free tier limited | Free | Free |
| **Public URL** | ✅ Yes | ❌ No | ❌ No |
| **CI/CD** | ❌ Not ideal | ✅ Perfect | ⚠️ Possible |
| **Security** | ⚠️ Public | ✅ Isolated | ✅ Local |
| **Reliability** | ⚠️ External | ✅ High | ✅ High |

## Migration Path

### Phase 1: Local Development ✅ DONE
- [x] Unit tests with mocks
- [x] Docker Compose for integration tests
- [x] ngrok for public access (development only)

### Phase 2: CI/CD ✅ DONE
- [x] GitLab CI with Docker services
- [x] Separate unit and integration test jobs
- [x] Coverage reports
- [x] JUnit XML artifacts

### Phase 3: Production (Future)
- [ ] Deploy to Render/Vercel
- [ ] Custom domain setup
- [ ] Production monitoring
- [ ] Real external API integration

## Example: Testing External Webhooks

### Local Development (Using ngrok)

```bash
# Terminal 1: Start backend
cd backend
yarn dev

# Terminal 2: Start ngrok
ngrok http 8000

# Use ngrok URL for webhook
# https://your-url.ngrok.io/api/webhook
```

### CI/CD (Using Mock Server)

```yaml
# tests/fixtures/mock-api/server.js
app.post('/webhook', (req, res) => {
  // Mock external service
  res.json({ success: true })
})

# Test calls this mock server
# No ngrok needed!
```

## Debugging GitLab CI

### View CI Logs

```bash
# In GitLab UI:
# 1. Go to CI/CD > Pipelines
# 2. Click on pipeline
# 3. Click on job
# 4. View logs
```

### Test Locally with GitLab Runner

```bash
# Install gitlab-runner
brew install gitlab-runner

# Run CI job locally
gitlab-runner exec docker backend:test:integration
```

## Best Practices

### ✅ DO

- Use ngrok for local development
- Use GitLab services for CI/CD
- Use Docker Compose for local integration tests
- Keep test data in fixtures
- Mock external APIs in tests

### ❌ DON'T

- Use ngrok in CI/CD pipelines
- Expose CI environment publicly
- Hardcode ngrok URLs
- Use ngrok for production
- Rely on external services in tests

## Summary

**ngrok:** Great for local development, demos, and webhooks
**GitLab CI:** Perfect for automated testing with Docker services
**Integration:** They complement each other, not replace

**Current Status:**
- ✅ Backend running locally
- ✅ ngrok tunnel active: https://idiodynamic-quadrilaterally-roberta.ngrok-free.dev
- ✅ GitLab CI configured with Docker services
- ✅ Integration tests ready for CI/CD

---

**Questions?**
- ngrok documentation: https://ngrok.com/docs
- GitLab CI services: https://docs.gitlab.com/ee/ci/services/
- Our test setup: [TESTING.md](TESTING.md)

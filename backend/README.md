# Planetary Agents Backend

A comprehensive backend gateway service for alchemical calculations and data orchestration, built with Express.js and TypeScript.

## 🌟 Features

- **🔗 Backend-to-Backend Communication**: Seamless integration with existing alchm-backend service
- **🌙 Planetary Hour Calculations**: Server-side planetary hour calculations with caching
- **🔥 Alchemical Thermodynamics**: Heat, entropy, and reactivity calculations
- **💰 Token Rate System**: Dynamic token pricing with planetary influences
- **⚡ Kinetics Integration**: Enhanced kinetics calculations with optimizations
- **🔄 Real-time WebSocket**: Live updates for planetary and token data
- **📊 Intelligent Caching**: Redis with memory fallback for optimal performance
- **🚦 Feature Flags**: Progressive rollout with graceful fallbacks
- **🔧 Circuit Breaker**: Resilient external service integration
- **📈 Observability**: Comprehensive logging and health checks

## 🏗️ Architecture

```
React Frontend (Display only)
     │
     └──► New Backend (Gateway/Orchestrator)
              │
              ├──► alchm-backend - Core alchemy, image generation
              ├──► Calculations - Planetary hours, token rates
              └──► Data persistence - Time series, user data
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis (optional, falls back to memory cache)
- Access to alchm-backend service

### Installation

```bash
cd backend
yarn install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Start development server
yarn dev

# Run tests
yarn test

# Run tests in watch mode
yarn test:watch

# Build for production
yarn build

# Start production server
yarn start
```

## 📡 API Endpoints

### Health & Status

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with dependency testing

### Planetary Hours

- `POST /api/planetary/current-hour` - Get current planetary hour
- `POST /api/planetary/forecast` - Get planetary hour forecast
- `POST /api/planetary/optimal-times` - Get optimal times for specific planet
- `GET /api/planetary/planets` - List available planets

### Alchemy

- `POST /api/alchemy/calculate` - Calculate alchemical properties
- `POST /api/alchemy/thermodynamics` - Calculate thermodynamic properties
- `POST /api/alchemy/batch-thermodynamics` - Batch thermodynamics calculation
- `POST /api/alchemy/imaginize` - Generate alchemical images
- `GET /api/alchemy/status` - Get alchemy service status

### Live Consciousness - NEW!

- `POST /api/consciousness/live` - Calculate live consciousness for single agent
- `POST /api/consciousness/batch` - Batch live consciousness calculation (up to 10 agents)
- `GET /api/consciousness/status` - Get consciousness system status and performance metrics

**Live Consciousness Features:**
- Real-time birth chart transformation with current planetary transits
- Dynamic Monica Constant (MC) and Kalchm calculations
- Consciousness level classification and interpretations
- Redis caching with 1-hour TTL for performance
- Rate limiting (30 requests/minute) for resource protection
- Batch processing for multiple agents simultaneously

### Token System

- `POST /api/tokens/calculate` - Calculate token rates
- `POST /api/tokens/historical` - Get historical token data
- `POST /api/tokens/projections` - Get token rate projections
- `POST /api/tokens/events` - Get upcoming token events
- `GET /api/tokens/info` - Get token information

### Kinetics

- `POST /api/kinetics/enhanced` - Enhanced kinetics calculation
- `POST /api/kinetics/group` - Group dynamics calculation
- `POST /api/kinetics/token` - Token-specific kinetics
- `GET /api/kinetics/status` - Get kinetics system status

## 🌐 WebSocket API

Connect to `ws://localhost:8001` (or configured WebSocket port)

### Available Channels

- `planetary-hours` - Real-time planetary hour updates
- `token-rates` - Live token rate changes
- `thermodynamics` - Thermodynamic calculations
- `kinetics-power` - Kinetics power level updates

### Message Format

```javascript
// Subscribe to channel
{
  "type": "subscribe",
  "channel": "planetary-hours",
  "data": {
    "location": { "lat": 37.7749, "lon": -122.4194 }
  }
}

// Request data
{
  "type": "request",
  "requestId": "unique-id",
  "data": {
    "action": "getCurrentPlanetaryHour",
    "datetime": "2025-01-01T12:00:00Z"
  }
}

// Unsubscribe
{
  "type": "unsubscribe",
  "channel": "planetary-hours"
}
```

## 🎛️ Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=8000
HOST=localhost

# External Services
ALCHM_BACKEND_URL=https://alchm-backend.onrender.com
ALCHM_BACKEND_TIMEOUT=30000
ALCHM_BACKEND_MAX_RETRIES=3

# Feature Flags
PLANETARY_HOURS_BACKEND=true
THERMODYNAMICS_BACKEND=true
TOKEN_CALCULATIONS_BACKEND=true
KINETICS_BACKEND=true

# Caching
REDIS_URL=redis://localhost:6379
CACHE_TTL_PLANETARY_HOURS=3600
CACHE_TTL_THERMODYNAMICS=86400
CACHE_TTL_TOKEN_CALCULATIONS=300

# WebSocket
ENABLE_WEBSOCKET=true
WEBSOCKET_PORT=8001

# Security
CORS_ORIGIN=http://localhost:3000,https://your-domain.com
```

### Feature Flags

The backend supports progressive rollout through feature flags:

- `PLANETARY_HOURS_BACKEND` - Enable server-side planetary hour calculations
- `THERMODYNAMICS_BACKEND` - Enable server-side thermodynamics
- `TOKEN_CALCULATIONS_BACKEND` - Enable server-side token calculations
- `KINETICS_BACKEND` - Enable enhanced kinetics processing

When disabled, the frontend gracefully falls back to client-side calculations.

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run with coverage
yarn test --coverage

# Run specific test suite
yarn test planetary-hours

# Run integration tests
yarn test:integration
```

### Test Categories

- **Unit Tests**: Individual service and utility testing
- **Integration Tests**: API endpoint testing
- **Performance Tests**: Response time and throughput validation
- **Cache Tests**: Redis and memory cache functionality

## 📊 Monitoring & Observability

### Health Checks

The service provides comprehensive health monitoring:

```bash
# Basic health check
curl http://localhost:8000/api/health

# Detailed health with dependency testing
curl http://localhost:8000/api/health/detailed
```

### Logging

Structured logging with Winston:

- **Development**: Colorized console output
- **Production**: JSON format with file rotation
- **Levels**: error, warn, info, debug

### Metrics

- Response times for all endpoints
- Cache hit/miss ratios
- Circuit breaker status
- WebSocket connection counts

## 🔧 Development

### Project Structure

```
backend/
├── src/
│   ├── services/          # Core business logic
│   │   ├── alchm-client.ts      # Backend-to-backend communication
│   │   ├── planetary-hours.ts   # Planetary hour calculations
│   │   ├── thermodynamics.ts    # Thermodynamic calculations
│   │   ├── token-calculator.ts  # Token rate calculations
│   │   └── cache.ts             # Caching service
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   ├── websocket/         # WebSocket handlers
│   ├── utils/             # Utilities and helpers
│   └── index.ts           # Application entry point
├── tests/                 # Test suites
├── dist/                  # Compiled JavaScript (generated)
└── coverage/              # Test coverage reports (generated)
```

### Adding New Services

1. Create service in `src/services/`
2. Add corresponding route in `src/routes/`
3. Update main router in `src/index.ts`
4. Add tests in `tests/services/`
5. Update documentation

### Code Style

- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Comprehensive JSDoc comments

## 🚀 Deployment

### Production Build

```bash
yarn build
yarn start
```

### Render Deployment (Recommended)

This backend is optimized for deployment on [Render](https://render.com). Follow these steps:

#### 1. Quick Deploy with render.yaml

```bash
# Push your code to GitHub/GitLab
git add .
git commit -m "Prepare for Render deployment"
git push origin main

# In Render dashboard:
# 1. Create new Web Service
# 2. Connect your repository
# 3. Use the included render.yaml for automatic configuration
```

#### 2. Manual Configuration

If not using render.yaml, configure these settings in Render dashboard:

**Build & Deploy:**
- Build Command: `yarn install && yarn build`
- Start Command: `yarn start`
- Environment: `Node.js`

**Required Environment Variables:**
```bash
NODE_ENV=production
ENABLE_KINETICS_BACKEND=true
ENABLE_CONSCIOUSNESS_BACKEND=true
ENABLE_PLANETARY_BACKEND=true
ENABLE_TOKEN_BACKEND=true
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

**Optional Environment Variables:**
```bash
REDIS_URL=redis://username:password@host:port  # For Redis addon
LOG_LEVEL=info
RATE_LIMIT_REQUESTS_PER_MINUTE=100
MAX_REQUEST_SIZE_MB=2
```

#### 3. Post-Deployment Checklist

```bash
# ✅ Health check
curl https://your-service.onrender.com/api/health

# ✅ Test core endpoints
curl -X POST https://your-service.onrender.com/api/planetary/current-hour \
  -H "Content-Type: application/json" \
  -d '{"location":{"lat":37.7749,"lon":-122.4194}}'

# ✅ Update frontend environment variables
NEXT_PUBLIC_BACKEND_URL=https://your-service.onrender.com
```

### Alternative Deployment Options

#### Docker Deployment

Use the included production Dockerfile:

```bash
# Build image
docker build -f Dockerfile.production -t planetary-agents-backend .

# Run container
docker run -p 8000:8000 -p 8001:8001 \
  -e NODE_ENV=production \
  -e ENABLE_KINETICS_BACKEND=true \
  planetary-agents-backend
```

#### Traditional VPS Deployment

```bash
# On your server
git clone https://github.com/your-repo/planetary-agents.git
cd planetary-agents/backend

# Install dependencies
yarn install --production

# Build application
yarn build

# Set up environment
cp .env.example .env
# Edit .env with your production values

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name "planetary-backend"
pm2 startup
pm2 save
```

### Environment Considerations

- **Development**: Full logging, hot reload, debug features
- **Production**: Optimized logging, file rotation, metrics collection
- **Testing**: Minimal logging, mock external services

### Production Validation

The backend includes automatic production validation that checks:

- ✅ Required environment variables
- ✅ Security configuration
- ✅ Resource limits
- ✅ External service connectivity
- ✅ Cache configuration

Failed validation will prevent startup to ensure production readiness.

### Performance Tuning

For production workloads:

```bash
# Environment variables for optimization
PLANETARY_CACHE_TTL=120        # 2 minutes for planetary data
CONSCIOUSNESS_CACHE_TTL=300    # 5 minutes for consciousness calculations
KINETICS_CACHE_TTL=120         # 2 minutes for kinetics
TOKEN_CACHE_TTL=60            # 1 minute for token rates

# Rate limiting for your traffic
RATE_LIMIT_REQUESTS_PER_MINUTE=200  # Adjust based on expected load

# Redis for scaling (recommended for production)
REDIS_URL=redis://your-redis-instance
```

### Monitoring & Alerting

Set up monitoring for these metrics:

- Health check endpoint: `/api/health`
- Response times < 500ms
- Error rate < 1%
- Cache hit ratio > 80%
- Memory usage < 80%

### Troubleshooting

**Common Issues:**

1. **503 Service Unavailable**
   - Check feature flags are enabled
   - Verify environment variables
   - Check health endpoint for details

2. **External Service Errors**
   - alchm-backend connectivity issues are expected and handled gracefully
   - Check circuit breaker status in health endpoint

3. **Memory Issues**
   - Enable Redis for better caching
   - Monitor cache cleanup intervals
   - Check for memory leaks in logs

4. **Performance Issues**
   - Verify Redis connectivity
   - Check cache hit ratios
   - Monitor rate limiting thresholds

**Debug Commands:**
```bash
# Check service health
curl https://your-service.onrender.com/api/health | jq

# Verify environment
curl https://your-service.onrender.com/ | jq '.environment'

# Test specific endpoints
curl -X POST https://your-service.onrender.com/api/planetary/current-hour \
  -H "Content-Type: application/json" \
  -d '{"location":{"lat":40.7128,"lon":-74.0060}}'
```

## 🔒 Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests/15 minutes per IP)
- Input validation with express-validator
- Circuit breaker for external service protection

## 📈 Performance

- Sub-200ms response time targets
- Intelligent caching with TTL strategies
- Request coalescing for duplicate requests
- Connection pooling for external services
- WebSocket for real-time updates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes with tests
4. Ensure all tests pass (`yarn test`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: This README and inline code documentation
- **Health Check**: `/api/health/detailed` endpoint for system status

## Package Manager

- Use Yarn 4 only. This repo is configured for Yarn (`packageManager: yarn@4.0.0`).
- NPM Docker/render configs are deprecated: `Dockerfile.npm`, `render-npm.yaml`.

## Build & Run

```bash
yarn install --frozen-lockfile
yarn build
yarn start
```

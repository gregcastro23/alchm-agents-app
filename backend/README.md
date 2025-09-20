# Planetary Agents Backend Service

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

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install --production
COPY dist ./dist
EXPOSE 8000
CMD ["node", "dist/index.js"]
```

### Environment Considerations

- **Development**: Full logging, hot reload, debug features
- **Production**: Optimized logging, file rotation, metrics collection
- **Testing**: Minimal logging, mock external services

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

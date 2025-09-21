import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import { logger } from './utils/logger.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { requestLogger } from './middleware/request-logger.js'
import { featureFlagMiddleware } from './middleware/feature-flags.js'
import { cacheService } from './services/cache.js'

// Routes
import alchemyRoutes from './routes/alchemy.js'
import planetaryRoutes from './routes/planetary.js'
import tokenRoutes from './routes/tokens.js'
import kineticsRoutes from './routes/kinetics.js'
import consciousnessRoutes from './routes/consciousness.js'
import healthRoutes from './routes/health.js'

// WebSocket handlers
import { setupWebSocketHandlers } from './websocket/handlers.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000
const HOST = process.env.HOST || 'localhost'
const ENABLE_WEBSOCKET = process.env.ENABLE_WEBSOCKET === 'true'

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow for development
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// Compression and parsing
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// Custom middleware
app.use(requestLogger)
app.use(featureFlagMiddleware)

// API Routes
app.use('/api/health', healthRoutes)
app.use('/api/alchemy', alchemyRoutes)
app.use('/api/planetary', planetaryRoutes)
app.use('/api/tokens', tokenRoutes)
app.use('/api/kinetics', kineticsRoutes)
app.use('/api/consciousness', consciousnessRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Planetary Agents Backend',
    version: '1.0.0',
    description: 'Gateway service for alchemical calculations and data orchestration',
    endpoints: {
      health: '/api/health',
      alchemy: '/api/alchemy',
      planetary: '/api/planetary',
      tokens: '/api/tokens',
      kinetics: '/api/kinetics',
      consciousness: '/api/consciousness'
    },
    timestamp: new Date().toISOString()
  })
})

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Initialize cache service
async function initializeServices() {
  try {
    await cacheService.connect()
    logger.info('Cache service initialized')
  } catch (error) {
    logger.warn('Cache service initialization failed, using memory fallback:', error)
  }
}

// Start server
async function startServer() {
  await initializeServices()
  
  const server = createServer(app)
  
  // Setup WebSocket if enabled
  if (ENABLE_WEBSOCKET) {
    const wsPort = parseInt(process.env.WEBSOCKET_PORT || '8001')
    const wss = new WebSocketServer({ port: wsPort })
    setupWebSocketHandlers(wss)
    logger.info(`WebSocket server started on port ${wsPort}`)
  }
  
  server.listen(PORT, HOST, () => {
    logger.info(`🚀 Planetary Agents Backend started`)
    logger.info(`📍 Server: http://${HOST}:${PORT}`)
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
    logger.info(`💾 Cache: ${process.env.REDIS_URL ? 'Redis' : 'Memory'}`)
    logger.info(`🔧 Feature Flags: ${Object.keys(process.env).filter(k => k.endsWith('_BACKEND')).join(', ')}`)
  })
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully')
    server.close(() => {
      cacheService.disconnect()
      process.exit(0)
    })
  })
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error)
  process.exit(1)
})

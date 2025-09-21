import { Router as createRouter, type Request, type Response } from 'express'
import type { Router as ExpressRouter } from 'express'
import { body, validationResult } from 'express-validator'
import { asyncHandler, AppError } from '../middleware/error-handler.js'
import { cacheService } from '../services/cache.js'
import {
  calculateEnhancedKinetics,
  calculateGroupDynamics,
  calculateTokenKinetics
} from '../services/kinetics-service.js'

const router: ExpressRouter = createRouter()

/**
 * POST /api/kinetics/enhanced
 * Enhanced kinetics calculation with backend optimizations
 * This mirrors the existing Next.js API but with improved caching and processing
 */
router.post('/enhanced', [
  body('location.lat').isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90'),
  body('location.lon').isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180'),
  body('options.includeAgentOptimization').optional().isBoolean(),
  body('options.includePowerPrediction').optional().isBoolean(),
  body('options.includeResonanceMap').optional().isBoolean(),
  body('options.agentIds').optional().isArray()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400)
  }

  if (!req.featureFlags.kineticsBackend) {
    throw new AppError('Kinetics backend is disabled', 503)
  }

  const { location, options = {} } = req.body
  const startTime = Date.now()

  // Check cache first
  const cacheKey = `kinetics:${location.lat}:${location.lon}:${JSON.stringify(options)}`
  const cached = await cacheService.get(cacheKey)

  if (cached) {
    return res.json({
      success: true,
      data: cached,
      computeTimeMs: 0,
      cacheHit: true,
      metadata: {
        location,
        options,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Calculate real kinetics data
  const data = await calculateEnhancedKinetics(location, options)

  // Cache the result for 2 minutes
  await cacheService.set(cacheKey, data, 120)

  const computeTime = Date.now() - startTime

  res.json({
    success: true,
    data,
    computeTimeMs: computeTime,
    cacheHit: false,
    metadata: {
      location,
      options,
      timestamp: new Date().toISOString()
    }
  })
}))

/**
 * POST /api/kinetics/group
 * Group dynamics calculation for multiple agents
 */
router.post('/group', [
  body('agentIds').isArray({ min: 2, max: 10 }).withMessage('agentIds must be array with 2-10 items'),
  body('location.lat').isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90'),
  body('location.lon').isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400)
  }

  if (!req.featureFlags.kineticsBackend) {
    throw new AppError('Kinetics backend is disabled', 503)
  }

  const { agentIds, location } = req.body
  const startTime = Date.now()

  // Check cache first
  const cacheKey = `group:${agentIds.sort().join(',')}:${location.lat}:${location.lon}`
  const cached = await cacheService.get(cacheKey)

  if (cached) {
    return res.json({
      success: true,
      data: cached,
      computeTimeMs: 0,
      cacheHit: true,
      metadata: {
        agentCount: agentIds.length,
        location,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Calculate real group dynamics
  const data = calculateGroupDynamics(agentIds, location)

  // Cache for 2 minutes
  await cacheService.set(cacheKey, data, 120)

  const computeTime = Date.now() - startTime

  res.json({
    success: true,
    data,
    computeTimeMs: computeTime,
    metadata: {
      agentCount: agentIds.length,
      location,
      timestamp: new Date().toISOString()
    }
  })
}))

/**
 * POST /api/kinetics/token
 * Token-specific kinetics for rate and rarity calculations
 */
router.post('/token', [
  body('baseTokenRate').isNumeric().withMessage('baseTokenRate must be numeric'),
  body('baseNFTRarity').isNumeric().withMessage('baseNFTRarity must be numeric'),
  body('location.lat').isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90'),
  body('location.lon').isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400)
  }

  if (!req.featureFlags.kineticsBackend) {
    throw new AppError('Kinetics backend is disabled', 503)
  }

  const { baseTokenRate, baseNFTRarity, location } = req.body
  const startTime = Date.now()

  // Check cache first
  const cacheKey = `token:${baseTokenRate}:${baseNFTRarity}:${location.lat}:${location.lon}`
  const cached = await cacheService.get(cacheKey)

  if (cached) {
    return res.json({
      success: true,
      data: cached,
      computeTimeMs: 0,
      cacheHit: true,
      metadata: {
        baseInputs: { baseTokenRate, baseNFTRarity },
        location,
        timestamp: new Date().toISOString(),
        powerLevel: `${Math.round(cached.powerLevel * 100)}%`
      }
    })
  }

  // Calculate real token kinetics
  const data = calculateTokenKinetics(Number(baseTokenRate), Number(baseNFTRarity), location)

  // Cache for 1 minute (token rates update more frequently)
  await cacheService.set(cacheKey, data, 60)

  const computeTime = Date.now() - startTime

  res.json({
    success: true,
    data,
    computeTimeMs: computeTime,
    metadata: {
      baseInputs: { baseTokenRate, baseNFTRarity },
      location,
      timestamp: new Date().toISOString(),
      powerLevel: `${Math.round((data?.powerLevel ?? 0) * 100)}%`
    }
  })
}))

/**
 * GET /api/kinetics/status
 * Get kinetics system status
 */
router.get('/status', (req: Request, res: Response) => {
  const status = {
    system: 'online',
    version: '2.0.0',
    features: {
      enhanced: req.featureFlags.kineticsBackend,
      groupDynamics: req.featureFlags.kineticsBackend,
      tokenMetrics: req.featureFlags.kineticsBackend
    },
    capabilities: [
      'Enhanced kinetics with agent optimization',
      'Group harmony calculations',
      'Token rate and rarity dynamics',
      'Power prediction and resonance mapping'
    ]
  }

  res.json({
    success: true,
    data: status,
    timestamp: new Date().toISOString()
  })
})

export default router

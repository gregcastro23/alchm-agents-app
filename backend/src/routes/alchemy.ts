import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { alchmClient } from '../services/alchm-client.js'
import { thermodynamicsService } from '../services/thermodynamics.js'
import { asyncHandler, AppError } from '../middleware/error-handler.js'

const router = Router()

/**
 * POST /api/alchemy/calculate
 * Calculate alchemical properties for birth information
 */
router.post('/calculate', [
  body('birthInfo.year').isInt({ min: 1900, max: 2100 }).withMessage('year must be between 1900 and 2100'),
  body('birthInfo.month').isInt({ min: 1, max: 12 }).withMessage('month must be between 1 and 12'),
  body('birthInfo.day').isInt({ min: 1, max: 31 }).withMessage('day must be between 1 and 31'),
  body('birthInfo.hour').isInt({ min: 0, max: 23 }).withMessage('hour must be between 0 and 23'),
  body('birthInfo.minute').isInt({ min: 0, max: 59 }).withMessage('minute must be between 0 and 59'),
  body('birthInfo.latitude').isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90'),
  body('birthInfo.longitude').isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180'),
  body('options.includeAspects').optional().isBoolean(),
  body('options.includeTransits').optional().isBoolean(),
  body('options.includePlanetary').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400)
  }

  const { birthInfo, options = {} } = req.body
  const startTime = Date.now()

  // Call the alchm-backend for core calculations
  const result = await alchmClient.calculateAlchemy({
    birthInfo,
    options
  })

  if (!result.success) {
    throw new AppError(result.error || 'Alchemy calculation failed', 500)
  }

  const computeTime = Date.now() - startTime

  res.json({
    success: true,
    data: result.data,
    metadata: {
      computeTime,
      backendTime: result.data?.computeTime,
      birthInfo,
      options
    }
  })
}))

/**
 * POST /api/alchemy/thermodynamics
 * Calculate thermodynamic properties from elemental values
 */
router.post('/thermodynamics', [
  body('elementalValues.spirit').isNumeric().withMessage('spirit must be numeric'),
  body('elementalValues.essence').isNumeric().withMessage('essence must be numeric'),
  body('elementalValues.matter').isNumeric().withMessage('matter must be numeric'),
  body('elementalValues.substance').isNumeric().withMessage('substance must be numeric'),
  body('elementalValues.fire').isNumeric().withMessage('fire must be numeric'),
  body('elementalValues.water').isNumeric().withMessage('water must be numeric'),
  body('elementalValues.air').isNumeric().withMessage('air must be numeric'),
  body('elementalValues.earth').isNumeric().withMessage('earth must be numeric')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400)
  }

  if (!req.featureFlags.thermodynamicsBackend) {
    throw new AppError('Thermodynamics backend is disabled', 503)
  }

  const { elementalValues } = req.body

  // Convert string values to numbers
  const values = {
    spirit: Number(elementalValues.spirit),
    essence: Number(elementalValues.essence),
    matter: Number(elementalValues.matter),
    substance: Number(elementalValues.substance),
    fire: Number(elementalValues.fire),
    water: Number(elementalValues.water),
    air: Number(elementalValues.air),
    earth: Number(elementalValues.earth)
  }

  const result = await thermodynamicsService.analyzeThermodynamics(values)

  res.json({
    success: true,
    data: result,
    metadata: {
      inputValues: values,
      conservationPassed: result.conservationCheck.passed
    }
  })
}))

/**
 * POST /api/alchemy/batch-thermodynamics
 * Calculate thermodynamics for multiple input sets
 */
router.post('/batch-thermodynamics', [
  body('inputSets').isArray({ min: 1, max: 100 }).withMessage('inputSets must be array with 1-100 items'),
  body('inputSets.*.spirit').isNumeric().withMessage('spirit must be numeric'),
  body('inputSets.*.essence').isNumeric().withMessage('essence must be numeric'),
  body('inputSets.*.matter').isNumeric().withMessage('matter must be numeric'),
  body('inputSets.*.substance').isNumeric().withMessage('substance must be numeric'),
  body('inputSets.*.fire').isNumeric().withMessage('fire must be numeric'),
  body('inputSets.*.water').isNumeric().withMessage('water must be numeric'),
  body('inputSets.*.air').isNumeric().withMessage('air must be numeric'),
  body('inputSets.*.earth').isNumeric().withMessage('earth must be numeric')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400)
  }

  if (!req.featureFlags.thermodynamicsBackend) {
    throw new AppError('Thermodynamics backend is disabled', 503)
  }

  const { inputSets } = req.body
  const startTime = Date.now()

  // Convert and validate all input sets
  const processedInputs = inputSets.map((set: any) => ({
    spirit: Number(set.spirit),
    essence: Number(set.essence),
    matter: Number(set.matter),
    substance: Number(set.substance),
    fire: Number(set.fire),
    water: Number(set.water),
    air: Number(set.air),
    earth: Number(set.earth)
  }))

  const results = await thermodynamicsService.batchAnalyze(processedInputs)
  const computeTime = Date.now() - startTime

  // Calculate batch statistics
  const conservationPassed = results.filter(r => r.conservationCheck.passed).length
  const avgHeat = results.reduce((sum, r) => sum + r.heat, 0) / results.length
  const avgEntropy = results.reduce((sum, r) => sum + r.entropy, 0) / results.length

  res.json({
    success: true,
    data: results,
    metadata: {
      totalInputs: inputSets.length,
      computeTime,
      statistics: {
        conservationPassRate: conservationPassed / results.length,
        averageHeat: avgHeat,
        averageEntropy: avgEntropy
      }
    }
  })
}))

/**
 * POST /api/alchemy/imaginize
 * Generate alchemical image through backend
 */
router.post('/imaginize', [
  body('birthInfo.year').isInt({ min: 1900, max: 2100 }).withMessage('year must be between 1900 and 2100'),
  body('birthInfo.month').isInt({ min: 1, max: 12 }).withMessage('month must be between 1 and 12'),
  body('birthInfo.day').isInt({ min: 1, max: 31 }).withMessage('day must be between 1 and 31'),
  body('birthInfo.hour').isInt({ min: 0, max: 23 }).withMessage('hour must be between 0 and 23'),
  body('birthInfo.minute').isInt({ min: 0, max: 59 }).withMessage('minute must be between 0 and 59'),
  body('birthInfo.latitude').isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90'),
  body('birthInfo.longitude').isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180'),
  body('options.style').optional().isString(),
  body('options.format').optional().isIn(['png', 'jpg', 'webp']),
  body('options.quality').optional().isInt({ min: 1, max: 100 }),
  body('options.width').optional().isInt({ min: 100, max: 2048 }),
  body('options.height').optional().isInt({ min: 100, max: 2048 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400)
  }

  const { birthInfo, horoscope, options = {} } = req.body

  const result = await alchmClient.imaginize({
    birthInfo,
    horoscope,
    options
  })

  if (!result.success) {
    throw new AppError(result.error || 'Image generation failed', 500)
  }

  res.json({
    success: true,
    data: {
      imageUrl: result.imageUrl,
      metadata: result.metadata
    }
  })
}))

/**
 * GET /api/alchemy/status
 * Get alchemy service status
 */
router.get('/status', asyncHandler(async (req, res) => {
  const alchmHealth = await alchmClient.healthCheck()
  const alchmStatus = alchmClient.getStatus()

  res.json({
    success: true,
    data: {
      backend: {
        healthy: alchmHealth.healthy,
        responseTime: alchmHealth.responseTime,
        error: alchmHealth.error
      },
      circuitBreaker: alchmStatus,
      featureFlags: {
        thermodynamicsBackend: req.featureFlags.thermodynamicsBackend
      }
    }
  })
}))

export default router

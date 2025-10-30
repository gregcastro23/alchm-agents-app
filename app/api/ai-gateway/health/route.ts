import { NextResponse } from 'next/server'
import {
  getAIGatewayConfig,
  getAIGatewayStatus,
  validateAIGatewayConfig,
  calculateCostSavings,
} from '@/lib/utils/ai-gateway'

/**
 * GET /api/ai-gateway/health
 * 
 * Health check endpoint for AI Gateway configuration
 * Returns status, validation, and recommendations
 */
export async function GET() {
  try {
    const config = getAIGatewayConfig()
    const validation = validateAIGatewayConfig()
    const status = getAIGatewayStatus()

    // Calculate example cost savings
    const exampleSavings = calculateCostSavings(
      10000, // 10k requests/month
      0.02, // $0.02 per request
      0.5 // 50% cache hit rate
    )

    const response = {
      timestamp: new Date().toISOString(),
      configuration: {
        enabled: config.enabled,
        provider: config.provider,
        url: config.url ? new URL(config.url).hostname : null,
      },
      validation: {
        valid: validation.valid,
        errors: validation.errors,
      },
      status: {
        configured: status.configured,
        ready: status.configured && config.enabled,
        recommendation: status.recommendation,
      },
      costAnalysis: {
        example: {
          monthlyRequests: 10000,
          averageCostPerRequest: '$0.02',
          estimatedCacheHitRate: '50%',
          monthlySavings: `$${exampleSavings.monthlySavings.toFixed(2)}`,
          annualSavings: `$${exampleSavings.annualSavings.toFixed(2)}`,
        },
      },
      documentation: '/AI_GATEWAY_SETUP.md',
    }

    return NextResponse.json(response, {
      status: validation.valid ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[AI Gateway Health Check] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check AI Gateway status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

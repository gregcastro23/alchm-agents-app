/**
 * AI Gateway Utility Functions
 * Provides validation, configuration, and monitoring for AI Gateway
 */

export interface AIGatewayConfig {
  enabled: boolean
  url?: string
  apiKey?: string
  provider?: string
}

/**
 * Get AI Gateway configuration from environment
 */
export function getAIGatewayConfig(): AIGatewayConfig {
  const enabled = String(process.env.AI_GATEWAY_ENABLED || 'false').toLowerCase() === 'true'
  const url = process.env.AI_GATEWAY_URL
  const apiKey = process.env.AI_GATEWAY_API_KEY

  // Detect provider from URL
  let provider = 'custom'
  if (url) {
    if (url.includes('cloudflare')) provider = 'cloudflare'
    else if (url.includes('portkey')) provider = 'portkey'
    else if (url.includes('helicone')) provider = 'helicone'
  }

  return {
    enabled,
    url,
    apiKey,
    provider,
  }
}

/**
 * Validate AI Gateway configuration
 */
export function validateAIGatewayConfig(): { valid: boolean; errors: string[] } {
  const config = getAIGatewayConfig()
  const errors: string[] = []

  if (config.enabled) {
    if (!config.url) {
      errors.push('AI_GATEWAY_URL is required when AI_GATEWAY_ENABLED=true')
    } else if (!config.url.endsWith('/v1')) {
      errors.push('AI_GATEWAY_URL should end with /v1 (e.g., https://gateway.example.com/v1)')
    }

    if (!config.apiKey) {
      errors.push('AI_GATEWAY_API_KEY is required when AI_GATEWAY_ENABLED=true')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if AI Gateway is properly configured
 */
export function isAIGatewayConfigured(): boolean {
  const validation = validateAIGatewayConfig()
  return validation.valid
}

/**
 * Get AI Gateway status information
 */
export function getAIGatewayStatus() {
  const config = getAIGatewayConfig()
  const validation = validateAIGatewayConfig()

  return {
    configured: validation.valid,
    enabled: config.enabled,
    provider: config.provider,
    url: config.url ? new URL(config.url).hostname : null,
    errors: validation.errors,
    recommendation: !config.enabled
      ? 'AI Gateway is disabled. Enable it to reduce costs by 30-70% through caching.'
      : !validation.valid
      ? 'AI Gateway is enabled but misconfigured. Check environment variables.'
      : 'AI Gateway is properly configured and ready to use.',
  }
}

/**
 * Get cache hit rate estimate based on request patterns
 */
export function estimateCacheHitRate(requestType: 'similar' | 'different' | 'variable'): number {
  switch (requestType) {
    case 'similar':
      return 0.7 // 70% cache hit rate for similar requests
    case 'different':
      return 0.2 // 20% cache hit rate for different requests
    case 'variable':
      return 0.4 // 40% cache hit rate for variable requests
    default:
      return 0.5 // 50% average
  }
}

/**
 * Calculate potential cost savings
 */
export function calculateCostSavings(
  monthlyRequests: number,
  averageCostPerRequest: number,
  estimatedCacheHitRate: number
): {
  cacheableRequests: number
  monthlySavings: number
  annualSavings: number
  savingsPercentage: number
} {
  const cacheableRequests = Math.floor(monthlyRequests * estimatedCacheHitRate)
  const monthlySavings = cacheableRequests * averageCostPerRequest
  const annualSavings = monthlySavings * 12
  const savingsPercentage = (cacheableRequests / monthlyRequests) * 100

  return {
    cacheableRequests,
    monthlySavings,
    annualSavings,
    savingsPercentage,
  }
}

/**
 * Generate AI Gateway recommendation message
 */
export function getAIGatewayRecommendation(): string {
  const config = getAIGatewayConfig()
  const validation = validateAIGatewayConfig()

  if (!config.enabled) {
    return `💡 AI Gateway is disabled. Enable it to:
   • Reduce API costs by 30-70% through intelligent caching
   • Get centralized monitoring and analytics
   • Benefit from automatic rate limiting and DDoS protection
   
   Setup: Add AI_GATEWAY_ENABLED=true to your environment variables.
   See AI_GATEWAY_SETUP.md for complete instructions.`
  }

  if (!validation.valid) {
    return `⚠️  AI Gateway is enabled but configuration has errors:
${validation.errors.map(e => `   • ${e}`).join('\n')}
   
   See AI_GATEWAY_SETUP.md for troubleshooting.`
  }

  return `✅ AI Gateway is enabled and configured:
   • Provider: ${config.provider}
   • URL: ${config.url}
   • Status: Ready to optimize your AI costs`
}

/**
 * Log AI Gateway configuration status
 */
export function logAIGatewayStatus(): void {
  const status = getAIGatewayStatus()
  const recommendation = getAIGatewayRecommendation()

  console.log('\n🤖 AI Gateway Status:')
  console.log(recommendation)
  
  if (status.enabled && status.configured) {
    console.log('\n💡 Tip: Monitor your cache hit rate in the gateway dashboard')
    console.log('   Typical cache hit rates: 40-70% for production applications')
  }
}

// Export validation on module load for debugging
if (process.env.NODE_ENV === 'development') {
  logAIGatewayStatus()
}

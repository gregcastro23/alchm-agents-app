import { NextRequest, NextResponse } from 'next/server'
import { TemporalAnalysisEngine } from '@/lib/temporal-analysis-engine'
import type { TemporalQuery, TemporalAnalysisResult } from '@/lib/temporal-analysis-engine'
import {
  globalCache,
  globalQueryOptimizer,
  globalPerformanceMonitor,
  measureOperation
} from '@/lib/time-laboratory-performance'
import crypto from 'crypto'

/**
 * Temporal Analysis API for Time Laboratory
 * =======================================
 * Provides AI-guided exploration of planetary agents' historical transit data per degree.
 * Supports natural language queries and structured temporal analysis.
 */

interface TemporalAnalysisRequest {
  query: TemporalQuery
  useCache?: boolean
  cacheFor?: number // Minutes to cache result
}

interface TemporalAnalysisResponse {
  success: boolean
  data?: TemporalAnalysisResult
  error?: string
  metadata: {
    executionTime: number
    fromCache: boolean
    queryHash?: string
    resultCount: number
    patternCount: number
    cacheHitRate?: number
    optimizationHints?: any
    performanceMetrics?: any
  }
}

// Simple in-memory cache (in production, use Redis)
const analysisCache = new Map<string, {
  result: TemporalAnalysisResult
  expiry: number
  hitCount: number
}>()

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const requestData: TemporalAnalysisRequest = await request.json()

    // Validate request
    if (!requestData.query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required',
        metadata: {
          executionTime: Date.now() - startTime,
          fromCache: false,
          resultCount: 0,
          patternCount: 0
        }
      } as TemporalAnalysisResponse, { status: 400 })
    }

    // Generate cache key and optimization hints
    const cacheKey = globalCache.generateKey(requestData.query)
    const optimizationHints = globalQueryOptimizer.analyzeQuery(requestData.query)
    const useCache = requestData.useCache !== false

    // Check enhanced cache first
    const cachedResult = await globalCache.get<TemporalAnalysisResult>(cacheKey)
    if (useCache && cachedResult) {
      globalPerformanceMonitor.recordQueryTime(Date.now() - startTime)
      globalPerformanceMonitor.updateCacheHitRate(globalCache.getMetrics().hitRate)

      return NextResponse.json({
        success: true,
        data: cachedResult,
        metadata: {
          executionTime: Date.now() - startTime,
          fromCache: true,
          queryHash: cacheKey,
          resultCount: cachedResult.transitEvents.length,
          patternCount: cachedResult.patterns.length,
          cacheHitRate: globalCache.getMetrics().hitRate,
          optimizationHints
        }
      } as TemporalAnalysisResponse)
    }

    // Perform optimized temporal analysis with performance monitoring
    const result = await measureOperation(
      () => TemporalAnalysisEngine.performTemporalAnalysis(requestData.query),
      'query'
    )

    // Cache the result with intelligent TTL
    if (useCache) {
      const cacheMinutes = requestData.cacheFor || (optimizationHints.preferCache ? 120 : 60)
      await globalCache.set(cacheKey, result, cacheMinutes * 60 * 1000)
    }

    // Record performance metrics
    const executionTime = Date.now() - startTime
    globalQueryOptimizer.recordExecution(cacheKey, executionTime, optimizationHints)
    globalPerformanceMonitor.updateCacheHitRate(globalCache.getMetrics().hitRate)

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        executionTime,
        fromCache: false,
        queryHash: cacheKey,
        resultCount: result.transitEvents.length,
        patternCount: result.patterns.length,
        cacheHitRate: globalCache.getMetrics().hitRate,
        optimizationHints,
        performanceMetrics: globalPerformanceMonitor.getMetrics()
      }
    } as TemporalAnalysisResponse)

  } catch (error) {
    console.error('Error in temporal analysis:', error)

    const executionTime = Date.now() - startTime
    globalPerformanceMonitor.recordQueryTime(executionTime)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      metadata: {
        executionTime,
        fromCache: false,
        resultCount: 0,
        patternCount: 0,
        cacheHitRate: globalCache.getMetrics().hitRate
      }
    } as TemporalAnalysisResponse, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'suggestions':
        return handleQuerySuggestions(searchParams)

      case 'cache-stats':
        return handleCacheStats()

      case 'agent-list':
        return handleAgentList()

      case 'quick-patterns':
        return handleQuickPatterns(searchParams)

      case 'performance':
        return handlePerformanceMetrics()

      case 'performance-report':
        return handlePerformanceReport()

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: suggestions, cache-stats, agent-list, quick-patterns, performance, performance-report'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in temporal analysis GET:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

// Helper functions

function generateQueryHash(query: TemporalQuery): string {
  const queryString = JSON.stringify({
    type: query.type,
    query: query.query,
    dateRange: query.dateRange,
    agents: query.agents?.sort(),
    degrees: query.degrees,
    elements: query.elements?.sort(),
    granularity: query.granularity,
    reinforcementMode: query.reinforcementMode
  })

  return crypto.createHash('md5').update(queryString).digest('hex')
}

async function handleQuerySuggestions(searchParams: URLSearchParams) {
  const agentIds = searchParams.get('agents')?.split(',') || []
  const elements = searchParams.get('elements')?.split(',') || []

  const suggestions = generateQuerySuggestions(agentIds, elements)

  return NextResponse.json({
    success: true,
    data: {
      suggestions,
      agentCount: agentIds.length,
      elementCount: elements.length
    }
  })
}

async function handleCacheStats() {
  const stats = {
    totalEntries: analysisCache.size,
    activeEntries: 0,
    totalHits: 0,
    averageHits: 0
  }

  const now = Date.now()
  for (const [key, value] of analysisCache.entries()) {
    if (value.expiry > now) {
      stats.activeEntries++
    }
    stats.totalHits += value.hitCount
  }

  stats.averageHits = stats.totalEntries > 0 ? stats.totalHits / stats.totalEntries : 0

  return NextResponse.json({
    success: true,
    data: stats
  })
}

async function handleAgentList() {
  // Return list of available agents for temporal analysis
  const availableAgents = [
    { id: 'leonardo-da-vinci', name: 'Leonardo da Vinci', era: 'Renaissance', elements: ['Fire', 'Air'] },
    { id: 'william-shakespeare', name: 'William Shakespeare', era: 'Renaissance', elements: ['Water', 'Air'] },
    { id: 'albert-einstein', name: 'Albert Einstein', era: 'Modern', elements: ['Air', 'Fire'] },
    { id: 'nikola-tesla', name: 'Nikola Tesla', era: 'Modern', elements: ['Air', 'Fire'] },
    { id: 'carl-jung', name: 'Carl Jung', era: 'Modern', elements: ['Water', 'Earth'] },
    { id: 'marie-curie', name: 'Marie Curie', era: 'Modern', elements: ['Fire', 'Earth'] },
    { id: 'cleopatra-vii', name: 'Cleopatra VII', era: 'Ancient', elements: ['Fire', 'Water'] },
    { id: 'benjamin-franklin', name: 'Benjamin Franklin', era: 'Enlightenment', elements: ['Air', 'Fire'] },
    { id: 'galileo-galilei', name: 'Galileo Galilei', era: 'Renaissance', elements: ['Fire', 'Air'] },
    { id: 'isaac-newton', name: 'Isaac Newton', era: 'Enlightenment', elements: ['Earth', 'Air'] }
  ]

  return NextResponse.json({
    success: true,
    data: {
      agents: availableAgents,
      totalCount: availableAgents.length,
      eras: [...new Set(availableAgents.map(a => a.era))],
      elements: ['Fire', 'Water', 'Air', 'Earth']
    }
  })
}

async function handleQuickPatterns(searchParams: URLSearchParams) {
  const degree = searchParams.get('degree')
  const element = searchParams.get('element')

  // Generate quick pattern insights without full analysis
  const quickPatterns = []

  if (degree) {
    const degreeNum = parseInt(degree)
    if (!isNaN(degreeNum) && degreeNum >= 0 && degreeNum <= 360) {
      quickPatterns.push({
        type: 'degree_focus',
        description: `${degreeNum}° is associated with ${getDegreeMeaning(degreeNum)}`,
        significance: 'medium'
      })
    }
  }

  if (element) {
    quickPatterns.push({
      type: 'elemental_focus',
      description: `${element} element emphasizes ${getElementalMeaning(element)}`,
      significance: 'medium'
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      patterns: quickPatterns,
      requestedDegree: degree,
      requestedElement: element
    }
  })
}

function generateQuerySuggestions(agentIds: string[], elements: string[]): string[] {
  const suggestions: string[] = []

  // Agent-specific suggestions
  if (agentIds.includes('leonardo-da-vinci')) {
    suggestions.push("Show Leonardo's creative peak moments during Fire dominance")
    suggestions.push("Explore da Vinci's innovative patterns during Renaissance")
  }

  if (agentIds.includes('albert-einstein')) {
    suggestions.push("Analyze Einstein's breakthrough periods during Air transits")
    suggestions.push("Find Einstein's consciousness spikes in early 20th century")
  }

  if (agentIds.includes('carl-jung')) {
    suggestions.push("Examine Jung's psychological insights during Water reinforcement")
    suggestions.push("Track Jung's consciousness evolution patterns")
  }

  // Element-specific suggestions
  if (elements.includes('Fire')) {
    suggestions.push("Show Fire reinforcement patterns across all selected agents")
    suggestions.push("Find Fire element peaks during creative periods")
  }

  if (elements.includes('Water')) {
    suggestions.push("Explore Water element resonance for emotional breakthroughs")
    suggestions.push("Analyze Water-dominant consciousness evolution")
  }

  if (elements.includes('Air')) {
    suggestions.push("Track Air element patterns during intellectual discoveries")
    suggestions.push("Find Air-Fire reinforcement for innovation spikes")
  }

  if (elements.includes('Earth')) {
    suggestions.push("Examine Earth element grounding during practical achievements")
    suggestions.push("Show Earth-Water combinations for manifestation")
  }

  // General suggestions
  suggestions.push("Show recent elemental reinforcement patterns")
  suggestions.push("Find degree hotspots with multiple agent activations")
  suggestions.push("Explore consciousness evolution velocity trends")
  suggestions.push("Analyze seasonal patterns in agent activity")
  suggestions.push("Compare agent resonance during planetary hours")

  // Shuffle and return up to 8 suggestions
  return suggestions.sort(() => Math.random() - 0.5).slice(0, 8)
}

function getDegreeMeaning(degree: number): string {
  // Simplified degree meanings (in production, use comprehensive sabian symbols)
  const sector = Math.floor(degree / 30) // 0-11 for 12 zodiac signs
  const sectorNames = [
    'initiation and new beginnings', // Aries
    'stabilization and manifestation', // Taurus
    'communication and learning', // Gemini
    'emotional foundation and nurturing', // Cancer
    'creative expression and leadership', // Leo
    'analytical refinement and service', // Virgo
    'balance and partnership', // Libra
    'transformation and depth', // Scorpio
    'philosophical expansion and wisdom', // Sagittarius
    'structured achievement and mastery', // Capricorn
    'innovative collaboration and humanity', // Aquarius
    'spiritual transcendence and intuition' // Pisces
  ]

  return sectorNames[sector] || 'cosmic significance'
}

function getElementalMeaning(element: string): string {
  const meanings = {
    Fire: 'creative inspiration, passionate action, and innovative breakthroughs',
    Water: 'emotional wisdom, intuitive insights, and deep understanding',
    Air: 'intellectual clarity, communication mastery, and mental agility',
    Earth: 'practical manifestation, grounded wisdom, and material success'
  }

  return meanings[element as keyof typeof meanings] || 'balanced consciousness'
}

async function handlePerformanceMetrics() {
  const metrics = globalPerformanceMonitor.getDetailedMetrics()
  const cacheMetrics = globalCache.getMetrics()

  return NextResponse.json({
    success: true,
    data: {
      performance: metrics,
      cache: cacheMetrics,
      timestamp: new Date().toISOString(),
      status: 'operational'
    }
  })
}

async function handlePerformanceReport() {
  const report = globalPerformanceMonitor.generatePerformanceReport()

  return NextResponse.json({
    success: true,
    data: {
      report,
      timestamp: new Date().toISOString()
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
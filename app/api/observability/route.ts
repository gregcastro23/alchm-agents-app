/**
 * Agent Observability Dashboard API
 * Provides metrics, insights, and performance benchmarks
 */

import { NextRequest, NextResponse } from 'next/server'
import { observabilityTracker } from '@/lib/observability/tracker'
import { PERFORMANCE_THRESHOLDS } from '@/lib/observability/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'overview'
    const sessionId = searchParams.get('sessionId')
    const agentId = searchParams.get('agentId')
    const timeWindowHours = parseInt(searchParams.get('timeWindowHours') || '24')

    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - timeWindowHours * 60 * 60 * 1000)

    switch (action) {
      case 'overview':
        return handleOverview(startTime, endTime)

      case 'session':
        if (!sessionId) {
          return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
        }
        return handleSession(sessionId)

      case 'insights':
        return handleInsights(startTime, endTime)

      case 'benchmark':
        if (!agentId) {
          return NextResponse.json({ error: 'agentId required' }, { status: 400 })
        }
        return handleBenchmark(agentId, startTime, endTime)

      case 'monica-routing':
        if (!sessionId) {
          return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
        }
        return handleMonicaRouting(sessionId)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Observability API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch observability data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Get system overview metrics
 */
async function handleOverview(startTime: Date, endTime: Date) {
  // This would aggregate data from all sessions in the time window
  // For now, return mock data structure
  const overview = {
    timeWindow: {
      start: startTime.toISOString(),
      end: endTime.toISOString(),
    },
    systemMetrics: {
      totalInteractions: 0,
      totalAgents: 0,
      avgResponseTime: 0,
      errorRate: 0,
    },
    qualityMetrics: {
      avgActionCompletion: 0.92,
      avgToolSelectionQuality: 0.88,
      avgRoutingAccuracy: 0.94,
    },
    topPerformingAgents: [],
    recentInsights: [],
    alerts: [],
  }

  return NextResponse.json(overview)
}

/**
 * Get session details with all traces
 */
async function handleSession(sessionId: string) {
  const session = observabilityTracker.getSession(sessionId)

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Calculate session insights
  const insights = observabilityTracker.getInsights({
    start: session.startTime,
    end: session.endTime || new Date(),
  })

  // Monica routing analysis if applicable
  const monicaAnalysis = observabilityTracker.analyzeMonicaRouting(sessionId)

  return NextResponse.json({
    session,
    insights: insights.filter(i =>
      i.affectedTraces.some(t => session.traces.some(trace => trace.traceId === t))
    ),
    monicaAnalysis,
    performanceSummary: {
      avgActionCompletion:
        session.traces.reduce((sum, t) => sum + t.metrics.actionCompletion, 0) /
        session.traces.length,
      avgLatency:
        session.traces.reduce((sum, t) => sum + t.metrics.latencyMs, 0) / session.traces.length,
      errorCount: session.traces.reduce((sum, t) => sum + t.errors.length, 0),
    },
  })
}

/**
 * Get insights for time window
 */
async function handleInsights(startTime: Date, endTime: Date) {
  const insights = observabilityTracker.getInsights({ start: startTime, end: endTime })

  // Group insights by type and severity
  const grouped = {
    critical: insights.filter(i => i.severity === 'critical'),
    warning: insights.filter(i => i.severity === 'warning'),
    info: insights.filter(i => i.severity === 'info'),
    byType: {
      pattern: insights.filter(i => i.type === 'pattern'),
      failure: insights.filter(i => i.type === 'failure'),
      optimization: insights.filter(i => i.type === 'optimization'),
      quality_degradation: insights.filter(i => i.type === 'quality_degradation'),
    },
  }

  return NextResponse.json({
    timeWindow: {
      start: startTime.toISOString(),
      end: endTime.toISOString(),
    },
    totalInsights: insights.length,
    insights: grouped,
    topIssues: insights
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
      .map(i => ({
        title: i.title,
        description: i.description,
        frequency: i.frequency,
        severity: i.severity,
        suggestedAction: i.suggestedAction,
      })),
  })
}

/**
 * Get agent performance benchmark
 */
async function handleBenchmark(agentId: string, startTime: Date, endTime: Date) {
  const benchmark = observabilityTracker.getAgentBenchmark(agentId, {
    start: startTime,
    end: endTime,
  })

  if (!benchmark) {
    return NextResponse.json(
      { error: 'No data available for this agent in the specified time window' },
      { status: 404 }
    )
  }

  // Add threshold comparisons
  const thresholdComparison = {
    actionCompletion: {
      value: benchmark.averageMetrics.actionCompletion,
      rating:
        benchmark.averageMetrics.actionCompletion >=
        PERFORMANCE_THRESHOLDS.actionCompletion.excellent
          ? 'excellent'
          : benchmark.averageMetrics.actionCompletion >=
              PERFORMANCE_THRESHOLDS.actionCompletion.good
            ? 'good'
            : 'needs_improvement',
      threshold: PERFORMANCE_THRESHOLDS.actionCompletion,
    },
    toolSelectionQuality: {
      value: benchmark.averageMetrics.toolSelectionQuality,
      rating:
        benchmark.averageMetrics.toolSelectionQuality >=
        PERFORMANCE_THRESHOLDS.toolSelectionQuality.excellent
          ? 'excellent'
          : benchmark.averageMetrics.toolSelectionQuality >=
              PERFORMANCE_THRESHOLDS.toolSelectionQuality.good
            ? 'good'
            : 'needs_improvement',
      threshold: PERFORMANCE_THRESHOLDS.toolSelectionQuality,
    },
    latency: {
      value: benchmark.averageMetrics.latencyMs,
      rating:
        benchmark.averageMetrics.latencyMs <= PERFORMANCE_THRESHOLDS.latencyMs.excellent
          ? 'excellent'
          : benchmark.averageMetrics.latencyMs <= PERFORMANCE_THRESHOLDS.latencyMs.good
            ? 'good'
            : 'needs_improvement',
      threshold: PERFORMANCE_THRESHOLDS.latencyMs,
    },
    routingAccuracy: {
      value: benchmark.averageMetrics.routingAccuracy,
      rating:
        benchmark.averageMetrics.routingAccuracy >= PERFORMANCE_THRESHOLDS.routingAccuracy.excellent
          ? 'excellent'
          : benchmark.averageMetrics.routingAccuracy >= PERFORMANCE_THRESHOLDS.routingAccuracy.good
            ? 'good'
            : 'needs_improvement',
      threshold: PERFORMANCE_THRESHOLDS.routingAccuracy,
    },
  }

  return NextResponse.json({
    ...benchmark,
    thresholdComparison,
    recommendations: generateRecommendations(benchmark, thresholdComparison),
  })
}

/**
 * Get Monica routing analysis
 */
async function handleMonicaRouting(sessionId: string) {
  const analysis = observabilityTracker.analyzeMonicaRouting(sessionId)

  if (!analysis) {
    return NextResponse.json(
      { error: 'No Monica routing data found for this session' },
      { status: 404 }
    )
  }

  return NextResponse.json(analysis)
}

/**
 * Generate recommendations based on benchmark data
 */
function generateRecommendations(benchmark: any, thresholdComparison: any): string[] {
  const recommendations: string[] = []

  // Action completion recommendations
  if (thresholdComparison.actionCompletion.rating === 'needs_improvement') {
    recommendations.push(
      `Action completion is at ${(benchmark.averageMetrics.actionCompletion * 100).toFixed(0)}%. Review agent prompts to ensure complete responses.`
    )
  }

  // Tool selection recommendations
  if (thresholdComparison.toolSelectionQuality.rating === 'needs_improvement') {
    recommendations.push(
      `Tool selection quality needs improvement. Review tool descriptions and agent instructions.`
    )
  }

  // Latency recommendations
  if (thresholdComparison.latency.rating === 'needs_improvement') {
    recommendations.push(
      `Average latency is ${(benchmark.averageMetrics.latencyMs / 1000).toFixed(1)}s. Consider optimizing model selection or caching.`
    )
  }

  // Routing accuracy recommendations (for Monica)
  if (
    thresholdComparison.routingAccuracy.rating === 'needs_improvement' &&
    benchmark.agentType === 'monica'
  ) {
    recommendations.push(
      `Routing accuracy needs improvement. Review Monica's routing logic and agent selection criteria.`
    )
  }

  // Error recommendations
  if (benchmark.totalErrors > benchmark.totalInteractions * 0.05) {
    recommendations.push(
      `Error rate is ${((benchmark.totalErrors / benchmark.totalInteractions) * 100).toFixed(1)}%. Investigate common failure patterns.`
    )
  }

  // If no issues, provide optimization suggestions
  if (recommendations.length === 0) {
    recommendations.push(
      `Performance is ${benchmark.rating}! Consider A/B testing different prompts or models to further optimize.`
    )
  }

  return recommendations
}

/**
 * RAG Cache Statistics API
 *
 * GET /api/rag/cache - Get cache statistics
 * DELETE /api/rag/cache - Clear cache
 */

import { NextRequest, NextResponse } from 'next/server'
import { ragCache } from '@/lib/rag/rag-cache'

export const dynamic = 'force-dynamic'

/**
 * GET /api/rag/cache
 * Get cache statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats = ragCache.getStats()

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        // Add computed metrics
        avgHitsPerEntry: stats.cacheSize > 0
          ? stats.totalHits / stats.cacheSize
          : 0,
        memoryUsageEstimate: `~${Math.round(stats.cacheSize * 2)}KB`, // Rough estimate
      },
    })
  } catch (error) {
    console.error('[RAG Cache API] Failed to get stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cache stats',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/rag/cache
 * Clear cache (admin only in production)
 */
export async function DELETE(request: NextRequest) {
  try {
    // In production, you might want to add authentication here
    // const session = await getSession(request)
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    ragCache.clear()

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    })
  } catch (error) {
    console.error('[RAG Cache API] Failed to clear cache:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cache',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rag/cache/invalidate
 * Invalidate specific cache entries
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Support invalidating by agent or query pattern
    if (body.agentId) {
      // This would require implementing an invalidateByAgent method
      return NextResponse.json({
        success: false,
        error: 'Agent-specific invalidation not yet implemented',
      }, { status: 501 })
    }

    if (body.clearAll) {
      ragCache.clear()
      return NextResponse.json({
        success: true,
        message: 'All cache entries cleared',
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request: provide agentId or clearAll=true',
    }, { status: 400 })
  } catch (error) {
    console.error('[RAG Cache API] Failed to invalidate cache:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to invalidate cache',
      },
      { status: 500 }
    )
  }
}

/**
 * Planetary Synchronization API
 * =============================
 *
 * Cross-backend synchronization endpoint that connects Planetary Agents' VSOP87
 * astronomical precision with WhatToEatNext's planetary position rectification.
 * Provides real-time synchronization for the most accurate astrological calculations.
 */

import { planetaryPositionSyncService } from '@/lib/services/planetary-position-sync'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/planetary-sync
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'health': {
        // Test connectivity with WhatToEatNext and overall sync health
        const healthCheck = await planetaryPositionSyncService.getHealthStatus()
        return NextResponse.json(healthCheck)
      }

      case 'sync-status': {
        // Get current synchronization status and metrics
        const status = await planetaryPositionSyncService.getSyncStatus()
        return NextResponse.json(status)
      }

      case 'cache-stats': {
        // Get cache statistics
        const cacheStats = planetaryPositionSyncService.getCacheStats()
        return NextResponse.json(cacheStats)
      }

      case 'clear-cache': {
        // Clear synchronization cache (admin operation)
        planetaryPositionSyncService.clearCache()
        return NextResponse.json({ message: 'Cache cleared successfully' })
      }

      default: {
        // Perform synchronization
        const dateParam = searchParams.get('date')
        const targetDate = dateParam ? new Date(dateParam) : new Date()

        if (isNaN(targetDate.getTime())) {
          return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
        }

        const result = await planetaryPositionSyncService.synchronizePositions(targetDate)
        return NextResponse.json(result)
      }
    }
  } catch (error) {
    console.error('Planetary sync API error:', error)
    return NextResponse.json(
      { error: 'Synchronization failed', message: error.message },
      { status: 500 }
    )
  }
}

// POST /api/planetary-sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, date, positions } = body

    switch (action) {
      case 'webhook-sync': {
        // Handle webhook updates from WhatToEatNext
        if (!positions || !date) {
          return NextResponse.json(
            { error: 'Missing required fields: positions and date' },
            { status: 400 }
          )
        }

        const success = await planetaryPositionSyncService.handleWebhookSync(positions, date)
        return NextResponse.json({
          received: true,
          processed: success,
          message: success
            ? 'Webhook sync processed successfully'
            : 'Webhook sync processing failed',
        })
      }

      case 'emergency-sync': {
        // Emergency synchronization request
        const dateParam = date ? new Date(date) : new Date()

        if (isNaN(dateParam.getTime())) {
          return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
        }

        const result = await planetaryPositionSyncService.emergencySynchronization(dateParam)
        return NextResponse.json({
          ...result,
          message: 'Emergency synchronization completed',
        })
      }

      case 'validate-positions': {
        // Validate planetary position data
        if (!positions) {
          return NextResponse.json({ error: 'Missing positions data' }, { status: 400 })
        }

        // Perform synchronization with provided positions
        const dateParam = date ? new Date(date) : new Date()
        const ourPositions =
          await planetaryPositionSyncService['getPlanetaryAgentsPositions'](dateParam)

        // Convert provided positions to sync format
        const theirPositions: Record<string, any> = {}
        Object.entries(positions).forEach(([planet, pos]: [string, any]) => {
          theirPositions[planet] = {
            planet,
            sign: pos.sign,
            degree: pos.degree,
            exact_longitude: pos.exact_longitude,
            is_retrograde: pos.is_retrograde || false,
            source: 'validation_input',
            confidence: pos.confidence || 0.8,
            last_updated: new Date().toISOString(),
            accuracy_level: 'external',
          }
        })

        // Perform validation sync
        const syncService = planetaryPositionSyncService as any
        const syncResult = syncService.performSynchronization(
          ourPositions,
          theirPositions,
          dateParam
        )

        return NextResponse.json({
          validation_result: syncResult,
          our_positions: ourPositions,
          their_positions: theirPositions,
          message: 'Position validation completed',
        })
      }

      default: {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      }
    }
  } catch (error) {
    console.error('Planetary sync POST error:', error)
    return NextResponse.json(
      { error: 'Request processing failed', message: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/planetary-sync (for configuration updates)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'update-config': {
        // Update sync service configuration
        // This would allow runtime configuration updates in production
        return NextResponse.json({
          message: 'Configuration update not implemented yet',
          received: body,
        })
      }

      default: {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      }
    }
  } catch (error) {
    console.error('Planetary sync PUT error:', error)
    return NextResponse.json(
      { error: 'Configuration update failed', message: error.message },
      { status: 500 }
    )
  }
}

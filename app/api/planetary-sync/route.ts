import { NextRequest, NextResponse } from 'next/server'
import { planetaryPositionSyncService } from '@/lib/services/planetary-position-sync'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const dateParam = searchParams.get('date')

  try {
    if (action === 'health') {
      const health = await planetaryPositionSyncService.getHealthStatus()
      return NextResponse.json(health)
    }

    if (action === 'status') {
      const status = await planetaryPositionSyncService.getSyncStatus()
      return NextResponse.json(status)
    }

    const date = dateParam ? new Date(dateParam) : new Date()
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date parameter' }, { status: 400 })
    }

    const result = await planetaryPositionSyncService.synchronizePositions(date)
    return NextResponse.json(result, { status: result.success ? 200 : 502 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to synchronize positions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body?.action === 'webhook-sync') {
      const processed = await planetaryPositionSyncService.handleWebhookSync(
        body.positions || {},
        body.date
      )

      return NextResponse.json({
        received: true,
        processed,
      })
    }

    const date = body?.date ? new Date(body.date) : new Date()
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date parameter' }, { status: 400 })
    }

    const result =
      body?.force === true
        ? await planetaryPositionSyncService.emergencySynchronization(date)
        : await planetaryPositionSyncService.synchronizePositions(date)

    return NextResponse.json(result, { status: result.success ? 200 : 502 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process sync request' },
      { status: 500 }
    )
  }
}

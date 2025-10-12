/**
 * Set Primary Natal Chart API
 *
 * Set a specific natal chart as the user's primary chart
 */

import { NextRequest, NextResponse } from 'next/server'
import { setPrimaryChart } from '../../../../lib/services/natal-chart-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * PUT /api/user-natal-charts/[chartId]/set-primary
 * Set chart as primary
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chartId: string }> }
) {
  try {
    const { chartId } = await params
    const body = await request.json()
    const userId = body.userId

    if (!userId) {
      return NextResponse.json({ error: 'userId is required in request body' }, { status: 400 })
    }

    await setPrimaryChart(chartId, userId)

    return NextResponse.json({
      success: true,
      message: 'Chart set as primary successfully',
    })
  } catch (error) {
    console.error('Error setting primary chart:', error)
    return NextResponse.json(
      {
        error: 'Failed to set primary chart',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

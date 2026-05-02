import { NextRequest, NextResponse } from 'next/server'
import { planetaryAPI } from '@/lib/planetary-api-client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const startDate = body?.startDate ? new Date(body.startDate) : new Date()
    const endDate = body?.endDate ? new Date(body.endDate) : new Date(Date.now() + 24 * 60 * 60 * 1000)
    const intervalHours = typeof body?.intervalHours === 'number' ? body.intervalHours : 1
    const data = await planetaryAPI.getPlanetaryPositionsBulk(
      startDate,
      endDate,
      intervalHours,
      body?.latitude,
      body?.longitude
    )
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'bulk positions failed' }, { status: 502 })
  }
}

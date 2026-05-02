import { NextRequest, NextResponse } from 'next/server'
import { planetaryAPI } from '@/lib/planetary-api-client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const legacy = url.searchParams.get('legacy') === 'true'
    const body = await req.json().catch(() => ({}))
    const date = body?.date ? new Date(body.date) : new Date()
    const latitude = typeof body?.latitude === 'number' ? body.latitude : undefined
    const longitude = typeof body?.longitude === 'number' ? body.longitude : undefined
    const data = legacy
      ? await planetaryAPI.getAlchemicalQuantitiesLegacy(date, latitude, longitude)
      : await planetaryAPI.getAlchemicalQuantities(date, latitude, longitude)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'alchemize failed' }, { status: 502 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const legacy = url.searchParams.get('legacy') === 'true'
    const data = legacy
      ? await planetaryAPI.getAlchemicalQuantitiesLegacy(new Date())
      : await planetaryAPI.getAlchemicalQuantities(new Date())
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'alchemize failed' }, { status: 502 })
  }
}

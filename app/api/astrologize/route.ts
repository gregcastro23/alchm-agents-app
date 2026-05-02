import { NextRequest, NextResponse } from 'next/server'
import { planetaryAPI } from '@/lib/planetary-api-client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const date = body?.date ? new Date(body.date) : new Date()
    const latitude = typeof body?.latitude === 'number' ? body.latitude : undefined
    const longitude = typeof body?.longitude === 'number' ? body.longitude : undefined
    const data = await planetaryAPI.getPlanetaryPositions(date, latitude, longitude)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'planetary positions failed' }, { status: 502 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const dateParam = url.searchParams.get('date')
    const lat = url.searchParams.get('latitude')
    const lon = url.searchParams.get('longitude')
    const date = dateParam ? new Date(dateParam) : new Date()
    const data = await planetaryAPI.getPlanetaryPositions(
      date,
      lat ? Number(lat) : undefined,
      lon ? Number(lon) : undefined
    )
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'planetary positions failed' }, { status: 502 })
  }
}

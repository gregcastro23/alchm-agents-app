import { NextRequest, NextResponse } from 'next/server'
import { backend, getAlchemicalQuantitiesLegacy, BackendError } from '@/lib/backend'

export const runtime = 'nodejs'

async function handle(legacy: boolean, date: Date, latitude?: number, longitude?: number) {
  try {
    const data = legacy
      ? await getAlchemicalQuantitiesLegacy(date, latitude, longitude)
      : await backend.alchemy.defaultQuantities(date, latitude, longitude)
    return NextResponse.json(data)
  } catch (err) {
    const status = err instanceof BackendError ? err.status : 502
    const message = err instanceof Error ? err.message : 'alchemize failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const legacy = url.searchParams.get('legacy') === 'true'
  const body = await req.json().catch(() => ({}))
  const date = body?.date ? new Date(body.date) : new Date()
  const latitude = typeof body?.latitude === 'number' ? body.latitude : undefined
  const longitude = typeof body?.longitude === 'number' ? body.longitude : undefined
  return handle(legacy, date, latitude, longitude)
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const legacy = url.searchParams.get('legacy') === 'true'
  return handle(legacy, new Date())
}

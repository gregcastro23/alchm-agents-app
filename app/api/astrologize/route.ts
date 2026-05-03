import { NextRequest, NextResponse } from 'next/server'
import { backend, BackendError } from '@/lib/backend'

export const runtime = 'nodejs'

function parseLocation(latRaw: unknown, lonRaw: unknown) {
  const latitude =
    typeof latRaw === 'number' ? latRaw : latRaw != null ? Number(latRaw) || undefined : undefined
  const longitude =
    typeof lonRaw === 'number' ? lonRaw : lonRaw != null ? Number(lonRaw) || undefined : undefined
  return { latitude, longitude }
}

async function handle(date: Date, latitude?: number, longitude?: number) {
  try {
    const data = await backend.planetary.positions(date, latitude, longitude)
    return NextResponse.json(data)
  } catch (err) {
    const status = err instanceof BackendError ? err.status : 502
    const message = err instanceof Error ? err.message : 'planetary positions failed'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const date = body?.date ? new Date(body.date) : new Date()
  const { latitude, longitude } = parseLocation(body?.latitude, body?.longitude)
  return handle(date, latitude, longitude)
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const dateParam = url.searchParams.get('date')
  const date = dateParam ? new Date(dateParam) : new Date()
  const { latitude, longitude } = parseLocation(url.searchParams.get('latitude'), url.searchParams.get('longitude'))
  return handle(date, latitude, longitude)
}

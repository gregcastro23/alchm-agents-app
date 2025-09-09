// Astrologize API integration (proxy helper)
// Fetches a circular natal horoscope (chart wheel) from an external Astrologize-like service

import { BirthInfoSchema, type BirthInfo, AlchmResponseSchema, AstrologizeWheelSchema } from './schemas'
import { CircuitBreaker, withRetries } from './resilience'

export type AstrologizeWheelResponse = {
  svg?: string
  imageUrl?: string
  meta?: any
}

const DEFAULT_BASE = 'https://alchm-backend.onrender.com'

function getBase(): string {
  return (process.env.ASTROLOGIZE_API_BASE || DEFAULT_BASE).replace(/\/$/, '')
}

const astroCB = new CircuitBreaker()
const alchmCB = new CircuitBreaker()

export async function fetchAstrologizeWheel(birth: BirthInfo): Promise<AstrologizeWheelResponse> {
  BirthInfoSchema.parse(birth)
  const url = `${getBase()}/astrologize`

  const payload = {
    name: birth.name || 'Subject',
    year: birth.year,
    month: birth.month,
    day: birth.day,
    hour: birth.hour,
    minute: birth.minute,
    latitude: birth.latitude,
    longitude: birth.longitude,
    format: 'svg'
  }

  const execResult = await astroCB.exec(async () => {
    const res = await withRetries(() => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }), 2, 200)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Astrologize API error: ${res.status} ${res.statusText} - ${text}`)
    }
    const data = await res.json().catch(() => ({}))
    const normalized = {
      svg: data.svg || data.data?.svg || data.wheelSvg,
      imageUrl: data.imageUrl || data.data?.imageUrl || data.wheelUrl,
      meta: data.meta || data.data?.meta || { configured: true }
    }
    return AstrologizeWheelSchema.parse(normalized)
  })

  if (!execResult.result) {
    throw new Error('Astrologize call degraded')
  }
  if (execResult.degraded) {
    execResult.result.meta = { ...(execResult.result.meta || {}), degraded: true }
  }
  return execResult.result
}

export type AlchmResponse = {
  alchm?: any
  spirit?: number
  essence?: number
  matter?: number
  substance?: number
  [key: string]: any
}

export async function fetchAlchmAlchemize(birth: BirthInfo): Promise<AlchmResponse> {
  BirthInfoSchema.parse(birth)
  const url = `${getBase()}/alchemize`
  const payload = {
    name: birth.name || 'Subject',
    year: birth.year,
    month: birth.month,
    day: birth.day,
    hour: birth.hour,
    minute: birth.minute,
    latitude: birth.latitude,
    longitude: birth.longitude
  }

  const execResult = await alchmCB.exec(async () => {
    const res = await withRetries(() => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }), 2, 200)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Alchm /alchemize error: ${res.status} ${res.statusText} - ${text}`)
    }
    const data = await res.json().catch(() => ({}))
    return AlchmResponseSchema.parse(data)
  })

  if (!execResult.result) {
    throw new Error('Alchm /alchemize degraded')
  }
  if ((execResult as any).degraded) {
    (execResult.result as any).meta = { ...((execResult.result as any).meta || {}), degraded: true }
  }
  return execResult.result
}

export async function fetchImaginize(prompt: string, options: Record<string, any> = {}): Promise<any> {
  const url = `${getBase()}/imaginize`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...options })
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Alchm /imaginize error: ${res.status} ${res.statusText} - ${text}`)
  }
  return res.json().catch(() => ({}))
}



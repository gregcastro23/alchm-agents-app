import { NextResponse } from 'next/server'
import { sampleHourlyAlchm } from '@/lib/alchemical-kinetics-sampler'
import { computePower } from '@/lib/alchemical-kinetics'
import {
  calculateAgentOptimization,
  predictPowerTrends,
  buildResonanceMap,
} from '@/lib/server/kinetics-enhancements'

type RequestBody = {
  location: { lat: number; lon: number }
  options?: {
    includeAgentOptimization?: boolean
    includePowerPrediction?: boolean
    includeResonanceMap?: boolean
    agentIds?: string[]
  }
}

export async function POST(req: Request) {
  const start = Date.now()
  try {
    const body = (await req.json()) as RequestBody
    const lat = Number(body?.location?.lat)
    const lon = Number(body?.location?.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ success: false, error: 'Invalid lat/lon' }, { status: 400 })
    }

    const today = new Date()
    const samples = await sampleHourlyAlchm({ latitude: lat, longitude: lon }, today, {
      includePlanetaryHours: true,
      hoursToSample: 24,
      startHour: 0,
    })
    if (!samples || samples.length === 0) {
      return NextResponse.json({ success: false, error: 'No samples generated' }, { status: 500 })
    }

    const powerInput = samples.map(s => ({
      t: s.t,
      Energy: s.Energy,
      planetaryHour: s.planetaryHour,
    }))
    const power = computePower(powerInput, { window: 3 })
    const base = {
      power,
      timing: {
        planetaryHours: samples.map(s => s.planetaryHour),
        seasonalInfluence: samples[0]?.seasonalPhase || 'Unknown',
      },
    }

    const data: Record<string, any> = { base }
    const opts = body.options || {}

    if (opts.includeAgentOptimization) {
      data.agentOptimization = calculateAgentOptimization(base)
    }
    if (opts.includePowerPrediction) {
      data.powerPrediction = predictPowerTrends(base)
    }
    if (opts.includeResonanceMap) {
      data.resonanceMap = buildResonanceMap(opts.agentIds)
    }

    const computeTimeMs = Date.now() - start
    return NextResponse.json({ success: true, data, computeTimeMs, cacheHit: false })
  } catch (error) {
    console.error('enhanced kinetics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to compute enhanced kinetics' },
      { status: 500 }
    )
  }
}

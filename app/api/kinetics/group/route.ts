import { NextResponse } from 'next/server'
import { sampleHourlyAlchm } from '../../../../lib/alchemical-kinetics-sampler'
import { computePower } from '../../../../lib/alchemical-kinetics'
import {
  buildResonanceMap,
  calculateGroupResonance,
  classifyMomentum,
} from '../../../../lib/server/kinetics-enhancements'

export async function POST(req: Request) {
  const start = Date.now()
  try {
    const body = await req.json()
    const agentIds = (body.agentIds as string[]) || []
    const lat = Number(body?.location?.lat)
    const lon = Number(body?.location?.lon)
    if (!Array.isArray(agentIds) || agentIds.length < 2) {
      return NextResponse.json(
        { success: false, error: 'agentIds (>=2) required' },
        { status: 400 }
      )
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ success: false, error: 'Invalid lat/lon' }, { status: 400 })
    }

    const today = new Date()
    const samples = await sampleHourlyAlchm({ latitude: lat, longitude: lon }, today, {
      includePlanetaryHours: true,
      hoursToSample: 24,
      startHour: 0,
    })
    const powerSeries = computePower(
      samples.map(s => ({ t: s.t, Energy: s.Energy, planetaryHour: s.planetaryHour })),
      { window: 3 }
    )
    const currentPower = powerSeries[powerSeries.length - 1]?.power || 0.5
    const momentumFlow = classifyMomentum(powerSeries as any)

    const resMap = buildResonanceMap(agentIds)
    const harmony = calculateGroupResonance(agentIds, resMap.pairwiseResonances)

    // Simple amplification model: +15% per agent in peak hour (approx via power)
    const powerAmplification =
      1.0 + Math.max(0, agentIds.length - 1) * (currentPower > 0.7 ? 0.15 : 0.05)

    const computeTimeMs = Date.now() - start
    return NextResponse.json({
      success: true,
      data: {
        harmony,
        powerAmplification,
        momentumFlow,
        currentPower,
        resonances: resMap.pairwiseResonances,
      },
      computeTimeMs,
    })
  } catch (error) {
    console.error('group kinetics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to compute group dynamics' },
      { status: 500 }
    )
  }
}

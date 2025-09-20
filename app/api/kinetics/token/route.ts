import { NextResponse } from 'next/server'
import { sampleHourlyAlchm } from '@/lib/alchemical-kinetics-sampler'
import { computePower } from '@/lib/alchemical-kinetics'

export async function POST(req: Request) {
  const start = Date.now()
  try {
    const body = await req.json()
    const baseTokenRate = Number(body?.baseTokenRate ?? 100)
    const baseNFTRarity = Number(body?.baseNFTRarity ?? 0.3)
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

    const powerSeries = computePower(samples.map(s => ({ t: s.t, Energy: s.Energy, planetaryHour: s.planetaryHour })), { window: 3 })
    const power = powerSeries[powerSeries.length - 1]?.power || 0.5
    const planetaryHour = samples[samples.length - 1]?.planetaryHour || 'Sun'
    const seasonal = samples[0]?.seasonalPhase || 'Neutral'

    const velocity = 0.5 // Placeholder until we wire elemental velocity directly where needed
    const momentum: 'building' | 'sustained' | 'peak' | 'waning' = power > 0.8 ? 'peak' : power > 0.6 ? 'sustained' : power > 0.3 ? 'building' : 'waning'

    const powerModifier = 1.0 + power * 0.5
    const velocityModifier = velocity > 0.7 ? 1.3 : velocity > 0.5 ? 1.15 : 1.0
    const momentumModifier = ({ building: 1.1, sustained: 1.2, peak: 1.5, waning: 0.9 } as const)[momentum]
    const kineticMultiplier = powerModifier * velocityModifier * momentumModifier
    const currentRate = baseTokenRate * kineticMultiplier

    const powerRarityBoost = power > 0.8 ? 0.3 : power > 0.6 ? 0.15 : 0
    const planetaryRarity = ({ Sun: 0.2, Moon: 0.15, Jupiter: 0.25, Venus: 0.1 } as Record<string, number>)[planetaryHour] || 0.05
    const seasonalRarity = ({ Spring: 0.1, Summer: 0.05, Autumn: 0.15, Winter: 0.2 } as Record<string, number>)[seasonal] || 0
    const totalRarity = Math.min(1.0, baseNFTRarity + powerRarityBoost + planetaryRarity + seasonalRarity)

    const tier = totalRarity > 0.9 ? 'Legendary' : totalRarity > 0.7 ? 'Epic' : totalRarity > 0.5 ? 'Rare' : totalRarity > 0.3 ? 'Uncommon' : 'Common'
    const priceMultiplier = tier === 'Legendary' ? 10 : tier === 'Epic' ? 5 : tier === 'Rare' ? 2.5 : tier === 'Uncommon' ? 1.5 : 1

    const computeTimeMs = Date.now() - start
    return NextResponse.json({
      success: true,
      data: {
        currentRate,
        baseRate: baseTokenRate,
        kineticMultiplier,
        velocityIndicator: 'stable',
        momentumPhase: momentum,
        powerLevel: power,
        nextOptimalWindow: null,
        accumulationForecast: momentum === 'peak' ? 'PEAK PERIOD - Maximum generation active NOW' : momentum === 'sustained' ? 'Stable accumulation period - consistent generation expected' : momentum === 'building' ? 'Next 2-4 hours optimal for accumulation (momentum building)' : 'Generation slowing - consider waiting for next cycle',
        solarAmplification: planetaryHour === 'Sun' ? 1.3 : 1.0,
        seasonalModifier: ({ Spring: 1.1, Summer: 1.2, Autumn: 0.95, Winter: 0.9 } as Record<string, number>)[seasonal] || 1.0,
        nftRarity: {
          baseRarity: baseNFTRarity,
          kineticRarity: totalRarity,
          tier,
          priceMultiplier,
          powerBoost: powerRarityBoost,
          planetaryBoost: planetaryRarity,
          seasonalBoost: seasonalRarity,
          minting_time: new Date().toISOString(),
          planetary_hour: planetaryHour,
        }
      },
      computeTimeMs,
    })
  } catch (error) {
    console.error('token kinetics error:', error)
    return NextResponse.json({ success: false, error: 'Failed to compute token/NFT kinetics' }, { status: 500 })
  }
}



'use client'

import React, { useState, useEffect } from 'react'
import { AlchemicalKineticsClient } from '@/lib/kinetics-client'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface KineticTokenMetrics {
  currentRate: number
  baseRate: number
  kineticMultiplier: number
  velocityIndicator: 'increasing' | 'stable' | 'decreasing'
  momentumPhase: 'building' | 'sustained' | 'peak' | 'waning'
  powerLevel: number
  nextOptimalWindow: Date | null
  accumulationForecast: string
  solarAmplification: number
  seasonalModifier: number
}

interface NFTRarityData {
  baseRarity: number
  kineticRarity: number
  tier: string
  priceMultiplier: number
  powerBoost: number
  planetaryBoost: number
  seasonalBoost: number
  minting_time: string
  planetary_hour: string
}

interface TokenDashboardKineticsProps {
  baseTokenRate?: number
  baseNFTRarity?: number
  userLocation?: { lat: number; lon: number }
  className?: string
  variant?: 'full' | 'compact'
}

export function TokenDashboardKinetics({
  baseTokenRate = 100,
  baseNFTRarity = 0.3,
  userLocation = { lat: 37.7749, lon: -122.4194 },
  className = '',
  variant = 'full',
}: TokenDashboardKineticsProps) {
  const [metrics, setMetrics] = useState<KineticTokenMetrics | null>(null)
  const [nftRarity, setNFTRarity] = useState<NFTRarityData | null>(null)
  const [historicalRates, setHistoricalRates] = useState<
    Array<{ time: string; rate: number; power: number }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchKineticMetrics()

    // Update every minute for real-time feedback
    const interval = setInterval(fetchKineticMetrics, 60000)

    return () => clearInterval(interval)
  }, [userLocation, baseTokenRate, baseNFTRarity])

  const fetchKineticMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current kinetics
      const kinetics = await AlchemicalKineticsClient.get({
        lat: userLocation.lat,
        lon: userLocation.lon,
        date: new Date().toISOString().split('T')[0],
        includeElemental: true,
        includePlanetary: true,
      })

      // Calculate token generation metrics
      const tokenMetrics = calculateTokenGenerationRate(baseTokenRate, kinetics)

      // Calculate NFT rarity
      const nftData = calculateNFTRarity(baseNFTRarity, kinetics, new Date())

      // Determine velocity trend
      const velocityTrend = kinetics.elementalVelocity?.slice(-3) || []
      const velocityIndicator: KineticTokenMetrics['velocityIndicator'] =
        velocityTrend.length >= 2 &&
        velocityTrend[velocityTrend.length - 1]?.magnitude > velocityTrend[0]?.magnitude
          ? 'increasing'
          : velocityTrend.length >= 2 &&
              velocityTrend[velocityTrend.length - 1]?.magnitude < velocityTrend[0]?.magnitude
            ? 'decreasing'
            : 'stable'

      // Predict next optimal window
      const nextOptimal = predictNextOptimalWindow(kinetics)

      setMetrics({
        currentRate: tokenMetrics.kinetic_rate,
        baseRate: tokenMetrics.base_rate,
        kineticMultiplier: tokenMetrics.total_multiplier,
        velocityIndicator,
        momentumPhase: tokenMetrics.momentum_type as KineticTokenMetrics['momentumPhase'],
        powerLevel: kinetics.power[kinetics.power.length - 1]?.power || 0.5,
        nextOptimalWindow: nextOptimal,
        accumulationForecast: tokenMetrics.accumulation_prediction,
        solarAmplification: getSolarAmplification(kinetics),
        seasonalModifier: getSeasonalModifier(kinetics),
      })

      setNFTRarity(nftData)

      // Update historical rates (keep last 24 points)
      setHistoricalRates(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          rate: tokenMetrics.kinetic_rate,
          power: kinetics.power[kinetics.power.length - 1]?.power || 0.5,
        }
        return [...prev.slice(-23), newPoint]
      })
    } catch (err) {
      console.error('Token kinetics fetch error:', err)
      setError('Unable to fetch kinetic data')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !metrics) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-32 bg-gray-700/50 rounded-lg"></div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className={`text-red-400/70 text-sm p-3 ${className}`}>
        {error || 'Unable to load token metrics'}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        className={`p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Token Generation</span>
          <span className={`text-sm font-bold ${getVelocityColor(metrics.velocityIndicator)}`}>
            {metrics.velocityIndicator === 'increasing'
              ? '↑'
              : metrics.velocityIndicator === 'decreasing'
                ? '↓'
                : '→'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">Current Rate:</span>
          <span className="text-green-400 font-bold">
            {metrics.currentRate.toFixed(1)} tokens/hour
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Multiplier:</span>
          <span className="text-yellow-400">×{metrics.kineticMultiplier.toFixed(2)}</span>
        </div>

        {metrics.momentumPhase === 'peak' && (
          <div className="mt-2 text-xs text-green-400 animate-pulse">🔥 PEAK GENERATION ACTIVE</div>
        )}
      </div>
    )
  }

  // Full variant
  return (
    <div
      className={`p-4 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-lg border border-gray-700/50 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Token Kinetics Dashboard</h3>
        {loading && (
          <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>

      {/* Generation Rate */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Token Generation Rate</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-green-400">
              {metrics.currentRate.toFixed(1)} tokens/hour
            </span>
            <span className={`text-sm ${getVelocityColor(metrics.velocityIndicator)}`}>
              {metrics.velocityIndicator === 'increasing'
                ? '↗ Increasing'
                : metrics.velocityIndicator === 'decreasing'
                  ? '↘ Decreasing'
                  : '→ Stable'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>Base: {metrics.baseRate} tokens/hour</span>
          <span>Kinetic Multiplier: ×{metrics.kineticMultiplier.toFixed(2)}</span>
        </div>
      </div>

      {/* Momentum Phase */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Momentum Phase</span>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getMomentumColor(metrics.momentumPhase)}`}
          >
            {metrics.momentumPhase}
          </div>
        </div>
        {metrics.momentumPhase === 'peak' && (
          <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded text-sm">
            <span className="text-green-400 animate-pulse">🔥</span>
            <span className="text-green-400">
              MAXIMUM GENERATION ACTIVE - Optimal accumulation time!
            </span>
          </div>
        )}
      </div>

      {/* Power Gauge */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Power Level</span>
          <span className="text-orange-400 font-bold">
            {(metrics.powerLevel * 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${metrics.powerLevel * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
          <span>Solar: ×{metrics.solarAmplification.toFixed(2)}</span>
          <span>Seasonal: ×{metrics.seasonalModifier.toFixed(2)}</span>
        </div>
      </div>

      {/* NFT Rarity Section */}
      {nftRarity && (
        <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Current NFT Minting</span>
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(nftRarity.tier)}`}
            >
              {nftRarity.tier}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Rarity:</span>
              <span className="text-purple-400 ml-1">
                {(nftRarity.kineticRarity * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400">Price:</span>
              <span className="text-green-400 ml-1">×{nftRarity.priceMultiplier}</span>
            </div>
          </div>
        </div>
      )}

      {/* Forecast */}
      <div className="mb-4">
        <div className="text-sm text-gray-300 mb-1">Accumulation Forecast</div>
        <p className="text-xs text-gray-400">{metrics.accumulationForecast}</p>
        {metrics.nextOptimalWindow && (
          <div className="text-xs text-cyan-400 mt-1">
            Next optimal: {metrics.nextOptimalWindow.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Rate Chart */}
      {historicalRates.length > 1 && (
        <div className="mt-4">
          <div className="text-sm text-gray-300 mb-2">24-Hour Rate History</div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalRates}>
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  interval="preserveStartEnd"
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#D1D5DB' }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, stroke: '#10B981', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="power"
                  stroke="#F59E0B"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mt-1">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-green-400"></div>
              <span>Generation Rate</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-yellow-400 border-dashed"></div>
              <span>Power Level</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Utility functions for calculations
function calculateTokenGenerationRate(baseRate: number, kinetics: any) {
  const power = kinetics.power[kinetics.power.length - 1]?.power || 0.5
  const velocity =
    kinetics.elementalVelocity[kinetics.elementalVelocity.length - 1]?.magnitude || 0.5
  const momentum =
    kinetics.elementalMomentum[kinetics.elementalMomentum.length - 1]?.momentumType || 'sustained'

  const powerModifier = 1.0 + power * 0.5 // Up to 50% boost
  const velocityModifier = velocity > 0.7 ? 1.3 : velocity > 0.5 ? 1.15 : 1.0
  const momentumModifier =
    {
      building: 1.1,
      sustained: 1.2,
      peak: 1.5,
      waning: 0.9,
    }[momentum] || 1.0

  const totalMultiplier = powerModifier * velocityModifier * momentumModifier
  const kineticRate = baseRate * totalMultiplier

  return {
    base_rate: baseRate,
    kinetic_rate: kineticRate,
    power_modifier: powerModifier,
    velocity_modifier: velocityModifier,
    momentum_modifier: momentumModifier,
    total_multiplier: totalMultiplier,
    momentum_type: momentum,
    accumulation_prediction: predictAccumulation(kineticRate, momentum),
  }
}

function calculateNFTRarity(baseRarity: number, kinetics: any, mintingTime: Date) {
  const power = kinetics.power[kinetics.power.length - 1]?.power || 0.5
  const currentHour = kinetics.timing?.planetaryHours[0] || 'Sun'
  const seasonal = kinetics.timing?.seasonalInfluence || 'Neutral'

  const powerRarityBoost = power > 0.8 ? 0.3 : power > 0.6 ? 0.15 : 0
  const planetaryRarity =
    {
      Sun: 0.2,
      Moon: 0.15,
      Jupiter: 0.25,
      Venus: 0.1,
    }[currentHour] || 0.05
  const seasonalRarity =
    {
      Spring: 0.1,
      Summer: 0.05,
      Autumn: 0.15,
      Winter: 0.2,
    }[seasonal] || 0

  const totalRarity = Math.min(
    1.0,
    baseRarity + powerRarityBoost + planetaryRarity + seasonalRarity
  )

  let tier: string, priceMultiplier: number
  if (totalRarity > 0.9) {
    tier = 'Legendary'
    priceMultiplier = 10.0
  } else if (totalRarity > 0.7) {
    tier = 'Epic'
    priceMultiplier = 5.0
  } else if (totalRarity > 0.5) {
    tier = 'Rare'
    priceMultiplier = 2.5
  } else if (totalRarity > 0.3) {
    tier = 'Uncommon'
    priceMultiplier = 1.5
  } else {
    tier = 'Common'
    priceMultiplier = 1.0
  }

  return {
    baseRarity,
    kineticRarity: totalRarity,
    tier,
    priceMultiplier,
    powerBoost: powerRarityBoost,
    planetaryBoost: planetaryRarity,
    seasonalBoost: seasonalRarity,
    minting_time: mintingTime.toISOString(),
    planetary_hour: currentHour,
  }
}

function predictAccumulation(rate: number, momentum: string): string {
  if (momentum === 'building') return 'Next 2-4 hours optimal for accumulation (momentum building)'
  if (momentum === 'sustained') return 'Stable accumulation period - consistent generation expected'
  if (momentum === 'peak') return 'PEAK PERIOD - Maximum generation active NOW'
  return 'Generation slowing - consider waiting for next cycle'
}

function predictNextOptimalWindow(kinetics: any): Date | null {
  // Simple prediction: next hour if power is rising, otherwise in 2-4 hours
  const power = kinetics.power[kinetics.power.length - 1]?.power || 0.5
  const nextWindow = new Date()
  nextWindow.setHours(nextWindow.getHours() + (power > 0.6 ? 1 : 3))
  return nextWindow
}

function getSolarAmplification(kinetics: any): number {
  const currentHour = kinetics.timing?.planetaryHours[0] || 'Sun'
  return currentHour === 'Sun' ? 1.3 : 1.0
}

function getSeasonalModifier(kinetics: any): number {
  const seasonal = kinetics.timing?.seasonalInfluence || 'Neutral'
  const modifiers = { Spring: 1.1, Summer: 1.2, Autumn: 0.95, Winter: 0.9 }
  return modifiers[seasonal as keyof typeof modifiers] || 1.0
}

// Style helper functions
function getVelocityColor(indicator: string): string {
  switch (indicator) {
    case 'increasing':
      return 'text-green-400'
    case 'decreasing':
      return 'text-red-400'
    default:
      return 'text-yellow-400'
  }
}

function getMomentumColor(phase: string): string {
  switch (phase) {
    case 'peak':
      return 'bg-green-500/20 text-green-400'
    case 'sustained':
      return 'bg-blue-500/20 text-blue-400'
    case 'building':
      return 'bg-yellow-500/20 text-yellow-400'
    case 'waning':
      return 'bg-orange-500/20 text-orange-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'Legendary':
      return 'bg-purple-500/20 text-purple-300'
    case 'Epic':
      return 'bg-blue-500/20 text-blue-300'
    case 'Rare':
      return 'bg-green-500/20 text-green-300'
    case 'Uncommon':
      return 'bg-yellow-500/20 text-yellow-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

export default TokenDashboardKinetics

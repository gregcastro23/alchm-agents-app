/**
 * Classical Alchemical Kinetics Module
 * -----------------------------------
 * This module defines derivative-based kinetics on top of the existing alchemizer outputs
 * without modifying the core engine formulas (Heat, Entropy, Reactivity, Energy).
 *
 * Classical Correspondences (documented basis):
 * - Velocity (Celeritas): Mercury principle; rate of transformation in time.
 * - Momentum (Impetus): Mars + Saturn synthesis; sustained force of change informed by inertia.
 * - Power (Potentia): Solar principle; capacity for work via rate of Energy change.
 * - Inertia (Stabilitas): Earth + Matter + Substance foundation; resistance to rapid change.
 *
 * Elemental Principles:
 * - No opposites, no balancing. Each element is computed independently; like reinforces like.
 * - Planetary timing modulates rate constants only; base totals/metrics are preserved.
 */

// Shared narrow types for elements and metrics to ensure strictness
export type ElementKey = 'Fire' | 'Water' | 'Air' | 'Earth'
export type ElementVector = Record<ElementKey, number>
export type MetricKey = 'Heat' | 'Entropy' | 'Reactivity' | 'Energy'
export type MetricVector = Record<MetricKey, number>

// Planetary hour label (classical seven + outer + ascendant allowed for extensibility)
export type PlanetaryHour =
  | 'Sun'
  | 'Moon'
  | 'Mars'
  | 'Mercury'
  | 'Jupiter'
  | 'Venus'
  | 'Saturn'
  | string // allow extended systems while preferring the classical seven

// Utility: clamp and safe divide
function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  if (value < min) return min
  if (value > max) return max
  return value
}

function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return 0
  return numerator / denominator
}

function movingAverage(series: number[], window: number): number[] {
  const w = Math.max(1, Math.floor(window))
  const out: number[] = new Array(series.length).fill(0)
  let run = 0
  for (let i = 0; i < series.length; i++) {
    run += series[i]
    if (i >= w) run -= series[i - w]
    const denom = i < w - 1 ? i + 1 : w
    out[i] = run / denom
  }
  return out
}

// Planetary modifiers: classical timing influences on rates (do not alter base values)
// Values are gentle multipliers to encode "more likely/faster" without overwhelming the base data.
// These are intentionally conservative and can be calibrated further.
export function getPlanetaryVelocityModifier(hour: PlanetaryHour, element: ElementKey): number {
  // Mercury enhances velocity globally (Celeritas); element-specific peaks apply
  const base = 1.0
  const mercuryBoost = hour === 'Mercury' ? 1.1 : 1.0
  const elementPeaks: Record<ElementKey, number> = {
    Fire: hour === 'Sun' || hour === 'Mars' ? 1.2 : 1.0,
    Water: hour === 'Moon' || hour === 'Venus' ? 1.15 : 1.0,
    Air: hour === 'Mercury' ? 1.15 : 1.0,
    Earth: hour === 'Saturn' ? 1.1 : 1.0,
  }
  return base * mercuryBoost * elementPeaks[element]
}

export function getPlanetaryMomentumModifier(hour: PlanetaryHour): number {
  // Mars + Saturn synthesis for sustained impetus
  if (hour === 'Mars' || hour === 'Saturn') return 1.15
  return 1.0
}

export function getPlanetaryInertiaModifier(hour: PlanetaryHour): number {
  // Saturnian stabilization
  return hour === 'Saturn' ? 1.1 : 1.0
}

export function getSolarAmplification(hour?: PlanetaryHour): number {
  return hour === 'Sun' ? 1.3 : 1.0 // +30% typical during Sun hours
}

export function getThermalDirection(heatDvdt: number): 'heating' | 'cooling' | 'stable' {
  if (heatDvdt > 0.001) return 'heating'
  if (heatDvdt < -0.001) return 'cooling'
  return 'stable'
}

// ---- Core Functions ----

/**
 * Compute finite differences using Mercury principle (swift calculation)
 * - Applies optional moving average smoothing (default 3, the Mercury triad)
 */
export function computeFiniteDifference(
  series: Array<{ t: Date; value: number }>,
  smoothingWindow: number = 3
): Array<{ t: Date; dvdt: number }> {
  if (!series || series.length === 0) return []
  const values = series.map(s => s.value)
  const smoothed = smoothingWindow > 1 ? movingAverage(values, smoothingWindow) : values
  const out: Array<{ t: Date; dvdt: number }> = []
  for (let i = 0; i < series.length; i++) {
    if (i === 0) {
      out.push({ t: series[i].t, dvdt: 0 })
      continue
    }
    const dtMs = series[i].t.getTime() - series[i - 1].t.getTime()
    const dt = dtMs / 3600000 // hours
    const dv = smoothed[i] - smoothed[i - 1]
    out.push({ t: series[i].t, dvdt: safeDivide(dv, dt) })
  }
  return out
}

/**
 * Elemental velocity computation (Celeritas per element)
 * Respects independent elements (no cross interference). Includes timing modifiers.
 * Kinetic intensity magnitude uses Euclidean norm of the per-element velocities.
 */
export function computeElementalVelocity(
  samples: Array<{
    t: Date
    totals: ElementVector
    planetaryHour?: PlanetaryHour
  }>
): Array<{
  t: Date
  v: ElementVector
  magnitude: number
  dominantElement: ElementKey
}> {
  if (!samples || samples.length === 0) return []
  const out: Array<{ t: Date; v: ElementVector; magnitude: number; dominantElement: ElementKey }> =
    []
  for (let i = 0; i < samples.length; i++) {
    const current = samples[i]
    const previous = i > 0 ? samples[i - 1] : undefined
    const dt = previous ? (current.t.getTime() - previous.t.getTime()) / 3600000 : 0 // hours

    const rawV: ElementVector = { Fire: 0, Water: 0, Air: 0, Earth: 0 }
    ;(Object.keys(rawV) as ElementKey[]).forEach(el => {
      if (!previous || dt === 0) {
        rawV[el] = 0
      } else {
        const dv = current.totals[el] - previous.totals[el]
        const base = safeDivide(dv, dt)
        const modifier = getPlanetaryVelocityModifier(current.planetaryHour ?? '', el)
        rawV[el] = base * modifier
      }
    })

    const magnitude = Math.sqrt(
      rawV.Fire * rawV.Fire +
        rawV.Water * rawV.Water +
        rawV.Air * rawV.Air +
        rawV.Earth * rawV.Earth
    )
    let dominantElement: ElementKey = 'Fire'
    let maxVal = rawV.Fire
    ;(['Water', 'Air', 'Earth'] as ElementKey[]).forEach(el => {
      if (rawV[el] > maxVal) {
        maxVal = rawV[el]
        dominantElement = el
      }
    })

    out.push({ t: current.t, v: rawV, magnitude, dominantElement })
  }
  return out
}

/**
 * Thermodynamic metric velocities (rate of energetic change)
 * Returns dv/dt per metric and a traditional thermal direction from Heat slope.
 */
export function computeMetricVelocity(
  samples: Array<{ t: Date; Heat: number; Entropy: number; Reactivity: number; Energy: number }>
): Array<{
  t: Date
  dvdt: MetricVector
  thermalDirection: 'heating' | 'cooling' | 'stable'
}> {
  if (!samples || samples.length === 0) return []
  const out: Array<{
    t: Date
    dvdt: MetricVector
    thermalDirection: 'heating' | 'cooling' | 'stable'
  }> = []
  for (let i = 0; i < samples.length; i++) {
    const current = samples[i]
    const previous = i > 0 ? samples[i - 1] : undefined
    const dt = previous ? (current.t.getTime() - previous.t.getTime()) / 3600000 : 0 // hours

    const dvdt: MetricVector = { Heat: 0, Entropy: 0, Reactivity: 0, Energy: 0 }
    ;(Object.keys(dvdt) as MetricKey[]).forEach(k => {
      if (!previous || dt === 0) {
        dvdt[k] = 0
      } else {
        const dv = (current as any)[k] - (previous as any)[k]
        dvdt[k] = safeDivide(dv, dt)
      }
    })

    const thermalDirection = getThermalDirection(dvdt.Heat)
    out.push({ t: current.t, dvdt, thermalDirection })
  }
  return out
}

/**
 * Elemental momentum using alchemical inertia (Stabilitas principle)
 * Inertia: m(t) = max(1, 1 + matter + earth + substance/2)
 * Momentum phase:
 * - building: velocity and inertia both increasing
 * - sustained: high momentum with roughly stable velocity
 * - dissipating: decreasing velocity despite inertia
 */
export function computeElementalMomentum(
  samples: Array<{
    t: Date
    v: ElementVector
    inertia: number // caller provides inertia already computed (optionally adjusted for timing)
    substance?: number
  }>
): Array<{
  t: Date
  p: ElementVector
  magnitude: number
  momentumType: 'building' | 'sustained' | 'dissipating'
}> {
  if (!samples || samples.length === 0) return []
  const out: Array<{
    t: Date
    p: ElementVector
    magnitude: number
    momentumType: 'building' | 'sustained' | 'dissipating'
  }> = []
  for (let i = 0; i < samples.length; i++) {
    const current = samples[i]
    const previous = i > 0 ? samples[i - 1] : undefined

    // Momentum vector p = m * v (per-element v, shared inertia)
    const p: ElementVector = {
      Fire: current.inertia * current.v.Fire,
      Water: current.inertia * current.v.Water,
      Air: current.inertia * current.v.Air,
      Earth: current.inertia * current.v.Earth,
    }

    const magnitude = Math.sqrt(
      p.Fire * p.Fire + p.Water * p.Water + p.Air * p.Air + p.Earth * p.Earth
    )

    // Phase assessment using finite differences on magnitude and inertia
    let momentumType: 'building' | 'sustained' | 'dissipating' = 'sustained'
    if (previous) {
      const prevMagnitude = Math.sqrt(
        previous.v.Fire * previous.inertia * previous.v.Fire * previous.inertia +
          previous.v.Water * previous.inertia * previous.v.Water * previous.inertia +
          previous.v.Air * previous.inertia * previous.v.Air * previous.inertia +
          previous.v.Earth * previous.inertia * previous.v.Earth * previous.inertia
      )
      const dMag = magnitude - prevMagnitude
      const dInertia = current.inertia - previous.inertia
      if (dMag > 0.001 && dInertia >= 0) {
        momentumType = 'building'
      } else if (Math.abs(dMag) <= 0.001) {
        momentumType = 'sustained'
      } else {
        momentumType = 'dissipating'
      }
    }

    out.push({ t: current.t, p, magnitude, momentumType })
  }
  return out
}

/**
 * Alchemical Power (Potentia) - Solar principle manifesting
 * Power = dEnergy/dt with optional solar amplification for planetary hour = Sun.
 */
export function computePower(
  samples: Array<{ t: Date; Energy: number; planetaryHour?: PlanetaryHour }>,
  options: { window?: number } = {}
): Array<{ t: Date; power: number; solarAmplification?: number }> {
  if (!samples || samples.length === 0) return []
  const raw: Array<{ t: Date; power: number; solarAmplification?: number }> = []
  for (let i = 0; i < samples.length; i++) {
    const current = samples[i]
    const previous = i > 0 ? samples[i - 1] : undefined
    const dt = previous ? (current.t.getTime() - previous.t.getTime()) / 3600000 : 0 // hours
    const dE = previous ? current.Energy - previous.Energy : 0
    const basePower = safeDivide(dE, dt)
    const solarAmplification = getSolarAmplification(current.planetaryHour)
    const power = basePower * solarAmplification
    raw.push({
      t: current.t,
      power,
      solarAmplification: solarAmplification !== 1 ? solarAmplification : undefined,
    })
  }

  // Optional smoothing using simple moving average over window
  const windowSize = Math.max(1, Math.floor(options.window ?? 1))
  if (windowSize <= 1) return raw

  const smoothed: Array<{ t: Date; power: number; solarAmplification?: number }> = []
  for (let i = 0; i < raw.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const slice = raw.slice(start, i + 1)
    const avg = slice.reduce((sum, s) => sum + (isFinite(s.power) ? s.power : 0), 0) / slice.length
    smoothed.push({ t: raw[i].t, power: avg, solarAmplification: raw[i].solarAmplification })
  }
  return smoothed
}

// ---- Inertia Helpers (optional for callers to compute provided inertia) ----

/**
 * Compute classical inertia from matter, earth, and substance at a given time.
 * m(t) = max(1, 1 + matter + earth + substance/2)
 * Optionally applies a planetary hour adjustment (Saturnian stabilization).
 */
export function computeInertia(input: {
  matter: number
  earth: number
  substance: number
  planetaryHour?: PlanetaryHour
}): number {
  const base = Math.max(1, 1 + input.matter + input.earth + input.substance / 2)
  const adjusted = base * getPlanetaryInertiaModifier(input.planetaryHour ?? '')
  return adjusted
}

// ---- Traditional Validation ----

export type KineticValidationExpectedRanges = {
  velocityMax: number
  momentumMax: number
  powerMax: number
}

export type KineticValidationResult = {
  isValid: boolean
  warnings: string[]
  traditionalAssessment: string
}

/**
 * Traditional validation helper
 * Performs sanity checks and classical expectations:
 * - Fire velocity peaks in Mars/Sun hours
 * - Water momentum builds in Moon/Venus hours
 * - Power shows solar correlation (+~30% typical)
 * - Earth inertia dampens rapid changes (lower velocity variance with high earth)
 */
export function validateKineticResults(
  kinetics: any,
  expectedRanges: KineticValidationExpectedRanges
): KineticValidationResult {
  const warnings: string[] = []

  // Range checks
  const vMax =
    kinetics.elementalVelocity?.reduce((m: number, s: any) => Math.max(m, s.magnitude || 0), 0) ?? 0
  const pMax =
    kinetics.elementalMomentum?.reduce((m: number, s: any) => Math.max(m, s.magnitude || 0), 0) ?? 0
  const powMax = kinetics.power?.reduce((m: number, s: any) => Math.max(m, s.power || 0), 0) ?? 0
  if (vMax > expectedRanges.velocityMax)
    warnings.push(
      `Velocity magnitude exceeds expected max (${vMax.toFixed(3)} > ${expectedRanges.velocityMax}).`
    )
  if (pMax > expectedRanges.momentumMax)
    warnings.push(
      `Momentum magnitude exceeds expected max (${pMax.toFixed(3)} > ${expectedRanges.momentumMax}).`
    )
  if (powMax > expectedRanges.powerMax)
    warnings.push(`Power exceeds expected max (${powMax.toFixed(3)} > ${expectedRanges.powerMax}).`)

  // Timing expectations (heuristic counts over series)
  const countByHour: Record<
    string,
    { fireLead: number; total: number; powerSum: number; powerCount: number }
  > = {}
  ;(kinetics.elementalVelocity ?? []).forEach((s: any) => {
    const hour = s.planetaryHour ?? s.hour ?? 'unknown'
    if (!countByHour[hour])
      countByHour[hour] = { fireLead: 0, total: 0, powerSum: 0, powerCount: 0 }
    // Fire leads when v.Fire is the max among elements
    const v = s.v as ElementVector
    const maxEl = (['Fire', 'Water', 'Air', 'Earth'] as ElementKey[]).reduce((a, b) =>
      v[a] >= v[b] ? a : (b as ElementKey)
    )
    if (maxEl === 'Fire') countByHour[hour].fireLead += 1
    countByHour[hour].total += 1
  })

  ;(kinetics.power ?? []).forEach((s: any) => {
    const hour = s.planetaryHour ?? s.hour ?? 'unknown'
    if (!countByHour[hour])
      countByHour[hour] = { fireLead: 0, total: 0, powerSum: 0, powerCount: 0 }
    if (typeof s.power === 'number') {
      countByHour[hour].powerSum += s.power
      countByHour[hour].powerCount += 1
    }
  })

  // Fire lead share in Sun/Mars hours
  const fireLeadShare = (hour: PlanetaryHour) => {
    const c = countByHour[hour]
    if (!c || c.total === 0) return 0
    return c.fireLead / c.total
  }
  const fireShareSun = fireLeadShare('Sun')
  const fireShareMars = fireLeadShare('Mars')
  if (fireShareSun < 0.2 || fireShareMars < 0.2) {
    warnings.push('Fire velocity does not lead sufficiently during Sun/Mars hours.')
  }

  // Solar correlation: Sun hour average power higher than overall average by ~30%
  const overallPowerAvg = (() => {
    const sum = Object.values(countByHour).reduce((acc, v) => acc + v.powerSum, 0)
    const cnt = Object.values(countByHour).reduce((acc, v) => acc + v.powerCount, 0)
    return cnt > 0 ? sum / cnt : 0
  })()
  const sunPowerAvg = (() => {
    const s = countByHour['Sun']
    return s && s.powerCount > 0 ? s.powerSum / s.powerCount : 0
  })()
  if (overallPowerAvg > 0) {
    const ratio = safeDivide(sunPowerAvg, overallPowerAvg)
    if (ratio < 1.2)
      warnings.push('Power shows weak solar amplification (<20% over baseline during Sun hours).')
  }

  const isValid = warnings.length === 0
  const traditionalAssessment = isValid
    ? 'Kinetics align with classical expectations.'
    : 'Kinetics deviate from some classical expectations.'
  return { isValid, warnings, traditionalAssessment }
}

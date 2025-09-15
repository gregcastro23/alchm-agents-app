// Temporal Delta Engine for The Philosopher's Stone
// Tracks changes between sessions, planetary movement deltas, and consciousness growth

export type PlanetPosition = {
  planet: string
  sign: string
  degree: number // 0-29.99 within sign
}

export type SessionSnapshot = {
  timestamp: string // ISO
  planetaryPositions: PlanetPosition[]
  alchmQuantities?: {
    spirit: number
    essence: number
    matter: number
    substance: number
    Heat?: number
    Entropy?: number
    Reactivity?: number
    Energy?: number
  }
  monicaConstant?: number
}

export type TemporalDelta = {
  daysSinceLast: number
  planetaryMovement: Array<{
    planet: string
    movedDegrees: number // 0-360
    from: { sign: string; degree: number }
    to: { sign: string; degree: number }
  }>
  consciousnessDelta?: {
    monicaConstantDelta?: number
    energyDelta?: number
  }
}

function normalizeDegree(deg: number): number {
  // Keep within 0-360
  const x = ((deg % 360) + 360) % 360
  return x
}

function signDegreeToAbsolute(sign: string, degree: number): number {
  const order = [
    'Aries',
    'Taurus',
    'Gemini',
    'Cancer',
    'Leo',
    'Virgo',
    'Libra',
    'Scorpio',
    'Sagittarius',
    'Capricorn',
    'Aquarius',
    'Pisces',
  ]
  const idx = order.indexOf(sign)
  const base = idx >= 0 ? idx * 30 : 0
  return normalizeDegree(base + Math.max(0, Math.min(29.9999, degree)))
}

function shortestAngularDistance(from: number, to: number): number {
  const diff = normalizeDegree(to - from)
  return diff <= 180 ? diff : 360 - diff
}

export function computePlanetaryMovement(
  previous: PlanetPosition[],
  current: PlanetPosition[]
): TemporalDelta['planetaryMovement'] {
  const byPlanetPrev = new Map(previous.map(p => [p.planet.toLowerCase(), p]))
  const result: TemporalDelta['planetaryMovement'] = []
  for (const now of current) {
    const prev = byPlanetPrev.get(now.planet.toLowerCase())
    if (!prev) continue
    const fromAbs = signDegreeToAbsolute(prev.sign, prev.degree)
    const toAbs = signDegreeToAbsolute(now.sign, now.degree)
    const moved = shortestAngularDistance(fromAbs, toAbs)
    result.push({
      planet: now.planet,
      movedDegrees: Math.round(moved * 100) / 100,
      from: { sign: prev.sign, degree: prev.degree },
      to: { sign: now.sign, degree: now.degree },
    })
  }
  // Sort by greatest movement
  return result.sort((a, b) => b.movedDegrees - a.movedDegrees)
}

export function computeTemporalDelta(
  previousSession: SessionSnapshot,
  currentSession: SessionSnapshot
): TemporalDelta {
  const prevTime = new Date(previousSession.timestamp)
  const curTime = new Date(currentSession.timestamp)
  const daysSinceLast = Math.max(
    0,
    Math.round(((curTime.getTime() - prevTime.getTime()) / (1000 * 60 * 60 * 24)) * 10) / 10
  )

  const planetaryMovement = computePlanetaryMovement(
    previousSession.planetaryPositions,
    currentSession.planetaryPositions
  )

  let consciousnessDelta: TemporalDelta['consciousnessDelta'] | undefined
  if (
    typeof previousSession.monicaConstant === 'number' ||
    typeof currentSession.monicaConstant === 'number'
  ) {
    const mcPrev = previousSession.monicaConstant ?? 0
    const mcCur = currentSession.monicaConstant ?? 0
    const energyPrev = previousSession.alchmQuantities?.Energy ?? 0
    const energyCur = currentSession.alchmQuantities?.Energy ?? 0
    consciousnessDelta = {
      monicaConstantDelta: Math.round((mcCur - mcPrev) * 1000) / 1000,
      energyDelta: Math.round((energyCur - energyPrev) * 100) / 100,
    }
  }

  return { daysSinceLast, planetaryMovement, consciousnessDelta }
}

export function summarizeDelta(delta: TemporalDelta): string[] {
  const lines: string[] = []
  lines.push(`${delta.daysSinceLast} days since last session`)
  const moonMove = delta.planetaryMovement.find(p => p.planet.toLowerCase() === 'moon')
  if (moonMove) lines.push(`The Moon has journeyed ${moonMove.movedDegrees}°`)
  const mercuryMove = delta.planetaryMovement.find(p => p.planet.toLowerCase() === 'mercury')
  if (mercuryMove) lines.push(`Mercury has rewired ${mercuryMove.movedDegrees}° of mental patterns`)
  if (delta.consciousnessDelta?.monicaConstantDelta !== undefined) {
    lines.push(
      `Your consciousness has expanded by ${delta.consciousnessDelta.monicaConstantDelta} points`
    )
  }
  return lines
}

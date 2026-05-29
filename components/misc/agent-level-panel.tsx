'use client'

/**
 * AgentLevelPanel — the Cosmic EV/IV training dashboard for a single agent.
 *
 * Self-contained: given an agentId it fetches /api/agents/:id/leveling (Neon via
 * Prisma) and renders the level badge, XP-to-next bar, a Sacred 7 SVG radar
 * (IV blueprint + EV-trained overlay), the EV total (x/510), and an ESMS-charged
 * "Reset EVs" button. No chart library — the radar is a plain SVG polygon.
 */
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RotateCw, Sparkles, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  SACRED_7_KEYS,
  EV_TOTAL_CAP,
  EV_SINGLE_CAP,
  type Sacred7Key,
} from '@/lib/consciousness-engine'

interface LevelingData {
  agentId: string
  name: string
  level: number
  xp: number
  progress: {
    level: number
    xpIntoLevel: number
    xpForLevelSpan: number
    progress: number
  }
  ivs: Record<Sacred7Key, number>
  evs: Partial<Record<Sacred7Key, number>>
  evTotal: number
  effectiveStats: Record<Sacred7Key, number>
}

const STAT_LABELS: { key: Sacred7Key; short: string; full: string }[] = [
  { key: 'wisdom', short: 'Wis', full: 'Wisdom' },
  { key: 'charisma', short: 'Cha', full: 'Charisma' },
  { key: 'intuition', short: 'Int', full: 'Intuition' },
  { key: 'analytical', short: 'Ana', full: 'Analytical' },
  { key: 'creativity', short: 'Cre', full: 'Creativity' },
  { key: 'empathy', short: 'Emp', full: 'Empathy' },
  { key: 'vitality', short: 'Vit', full: 'Vitality' },
]

// Radar geometry. MAX = 100 IV + 252/4 EV = 163; round up for headroom.
const SIZE = 248
const CX = SIZE / 2
const CY = SIZE / 2 - 6
const R = 86
const RADAR_MAX = 165

const angleFor = (i: number) => ((-90 + i * (360 / SACRED_7_KEYS.length)) * Math.PI) / 180
function point(i: number, value: number, radius = R): [number, number] {
  const r = (Math.min(RADAR_MAX, Math.max(0, value)) / RADAR_MAX) * radius
  return [CX + r * Math.cos(angleFor(i)), CY + r * Math.sin(angleFor(i))]
}
const polygon = (values: number[]) => values.map((v, i) => point(i, v).join(',')).join(' ')

export function AgentLevelPanel({ agentId }: { agentId: string }) {
  const { toast } = useToast()
  const [data, setData] = useState<LevelingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/leveling`)
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to load leveling')
      setData(json as LevelingData)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leveling')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    load()
  }, [load])

  const handleReset = useCallback(async () => {
    if (resetting) return
    setResetting(true)
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/reset-evs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (res.status === 401) {
        toast({
          title: 'Sign in required',
          description: 'Log in to reset Evolution Values.',
          variant: 'destructive',
        })
        return
      }
      if (res.status === 402) {
        toast({
          title: 'Not enough ESMS',
          description: 'You need 50 ESMS tokens to reset.',
          variant: 'destructive',
        })
        return
      }
      if (!json?.success) throw new Error(json?.error || 'Reset failed')
      toast({
        title: json.charged ? 'Evolution Values reset' : 'Already at 0 EVs',
        description: json.charged ? '50 ESMS spent. Re-spec away.' : 'Nothing to reset.',
      })
      await load()
    } catch (e) {
      toast({
        title: 'Reset failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setResetting(false)
    }
  }, [agentId, resetting, toast, load])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading cosmic training…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-3 py-6 text-center text-sm text-muted-foreground">
        <p>Couldn’t load training data{error ? `: ${error}` : ''}.</p>
        <Button size="sm" variant="outline" onClick={load}>
          Retry
        </Button>
      </div>
    )
  }

  const ivValues = STAT_LABELS.map(s => data.ivs[s.key] ?? 0)
  const effValues = STAT_LABELS.map(s => (data.ivs[s.key] ?? 0) + (data.evs[s.key] ?? 0) / 4)
  const isMaxLevel = data.level >= 100
  const xpToNext = Math.max(0, data.progress.xpForLevelSpan - data.progress.xpIntoLevel)

  return (
    <div className="space-y-5">
      {/* Level + XP */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white border-0">
              <Sparkles className="mr-1 h-3 w-3" /> Lv. {data.level}
            </Badge>
            <span className="text-xs text-muted-foreground">{data.xp.toLocaleString()} XP</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {isMaxLevel ? 'MAX LEVEL' : `${xpToNext.toLocaleString()} XP to Lv. ${data.level + 1}`}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500 transition-all"
            style={{ width: `${Math.round((isMaxLevel ? 1 : data.progress.progress) * 100)}%` }}
          />
        </div>
      </div>

      {/* Sacred 7 radar */}
      <div className="flex flex-col items-center">
        <svg
          width={SIZE}
          height={SIZE - 4}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="overflow-visible"
        >
          {/* grid rings */}
          {[0.25, 0.5, 0.75, 1].map(ring => (
            <polygon
              key={ring}
              points={polygon(STAT_LABELS.map(() => RADAR_MAX * ring))}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.12}
              className="text-foreground"
            />
          ))}
          {/* axes */}
          {STAT_LABELS.map((s, i) => {
            const [x, y] = point(i, RADAR_MAX)
            return (
              <line
                key={s.key}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.1}
                className="text-foreground"
              />
            )
          })}
          {/* IV base */}
          <polygon
            points={polygon(ivValues)}
            fill="rgb(59 130 246 / 0.18)"
            stroke="rgb(59 130 246 / 0.7)"
            strokeWidth={1.5}
          />
          {/* IV + EV overlay */}
          <polygon
            points={polygon(effValues)}
            fill="rgb(217 70 239 / 0.20)"
            stroke="rgb(217 70 239 / 0.85)"
            strokeWidth={1.5}
          />
          {/* labels */}
          {STAT_LABELS.map((s, i) => {
            const [x, y] = point(i, RADAR_MAX + 22)
            return (
              <text
                key={s.key}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-[10px]"
              >
                {s.short}
              </text>
            )
          })}
        </svg>
        <div className="mt-1 flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: 'rgb(59 130 246 / 0.8)' }}
            />{' '}
            IV blueprint
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: 'rgb(217 70 239 / 0.85)' }}
            />{' '}
            + EV training
          </span>
        </div>
      </div>

      {/* EV total + per-stat */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">Evolution Values</span>
          <span className="text-muted-foreground">
            {data.evTotal} / {EV_TOTAL_CAP}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.round((data.evTotal / EV_TOTAL_CAP) * 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px]">
          {STAT_LABELS.map(s => {
            const ev = data.evs[s.key] ?? 0
            const eff = Math.round((data.effectiveStats[s.key] ?? 0) * 10) / 10
            return (
              <div key={s.key} className="flex items-center justify-between">
                <span className="text-muted-foreground">{s.full}</span>
                <span className="tabular-nums">
                  {eff}
                  {ev > 0 && (
                    <span className="ml-1 text-emerald-400">
                      +{ev}
                      {ev >= EV_SINGLE_CAP ? ' (max)' : ''}
                    </span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reset */}
      <Button
        variant="outline"
        size="sm"
        className="w-full border-fuchsia-500/40 hover:bg-fuchsia-500/10"
        disabled={resetting || data.evTotal <= 0}
        onClick={handleReset}
      >
        {resetting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RotateCw className="mr-2 h-4 w-4" />
        )}
        {data.evTotal <= 0 ? 'No EVs to reset' : 'Reset EVs (50 ESMS)'}
      </Button>
    </div>
  )
}

export default AgentLevelPanel

"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import { computeTemporalDelta, summarizeDelta, type SessionSnapshot, type TemporalDelta } from "@/lib/philosophers-stone/temporal-delta"
import { TemporalGreeting } from "@/components/temporal/temporal-greeting"
import { RelationSelector, type RelationChart } from "@/components/temporal/relation-selector"
import { PlanetaryMovementChart } from "@/components/temporal/planetary-movement-chart"
import { ConsciousnessVectorDisplay } from "@/components/temporal/consciousness-vector-display"
import { SynastryAnalysisEngine, type SynastryChart, type ElementalProfile, type ModalProfile } from "@/lib/synastry-compatibility-engine"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlanetaryPositions } from "@/hooks/usePlanetaryPositions"
import { generateAccurateHoroscope } from "@/lib/monica/horoscope-generator"
import { alchemize } from "@/lib/alchemizer"
import { calculateMC } from "@/lib/monica/monica-constant-validator"
import { fetchAstrologizeWheel, fetchAlchmAlchemize } from "@/lib/astrologize"

async function loadPreviousSession(userId: string, personalityId: string) {
  const res = await fetch(`/api/philosophers-stone/session?userId=${encodeURIComponent(userId)}&personalityId=${encodeURIComponent(personalityId)}`, { cache: 'no-store' })
  if (!res.ok) return null
  const data = await res.json()
  return data.session?.sessionData || null
}

async function saveSession(userId: string, personalityId: string, snapshot: SessionSnapshot) {
  await fetch("/api/philosophers-stone/session", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, personalityId, snapshot })
  })
}

// Mock function to convert RelationChart to SynastryChart format
function createSynastryChartSkeleton(user: RelationChart, relation: RelationChart): SynastryChart {
  const mockElemental: ElementalProfile = {
    fire: 25, earth: 25, air: 25, water: 25,
    dominant_element: 'fire', secondary_element: 'earth'
  }
  const mockModal: ModalProfile = {
    cardinal: 33, fixed: 33, mutable: 34,
    dominant_mode: 'mutable'
  }
  
  return {
    person1: {
      name: user.name,
      birth_data: {
        date: user.birthDate,
        time: user.birthTime || null,
        location: user.location || 'Unknown'
      },
      chart_features: [],
      planetary_placements: [],
      elemental_emphasis: mockElemental,
      modal_emphasis: mockModal
    },
    person2: {
      name: relation.name,
      birth_data: {
        date: relation.birthDate,
        time: relation.birthTime || null,
        location: relation.location || 'Unknown'
      },
      chart_features: [],
      planetary_placements: [],
      elemental_emphasis: mockElemental,
      modal_emphasis: mockModal
    }
  }
}

export function TemporalClient() {
  const [lines, setLines] = useState<string[]>([])
  const [delta, setDelta] = useState<TemporalDelta | null>(null)
  const [relations, setRelations] = useState<Array<RelationChart & { alchm?: any; mc?: number }>>([])
  const [synastryHint, setSynastryHint] = useState<string>("")
  const [aggregate, setAggregate] = useState<{ spirit: number; essence: number; matter: number; substance: number; count: number } | null>(null)
  const [dataSource, setDataSource] = useState<'backend' | 'local' | 'mixed'>('backend')
  const [freshness, setFreshness] = useState<string>("")

  // Throttling for concurrent relation processing
  const MAX_CONCURRENT = 3
  const inFlightRef = useRef(0)
  const queueRef = useRef<Array<() => void>>([])

  function runThrottled<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        inFlightRef.current += 1
        fn()
          .then(res => resolve(res))
          .catch(err => reject(err))
          .finally(() => {
            inFlightRef.current -= 1
            const next = queueRef.current.shift()
            if (next) next()
          })
      }
      if (inFlightRef.current < MAX_CONCURRENT) {
        run()
      } else {
        queueRef.current.push(run)
      }
    })
  }

  // In-memory caches for relation results (per session)
  const alchmCacheRef = useRef<Map<string, any>>(new Map())
  const wheelCacheRef = useRef<Map<string, { svg?: string; imageUrl?: string }>>(new Map())
  function cacheKeyFromBirth(b: { year: number; month: number; day: number; hour: number; minute: number; latitude: number; longitude: number; name?: string }) {
    return `${b.name || 'Subject'}:${b.year}-${b.month}-${b.day}T${b.hour}:${b.minute}@${b.latitude},${b.longitude}`
  }
  
  // Use unified planetary positions hook to ensure consistency across all tabs
  const { 
    timestamp, 
    planetaryPositions, 
    alchmQuantities, 
    monicaConstant, 
    loading 
  } = usePlanetaryPositions({
    refreshInterval: 30000, // 30 seconds 
    useApi: true // Use API for Philosopher's Stone consistency
  })

  // Create current snapshot from unified data
  const currentSnapshot: SessionSnapshot | null = useMemo(() => {
    if (loading || !timestamp) return null
    
    return {
      timestamp,
      planetaryPositions,
      alchmQuantities,
      monicaConstant
    }
  }, [timestamp, planetaryPositions, alchmQuantities, monicaConstant, loading])

  useEffect(() => {
    if (!currentSnapshot) return
    
    let cancelled = false
    ;(async () => {
      const userId = 'guest'
      const personalityId = 'stone'
      const previous = await loadPreviousSession(userId, personalityId)
      
      if (previous) {
        const temporalDelta = computeTemporalDelta(previous, currentSnapshot)
        const summary = ["Welcome back to the Living Stone", ...summarizeDelta(temporalDelta)]
        if (!cancelled) {
          setLines(summary)
          setDelta(temporalDelta)
        }
      } else {
        if (!cancelled) {
          setLines(["Welcome to the Living Stone", "First session initialized"])
        }
      }
      await saveSession(userId, personalityId, currentSnapshot)
    })()
    return () => { cancelled = true }
  }, [currentSnapshot])

  const handleAddRelation = async (relation: RelationChart) => {
    try {
      const [y, m, d] = relation.birthDate.split('-').map(v => parseInt(v, 10))
      const [hh, mm] = (relation.birthTime || '12:00').split(':').map(v => parseInt(v, 10))
      const lat = (relation as any).latitude ? parseFloat((relation as any).latitude) : 0
      const lon = (relation as any).longitude ? parseFloat((relation as any).longitude) : 0

      const birthInfo = {
        year: y,
        month: Math.max(0, m - 1),
        day: d,
        hour: isNaN(hh) ? 12 : hh,
        minute: isNaN(mm) ? 0 : mm,
        latitude: isNaN(lat) ? 0 : lat,
        longitude: isNaN(lon) ? 0 : lon
      }

      // In parallel per relation: alchm + wheel (throttled overall)
      const task = async () => {
        let usedBackend = true
        const key = cacheKeyFromBirth({ ...birthInfo, name: relation.name })

        const alchmPromise = (async () => {
          const cached = alchmCacheRef.current.get(key)
          if (cached) return cached
          try {
            const backend = await fetchAlchmAlchemize({ ...birthInfo, name: relation.name } as any)
            const parsed = (backend as any)?.alchm || backend
            alchmCacheRef.current.set(key, parsed)
            return parsed
          } catch {
            usedBackend = false
            const horoscope = generateAccurateHoroscope(birthInfo as any)
            const local = alchemize(birthInfo as any, horoscope as any)
            alchmCacheRef.current.set(key, local)
            return local
          }
        })()

        const wheelPromise = (async () => {
          const cached = wheelCacheRef.current.get(key)
          if (cached) return cached
          try {
            const wheelResp = await fetchAstrologizeWheel({ ...birthInfo, name: relation.name })
            const wheel = { svg: wheelResp.svg, imageUrl: wheelResp.imageUrl }
            wheelCacheRef.current.set(key, wheel)
            return wheel
          } catch {
            const empty: { svg?: string; imageUrl?: string } = {}
            wheelCacheRef.current.set(key, empty)
            return empty
          }
        })()

        const [alchmInfo, wheel] = await Promise.all([alchmPromise, wheelPromise])
        const confidence = usedBackend ? 0.9 : 0.7
        const validation = usedBackend ? 'schema' : 'heuristic'
        const degraded = !usedBackend
        return { alchmInfo, wheel, usedBackend, confidence, validation, degraded }
      }

      const { alchmInfo, wheel, usedBackend, confidence, validation, degraded } = await runThrottled(task)

      const spirit = alchmInfo?.['Alchemy Effects']?.['Total Spirit'] || 0
      const essence = alchmInfo?.['Alchemy Effects']?.['Total Essence'] || 0
      const matter = alchmInfo?.['Alchemy Effects']?.['Total Matter'] || 0
      const substance = alchmInfo?.['Alchemy Effects']?.['Total Substance'] || 0

      const mc = calculateMC(
        spirit,
        essence,
        matter,
        substance,
        alchmInfo?.['Total Effect Value']?.['Fire'] || 0,
        alchmInfo?.['Total Effect Value']?.['Water'] || 0,
        alchmInfo?.['Total Effect Value']?.['Air'] || 0,
        alchmInfo?.['Total Effect Value']?.['Earth'] || 0
      )

      const enriched = { ...relation, alchm: alchmInfo, mc, wheel, _meta: { usedBackend, confidence, validation, degraded } }
      const newRelations = [...relations, enriched]
      setRelations(newRelations)
      setDataSource(prev => (prev === 'mixed' ? 'mixed' : usedBackend ? prev : prev === 'backend' ? 'mixed' : 'local'))
      setFreshness(new Date().toLocaleTimeString())

      const agg = newRelations.reduce((acc, r) => {
        const a = r.alchm?.['Alchemy Effects'] || {}
        return {
          spirit: acc.spirit + (a['Total Spirit'] || 0),
          essence: acc.essence + (a['Total Essence'] || 0),
          matter: acc.matter + (a['Total Matter'] || 0),
          substance: acc.substance + (a['Total Substance'] || 0),
          count: acc.count + 1
        }
      }, { spirit: 0, essence: 0, matter: 0, substance: 0, count: 0 })
      setAggregate(agg)

      if (newRelations.length === 1) {
        const userChart = { name: 'You', birthDate: '1990-01-01' } as RelationChart
        const synastryChart = createSynastryChartSkeleton(userChart, relation)
        const report = SynastryAnalysisEngine.generateSynastryReport(synastryChart)
        setSynastryHint(`With ${relation.name} present: ${report.compatibility_analysis.universal_lesson}`)
      }
    } catch (e) {
      console.error('Failed to add relation chart:', e)
    }
  }

  const handleRemoveRelation = (index: number) => {
    const newRelations = relations.filter((_, i) => i !== index)
    setRelations(newRelations)
    if (newRelations.length === 0) {
      setSynastryHint("")
    }
    if (newRelations.length > 0) {
      const agg = newRelations.reduce((acc, r) => {
        const a = (r as any).alchm?.['Alchemy Effects'] || {}
        return {
          spirit: acc.spirit + (a['Total Spirit'] || 0),
          essence: acc.essence + (a['Total Essence'] || 0),
          matter: acc.matter + (a['Total Matter'] || 0),
          substance: acc.substance + (a['Total Substance'] || 0),
          count: acc.count + 1
        }
      }, { spirit: 0, essence: 0, matter: 0, substance: 0, count: 0 })
      setAggregate(agg)
    } else {
      setAggregate(null)
    }
  }

  if (loading) return <div className="text-center py-8">Loading the Living Stone...</div>

  return (
    <div className="space-y-6">
      <TemporalGreeting lines={lines} relationHint={synastryHint} />
      
      {currentSnapshot && currentSnapshot.alchmQuantities && (
        <ConsciousnessVectorDisplay 
          alchmQuantities={currentSnapshot.alchmQuantities} 
          monicaConstant={currentSnapshot.monicaConstant || 0}
        />
      )}

      {delta && <PlanetaryMovementChart delta={delta} />}

      <RelationSelector 
        onAddRelation={handleAddRelation}
        relations={relations}
        onRemoveRelation={handleRemoveRelation}
      />

      {relations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Field Charts — Alchemical Profiles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs text-muted-foreground">Source: {dataSource} · Updated: {freshness || '—'}</div>
            {relations.map((r, i) => (
              <div key={`${r.name}-${i}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{r.name} — {r.birthDate}{(r as any).birthTime ? ` ${(r as any).birthTime}` : ''}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {typeof (r as any).mc === 'number' && (
                      <span>MC: {(r as any).mc.toFixed(3)}</span>
                    )}
                    {(r as any)._meta && (
                      <span>
                        {(r as any)._meta.degraded ? 'degraded' : 'ok'} · conf {(r as any)._meta.confidence?.toFixed(2)} · {(r as any)._meta.validation}
                      </span>
                    )}
                  </div>
                </div>
                {(r as any).wheel?.svg && (
                  <div className="border rounded p-2 overflow-auto">
                    <div dangerouslySetInnerHTML={{ __html: (r as any).wheel.svg }} />
                  </div>
                )}
                {(r as any).wheel?.imageUrl && !(r as any).wheel?.svg && (
                  <div className="border rounded p-2 overflow-auto">
                    <img src={(r as any).wheel.imageUrl} alt={`${r.name} natal wheel`} className="max-w-full h-auto" />
                  </div>
                )}
                {(r as any).alchm && (
                  <ConsciousnessVectorDisplay 
                    alchmQuantities={{
                      spirit: (r as any).alchm['Alchemy Effects']?.['Total Spirit'] || 0,
                      essence: (r as any).alchm['Alchemy Effects']?.['Total Essence'] || 0,
                      matter: (r as any).alchm['Alchemy Effects']?.['Total Matter'] || 0,
                      substance: (r as any).alchm['Alchemy Effects']?.['Total Substance'] || 0,
                      Heat: (r as any).alchm['Heat'] || 0,
                      Entropy: (r as any).alchm['Entropy'] || 0,
                      Reactivity: (r as any).alchm['Reactivity'] || 0,
                      Energy: (r as any).alchm['Energy'] || 0,
                    }}
                    monicaConstant={(r as any).mc || 0}
                  />
                )}
              </div>
            ))}

            {aggregate && (
              <div className="mt-2 text-sm">
                <div className="font-medium">Collective Field Totals ({aggregate.count} charts)</div>
                <div className="text-muted-foreground">
                  Spirit: {aggregate.spirit.toFixed(2)} · Essence: {aggregate.essence.toFixed(2)} · Matter: {aggregate.matter.toFixed(2)} · Substance: {aggregate.substance.toFixed(2)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Today's Unique Opportunity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            The temporal delta reveals {delta?.planetaryMovement[0]?.planet || 'cosmic'} as the primary mover. 
            Focus on {delta?.planetaryMovement[0]?.planet === 'Mercury' ? 'communication and mental clarity' : 
                     delta?.planetaryMovement[0]?.planet === 'Venus' ? 'relationships and values alignment' :
                     delta?.planetaryMovement[0]?.planet === 'Mars' ? 'action and initiative' :
                     'consciousness expansion'} today.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default TemporalClient



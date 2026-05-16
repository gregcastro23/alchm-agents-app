import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HISTORICAL_AGENTS, getHistoricalAgent } from '@/lib/agents/historical'
import type { CraftedAgent, Element } from '@/lib/agent-types'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  return HISTORICAL_AGENTS.map(a => ({ id: a.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const agent = getHistoricalAgent(id)
  if (!agent) return { title: 'Agent profile not found' }
  return {
    title: `${agent.name} — ${agent.title}`,
    description:
      agent.personality?.core?.essence ||
      agent.synthesis ||
      `${agent.name}: ${agent.specialization ?? agent.era ?? 'Historical agent'}`,
  }
}

const ELEMENT_TINT: Record<Element, string> = {
  Fire: 'from-orange-500/30 to-red-500/10',
  Water: 'from-blue-500/30 to-cyan-500/10',
  Air: 'from-sky-400/30 to-indigo-500/10',
  Earth: 'from-emerald-500/30 to-lime-500/10',
}

function formatBirth(agent: CraftedAgent): string {
  const d = agent.birthData?.date
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  const year = date.getUTCFullYear()
  const month = date.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
  const day = date.getUTCDate()
  const era = year < 0 ? `${Math.abs(year)} BCE` : `${year}`
  return `${month} ${day}, ${era}`
}

export default async function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const agent = getHistoricalAgent(id)
  if (!agent) notFound()

  const accent = agent.appearance?.color || '#7c3aed'
  const tint =
    ELEMENT_TINT[agent.consciousness?.dominantElement as Element] ||
    'from-violet-500/30 to-fuchsia-500/10'

  const planets = agent.consciousness?.natalChart?.planets ?? {}
  const aspects = agent.consciousness?.natalChart?.aspects ?? []
  const ae = agent.consciousness?.alchemicalElements

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className={`relative overflow-hidden border-b bg-gradient-to-br ${tint}`}>
        <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border-2 text-5xl shadow-lg backdrop-blur-sm md:h-32 md:w-32 md:text-6xl"
              style={{ borderColor: accent, background: `${accent}22` }}
              aria-hidden="true"
            >
              <span>{agent.appearance?.symbol ?? '✦'}</span>
            </div>
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {agent.era && (
                  <Badge variant="outline" className="border-foreground/20">
                    {agent.era}
                  </Badge>
                )}
                {agent.consciousness?.level && (
                  <Badge variant="secondary">{agent.consciousness.level}</Badge>
                )}
                {agent.consciousness?.dominantElement && (
                  <Badge style={{ backgroundColor: accent, color: 'white' }}>
                    {agent.consciousness.dominantElement} · {agent.consciousness.dominantModality}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{agent.name}</h1>
              <p className="mt-1 text-lg italic text-muted-foreground md:text-xl">{agent.title}</p>
              {agent.specialization && (
                <p className="mt-2 text-sm text-muted-foreground">{agent.specialization}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild size="lg" style={{ backgroundColor: accent }}>
                <Link href={`/gallery/chat/${agent.id}`}>Chat with {agent.name.split(' ')[0]}</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/gallery">← Back to Gallery</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-10 px-6 py-10">
        {/* Synthesis / Bio */}
        {(agent.synthesis || agent.monicaCreationStory) && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">About</h2>
            <Card>
              <CardContent className="prose prose-sm max-w-none pt-6 dark:prose-invert">
                {agent.synthesis && <p>{agent.synthesis}</p>}
                {agent.monicaCreationStory && (
                  <p className="text-muted-foreground">{agent.monicaCreationStory}</p>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Essence / Expression / Emotion */}
        {agent.personality?.core && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Essence · Expression · Emotion</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Essence</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {agent.personality.core.essence}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Expression</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {agent.personality.core.expression}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Emotion</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {agent.personality.core.emotion}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Quotes */}
        {agent.quotes && agent.quotes.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">In Their Own Words</h2>
            <div className="space-y-3">
              {agent.quotes.slice(0, 5).map((q: string, i: number) => (
                <blockquote
                  key={i}
                  className="border-l-4 pl-4 italic text-muted-foreground"
                  style={{ borderColor: accent }}
                >
                  &ldquo;{q}&rdquo;
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* Beliefs */}
        {agent.coreBeliefs && agent.coreBeliefs.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Core Beliefs</h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="list-disc space-y-2 pl-5 text-sm">
                  {agent.coreBeliefs.map((b: string, i: number) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Personality traits */}
        {agent.personality?.traits && agent.personality.traits.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Personality</h2>
            <div className="flex flex-wrap gap-2">
              {agent.personality.traits.map((t: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
            {agent.personality.currentMood && (
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium">Current mood:</span> {agent.personality.currentMood}
              </p>
            )}
          </section>
        )}

        {/* Gifts & Shadows */}
        <section className="grid gap-6 md:grid-cols-2">
          {agent.personality?.gifts && agent.personality.gifts.length > 0 && (
            <div>
              <h2 className="mb-3 text-xl font-semibold">Gifts</h2>
              <div className="space-y-3">
                {agent.personality.gifts.map((g: any, i: number) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{g.type}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>{g.description}</p>
                      {g.expression && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Expression:</span> {g.expression}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {agent.personality?.shadows && agent.personality.shadows.length > 0 && (
            <div>
              <h2 className="mb-3 text-xl font-semibold">Shadows</h2>
              <div className="space-y-3">
                {agent.personality.shadows.map((s: any, i: number) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{s.type}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>{s.description}</p>
                      {s.transformationPath && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Transformation path:</span>{' '}
                          {s.transformationPath}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Challenges */}
        {agent.personality?.challenges && agent.personality.challenges.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Challenges & Growth</h2>
            <div className="space-y-3">
              {agent.personality.challenges.map((c: any, i: number) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{c.type}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>{c.description}</p>
                    {c.growthOpportunity && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Growth opportunity:</span>{' '}
                        {c.growthOpportunity}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Abilities */}
        {agent.abilities && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Abilities</h2>
            <Card>
              <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Specialty</p>
                  <p className="text-sm">{agent.abilities.specialty}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Teaching Style
                  </p>
                  <p className="text-sm">{agent.abilities.teachingStyle}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Resonance</p>
                  <p className="text-sm">{agent.abilities.resonanceType}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Unique Power
                  </p>
                  <p className="text-sm">{agent.abilities.uniquePower}</p>
                </div>
                {agent.abilities.wisdomDomains && agent.abilities.wisdomDomains.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      Wisdom Domains
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {agent.abilities.wisdomDomains.map((d: string, i: number) => (
                        <Badge key={i} variant="outline">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Consciousness Signature */}
        <section>
          <h2 className="mb-3 text-xl font-semibold">Consciousness Signature</h2>
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-3 text-sm md:grid-cols-2">
                {agent.consciousness?.strength && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Strength
                    </p>
                    <p>{agent.consciousness.strength}</p>
                  </div>
                )}
                {agent.consciousness?.emotion && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Emotional Tone
                    </p>
                    <p>{agent.consciousness.emotion}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Signature</p>
                  <p className="font-mono text-xs">{agent.consciousness?.signature}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Element · Modality
                  </p>
                  <p>
                    {agent.consciousness?.dominantElement} · {agent.consciousness?.dominantModality}
                  </p>
                </div>
              </div>

              {agent.sacredStats && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Sacred Stats Matrix
                  </p>
                  {Object.entries({
                    Power: agent.sacredStats.powerScore,
                    Resonance: agent.sacredStats.resonanceScore7,
                    Wisdom: agent.sacredStats.wisdomScore,
                    Charisma: agent.sacredStats.charismaScore,
                    Intuition: agent.sacredStats.intuitionScore,
                    Adaptability: agent.sacredStats.adaptabilityScore,
                    Vitality: agent.sacredStats.vitalityScore,
                  }).map(([k, v]) => (
                    <div key={k}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="capitalize">{k}</span>
                        <span className="text-muted-foreground">{Math.round(v)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, v))}%`,
                            background: accent,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Natal Chart */}
        {Object.keys(planets).length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Natal Chart</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                        <th className="py-2 pr-4">Planet</th>
                        <th className="py-2 pr-4">Sign</th>
                        <th className="py-2 pr-4">Degree</th>
                        <th className="py-2 pr-4">House</th>
                        <th className="py-2 pr-4">Rx</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(planets).map(([planet, p]: [string, any]) => (
                        <tr key={planet} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">{planet}</td>
                          <td className="py-2 pr-4">{p.sign}</td>
                          <td className="py-2 pr-4">{p.degree.toFixed(1)}°</td>
                          <td className="py-2 pr-4">{p.house ?? '—'}</td>
                          <td className="py-2 pr-4">{p.retrograde ? '℞' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {aspects.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                      Notable Aspects
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {aspects.map((a: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {a.planet1} {a.type} {a.planet2}
                          {a.exact ? ' (exact)' : ` · ${a.orb.toFixed(1)}°`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Historical Diet */}
        {agent.historicalDiet && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">
              Historical Diet
              {agent.historicalDiet.culturalCuisine && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({agent.historicalDiet.culturalCuisine})
                </span>
              )}
            </h2>
            <Card>
              <CardContent className="space-y-4 pt-6 text-sm">
                {agent.historicalDiet.dietaryPhilosophy && (
                  <p className="text-muted-foreground">{agent.historicalDiet.dietaryPhilosophy}</p>
                )}
                <div className="grid gap-4 md:grid-cols-3">
                  {agent.historicalDiet.staples?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                        Staples
                      </p>
                      <ul className="space-y-1">
                        {agent.historicalDiet.staples.map((s: string, i: number) => (
                          <li key={i}>· {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {agent.historicalDiet.favoriteFoods?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                        Favorites
                      </p>
                      <ul className="space-y-1">
                        {agent.historicalDiet.favoriteFoods.map((s: string, i: number) => (
                          <li key={i}>· {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {agent.historicalDiet.avoidedFoods?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                        Avoided
                      </p>
                      <ul className="space-y-1">
                        {agent.historicalDiet.avoidedFoods.map((s: string, i: number) => (
                          <li key={i}>· {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {agent.historicalDiet.beverages && agent.historicalDiet.beverages.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                      Beverages
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {agent.historicalDiet.beverages.map((b: string, i: number) => (
                        <Badge key={i} variant="outline">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {agent.historicalDiet.foodLore && (
                  <p className="border-l-2 border-muted pl-3 italic text-muted-foreground">
                    {agent.historicalDiet.foodLore}
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Birth Data */}
        <section>
          <h2 className="mb-3 text-xl font-semibold">Birth Data</h2>
          <Card>
            <CardContent className="grid gap-3 pt-6 text-sm md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
                <p>{formatBirth(agent)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Time</p>
                <p>{agent.birthData?.time ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Location</p>
                <p>{agent.birthData?.location?.name ?? '—'}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer CTA */}
        <section className="border-t pt-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-muted-foreground">Continue the dialogue across centuries.</p>
            <Button asChild size="lg" style={{ backgroundColor: accent }}>
              <Link href={`/gallery/chat/${agent.id}`}>Start a conversation with {agent.name}</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { redirect } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  users: {
    total: number
    newToday: number
    admins: number
    recent: { id: string; email: string; name: string | null; role: string; createdAt: string }[]
  }
  agents: {
    historical: number
    planetary: number
    created: number
    totalConversations: number
  }
  system: {
    database: 'healthy' | 'error'
    aiProviders: { openai: boolean; anthropic: boolean; google: boolean; gateway: boolean }
    railwayBackend: 'healthy' | 'error' | 'unknown'
    vercelDeployment: { url: string; lastDeploy: string | null }
  }
  recentActivity: { type: string; description: string; timestamp: string }[]
  topAgents: { id: string; name: string; interactions: number }[]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ ok, label }: { ok: boolean | 'unknown'; label: string }) {
  const color = ok === 'unknown' ? 'bg-yellow-400' : ok ? 'bg-green-400' : 'bg-red-400'
  const text = ok === 'unknown' ? 'text-yellow-300' : ok ? 'text-green-300' : 'text-red-300'
  return (
    <div className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-900/20 px-4 py-3 backdrop-blur-sm">
      <span className={`inline-block h-2.5 w-2.5 animate-pulse rounded-full ${color}`} />
      <span className={`text-sm font-medium ${text}`}>{label}</span>
    </div>
  )
}

function StatCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string
  value: string | number
  sub?: string
  icon: string
}) {
  return (
    <div className="rounded-2xl border border-purple-500/30 bg-purple-900/20 p-6 backdrop-blur-sm">
      <div className="mb-2 text-2xl">{icon}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm font-medium text-purple-300">{title}</div>
      {sub && <div className="mt-1 text-xs text-purple-400/70">{sub}</div>}
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-purple-800/30 ${className}`} />
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'system' | 'users' | 'agents' | 'economy' | 'desktop'>(
    'system'
  )
  const [recentUsers, setRecentUsers] = useState<any[]>([])

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn()
    }
  }, [status])

  // Fetch dashboard data
  useEffect(() => {
    if (status !== 'authenticated') return
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard')
        if (res.status === 401 || res.status === 403) {
          setError('You do not have admin privileges.')
          setLoading(false)
          return
        }
        if (!res.ok) throw new Error('Failed to fetch dashboard data')
        const json = await res.json()
        setData(json)
      } catch (e: any) {
        setError(e.message || 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [status])

  // ── Guard states ────────────────────────────────────────────────────────────
  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen bg-[#08080e] p-8">
        <Skeleton className="mb-4 h-12 w-72" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    signIn('google', { callbackUrl: '/admin' })
    return null
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080e]">
        <div className="rounded-2xl border border-red-500/30 bg-red-900/20 p-8 text-center backdrop-blur-sm">
          <div className="text-4xl">🔒</div>
          <div className="mt-3 text-xl font-bold text-red-300">Access Denied</div>
          <div className="mt-2 text-sm text-red-400/80">{error}</div>
        </div>
      </div>
    )
  }

  if (!data) return null

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalAgents = data.agents.historical + data.agents.planetary + data.agents.created

  // System health score: count green statuses out of 6 possible
  const healthChecks = [
    data.system.database === 'healthy',
    data.system.railwayBackend === 'healthy',
    data.system.aiProviders.openai,
    data.system.aiProviders.anthropic,
    data.system.aiProviders.google,
    data.system.aiProviders.gateway,
  ]
  const healthScore = Math.round((healthChecks.filter(Boolean).length / healthChecks.length) * 100)

  const maxInteractions = Math.max(...data.topAgents.map(a => a.interactions), 1)

  const userEmail = session?.user?.email || ''
  const userRole = (session?.user as any)?.role || 'user'

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#08080e] text-white">
      {/* Background radial glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-purple-900/20 blur-3xl" />
        <div className="absolute -right-40 top-60 h-80 w-80 rounded-full bg-indigo-900/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-8">
        {/* ── Header ── */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
              Admin Control Center
            </h1>
            <p className="mt-1 text-sm text-purple-300/60">Planetary Agents — Mission Control</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-purple-500/40 bg-purple-900/30 px-3 py-1 text-xs text-purple-200">
              {userEmail}
            </span>
            <span className="rounded-full border border-orange-500/40 bg-orange-900/20 px-3 py-1 text-xs font-semibold text-orange-300">
              Pro Admin
            </span>
          </div>
        </div>

        {/* ── Status chips row ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatusDot
            ok={data.system.database === 'healthy'}
            label={data.system.database === 'healthy' ? 'PostgreSQL Online' : 'DB Error'}
          />
          <StatusDot
            ok={data.system.aiProviders.gateway}
            label={data.system.aiProviders.gateway ? 'AI Gateway Active' : 'Gateway Off'}
          />
          <StatusDot
            ok={data.system.aiProviders.openai}
            label={data.system.aiProviders.openai ? 'OpenAI Connected' : 'OpenAI Missing'}
          />
          <StatusDot
            ok={data.system.aiProviders.google}
            label={data.system.aiProviders.google ? 'Gemini Connected' : 'Gemini Missing'}
          />
          <StatusDot
            ok={
              data.system.railwayBackend === 'healthy'
                ? true
                : data.system.railwayBackend === 'unknown'
                  ? 'unknown'
                  : false
            }
            label={
              data.system.railwayBackend === 'healthy'
                ? 'Railway Healthy'
                : data.system.railwayBackend === 'unknown'
                  ? 'Railway Unknown'
                  : 'Railway Error'
            }
          />
        </div>

        {/* ── Stat cards row ── */}
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon="👥"
            title="Total Users"
            value={data.users.total.toLocaleString()}
            sub={`+${data.users.newToday} new today`}
          />
          <StatCard
            icon="🤖"
            title="Total Agents"
            value={totalAgents.toLocaleString()}
            sub={`${data.agents.historical} historical · ${data.agents.planetary} planetary · ${data.agents.created} created`}
          />
          <StatCard
            icon="💬"
            title="Conversations"
            value={data.agents.totalConversations.toLocaleString()}
            sub="all-time across historical agents"
          />
          <StatCard
            icon="🛡️"
            title="Health Score"
            value={`${healthScore}%`}
            sub={`${healthChecks.filter(Boolean).length}/${healthChecks.length} systems green`}
          />
        </div>

        {/* ── Two-column section ── */}
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="rounded-2xl border border-purple-500/30 bg-purple-900/20 p-6 backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-bold text-purple-200">Recent Activity</h2>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-purple-400/60">No recent interactions recorded.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentActivity.map((act, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-700/40 text-xs">
                      {act.type === 'chat' ? '💬' : act.type === 'evolution' ? '⚡' : '🌀'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-white">{act.description}</p>
                      <p className="text-xs text-purple-400/60">
                        {new Date(act.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded bg-purple-800/40 px-1.5 py-0.5 text-xs text-purple-300">
                      {act.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Top Agents */}
          <div className="rounded-2xl border border-purple-500/30 bg-purple-900/20 p-6 backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-bold text-purple-200">Top Agents</h2>
            {data.topAgents.length === 0 ? (
              <p className="text-sm text-purple-400/60">No agent data available.</p>
            ) : (
              <ul className="space-y-4">
                {data.topAgents.map((agent, i) => {
                  const pct = Math.round((agent.interactions / maxInteractions) * 100)
                  return (
                    <li key={agent.id}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-white">
                          <span className="mr-2 text-purple-400">#{i + 1}</span>
                          {agent.name}
                        </span>
                        <span className="text-xs text-purple-300">
                          {agent.interactions.toLocaleString()} conv.
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-900/40">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-orange-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Tabbed bottom section ── */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-900/20 backdrop-blur-sm">
          {/* Tab bar */}
          <div className="flex flex-wrap border-b border-purple-500/20">
            {(['system', 'users', 'agents', 'economy', 'desktop'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-purple-400 text-purple-200'
                    : 'text-purple-400/60 hover:text-purple-300'
                }`}
              >
                {tab === 'desktop'
                  ? '🖥️ Desktop Companion'
                  : tab === 'economy'
                    ? '🪙 Alchemical Economy'
                    : tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* System tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-300/70">
                    API Keys &amp; Configuration
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { label: 'OPENAI_API_KEY', ok: data.system.aiProviders.openai },
                      { label: 'ANTHROPIC_API_KEY', ok: data.system.aiProviders.anthropic },
                      { label: 'GOOGLE_GENERATIVE_AI_API_KEY', ok: data.system.aiProviders.google },
                      { label: 'AI_GATEWAY_ENABLED', ok: data.system.aiProviders.gateway },
                      {
                        label: 'NEXT_PUBLIC_BACKEND_URL',
                        ok: Boolean(data.system.vercelDeployment.url),
                      },
                      {
                        label: 'DATABASE_URL',
                        ok: data.system.database === 'healthy',
                      },
                    ].map(({ label, ok }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-lg border border-purple-500/20 bg-purple-950/30 px-4 py-2"
                      >
                        <span className="font-mono text-xs text-purple-300">{label}</span>
                        <span className={ok ? 'text-green-400' : 'text-red-400'}>
                          {ok ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-300/70">
                    Deployment
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-purple-500/20 bg-purple-950/30 px-4 py-3">
                      <div className="text-xs text-purple-400/60">App URL</div>
                      <div className="mt-0.5 text-sm text-white">
                        {data.system.vercelDeployment.url}
                      </div>
                    </div>
                    <div className="rounded-lg border border-purple-500/20 bg-purple-950/30 px-4 py-3">
                      <div className="text-xs text-purple-400/60">Node.js Version</div>
                      <div className="mt-0.5 text-sm text-white">
                        {typeof process !== 'undefined' ? process.version : 'N/A'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-purple-500/20 bg-purple-950/30 px-4 py-3">
                      <div className="text-xs text-purple-400/60">Railway Backend</div>
                      <div
                        className={`mt-0.5 text-sm font-medium ${
                          data.system.railwayBackend === 'healthy'
                            ? 'text-green-300'
                            : data.system.railwayBackend === 'unknown'
                              ? 'text-yellow-300'
                              : 'text-red-300'
                        }`}
                      >
                        {data.system.railwayBackend}
                      </div>
                    </div>
                    <div className="rounded-lg border border-purple-500/20 bg-purple-950/30 px-4 py-3">
                      <div className="text-xs text-purple-400/60">Database</div>
                      <div
                        className={`mt-0.5 text-sm font-medium ${
                          data.system.database === 'healthy' ? 'text-green-300' : 'text-red-300'
                        }`}
                      >
                        {data.system.database}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users tab */}
            {activeTab === 'users' && (
              <div>
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <div className="rounded-lg border border-purple-500/20 bg-purple-950/30 px-4 py-2 text-sm">
                    <span className="text-purple-400/60">Total: </span>
                    <span className="font-bold text-white">{data.users.total}</span>
                  </div>
                  <div className="rounded-lg border border-purple-500/20 bg-purple-950/30 px-4 py-2 text-sm">
                    <span className="text-purple-400/60">New Today: </span>
                    <span className="font-bold text-green-300">+{data.users.newToday}</span>
                  </div>
                  <div className="rounded-lg border border-purple-500/20 bg-purple-950/30 px-4 py-2 text-sm">
                    <span className="text-purple-400/60">Admins: </span>
                    <span className="font-bold text-orange-300">{data.users.admins}</span>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-purple-500/20">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-purple-500/20 bg-purple-950/40">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-purple-400/70">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-purple-400/70">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-purple-400/70">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.recent.map((u, i) => (
                        <tr
                          key={u.id}
                          className={`border-b border-purple-500/10 transition-colors hover:bg-purple-900/20 ${i % 2 === 0 ? '' : 'bg-purple-950/20'}`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{u.name || '—'}</div>
                            <div className="text-xs text-purple-400/60">{u.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                u.role === 'admin'
                                  ? 'bg-orange-900/40 text-orange-300 border border-orange-500/30'
                                  : 'bg-purple-900/40 text-purple-300 border border-purple-500/30'
                              }`}
                            >
                              {u.role === 'admin' ? '⚡ admin' : u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-purple-400/60">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {data.users.recent.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-8 text-center text-sm text-purple-400/50"
                          >
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Agents tab */}
            {activeTab === 'agents' && (
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-purple-300/70">
                  Agent Breakdown
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      label: 'Historical Agents',
                      count: data.agents.historical,
                      color: 'from-purple-500 to-blue-500',
                      icon: '📜',
                    },
                    {
                      label: 'Planetary Agents',
                      count: data.agents.planetary,
                      color: 'from-blue-500 to-cyan-400',
                      icon: '🪐',
                    },
                    {
                      label: 'Created Agents',
                      count: data.agents.created,
                      color: 'from-orange-500 to-yellow-400',
                      icon: '✨',
                    },
                  ].map(({ label, count, color, icon }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-purple-500/20 bg-purple-950/30 p-5 text-center"
                    >
                      <div className="text-3xl">{icon}</div>
                      <div
                        className={`mt-2 bg-gradient-to-r ${color} bg-clip-text text-3xl font-extrabold text-transparent`}
                      >
                        {count.toLocaleString()}
                      </div>
                      <div className="mt-1 text-sm text-purple-300">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-xl border border-purple-500/20 bg-purple-950/30 p-5">
                  <div className="text-sm text-purple-300/70">Total Agent Conversations</div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    {data.agents.totalConversations.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Economy tab */}
            {activeTab === 'economy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-300/70">
                    Alchemical Treasury Pools
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-4">
                    {[
                      {
                        token: 'Spirit',
                        color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
                        icon: '✨',
                      },
                      {
                        token: 'Essence',
                        color: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
                        icon: '💧',
                      },
                      {
                        token: 'Matter',
                        color: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
                        icon: '📦',
                      },
                      {
                        token: 'Substance',
                        color: 'text-green-400 border-green-500/20 bg-green-500/5',
                        icon: '⚡',
                      },
                    ].map(({ token, color, icon }) => (
                      <div key={token} className={`rounded-xl border p-5 text-center ${color}`}>
                        <div className="text-2xl">{icon}</div>
                        <div className="mt-2 text-2xl font-bold">125.00 ESMS</div>
                        <div className="text-xs opacity-75">Transmutation Cost Gate</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-purple-500/20 bg-purple-950/30 p-5">
                  <h4 className="font-semibold text-purple-200 mb-3">
                    PostgreSQL CTE Gold Gate Protocol
                  </h4>
                  <p className="text-xs text-purple-300/60 leading-relaxed mb-4">
                    Upgrades from free 1.5B Hermes models to 8B Astral consciousness segments
                    execute atomic debit CTEs. If balances under any quantity falls below 125, the
                    transmutational transaction voids automatically inside the Postgres core.
                  </p>
                  <div className="rounded-lg bg-black/40 p-4 font-mono text-xs text-purple-300 border border-purple-500/10 overflow-x-auto">
                    {`WITH debited AS (
  UPDATE token_balances
  SET spirit_coins = spirit_coins - 125, essence_coins = essence_coins - 125,
      matter_coins = matter_coins - 125, substance_coins = substance_coins - 125
  WHERE user_id = $1 AND spirit_coins >= 125 AND essence_coins >= 125
  RETURNING *
) INSERT INTO ledger_events (user_id, agent_id, kind, delta) SELECT user_id, $2, 'transmute_8b', -500 FROM debited;`}
                  </div>
                </div>
              </div>
            )}

            {/* Desktop tab */}
            {activeTab === 'desktop' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-purple-500/20 bg-purple-950/30 p-5">
                    <h4 className="font-semibold text-purple-200 mb-2">Tauri Client Sandbox</h4>
                    <p className="text-xs text-purple-300/60 leading-relaxed">
                      Models are written, verified, and fetched solely inside the sandboxed cache:
                    </p>
                    <div className="mt-2 rounded bg-black/40 p-2 font-mono text-xs text-indigo-300 border border-purple-500/10">
                      $APPDATA/com.cookingwithcastro.alchm/models/
                    </div>
                  </div>

                  <div className="rounded-xl border border-purple-500/20 bg-purple-950/30 p-5">
                    <h4 className="font-semibold text-purple-200 mb-2">Bun Sidecar Handshake</h4>
                    <p className="text-xs text-purple-300/60 leading-relaxed">
                      Every local HTTP query is verified using UUID v4 IPC security nonces:
                    </p>
                    <div className="mt-2 rounded bg-black/40 p-2 font-mono text-xs text-green-300 border border-purple-500/10">
                      X-IPC-Nonce: uuid_v4_boot_token
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-purple-500/20 bg-purple-950/30 p-5">
                  <h4 className="font-semibold text-purple-200 mb-3">Model Verification Catalog</h4>
                  <p className="text-xs text-purple-300/60 leading-relaxed mb-3">
                    Exposed canonical binaries registry `/api/models/catalog` used by local checking
                    services:
                  </p>
                  <table className="w-full text-xs text-left text-purple-300">
                    <thead>
                      <tr className="border-b border-purple-500/20 text-purple-400">
                        <th className="py-2">Engine ID</th>
                        <th className="py-2">SHA-256 Hash</th>
                        <th className="py-2">Size</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-purple-500/10">
                        <td className="py-2 font-mono">alchm-agent-fire-8b</td>
                        <td className="py-2 font-mono">4b8a2a5ef122...82df</td>
                        <td className="py-2">4.5 GB</td>
                        <td className="py-2 text-green-400 font-semibold">✓ Canonical</td>
                      </tr>
                      <tr className="border-b border-purple-500/10">
                        <td className="py-2 font-mono">alchm-agent-water-8b</td>
                        <td className="py-2 font-mono">a9f0293ee023...19cb</td>
                        <td className="py-2">4.5 GB</td>
                        <td className="py-2 text-green-400 font-semibold">✓ Canonical</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-purple-500/40">
          Planetary Agents Admin · Data refreshes on page load
        </div>
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Cloud,
  Database,
  ExternalLink,
  FileSearch,
  Gauge,
  GitBranch,
  HardDrive,
  LayoutDashboard,
  Lock,
  Monitor,
  RefreshCw,
  Server,
  ShieldCheck,
  TerminalSquare,
  UserCog,
  Users,
  Workflow,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { PerformanceDashboard } from '@/components/admin/performance-dashboard'
import BatchProcessingDashboard from '@/components/dashboards/batch-processing-dashboard'
import { RAGMonitor } from '@/components/rag/rag-monitor'
import { cn } from '@/lib/utils'
import { DESKTOP_APP_DOWNLOAD_URL } from '@/lib/desktop-download'
import type { AdminDashboardData, AdminHealthValue, AdminSystemStats } from '@/types/admin'

type AdminTab =
  | 'overview'
  | 'users'
  | 'agents'
  | 'rag'
  | 'infrastructure'
  | 'deployments'
  | 'jobs'
  | 'desktop'

type AdminOperatorConsoleProps = {
  initialUser: {
    id?: string | null
    email?: string | null
    name?: string | null
    role?: string | null
    tier?: string | null
  }
  authSource: string
}

const tabs: Array<{ id: AdminTab; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'rag', label: 'RAG / Knowledge', icon: FileSearch },
  { id: 'infrastructure', label: 'Infrastructure', icon: Server },
  { id: 'deployments', label: 'Deployments', icon: GitBranch },
  { id: 'jobs', label: 'Jobs', icon: Workflow },
  { id: 'desktop', label: 'Desktop Companion', icon: Monitor },
]

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return 'n/a'
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function healthLabel(value: AdminHealthValue | 'healthy' | 'error' | boolean) {
  if (value === true || value === 'healthy') return 'healthy'
  if (value === false || value === 'error') return 'error'
  return 'unknown'
}

function statusClasses(status: 'healthy' | 'error' | 'unknown' | 'warn') {
  return cn(
    'border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em]',
    status === 'healthy' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    status === 'warn' && 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    status === 'unknown' && 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    status === 'error' && 'border-rose-500/30 bg-rose-500/10 text-rose-300'
  )
}

function StatusBadge({
  status,
  label,
}: {
  status: 'healthy' | 'error' | 'unknown' | 'warn'
  label: string
}) {
  const Icon = status === 'healthy' ? CheckCircle2 : status === 'error' ? XCircle : CircleDashed
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md', statusClasses(status))}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function MetricPanel({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'sky',
}: {
  icon: LucideIcon
  label: string
  value: string
  detail?: string
  tone?: 'sky' | 'emerald' | 'amber' | 'rose'
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">{value}</p>
          {detail && <p className="mt-1 text-xs text-zinc-500">{detail}</p>}
        </div>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md border',
            tone === 'sky' && 'border-sky-500/30 bg-sky-500/10 text-sky-300',
            tone === 'emerald' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
            tone === 'amber' && 'border-amber-500/30 bg-amber-500/10 text-amber-300',
            tone === 'rose' && 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

function Panel({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string
  icon: LucideIcon
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/60">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">
          <Icon className="h-4 w-4 text-sky-300" />
          {title}
        </h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center text-sm text-zinc-500">
      {label}
    </div>
  )
}

function QuickLink({
  href,
  icon: Icon,
  label,
  external = false,
}: {
  href: string
  icon: LucideIcon
  label: string
  external?: boolean
}) {
  const className =
    'inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-sky-500/50 hover:bg-zinc-800'
  const content = (
    <>
      <Icon className="h-4 w-4" />
      {label}
      {external && <ExternalLink className="h-3.5 w-3.5" />}
    </>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}

export function AdminOperatorConsole({ initialUser, authSource }: AdminOperatorConsoleProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [systemStats, setSystemStats] = useState<AdminSystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/admin/dashboard', { cache: 'no-store' })
      const payload = await response.json().catch(() => null)

      if (response.status === 401 || response.status === 403) {
        setAuthError(payload?.error || 'Admin privileges required')
        return
      }

      if (!response.ok) {
        throw new Error(payload?.error || `Dashboard API returned ${response.status}`)
      }

      setData(payload as AdminDashboardData)
      setError(null)
      setAuthError(null)
      setLastUpdated(new Date().toISOString())
    } catch (dashboardError) {
      setError(
        dashboardError instanceof Error ? dashboardError.message : 'Failed to load dashboard'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const fetchSystemStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const response = await fetch('/api/admin/system-stats?timeRange=24', { cache: 'no-store' })
      const payload = await response.json().catch(() => null)

      if (response.ok && payload?.success) {
        setSystemStats(payload.systemStats as AdminSystemStats)
      }
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    const interval = window.setInterval(fetchDashboard, 30000)
    return () => window.clearInterval(interval)
  }, [fetchDashboard])

  useEffect(() => {
    if (activeTab === 'infrastructure' && !systemStats && !statsLoading) {
      fetchSystemStats()
    }
  }, [activeTab, fetchSystemStats, statsLoading, systemStats])

  const totalAgents = data
    ? data.agents.historical + data.agents.planetary + data.agents.created
    : 0
  const healthChecks = useMemo(() => {
    if (!data) return []

    return [
      data.system.database === 'healthy',
      data.system.railwayBackend === 'healthy',
      data.system.aiProviders.openai,
      data.system.aiProviders.anthropic,
      data.system.aiProviders.google,
      data.system.aiProviders.gateway,
    ]
  }, [data])
  const healthScore =
    healthChecks.length > 0
      ? Math.round((healthChecks.filter(Boolean).length / healthChecks.length) * 100)
      : 0
  const degraded = data ? healthScore < 75 : false
  const productionUrl = data?.system.vercelDeployment.url?.startsWith('http')
    ? data.system.vercelDeployment.url
    : 'https://agents.alchm.kitchen'

  if (authError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
        <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <Lock className="h-8 w-8 text-rose-300" />
          <h1 className="mt-4 text-xl font-semibold">Admin Console Locked</h1>
          <p className="mt-2 text-sm text-zinc-400">{authError}</p>
          <Link
            href="/auth/signin?callbackUrl=/admin"
            className="mt-5 inline-flex rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-950"
          >
            Sign in again
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge
                status={degraded ? 'warn' : data ? 'healthy' : 'unknown'}
                label={data ? `${healthScore}% health` : 'loading'}
              />
              <StatusBadge status="healthy" label={authSource.replace(/-/g, ' ')} />
            </div>
            <h1 className="text-3xl font-semibold text-zinc-50">Operator Console</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {initialUser.email || initialUser.name || initialUser.id} · agents.alchm.kitchen
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <QuickLink href={productionUrl} icon={Cloud} label="Production" external />
            <QuickLink href="/api/health" icon={Gauge} label="Health API" />
            <button
              type="button"
              onClick={fetchDashboard}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-sky-500/50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              API failure
            </div>
            <p className="mt-1 text-amber-100/75">{error}</p>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[245px_minmax(0,1fr)]">
          <nav className="h-fit rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 lg:sticky lg:top-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'mb-1 flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition',
                  activeTab === tab.id
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                )}
              >
                <span className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ))}
          </nav>

          <section className="min-w-0">
            {loading && !data ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900"
                  />
                ))}
              </div>
            ) : data ? (
              <>
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <MetricPanel
                        icon={Users}
                        label="Users"
                        value={formatNumber(data.users.total)}
                        detail={`+${data.users.newToday} today`}
                        tone="sky"
                      />
                      <MetricPanel
                        icon={Bot}
                        label="Agents"
                        value={formatNumber(totalAgents)}
                        detail={`${data.agents.historical} historical · ${data.agents.created} created`}
                        tone="amber"
                      />
                      <MetricPanel
                        icon={BrainCircuit}
                        label="Conversations"
                        value={formatNumber(data.agents.totalConversations)}
                        detail="historical agent total"
                        tone="emerald"
                      />
                      <MetricPanel
                        icon={ShieldCheck}
                        label="Health"
                        value={`${healthScore}%`}
                        detail={`${healthChecks.filter(Boolean).length}/${healthChecks.length} checks green`}
                        tone={degraded ? 'rose' : 'emerald'}
                      />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                      <Panel title="Recent Activity" icon={Activity}>
                        {data.recentActivity.length === 0 ? (
                          <EmptyState label="No recent interactions recorded" />
                        ) : (
                          <div className="divide-y divide-zinc-800">
                            {data.recentActivity.slice(0, 8).map(activity => (
                              <div
                                key={`${activity.type}-${activity.timestamp}`}
                                className="grid gap-2 py-3 sm:grid-cols-[1fr_auto]"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm text-zinc-200">
                                    {activity.description}
                                  </p>
                                  <p className="mt-1 text-xs text-zinc-500">
                                    {formatDate(activity.timestamp)}
                                  </p>
                                </div>
                                <span className="h-fit rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-400">
                                  {activity.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </Panel>

                      <Panel title="Top Agents" icon={Bot}>
                        {data.topAgents.length === 0 ? (
                          <EmptyState label="No agent ranking data available" />
                        ) : (
                          <div className="space-y-3">
                            {data.topAgents.map((agent, index) => {
                              const max = Math.max(
                                ...data.topAgents.map(item => item.interactions),
                                1
                              )
                              const width = Math.round((agent.interactions / max) * 100)

                              return (
                                <div key={agent.id}>
                                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                    <span className="truncate text-zinc-200">
                                      {index + 1}. {agent.name}
                                    </span>
                                    <span className="text-zinc-500">
                                      {formatNumber(agent.interactions)}
                                    </span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-md bg-zinc-800">
                                    <div
                                      className="h-full rounded-md bg-sky-400"
                                      style={{ width: `${width}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </Panel>
                    </div>
                  </div>
                )}

                {activeTab === 'users' && (
                  <Panel title="Recent Users" icon={UserCog}>
                    {data.users.recent.length === 0 ? (
                      <EmptyState label="No users found" />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                          <thead className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                            <tr className="border-b border-zinc-800">
                              <th className="px-3 py-2 text-left font-semibold">User</th>
                              <th className="px-3 py-2 text-left font-semibold">Role</th>
                              <th className="px-3 py-2 text-left font-semibold">Joined</th>
                              <th className="px-3 py-2 text-left font-semibold">ID</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800">
                            {data.users.recent.map(user => (
                              <tr key={user.id} className="hover:bg-zinc-900">
                                <td className="px-3 py-3">
                                  <div className="font-medium text-zinc-100">
                                    {user.name || 'Unnamed'}
                                  </div>
                                  <div className="text-xs text-zinc-500">{user.email}</div>
                                </td>
                                <td className="px-3 py-3">
                                  <span
                                    className={cn(
                                      'rounded-md px-2 py-1 text-xs font-semibold',
                                      user.role === 'admin'
                                        ? 'bg-emerald-500/10 text-emerald-300'
                                        : 'bg-zinc-800 text-zinc-300'
                                    )}
                                  >
                                    {user.role}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-zinc-400">
                                  {formatDate(user.createdAt)}
                                </td>
                                <td className="px-3 py-3 font-mono text-xs text-zinc-500">
                                  {user.id}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Panel>
                )}

                {activeTab === 'agents' && (
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <MetricPanel
                        icon={BriefcaseBusiness}
                        label="Historical"
                        value={formatNumber(data.agents.historical)}
                        tone="sky"
                      />
                      <MetricPanel
                        icon={Cloud}
                        label="Planetary"
                        value={formatNumber(data.agents.planetary)}
                        tone="emerald"
                      />
                      <MetricPanel
                        icon={Bot}
                        label="Created"
                        value={formatNumber(data.agents.created)}
                        tone="amber"
                      />
                    </div>
                    <Panel title="Conversation Telemetry" icon={Activity}>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        <PerformanceDashboard />
                      </div>
                    </Panel>
                  </div>
                )}

                {activeTab === 'rag' && (
                  <div className="space-y-5">
                    <Panel
                      title="Knowledge Retrieval"
                      icon={Database}
                      action={
                        <QuickLink
                          href="/admin/rag-analytics"
                          icon={FileSearch}
                          label="Analytics"
                        />
                      }
                    >
                      <RAGMonitor variant="detailed" autoRefresh refreshInterval={10000} />
                    </Panel>
                    <Panel title="Knowledge Actions" icon={TerminalSquare}>
                      <div className="flex flex-wrap gap-2">
                        <QuickLink
                          href="/api/vector-store/health"
                          icon={Gauge}
                          label="Vector Health"
                        />
                        <QuickLink
                          href="/api/knowledge-updater"
                          icon={Database}
                          label="Knowledge Updater"
                        />
                        <QuickLink href="/api/rag/cache" icon={HardDrive} label="RAG Cache" />
                      </div>
                    </Panel>
                  </div>
                )}

                {activeTab === 'infrastructure' && (
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <MetricPanel
                        icon={Database}
                        label="Database"
                        value={data.system.database}
                        tone={data.system.database === 'healthy' ? 'emerald' : 'rose'}
                      />
                      <MetricPanel
                        icon={Server}
                        label="Railway"
                        value={data.system.railwayBackend}
                        tone={data.system.railwayBackend === 'healthy' ? 'emerald' : 'amber'}
                      />
                      <MetricPanel
                        icon={Cloud}
                        label="AI Gateway"
                        value={data.system.aiProviders.gateway ? 'enabled' : 'off'}
                        tone={data.system.aiProviders.gateway ? 'emerald' : 'amber'}
                      />
                      <MetricPanel
                        icon={Gauge}
                        label="Memory RSS"
                        value={
                          systemStats
                            ? `${systemStats.performance.systemMetrics.memoryUsage.rss} MB`
                            : statsLoading
                              ? 'loading'
                              : 'n/a'
                        }
                        tone="sky"
                      />
                    </div>

                    <Panel
                      title="Provider Configuration"
                      icon={ShieldCheck}
                      action={
                        <button
                          type="button"
                          onClick={fetchSystemStats}
                          className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                        >
                          <RefreshCw
                            className={cn('h-3.5 w-3.5', statsLoading && 'animate-spin')}
                          />
                          Stats
                        </button>
                      }
                    >
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {Object.entries(data.system.aiProviders).map(([provider, enabled]) => (
                          <div
                            key={provider}
                            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2"
                          >
                            <span className="font-mono text-xs uppercase text-zinc-400">
                              {provider}
                            </span>
                            <StatusBadge
                              status={healthLabel(enabled)}
                              label={enabled ? 'live' : 'off'}
                            />
                          </div>
                        ))}
                      </div>
                    </Panel>

                    <Panel title="Runtime Metrics" icon={Gauge}>
                      <PerformanceDashboard />
                    </Panel>
                  </div>
                )}

                {activeTab === 'deployments' && (
                  <div className="space-y-5">
                    <Panel title="Production Surface" icon={Cloud}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Alias</p>
                          <a
                            href="https://agents.alchm.kitchen"
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-sky-300"
                          >
                            agents.alchm.kitchen <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                            Deployment URL
                          </p>
                          <p className="mt-2 break-all font-mono text-sm text-zinc-300">
                            {data.system.vercelDeployment.url}
                          </p>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                            Commit
                          </p>
                          <p className="mt-2 font-mono text-sm text-zinc-300">
                            {data.system.vercelDeployment.commitSha || 'n/a'}
                          </p>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                            Deploy Stamp
                          </p>
                          <p className="mt-2 text-sm text-zinc-300">
                            {formatDate(data.system.vercelDeployment.lastDeploy)}
                          </p>
                        </div>
                      </div>
                    </Panel>
                  </div>
                )}

                {activeTab === 'jobs' && (
                  <Panel title="Batch Jobs" icon={Workflow}>
                    <BatchProcessingDashboard embedded />
                  </Panel>
                )}

                {activeTab === 'desktop' && (
                  <div className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-3">
                      <MetricPanel
                        icon={Monitor}
                        label="Release Channel"
                        value="GitHub latest"
                        detail="alchm-agents-app"
                        tone="sky"
                      />
                      <MetricPanel
                        icon={HardDrive}
                        label="Model Cache"
                        value="sandboxed"
                        detail="$APPDATA/com.cookingwithcastro.alchm/models"
                        tone="emerald"
                      />
                      <MetricPanel
                        icon={ShieldCheck}
                        label="Sidecar IPC"
                        value="nonce gated"
                        detail="X-IPC-Nonce required"
                        tone="amber"
                      />
                    </div>
                    <Panel title="Desktop Companion Links" icon={Monitor}>
                      <div className="flex flex-wrap gap-2">
                        <QuickLink
                          href={DESKTOP_APP_DOWNLOAD_URL}
                          icon={ExternalLink}
                          label="Desktop Releases"
                          external
                        />
                        <QuickLink
                          href="/api/models/catalog"
                          icon={Database}
                          label="Model Catalog"
                        />
                      </div>
                    </Panel>
                  </div>
                )}
              </>
            ) : (
              <EmptyState label="No admin data loaded" />
            )}
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
          <span>Last updated {lastUpdated ? formatDate(lastUpdated) : 'n/a'}</span>
          <span>Refresh interval 30s</span>
        </footer>
      </div>
    </main>
  )
}

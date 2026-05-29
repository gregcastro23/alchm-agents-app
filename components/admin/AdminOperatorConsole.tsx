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
  Swords,
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
import { ALCHM_DESKTOP_DOWNLOAD_LABEL, DESKTOP_APP_DOWNLOAD_URL } from '@/lib/desktop-download'
import type {
  AdminDashboardData,
  AdminHealthValue,
  AdminSystemStats,
  AdminRecentChat,
  AdminJingDuel,
} from '@/types/admin'

type AdminTab =
  | 'overview'
  | 'users'
  | 'agents'
  | 'chats'
  | 'jing'
  | 'leveling'
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

interface AdminLevelingSummary {
  totals: {
    agents: number
    maxedLevel100: number
    untrainedLevel1: number
    avgLevel: number
    totalEvsTrained: number
    evTotalCap: number
    agentsInTraining: number
  }
  distribution: Array<{ band: string; count: number }>
  topAgents: Array<{ agentId: string; name: string; level: number; xp: number }>
  inTraining: Array<{
    agentId: string
    name: string
    level: number
    evTotal: number
    lastTrainingPartner: string | null
  }>
}

const tabs: Array<{ id: AdminTab; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'chats', label: 'Chat Status', icon: TerminalSquare },
  { id: 'jing', label: 'Jing Arena', icon: Swords },
  { id: 'leveling', label: 'Cosmic Leveling', icon: Gauge },
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
  const [selectedChat, setSelectedChat] = useState<AdminRecentChat | null>(null)
  const [selectedDuel, setSelectedDuel] = useState<AdminJingDuel | null>(null)
  const [leveling, setLeveling] = useState<AdminLevelingSummary | null>(null)
  const [levelingLoading, setLevelingLoading] = useState(false)

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

  const fetchLeveling = useCallback(async () => {
    setLevelingLoading(true)
    try {
      const response = await fetch('/api/admin/leveling-summary', { cache: 'no-store' })
      const payload = await response.json().catch(() => null)
      if (response.ok && payload?.success) setLeveling(payload as AdminLevelingSummary)
    } finally {
      setLevelingLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'infrastructure' && !systemStats && !statsLoading) {
      fetchSystemStats()
    }
  }, [activeTab, fetchSystemStats, statsLoading, systemStats])

  useEffect(() => {
    if (activeTab === 'leveling' && !leveling && !levelingLoading) {
      fetchLeveling()
    }
  }, [activeTab, fetchLeveling, leveling, levelingLoading])

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

                {activeTab === 'chats' && (
                  <Panel title="Agent Chats Status" icon={TerminalSquare}>
                    {!data.recentChats || data.recentChats.length === 0 ? (
                      <EmptyState label="No agent chats recorded" />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-sm">
                          <thead className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                            <tr className="border-b border-zinc-800">
                              <th className="px-3 py-2 text-left font-semibold">Agent</th>
                              <th className="px-3 py-2 text-left font-semibold">User Message</th>
                              <th className="px-3 py-2 text-left font-semibold">Agent Response</th>
                              <th className="px-3 py-2 text-left font-semibold">
                                Model / Provider
                              </th>
                              <th className="px-3 py-2 text-left font-semibold">Latency</th>
                              <th className="px-3 py-2 text-left font-semibold">Status</th>
                              <th className="px-3 py-2 text-left font-semibold">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800">
                            {data.recentChats.map(chat => {
                              const isSuccess =
                                chat.agentResponse &&
                                !chat.agentResponse.includes('[All providers unavailable]')
                              const latency = chat.responseTime ? `${chat.responseTime}ms` : 'n/a'

                              return (
                                <tr
                                  key={chat.id}
                                  className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                                  onClick={() => setSelectedChat(chat)}
                                >
                                  <td className="px-3 py-3">
                                    <div className="font-semibold text-zinc-100">
                                      {chat.agentName}
                                    </div>
                                    <div
                                      className="text-xs text-zinc-500 font-mono truncate max-w-[150px]"
                                      title={chat.agentId}
                                    >
                                      {chat.agentId}
                                    </div>
                                  </td>
                                  <td
                                    className="px-3 py-3 max-w-[200px] truncate text-zinc-300"
                                    title={chat.userMessage}
                                  >
                                    {chat.userMessage}
                                  </td>
                                  <td
                                    className="px-3 py-3 max-w-[250px] truncate text-zinc-400"
                                    title={chat.agentResponse}
                                  >
                                    {chat.agentResponse}
                                  </td>
                                  <td className="px-3 py-3 font-mono text-xs text-zinc-400">
                                    {chat.modelUsed || 'n/a'}
                                  </td>
                                  <td className="px-3 py-3 font-mono text-xs text-zinc-300">
                                    {latency}
                                  </td>
                                  <td className="px-3 py-3">
                                    <span
                                      className={cn(
                                        'rounded-md px-2 py-1 text-xs font-semibold uppercase border tracking-wider',
                                        isSuccess
                                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                          : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                                      )}
                                    >
                                      {isSuccess ? 'Success' : 'Failed'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-zinc-500 text-xs whitespace-nowrap">
                                    {formatDate(chat.createdAt)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Panel>
                )}

                {activeTab === 'jing' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MetricPanel
                        icon={Swords}
                        label="Total Duels"
                        value={formatNumber(data.jingAggregates?.total ?? 0)}
                        detail="All-time persisted casts"
                      />
                      <MetricPanel
                        icon={Activity}
                        label="Last 24h"
                        value={formatNumber(data.jingAggregates?.last24h ?? 0)}
                        detail="Casts in past day"
                        tone="emerald"
                      />
                      <MetricPanel
                        icon={Gauge}
                        label="Last 7d"
                        value={formatNumber(data.jingAggregates?.last7d ?? 0)}
                        detail="Casts in past week"
                        tone="amber"
                      />
                      <MetricPanel
                        icon={RefreshCw}
                        label="Avg Latency"
                        value={
                          data.jingAggregates?.avgLatencyMs
                            ? `${formatNumber(data.jingAggregates.avgLatencyMs)}ms`
                            : 'n/a'
                        }
                        detail="Both turns combined"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      <Panel title="Stance Histogram" icon={Swords}>
                        {(() => {
                          const hist = data.jingAggregates?.stanceHistogram ?? {}
                          const entries = ['clash', 'absorb', 'mirror'].map(stance => ({
                            stance,
                            count: hist[stance] ?? 0,
                          }))
                          const max = Math.max(1, ...entries.map(e => e.count))
                          const stanceTone: Record<string, string> = {
                            clash: 'bg-rose-500/40 border-rose-500/50',
                            absorb: 'bg-sky-500/40 border-sky-500/50',
                            mirror: 'bg-fuchsia-500/40 border-fuchsia-500/50',
                          }
                          return (
                            <div className="space-y-3">
                              {entries.map(({ stance, count }) => (
                                <div key={stance} className="space-y-1.5">
                                  <div className="flex justify-between text-xs">
                                    <span className="capitalize text-zinc-200 font-semibold">
                                      {stance}
                                    </span>
                                    <span className="font-mono text-zinc-400">{count}</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                                    <div
                                      className={cn(
                                        'h-full rounded-full border',
                                        stanceTone[stance] || 'bg-zinc-600/40 border-zinc-500/50'
                                      )}
                                      style={{ width: `${(count / max) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                      </Panel>

                      <Panel title="Boost Element" icon={Gauge}>
                        {(() => {
                          const hist = data.jingAggregates?.boostElementHistogram ?? {}
                          const order = ['fire', 'water', 'earth', 'air', 'none']
                          const entries = order
                            .filter(el => hist[el] !== undefined)
                            .map(el => ({ el, count: hist[el] ?? 0 }))
                          if (entries.length === 0) {
                            return <EmptyState label="No boost elements recorded yet" />
                          }
                          const max = Math.max(1, ...entries.map(e => e.count))
                          const elTone: Record<string, string> = {
                            fire: 'bg-rose-500/40 border-rose-500/50',
                            water: 'bg-sky-500/40 border-sky-500/50',
                            earth: 'bg-emerald-500/40 border-emerald-500/50',
                            air: 'bg-amber-500/40 border-amber-500/50',
                            none: 'bg-zinc-600/40 border-zinc-500/50',
                          }
                          return (
                            <div className="space-y-3">
                              {entries.map(({ el, count }) => (
                                <div key={el} className="space-y-1.5">
                                  <div className="flex justify-between text-xs">
                                    <span className="capitalize text-zinc-200 font-semibold">
                                      {el}
                                    </span>
                                    <span className="font-mono text-zinc-400">{count}</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                                    <div
                                      className={cn(
                                        'h-full rounded-full border',
                                        elTone[el] || 'bg-zinc-600/40 border-zinc-500/50'
                                      )}
                                      style={{ width: `${(count / max) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                      </Panel>

                      <Panel title="Top Pairs" icon={Bot}>
                        {(() => {
                          const pairs = data.jingAggregates?.topPairs ?? []
                          if (pairs.length === 0) {
                            return <EmptyState label="No duels recorded yet" />
                          }
                          return (
                            <ul className="space-y-2 text-sm">
                              {pairs.map(p => (
                                <li
                                  key={`${p.casterId}::${p.targetId}`}
                                  className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2"
                                >
                                  <span className="text-zinc-200 truncate">
                                    {p.casterName}
                                    <ChevronRight className="inline h-3 w-3 mx-1 text-zinc-500" />
                                    {p.targetName}
                                  </span>
                                  <span className="font-mono text-zinc-400 text-xs">{p.count}</span>
                                </li>
                              ))}
                            </ul>
                          )
                        })()}
                      </Panel>
                    </div>

                    <Panel title="Recent Jing Duels" icon={Swords}>
                      {!data.recentJingDuels || data.recentJingDuels.length === 0 ? (
                        <EmptyState label="No duels recorded — cast one in the desktop shell" />
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[900px] text-sm">
                            <thead className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                              <tr className="border-b border-zinc-800">
                                <th className="px-3 py-2 text-left font-semibold">Caster</th>
                                <th className="px-3 py-2 text-left font-semibold">Target</th>
                                <th className="px-3 py-2 text-left font-semibold">
                                  Move → Counter
                                </th>
                                <th className="px-3 py-2 text-left font-semibold">Stance</th>
                                <th className="px-3 py-2 text-left font-semibold">Boost</th>
                                <th className="px-3 py-2 text-left font-semibold">Latency</th>
                                <th className="px-3 py-2 text-left font-semibold">Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                              {data.recentJingDuels.map(duel => {
                                const stanceTone: Record<string, string> = {
                                  clash: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
                                  absorb: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
                                  mirror:
                                    'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300',
                                }
                                const boostPct = Math.round(duel.boostMagnitude * 100)
                                return (
                                  <tr
                                    key={duel.id}
                                    className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                                    onClick={() => setSelectedDuel(duel)}
                                  >
                                    <td className="px-3 py-3">
                                      <div className="font-semibold text-zinc-100">
                                        {duel.casterName}
                                      </div>
                                      <div
                                        className="text-xs text-zinc-500 font-mono truncate max-w-[160px]"
                                        title={duel.casterId}
                                      >
                                        {duel.casterId}
                                      </div>
                                    </td>
                                    <td className="px-3 py-3">
                                      <div className="font-semibold text-zinc-100">
                                        {duel.targetName}
                                      </div>
                                      <div
                                        className="text-xs text-zinc-500 font-mono truncate max-w-[160px]"
                                        title={duel.targetId}
                                      >
                                        {duel.targetId}
                                      </div>
                                    </td>
                                    <td className="px-3 py-3 font-mono text-xs text-zinc-300">
                                      {duel.attackMoveId}
                                      <ChevronRight className="inline h-3 w-3 mx-1 text-zinc-500" />
                                      {duel.counterMoveId}
                                    </td>
                                    <td className="px-3 py-3">
                                      <span
                                        className={cn(
                                          'rounded-md px-2 py-1 text-xs font-semibold uppercase border tracking-wider capitalize',
                                          stanceTone[duel.stance] ||
                                            'border-zinc-700 bg-zinc-800/40 text-zinc-300'
                                        )}
                                      >
                                        {duel.stance}
                                      </span>
                                    </td>
                                    <td className="px-3 py-3 font-mono text-xs text-zinc-300">
                                      {duel.boostElement
                                        ? `${boostPct}% ${duel.boostElement}`
                                        : '—'}
                                    </td>
                                    <td className="px-3 py-3 font-mono text-xs text-zinc-300">
                                      {duel.latencyMs ? `${duel.latencyMs}ms` : 'n/a'}
                                    </td>
                                    <td className="px-3 py-3 text-zinc-500 text-xs whitespace-nowrap">
                                      {formatDate(duel.createdAt)}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Panel>
                  </div>
                )}

                {activeTab === 'leveling' && (
                  <div className="space-y-6">
                    {!leveling ? (
                      <EmptyState
                        label={levelingLoading ? 'Loading cosmic leveling…' : 'No leveling data.'}
                      />
                    ) : (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <MetricPanel
                            icon={Bot}
                            label="Total Agents"
                            value={leveling.totals.agents.toLocaleString()}
                            tone="sky"
                          />
                          <MetricPanel
                            icon={Gauge}
                            label="Avg Level"
                            value={String(leveling.totals.avgLevel)}
                            detail={`${leveling.totals.maxedLevel100.toLocaleString()} at Lv.100`}
                            tone="emerald"
                          />
                          <MetricPanel
                            icon={Activity}
                            label="In Training"
                            value={leveling.totals.agentsInTraining.toLocaleString()}
                            detail="agents with EVs > 0"
                            tone="amber"
                          />
                          <MetricPanel
                            icon={Swords}
                            label="EVs Trained"
                            value={leveling.totals.totalEvsTrained.toLocaleString()}
                            detail="total across roster"
                            tone="rose"
                          />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <Panel title="Level Distribution" icon={Gauge}>
                            <div className="space-y-2">
                              {leveling.distribution.map(b => {
                                const pct = leveling.totals.agents
                                  ? Math.round((b.count / leveling.totals.agents) * 100)
                                  : 0
                                return (
                                  <div key={b.band}>
                                    <div className="flex items-center justify-between text-xs text-zinc-400">
                                      <span>{b.band}</span>
                                      <span className="tabular-nums">
                                        {b.count.toLocaleString()} ({pct}%)
                                      </span>
                                    </div>
                                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                                      <div
                                        className="h-full rounded-full bg-sky-500"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </Panel>

                          <Panel title="Legends Leaderboard" icon={Bot}>
                            {leveling.topAgents.length === 0 ? (
                              <EmptyState label="No ranked agents." />
                            ) : (
                              <ol className="space-y-1.5 text-sm">
                                {leveling.topAgents.map((a, i) => (
                                  <li
                                    key={a.agentId}
                                    className="flex items-center justify-between gap-2"
                                  >
                                    <span className="truncate text-zinc-200">
                                      <span className="text-zinc-500">{i + 1}.</span> {a.name}
                                    </span>
                                    <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                                      Lv.{a.level} · {a.xp.toLocaleString()} XP
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            )}
                          </Panel>
                        </div>

                        <Panel title="Currently Training" icon={Activity}>
                          {leveling.inTraining.length === 0 ? (
                            <EmptyState label="No agents are training yet (no EVs earned)." />
                          ) : (
                            <div className="space-y-1.5 text-sm">
                              {leveling.inTraining.map(a => (
                                <div
                                  key={a.agentId}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <span className="truncate text-zinc-200">
                                    {a.name} <span className="text-zinc-500">Lv.{a.level}</span>
                                  </span>
                                  <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                                    {a.evTotal} EVs
                                    {a.lastTrainingPartner
                                      ? ` · last: ${a.lastTrainingPartner}`
                                      : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </Panel>
                      </>
                    )}
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
                          label={ALCHM_DESKTOP_DOWNLOAD_LABEL}
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

        {/* Chat Telemetry Detail Modal */}
        {selectedChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm transition-opacity">
            <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="p-5 border-b border-zinc-800 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                    <TerminalSquare className="w-5 h-5 text-sky-400" />
                    Chat Telemetry Details
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                    Agent:{' '}
                    <span className="font-semibold text-zinc-300">{selectedChat.agentName}</span>
                    <span className="text-zinc-600 font-mono">({selectedChat.agentId})</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedChat(null)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-800"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-sm">
                {/* Status & Latency Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/40 p-4 border border-zinc-800/60 rounded-lg font-mono text-xs">
                  <div>
                    <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">
                      Status
                    </span>
                    <span
                      className={cn(
                        'font-semibold',
                        selectedChat.agentResponse &&
                          !selectedChat.agentResponse.includes('[All providers unavailable]')
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      )}
                    >
                      {selectedChat.agentResponse &&
                      !selectedChat.agentResponse.includes('[All providers unavailable]')
                        ? 'SUCCESS'
                        : 'FAILED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">
                      Response Time
                    </span>
                    <span className="text-zinc-300 font-semibold">
                      {selectedChat.responseTime ? `${selectedChat.responseTime}ms` : 'n/a'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">
                      Model Used
                    </span>
                    <span className="text-zinc-300 font-semibold">
                      {selectedChat.modelUsed || 'n/a'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">
                      Timestamp
                    </span>
                    <span className="text-zinc-300">
                      {new Date(selectedChat.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* User Message */}
                <div className="space-y-1.5">
                  <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                    User Message
                  </h4>
                  <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-lg text-zinc-200 whitespace-pre-wrap select-text">
                    {selectedChat.userMessage}
                  </div>
                </div>

                {/* Agent Response */}
                <div className="space-y-1.5">
                  <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                    Agent Response
                  </h4>
                  <div className="bg-zinc-950/40 border border-zinc-800/80 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap select-text max-h-[300px] overflow-y-auto font-sans leading-relaxed">
                    {selectedChat.agentResponse}
                  </div>
                </div>

                {/* Session Identification */}
                <div className="pt-2 text-xs font-mono text-zinc-500 flex justify-between border-t border-zinc-800/60">
                  <span>Session: {selectedChat.sessionId}</span>
                  <span>ID: {selectedChat.id}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-100 rounded-lg text-xs font-semibold uppercase tracking-wider"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Jing Duel Detail Modal */}
        {selectedDuel && (
          <JingDuelModal duel={selectedDuel} onClose={() => setSelectedDuel(null)} />
        )}
      </div>
    </main>
  )
}

function JingDuelModal({ duel, onClose }: { duel: AdminJingDuel; onClose: () => void }) {
  const synastry = duel.synastrySnapshot as {
    pair?: { agentA?: string; agentB?: string; cacheHit?: boolean }
    scores?: {
      tension?: number
      harmony?: number
      intensification?: number
      aspectCount?: number
    }
    dominantStance?: string
    interchartAspects?: Array<{
      planetA: string
      planetB: string
      type: string
      orb: number
      exactness: number
      harmonic: string
    }>
  } | null
  const casterTransit = duel.casterTransitSnapshot as {
    summary?: string
    boostElement?: string | null
    boostMagnitude?: number
    stressNotes?: string[]
    activations?: Array<{
      transitPlanet: string
      natalPoint: string
      type: string
      orb: number
      exactness: number
      natalElement: string
      valence: string
    }>
  } | null
  const targetTransit = duel.targetTransitSnapshot as typeof casterTransit
  const stanceTone: Record<string, string> = {
    clash: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    absorb: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    mirror: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300',
  }
  const boostPct = Math.round(duel.boostMagnitude * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Swords className="w-5 h-5 text-fuchsia-400" />
              Jing Duel Ledger
            </h3>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-zinc-200">{duel.casterName}</span>
              <ChevronRight className="w-3 h-3 text-zinc-600" />
              <span className="font-semibold text-zinc-200">{duel.targetName}</span>
              <span className="text-zinc-500">·</span>
              <span className="font-mono text-zinc-400">
                {duel.attackMoveId} → {duel.counterMoveId}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-800"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Headline cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/40 p-4 border border-zinc-800/60 rounded-lg font-mono text-xs">
            <div>
              <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">
                Stance
              </span>
              <span
                className={cn(
                  'inline-block mt-1 rounded-md px-2 py-1 text-xs font-semibold uppercase border tracking-wider capitalize',
                  stanceTone[duel.stance] || 'border-zinc-700 bg-zinc-800/40 text-zinc-300'
                )}
              >
                {duel.stance}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">
                Boost
              </span>
              <span className="text-zinc-300 font-semibold">
                {duel.boostElement ? `${boostPct}% ${duel.boostElement}` : '—'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">
                Latency
              </span>
              <span className="text-zinc-300 font-semibold">
                {duel.latencyMs ? `${duel.latencyMs}ms` : 'n/a'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">
                Cache Hit
              </span>
              <span
                className={cn(
                  'font-semibold',
                  duel.cacheHit ? 'text-emerald-400' : 'text-zinc-500'
                )}
              >
                {duel.cacheHit ? 'YES' : 'NO'}
              </span>
            </div>
          </div>

          {/* Synastry summary */}
          {synastry && (
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                Synastry
              </h4>
              <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block">Tension</span>
                    <span className="text-rose-300">
                      {synastry.scores?.tension?.toFixed(2) ?? '0.00'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Harmony</span>
                    <span className="text-sky-300">
                      {synastry.scores?.harmony?.toFixed(2) ?? '0.00'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Intensification</span>
                    <span className="text-fuchsia-300">
                      {synastry.scores?.intensification?.toFixed(2) ?? '0.00'}
                    </span>
                  </div>
                </div>
                {synastry.interchartAspects && synastry.interchartAspects.length > 0 && (
                  <ul className="space-y-1 text-xs font-mono text-zinc-300 pt-2 border-t border-zinc-800/60">
                    {synastry.interchartAspects.slice(0, 6).map((a, i) => (
                      <li key={i} className="flex justify-between">
                        <span>
                          {duel.casterName.split(' ')[0]} {a.planetA}{' '}
                          <span
                            className={cn(
                              'mx-1',
                              a.harmonic === 'friction'
                                ? 'text-rose-400'
                                : a.harmonic === 'harmony'
                                  ? 'text-sky-400'
                                  : 'text-fuchsia-400'
                            )}
                          >
                            {a.type}
                          </span>
                          {duel.targetName.split(' ')[0]} {a.planetB}
                        </span>
                        <span className="text-zinc-500">{a.orb.toFixed(1)}° orb</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Per-agent transit overlays */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: duel.casterName, overlay: casterTransit, role: 'Caster' },
              { label: duel.targetName, overlay: targetTransit, role: 'Target' },
            ].map((entry, i) => (
              <div
                key={i}
                className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-lg space-y-2"
              >
                <div className="flex justify-between items-baseline">
                  <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                    {entry.role} Overlay
                  </h4>
                  <span className="text-xs text-zinc-300 font-semibold">{entry.label}</span>
                </div>
                {entry.overlay ? (
                  <>
                    <p className="text-xs text-zinc-300 italic">
                      {entry.overlay.summary || 'No summary'}
                    </p>
                    {entry.overlay.activations && entry.overlay.activations.length > 0 && (
                      <ul className="space-y-1 text-[11px] font-mono text-zinc-400 pt-1">
                        {entry.overlay.activations.slice(0, 4).map((a, j) => (
                          <li key={j}>
                            transit {a.transitPlanet} {a.type} natal {a.natalPoint}{' '}
                            <span className="text-zinc-600">({a.orb.toFixed(1)}°)</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {entry.overlay.stressNotes && entry.overlay.stressNotes.length > 0 && (
                      <div className="pt-2 border-t border-zinc-800/60 space-y-0.5">
                        {entry.overlay.stressNotes.map((note, k) => (
                          <p key={k} className="text-[11px] text-rose-300/80">
                            ⚠ {note}
                          </p>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No overlay captured</p>
                )}
              </div>
            ))}
          </div>

          {/* Prompts + Responses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                Caster Prompt
              </h4>
              <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-lg text-xs text-zinc-300 whitespace-pre-wrap max-h-[180px] overflow-y-auto">
                {duel.casterPrompt || <span className="text-zinc-600 italic">not captured</span>}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                Caster Response
              </h4>
              <div className="bg-zinc-950/40 border border-zinc-800/80 p-3 rounded-lg text-xs text-zinc-200 whitespace-pre-wrap max-h-[180px] overflow-y-auto">
                {duel.casterResponse || <span className="text-zinc-600 italic">not captured</span>}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                Target Prompt
              </h4>
              <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-lg text-xs text-zinc-300 whitespace-pre-wrap max-h-[180px] overflow-y-auto">
                {duel.targetPrompt || <span className="text-zinc-600 italic">not captured</span>}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                Target Response
              </h4>
              <div className="bg-zinc-950/40 border border-zinc-800/80 p-3 rounded-lg text-xs text-zinc-200 whitespace-pre-wrap max-h-[180px] overflow-y-auto">
                {duel.targetResponse || <span className="text-zinc-600 italic">not captured</span>}
              </div>
            </div>
          </div>

          {/* Footer ids */}
          <div className="pt-2 text-xs font-mono text-zinc-500 flex justify-between border-t border-zinc-800/60">
            <span>Session: {duel.sessionId}</span>
            <span>ID: {duel.id}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-100 rounded-lg text-xs font-semibold uppercase tracking-wider"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  )
}

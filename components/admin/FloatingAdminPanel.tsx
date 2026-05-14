'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Activity,
  AlertTriangle,
  Bot,
  ChevronRight,
  Cpu,
  Gauge,
  Globe2,
  HardDrive,
  LayoutDashboard,
  Lock,
  Network,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type HealthValue = 'healthy' | 'error' | 'unknown'

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
    railwayBackend: HealthValue
    vercelDeployment: { url: string; lastDeploy: string | null }
  }
  recentActivity: { type: string; description: string; timestamp: string }[]
  topAgents: { id: string; name: string; interactions: number }[]
}

interface RuntimeTelemetry {
  online: boolean
  viewport: string
  deviceMemory: string
  network: string
  heap: string
  localTime: string
}

const GREG_HANDLE = 'gregcastro23'
const GREG_EMAIL = 'gregcastro23@gmail.com'

function normalizeHandle(value?: string | null) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isGregIdentity(identity: {
  email?: string | null
  name?: string | null
  id?: string | null
}) {
  const email = identity.email?.toLowerCase() || ''
  const emailHandle = email.split('@')[0]
  const values = [identity.id, identity.name, emailHandle].map(normalizeHandle)

  return email === GREG_EMAIL || values.includes(GREG_HANDLE)
}

function parseLegacyIdentity() {
  if (typeof document === 'undefined') return null

  try {
    const cookies = Object.fromEntries(
      document.cookie
        .split(';')
        .map(cookie => cookie.trim().split('='))
        .filter(([key]) => Boolean(key))
        .map(([key, value]) => [key, decodeURIComponent(value || '')])
    )

    return {
      id: cookies.userId || null,
      name: cookies.userName || null,
      email: null,
    }
  } catch {
    return null
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatRelativeTime(value?: string | null) {
  if (!value) return 'No deploy stamp'

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'Unknown'

  const seconds = Math.max(1, Math.round((Date.now() - timestamp) / 1000))
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h ago`

  return `${Math.round(hours / 24)}d ago`
}

function getRuntimeTelemetry(): RuntimeTelemetry {
  if (typeof window === 'undefined') {
    return {
      online: true,
      viewport: 'server',
      deviceMemory: 'n/a',
      network: 'n/a',
      heap: 'n/a',
      localTime: '',
    }
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { effectiveType?: string; downlink?: number; rtt?: number }
  }
  const perf = performance as Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number }
  }

  const heap = perf.memory
    ? `${Math.round(perf.memory.usedJSHeapSize / 1024 / 1024)} / ${Math.round(
        perf.memory.jsHeapSizeLimit / 1024 / 1024
      )} MB`
    : 'browser hidden'

  return {
    online: navigator.onLine,
    viewport: `${window.innerWidth} x ${window.innerHeight}`,
    deviceMemory: nav.deviceMemory ? `${nav.deviceMemory} GB` : 'unknown',
    network: nav.connection?.effectiveType
      ? `${nav.connection.effectiveType}${nav.connection.downlink ? ` / ${nav.connection.downlink} Mbps` : ''}`
      : 'unknown',
    heap,
    localTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
}

function StatusPill({
  label,
  status,
  detail,
}: {
  label: string
  status: 'good' | 'warn' | 'bad'
  detail?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-3 py-2',
        status === 'good' && 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
        status === 'warn' && 'border-amber-300/30 bg-amber-400/10 text-amber-100',
        status === 'bad' && 'border-rose-300/30 bg-rose-400/10 text-rose-100'
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            status === 'good' && 'bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.8)]',
            status === 'warn' && 'bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.8)]',
            status === 'bad' && 'bg-rose-300 shadow-[0_0_14px_rgba(253,164,175,0.8)]'
          )}
        />
        {label}
      </div>
      {detail && <div className="mt-1 text-[11px] text-white/60">{detail}</div>}
    </div>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
  tone = 'cyan',
}: {
  icon: LucideIcon
  label: string
  value: string
  tone?: 'cyan' | 'green' | 'amber' | 'pink'
}) {
  const toneClass = {
    cyan: 'from-cyan-300/25 to-blue-400/10 text-cyan-100',
    green: 'from-emerald-300/25 to-teal-400/10 text-emerald-100',
    amber: 'from-amber-300/25 to-orange-400/10 text-amber-100',
    pink: 'from-fuchsia-300/25 to-rose-400/10 text-fuchsia-100',
  }[tone]

  return (
    <div className={cn('rounded-2xl border border-white/10 bg-gradient-to-br p-3', toneClass)}>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-black/20">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-black tracking-tight text-white">{value}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
        {label}
      </div>
    </div>
  )
}

function FeatureRow({
  name,
  active,
  detail,
}: {
  name: string
  active: boolean | 'unknown'
  detail: string
}) {
  const status = active === 'unknown' ? 'warn' : active ? 'good' : 'bad'

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <div>
        <div className="text-sm font-semibold text-white">{name}</div>
        <div className="text-xs text-white/45">{detail}</div>
      </div>
      <span
        className={cn(
          'rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]',
          status === 'good' && 'bg-emerald-300/15 text-emerald-200',
          status === 'warn' && 'bg-amber-300/15 text-amber-200',
          status === 'bad' && 'bg-rose-300/15 text-rose-200'
        )}
      >
        {active === 'unknown' ? 'watch' : active ? 'live' : 'off'}
      </span>
    </div>
  )
}

export function FloatingAdminPanel() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [legacyIdentity, setLegacyIdentity] = useState<ReturnType<typeof parseLegacyIdentity>>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [telemetry, setTelemetry] = useState<RuntimeTelemetry>(() => getRuntimeTelemetry())

  const sessionUser = session?.user as
    | {
        id?: string
        email?: string | null
        name?: string | null
        image?: string | null
        role?: string
        tier?: string
      }
    | undefined

  useEffect(() => {
    setLegacyIdentity(parseLegacyIdentity())
    try {
      setCollapsed(localStorage.getItem('floating-admin-panel-collapsed') === 'true')
    } catch {
      setCollapsed(false)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('floating-admin-panel-collapsed', String(collapsed))
    } catch {}
  }, [collapsed])

  useEffect(() => {
    const updateTelemetry = () => setTelemetry(getRuntimeTelemetry())

    updateTelemetry()
    const interval = window.setInterval(updateTelemetry, 15000)
    window.addEventListener('resize', updateTelemetry)
    window.addEventListener('online', updateTelemetry)
    window.addEventListener('offline', updateTelemetry)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('resize', updateTelemetry)
      window.removeEventListener('online', updateTelemetry)
      window.removeEventListener('offline', updateTelemetry)
    }
  }, [])

  const isGregUser = useMemo(() => {
    if (sessionUser && isGregIdentity(sessionUser)) return true
    if (legacyIdentity && isGregIdentity(legacyIdentity)) return true

    return false
  }, [legacyIdentity, sessionUser])

  const fetchPanelData = useCallback(async () => {
    if (!isGregUser || status === 'loading') return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/dashboard', { cache: 'no-store' })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || `Admin API returned ${response.status}`)
      }

      const payload = (await response.json()) as DashboardData
      setData(payload)
      setError(null)
      setLastUpdated(new Date().toISOString())
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load admin data')
    } finally {
      setLoading(false)
    }
  }, [isGregUser, status])

  useEffect(() => {
    fetchPanelData()
    const interval = window.setInterval(fetchPanelData, 30000)
    return () => window.clearInterval(interval)
  }, [fetchPanelData])

  if (status === 'loading' || !isGregUser) return null

  const identity = sessionUser || legacyIdentity
  const role = sessionUser?.role || (data ? 'admin' : 'operator')
  const tier = sessionUser?.tier || 'mission'
  const totalAgents = data
    ? data.agents.historical + data.agents.planetary + data.agents.created
    : 0
  const healthChecks = data
    ? [
        data.system.database === 'healthy',
        data.system.railwayBackend === 'healthy',
        data.system.aiProviders.openai,
        data.system.aiProviders.anthropic,
        data.system.aiProviders.google,
        data.system.aiProviders.gateway,
      ]
    : [telemetry.online]
  const healthScore = Math.round((healthChecks.filter(Boolean).length / healthChecks.length) * 100)
  const healthTone = healthScore >= 75 ? 'good' : healthScore >= 45 ? 'warn' : 'bad'

  if (collapsed) {
    return (
      <aside
        className="fixed right-3 top-24 z-[70] flex w-16 flex-col items-center gap-3 rounded-[2rem] border border-cyan-200/20 bg-slate-950/85 px-2 py-4 text-white shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
        aria-label="Greg admin panel"
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-[0_0_26px_rgba(103,232,249,0.45)] transition hover:scale-105"
          aria-label="Expand admin panel"
        >
          <ShieldCheck className="h-5 w-5" />
        </button>
        <div className="h-24 w-px bg-gradient-to-b from-cyan-200/0 via-cyan-200/45 to-cyan-200/0" />
        <div className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/80">
          Greg Ops
        </div>
        <div
          className={cn(
            'h-3 w-3 rounded-full',
            healthTone === 'good' && 'bg-emerald-300',
            healthTone === 'warn' && 'bg-amber-300',
            healthTone === 'bad' && 'bg-rose-300'
          )}
        />
      </aside>
    )
  }

  return (
    <aside
      className="fixed bottom-5 right-4 top-24 z-[70] flex w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/88 text-white shadow-[0_30px_120px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
      aria-label="Greg admin command panel"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(103,232,249,0.25),transparent_34%),radial-gradient(circle_at_100%_20%,rgba(251,191,36,0.15),transparent_28%),linear-gradient(145deg,rgba(15,23,42,0.1),rgba(2,6,23,0.8))]" />

      <div className="relative border-b border-white/10 p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
              <Sparkles className="h-3 w-3" />
              Greg Mission Control
            </div>
            <h2 className="text-2xl font-black tracking-[-0.04em] text-white">
              Admin Command Rail
            </h2>
            <p className="mt-1 text-xs text-white/50">Persistent right-side system intelligence</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchPanelData}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Refresh admin panel"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </button>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/10"
              aria-label="Collapse admin panel"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-200 to-emerald-200 text-lg font-black text-slate-950">
            G
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{identity?.name || GREG_HANDLE}</div>
            <div className="truncate text-xs text-white/45">{identity?.email || identity?.id}</div>
          </div>
          <div className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
            {role}
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-3 text-amber-50">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Lock className="h-4 w-4" />
              Admin data locked
            </div>
            <p className="mt-1 text-xs text-amber-100/70">{error}</p>
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-3">
          <MetricTile
            icon={Gauge}
            label="Health"
            value={`${healthScore}%`}
            tone={healthTone === 'good' ? 'green' : healthTone === 'warn' ? 'amber' : 'pink'}
          />
          <MetricTile
            icon={Users}
            label="Users"
            value={data ? formatNumber(data.users.total) : 'locked'}
            tone="cyan"
          />
          <MetricTile
            icon={Bot}
            label="Agents"
            value={data ? formatNumber(totalAgents) : 'locked'}
            tone="amber"
          />
          <MetricTile
            icon={Zap}
            label="Chats"
            value={data ? formatNumber(data.agents.totalConversations) : 'locked'}
            tone="pink"
          />
        </div>

        <section className="mb-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-white/75">
              <Activity className="h-4 w-4 text-cyan-200" />
              System Status
            </h3>
            <span className="text-[11px] text-white/40">
              {lastUpdated ? formatRelativeTime(lastUpdated) : telemetry.localTime}
            </span>
          </div>

          <div className="grid gap-2">
            <StatusPill
              label="Database"
              status={data?.system.database === 'healthy' ? 'good' : data ? 'bad' : 'warn'}
              detail={data ? `PostgreSQL ${data.system.database}` : 'Waiting for admin API'}
            />
            <StatusPill
              label="Backend"
              status={
                data?.system.railwayBackend === 'healthy'
                  ? 'good'
                  : data?.system.railwayBackend === 'unknown'
                    ? 'warn'
                    : data
                      ? 'bad'
                      : 'warn'
              }
              detail={data ? `Railway ${data.system.railwayBackend}` : 'Status pending'}
            />
          </div>
        </section>

        <section className="mb-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-3">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-white/75">
            <Network className="h-4 w-4 text-emerald-200" />
            Feature Matrix
          </h3>
          <div className="grid gap-2">
            <FeatureRow
              name="AI Gateway"
              active={data?.system.aiProviders.gateway ?? 'unknown'}
              detail="Unified provider routing"
            />
            <FeatureRow
              name="OpenAI Provider"
              active={data?.system.aiProviders.openai ?? 'unknown'}
              detail="Agent reasoning and generation"
            />
            <FeatureRow
              name="Anthropic Provider"
              active={data?.system.aiProviders.anthropic ?? 'unknown'}
              detail="Secondary model capacity"
            />
            <FeatureRow
              name="Google Gemini"
              active={data?.system.aiProviders.google ?? 'unknown'}
              detail="Multimodal model lane"
            />
            <FeatureRow
              name="Client Network"
              active={telemetry.online}
              detail={telemetry.network}
            />
          </div>
        </section>

        <section className="mb-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-3">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-white/75">
            <Cpu className="h-4 w-4 text-amber-200" />
            User Intelligence
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl bg-white/[0.04] p-3">
              <div className="text-white/40">Tier</div>
              <div className="mt-1 font-bold capitalize text-white">{tier.replace(/_/g, ' ')}</div>
            </div>
            <div className="rounded-2xl bg-white/[0.04] p-3">
              <div className="text-white/40">Route</div>
              <div className="mt-1 truncate font-bold text-white">{pathname || '/'}</div>
            </div>
            <div className="rounded-2xl bg-white/[0.04] p-3">
              <div className="text-white/40">Viewport</div>
              <div className="mt-1 font-bold text-white">{telemetry.viewport}</div>
            </div>
            <div className="rounded-2xl bg-white/[0.04] p-3">
              <div className="text-white/40">Device Memory</div>
              <div className="mt-1 font-bold text-white">{telemetry.deviceMemory}</div>
            </div>
            <div className="col-span-2 rounded-2xl bg-white/[0.04] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-white/40">Browser Heap</div>
                  <div className="mt-1 font-bold text-white">{telemetry.heap}</div>
                </div>
                {telemetry.online ? (
                  <Wifi className="h-5 w-5 text-emerald-200" />
                ) : (
                  <WifiOff className="h-5 w-5 text-rose-200" />
                )}
              </div>
            </div>
          </div>
        </section>

        {data && (
          <section className="mb-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-3">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-white/75">
              <HardDrive className="h-4 w-4 text-fuchsia-200" />
              Live Intelligence
            </h3>

            <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl bg-white/[0.04] p-2">
                <div className="text-lg font-black text-white">{data.users.newToday}</div>
                <div className="text-white/40">new today</div>
              </div>
              <div className="rounded-2xl bg-white/[0.04] p-2">
                <div className="text-lg font-black text-white">{data.users.admins}</div>
                <div className="text-white/40">admins</div>
              </div>
              <div className="rounded-2xl bg-white/[0.04] p-2">
                <div className="text-lg font-black text-white">{data.topAgents.length}</div>
                <div className="text-white/40">top agents</div>
              </div>
            </div>

            <div className="space-y-2">
              {data.topAgents.slice(0, 4).map((agent, index) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">
                      {index + 1}. {agent.name}
                    </div>
                    <div className="text-xs text-white/40">agent id: {agent.id}</div>
                  </div>
                  <div className="text-sm font-black text-cyan-100">
                    {formatNumber(agent.interactions)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="relative border-t border-white/10 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-200 px-3 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100"
          >
            <LayoutDashboard className="h-4 w-4" />
            Full Admin
          </Link>
          <Link
            href="/api/health"
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            <Globe2 className="h-4 w-4" />
            Health API
          </Link>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-white/5">
          <div className="h-full w-1/2 animate-pulse bg-cyan-200" />
        </div>
      )}

      {error && !data && (
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="absolute right-3 top-3 rounded-full bg-white/10 p-1 text-white/60 hover:text-white"
          aria-label="Dismiss expanded admin panel"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {healthTone !== 'good' && (
        <div className="pointer-events-none absolute bottom-[5.75rem] right-5 flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-100">
          <AlertTriangle className="h-3.5 w-3.5" />
          Watch systems
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        Admin panel health score {healthScore} percent
      </div>
    </aside>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { adminErrorResponse, requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) return adminErrorResponse(admin)

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // ── Users ────────────────────────────────────────────────────────────────
    let userTotal = 0
    let userNewToday = 0
    let userAdmins = 0
    try {
      ;[userTotal, userNewToday, userAdmins] = await Promise.all([
        prisma.users.count(),
        prisma.users.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.users.count({ where: { role: 'admin' } }),
      ])
    } catch {
      // leave as 0
    }

    // ── Agents ───────────────────────────────────────────────────────────────
    let historicalCount = 0
    let createdCount = 0
    let totalConversations = 0
    // Planetary agents are synthetic — fixed set of 10 planets/bodies
    const planetaryCount = 10
    try {
      ;[historicalCount, createdCount] = await Promise.all([
        prisma.historical_agents.count(),
        prisma.created_agents.count(),
      ])
    } catch {
      // leave as 0
    }
    try {
      const convAgg = await prisma.historical_agents.aggregate({
        _sum: { conversations: true },
      })
      totalConversations = convAgg._sum?.conversations ?? 0
    } catch {
      // leave as 0
    }

    // ── System health ────────────────────────────────────────────────────────
    let dbStatus: 'healthy' | 'error' = 'error'
    try {
      await prisma.$queryRaw`SELECT 1`
      dbStatus = 'healthy'
    } catch {
      // leave as error
    }

    let railwayStatus: 'healthy' | 'error' | 'unknown' = 'unknown'
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/health`, {
          signal: AbortSignal.timeout(3000),
        })
        railwayStatus = res.ok ? 'healthy' : 'error'
      } catch {
        railwayStatus = 'error'
      }
    }

    const aiProviders = {
      openai: Boolean(process.env.OPENAI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      google: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      gateway: process.env.AI_GATEWAY_ENABLED === 'true',
    }

    const vercelDeployment = {
      url: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'localhost:3000',
      lastDeploy: process.env.VERCEL_GIT_COMMIT_SHA ? new Date().toISOString() : null,
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    }

    // ── Recent activity ───────────────────────────────────────────────────────
    let recentActivity: { type: string; description: string; timestamp: string }[] = []
    try {
      const interactions = await prisma.consciousness_interactions.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        select: { interactionType: true, agentId: true, timestamp: true },
      })
      recentActivity = interactions.map(i => ({
        type: i.interactionType,
        description: `Interaction with agent ${i.agentId}`,
        timestamp: i.timestamp.toISOString(),
      }))
    } catch {
      // leave as []
    }

    // ── Recent Chats Telemetry ───────────────────────────────────────────────
    let recentChats: {
      id: string
      agentId: string
      agentName: string
      sessionId: string
      userMessage: string
      agentResponse: string
      responseTime: number | null
      modelUsed: string | null
      createdAt: string
    }[] = []
    try {
      const convs = await prisma.agentConversation.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          historical_agents: {
            select: {
              name: true,
            },
          },
        },
      })
      recentChats = convs.map(c => ({
        id: c.id,
        agentId: c.agentId,
        agentName:
          c.historical_agents?.name ||
          c.agentId
            .split('-')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
        sessionId: c.sessionId,
        userMessage: c.userMessage,
        agentResponse: c.agentResponse,
        responseTime: c.responseTime,
        modelUsed: c.modelUsed,
        createdAt: c.createdAt.toISOString(),
      }))
    } catch (err) {
      console.error('Failed to query recent chats for admin dashboard:', err)
    }

    // ── Top agents ────────────────────────────────────────────────────────────
    let topAgents: { id: string; name: string; interactions: number }[] = []
    try {
      const top = await prisma.historical_agents.findMany({
        take: 5,
        orderBy: { conversations: 'desc' },
        select: { agentId: true, name: true, conversations: true },
      })
      topAgents = top.map(a => ({
        id: a.agentId,
        name: a.name,
        interactions: a.conversations,
      }))
    } catch {
      // leave as []
    }

    // ── Recent users list ─────────────────────────────────────────────────────
    let recentUsers: {
      id: string
      email: string
      name: string | null
      role: string
      createdAt: string
    }[] = []
    try {
      const rows = await prisma.users.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      })
      recentUsers = rows.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      }))
    } catch {
      // leave as []
    }

    // ── Jing Arena telemetry ─────────────────────────────────────────────────
    // Each cast writes a row to AgentJingDuel. The personalized
    // recommendation pipeline consumes the same table; here we surface a
    // recent feed + aggregates for the admin console.
    type RecentJingDuel = {
      id: string
      sessionId: string
      userId: string | null
      source: string
      casterId: string
      casterName: string
      targetId: string
      targetName: string
      attackMoveId: string
      counterMoveId: string
      stance: string
      boostElement: string | null
      boostMagnitude: number
      cacheHit: boolean
      latencyMs: number | null
      modelUsed: string | null
      createdAt: string
      synastrySnapshot: unknown
      casterTransitSnapshot: unknown
      targetTransitSnapshot: unknown
      casterPrompt: string | null
      casterResponse: string | null
      targetPrompt: string | null
      targetResponse: string | null
    }
    let recentJingDuels: RecentJingDuel[] = []
    let jingAggregates: {
      total: number
      last24h: number
      last7d: number
      stanceHistogram: Record<string, number>
      boostElementHistogram: Record<string, number>
      topPairs: {
        casterId: string
        targetId: string
        casterName: string
        targetName: string
        count: number
      }[]
      avgLatencyMs: number | null
    } = {
      total: 0,
      last24h: 0,
      last7d: 0,
      stanceHistogram: {},
      boostElementHistogram: {},
      topPairs: [],
      avgLatencyMs: null,
    }

    try {
      const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const [duels, total, last24h, last7d, stanceGroups, boostGroups, pairGroups, latencyAgg] =
        await Promise.all([
          prisma.agentJingDuel.findMany({
            take: 30,
            orderBy: { createdAt: 'desc' },
            include: {
              caster: { select: { name: true } },
              target: { select: { name: true } },
            },
          }),
          prisma.agentJingDuel.count(),
          prisma.agentJingDuel.count({ where: { createdAt: { gte: since24h } } }),
          prisma.agentJingDuel.count({ where: { createdAt: { gte: since7d } } }),
          prisma.agentJingDuel.groupBy({
            by: ['stance'],
            _count: { _all: true },
          }),
          prisma.agentJingDuel.groupBy({
            by: ['boostElement'],
            _count: { _all: true },
          }),
          prisma.agentJingDuel.groupBy({
            by: ['casterId', 'targetId'],
            _count: { _all: true },
            orderBy: { _count: { casterId: 'desc' } },
            take: 5,
          }),
          prisma.agentJingDuel.aggregate({
            _avg: { latencyMs: true },
          }),
        ])

      recentJingDuels = duels.map(d => ({
        id: d.id,
        sessionId: d.sessionId,
        userId: d.userId,
        source: d.source,
        casterId: d.casterId,
        casterName: d.caster?.name || d.casterId,
        targetId: d.targetId,
        targetName: d.target?.name || d.targetId,
        attackMoveId: d.attackMoveId,
        counterMoveId: d.counterMoveId,
        stance: d.stance,
        boostElement: d.boostElement,
        boostMagnitude: d.boostMagnitude,
        cacheHit: d.cacheHit,
        latencyMs: d.latencyMs,
        modelUsed: d.modelUsed,
        createdAt: d.createdAt.toISOString(),
        synastrySnapshot: d.synastrySnapshot,
        casterTransitSnapshot: d.casterTransitSnapshot,
        targetTransitSnapshot: d.targetTransitSnapshot,
        casterPrompt: d.casterPrompt,
        casterResponse: d.casterResponse,
        targetPrompt: d.targetPrompt,
        targetResponse: d.targetResponse,
      }))

      const stanceHistogram: Record<string, number> = {}
      for (const row of stanceGroups) stanceHistogram[row.stance] = row._count._all

      const boostElementHistogram: Record<string, number> = {}
      for (const row of boostGroups) {
        const key = row.boostElement || 'none'
        boostElementHistogram[key] = row._count._all
      }

      // For top pairs we need the agent names too. The groupBy result
      // only has ids — pull names from historical_agents in one shot.
      const pairAgentIds = Array.from(new Set(pairGroups.flatMap(p => [p.casterId, p.targetId])))
      const agentNameRows = await prisma.historical_agents.findMany({
        where: { agentId: { in: pairAgentIds } },
        select: { agentId: true, name: true },
      })
      const nameByAgentId = new Map(agentNameRows.map(a => [a.agentId, a.name]))

      const topPairs = pairGroups.map(p => ({
        casterId: p.casterId,
        targetId: p.targetId,
        casterName: nameByAgentId.get(p.casterId) || p.casterId,
        targetName: nameByAgentId.get(p.targetId) || p.targetId,
        count: p._count._all,
      }))

      jingAggregates = {
        total,
        last24h,
        last7d,
        stanceHistogram,
        boostElementHistogram,
        topPairs,
        avgLatencyMs: latencyAgg._avg.latencyMs ? Math.round(latencyAgg._avg.latencyMs) : null,
      }
    } catch (err) {
      console.error('Failed to query Jing duel telemetry:', err)
    }

    return NextResponse.json({
      users: {
        total: userTotal,
        newToday: userNewToday,
        admins: userAdmins,
        recent: recentUsers,
      },
      agents: {
        historical: historicalCount,
        planetary: planetaryCount,
        created: createdCount,
        totalConversations,
      },
      system: {
        database: dbStatus,
        aiProviders,
        railwayBackend: railwayStatus,
        vercelDeployment,
      },
      recentActivity,
      topAgents,
      recentChats,
      recentJingDuels,
      jingAggregates,
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}

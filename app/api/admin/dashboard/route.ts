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
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}

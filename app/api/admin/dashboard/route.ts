import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

const adminEmails = [
  'admin@planetaryagents.com',
  'support@planetaryagents.com',
  'gregcastro23@gmail.com',
]

function normalizeHandle(value?: string | null) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isGregCastroIdentity(user?: {
  id?: string | null
  email?: string | null
  name?: string | null
}) {
  const email = user?.email?.toLowerCase() || ''

  return email === 'gregcastro23@gmail.com' || normalizeHandle(user?.id) === 'gregcastro23'
}

async function isAdminUser(user?: {
  id?: string | null
  email?: string | null
  name?: string | null
  role?: string | null
}): Promise<boolean> {
  if (!user) return false

  if (
    user.role === 'admin' ||
    adminEmails.includes(user.email || '') ||
    isGregCastroIdentity(user)
  ) {
    return true
  }

  if (!user.id) return false

  try {
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
    })
    return dbUser?.role === 'admin' || adminEmails.includes(dbUser?.email || '')
  } catch {
    return false
  }
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as
      | { id?: string; email?: string | null; name?: string | null; role?: string | null }
      | undefined

    if (!sessionUser?.id && !sessionUser?.email && !sessionUser?.name) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const adminCheck = await isAdminUser(sessionUser)
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

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
      const convAgg = await (prisma.historical_agents as any).aggregate({
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
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}

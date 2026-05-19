import { NextRequest, NextResponse } from 'next/server'
import os from 'node:os'
import { adminErrorResponse, requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { performanceMonitor } from '@/lib/performance-monitor'

type AdminActionBody = {
  action?: 'clear_cache' | 'send_system_notification' | 'export_data'
  data?: {
    message?: string
    type?: string
    format?: string
    tables?: string[]
  }
}

function getTimeRangeHours(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const raw = Number(searchParams.get('timeRange') || 24)

  if (!Number.isFinite(raw) || raw <= 0) return 24
  return Math.min(raw, 24 * 30)
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) return adminErrorResponse(admin)

    const timeRange = getTimeRangeHours(req)
    const now = new Date()
    const timeRangeStart = new Date(now.getTime() - timeRange * 60 * 60 * 1000)
    const systemHealth = performanceMonitor.getSystemHealth()

    const [
      totalUsers,
      activeUserRows,
      totalInteractions,
      recentInteractions,
      totalAgentEvolutions,
      recentEvolutions,
      errorLogs,
      popularAgents,
      tierDistribution,
      evolutionLevels,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.consciousness_interactions.findMany({
        where: {
          timestamp: { gte: timeRangeStart },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.consciousness_interactions.count(),
      prisma.consciousness_interactions.count({
        where: { timestamp: { gte: timeRangeStart } },
      }),
      prisma.agent_evolution_states.count(),
      prisma.agent_evolution_states.count({
        where: { lastInteraction: { gte: timeRangeStart } },
      }),
      prisma.monica_interactions.findMany({
        where: {
          createdAt: { gte: timeRangeStart },
          monicaResponse: { contains: 'error', mode: 'insensitive' },
        },
        select: {
          id: true,
          createdAt: true,
          pageUrl: true,
          monicaResponse: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.consciousness_interactions.groupBy({
        by: ['agentId'],
        where: { timestamp: { gte: timeRangeStart } },
        _count: { agentId: true },
        orderBy: { _count: { agentId: 'desc' } },
        take: 10,
      }),
      prisma.userSubscription.groupBy({
        by: ['tier'],
        _count: { tier: true },
      }),
      prisma.agent_evolution_states.groupBy({
        by: ['currentLevel'],
        _count: { currentLevel: true },
      }),
    ])

    const memoryUsage = process.memoryUsage()
    const systemMetrics = {
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      loadAverage: process.platform === 'linux' ? os.loadavg() : [0, 0, 0],
    }

    return NextResponse.json({
      success: true,
      systemStats: {
        overview: {
          totalUsers,
          activeUsers: activeUserRows.length,
          totalInteractions,
          recentInteractions,
          totalAgentEvolutions,
          recentEvolutions,
          timeRange: `${timeRange} hours`,
        },
        performance: {
          systemHealth,
          slowEndpoints: performanceMonitor.getSlowEndpoints(5),
          systemMetrics,
        },
        users: {
          tierDistribution: tierDistribution.map(tier => ({
            tier: tier.tier,
            count: tier._count.tier,
          })),
          growthRate:
            totalUsers > 0 ? `${((activeUserRows.length / totalUsers) * 100).toFixed(1)}%` : '0%',
        },
        agents: {
          popularAgents: popularAgents.map(agent => ({
            agentId: agent.agentId,
            interactionCount: agent._count.agentId,
          })),
          evolutionLevels: evolutionLevels.map(level => ({
            level: level.currentLevel,
            count: level._count.currentLevel,
          })),
        },
        errors: {
          recentErrorLogs: errorLogs.map(error => ({
            id: error.id,
            timestamp: error.createdAt.toISOString(),
            source: error.pageUrl,
            message: (error.monicaResponse || '').slice(0, 200),
          })),
          errorRate: systemHealth.errorRate,
        },
        timestamp: now.toISOString(),
      },
    })
  } catch (error) {
    console.error('Admin system stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get system statistics',
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) return adminErrorResponse(admin)

    const { action, data } = (await req.json().catch(() => ({}))) as AdminActionBody

    switch (action) {
      case 'clear_cache':
        performanceMonitor.clearMetrics()
        return NextResponse.json({
          success: true,
          message: 'Performance cache cleared',
        })

      case 'send_system_notification': {
        if (!data?.message) {
          return NextResponse.json(
            {
              success: false,
              error: 'Notification message is required',
            },
            { status: 400 }
          )
        }

        const users = await prisma.users.findMany({
          take: 10,
          select: { id: true, email: true },
        })

        for (const user of users) {
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: data.type || 'system_announcement',
              userId: user.id,
              metadata: {
                message: data.message,
                adminSent: true,
                adminEmail: admin.user.email,
              },
            }),
          })
        }

        return NextResponse.json({
          success: true,
          message: `System notification queued for ${users.length} users`,
        })
      }

      case 'export_data': {
        const tables = data?.tables || []
        const exportData: Record<string, unknown> = {}

        if (tables.includes('users')) {
          exportData.users = await prisma.users.findMany({
            take: 1000,
            select: {
              email: true,
              name: true,
              createdAt: true,
              verified: true,
              provider: true,
              role: true,
            },
          })
        }

        if (tables.includes('interactions')) {
          exportData.interactions = await prisma.consciousness_interactions.findMany({
            take: 1000,
            orderBy: { timestamp: 'desc' },
          })
        }

        if (tables.includes('evolutions')) {
          exportData.evolutions = await prisma.agent_evolution_states.findMany({
            take: 1000,
          })
        }

        return NextResponse.json({
          success: true,
          exportData,
          timestamp: new Date().toISOString(),
          format: data?.format || 'json',
        })
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid admin action',
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin action error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute admin action',
      },
      { status: 500 }
    )
  }
}

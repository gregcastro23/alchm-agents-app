import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Comprehensive health check endpoint for Docker monitoring
 * Returns detailed health status of all system components
 */
export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'planetary-agents-frontend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: { status: 'unknown', latency: 0, error: null },
      backend: { status: 'unknown', latency: 0, error: null },
      redis: { status: 'unknown', error: null },
      memory: { usage: 0, percentage: 0 },
      uptime: process.uptime(),
    },
  }

  let overallStatus = 'healthy'

  // Database health check
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start

    healthCheck.checks.database = {
      status: 'healthy',
      latency,
      error: null,
    }
  } catch (error) {
    overallStatus = 'unhealthy'
    healthCheck.checks.database = {
      status: 'unhealthy',
      latency: 0,
      error: error instanceof Error ? error.message : 'Database connection failed',
    }
  }

  // Backend service health check
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const start = Date.now()

    const response = await fetch(`${backendUrl}/api/health`, {
      method: 'GET',
      headers: { 'User-Agent': 'Frontend-HealthCheck/1.0' },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    const latency = Date.now() - start

    if (response.ok) {
      healthCheck.checks.backend = {
        status: 'healthy',
        latency,
        error: null,
      }
    } else {
      healthCheck.checks.backend = {
        status: 'degraded',
        latency,
        error: `Backend returned status ${response.status}`,
      }
    }
  } catch (error) {
    healthCheck.checks.backend = {
      status: 'unhealthy',
      latency: 0,
      error: error instanceof Error ? error.message : 'Backend connection failed',
    }
  }

  // Memory usage check
  const memUsage = process.memoryUsage()
  const totalMemory = memUsage.heapTotal + memUsage.external + memUsage.arrayBuffers
  const memoryPercentage = Math.round((totalMemory / (512 * 1024 * 1024)) * 100) // Assuming 512MB limit

  healthCheck.checks.memory = {
    usage: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: memoryPercentage,
  }

  // High memory usage warning
  if (memoryPercentage > 90) {
    overallStatus = 'degraded'
  }

  // Update overall status
  healthCheck.status = overallStatus

  // Return appropriate HTTP status code
  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(healthCheck, { status: statusCode })
}

/**
 * HEAD request for simple liveness probe
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react'
import { logger, LogLevel } from '@/lib/structured-logger'

interface PerformanceMetrics {
  averageResponseTime: number
  errorRate: number
  requestCount: number
  topEndpoints: Record<string, number>
  memoryUsage?: number
  uptime?: number
}

interface PerformanceData {
  timestamp: string
  metrics: PerformanceMetrics
  systemHealth: 'healthy' | 'warning' | 'critical'
}

export function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      const metrics = logger.getPerformanceMetrics(1) // Last hour

      // Calculate system health
      let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (metrics.errorRate > 0.1) systemHealth = 'critical'
      else if (metrics.errorRate > 0.05 || metrics.averageResponseTime > 2000) systemHealth = 'warning'

      setPerformanceData({
        timestamp: new Date().toISOString(),
        metrics,
        systemHealth
      })
    } catch (error) {
      console.error('Failed to fetch performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformanceData()

    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (loading && !performanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading performance metrics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!performanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Unable to load performance metrics
          </div>
        </CardContent>
      </Card>
    )
  }

  const { metrics, systemHealth } = performanceData

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Dashboard
            <Badge
              variant="secondary"
              className={`${getHealthColor(systemHealth)} text-white flex items-center gap-1`}
            >
              {getHealthIcon(systemHealth)}
              {systemHealth.toUpperCase()}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPerformanceData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="logs">Recent Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                      <p className="text-2xl font-bold">{metrics.averageResponseTime.toFixed(0)}ms</p>
                    </div>
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="mt-2">
                    <Progress
                      value={Math.min((metrics.averageResponseTime / 2000) * 100, 100)}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: &lt;2000ms
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                      <p className="text-2xl font-bold">{(metrics.errorRate * 100).toFixed(2)}%</p>
                    </div>
                    {metrics.errorRate > 0.05 ? (
                      <TrendingUp className="h-8 w-8 text-red-500" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-green-500" />
                    )}
                  </div>
                  <div className="mt-2">
                    <Progress
                      value={metrics.errorRate * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: &lt;5%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                      <p className="text-2xl font-bold">{metrics.requestCount}</p>
                    </div>
                    <Zap className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      Last hour
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.topEndpoints)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([endpoint, count]) => (
                      <div key={endpoint} className="flex items-center justify-between">
                        <span className="text-sm font-mono">{endpoint}</span>
                        <Badge variant="secondary">{count} requests</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Error Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {logger.getLogsByLevel(LogLevel.ERROR, 10).map((log, index) => (
                    <div key={index} className="text-xs p-2 bg-red-50 dark:bg-red-950 rounded">
                      <div className="font-mono">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      <div className="text-red-700 dark:text-red-300">{log.message}</div>
                      {log.context.operation && (
                        <div className="text-muted-foreground">Operation: {log.context.operation}</div>
                      )}
                    </div>
                  ))}
                  {logger.getLogsByLevel(LogLevel.ERROR, 10).length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No recent errors
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

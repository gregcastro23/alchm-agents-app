'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Activity, AlertTriangle, CheckCircle, Clock, Coffee,
  Download, FileText, Filter, Play, Pause, RefreshCw,
  Settings, TrendingUp, TrendingDown, Users, Zap,
  BarChart3, PieChart, Timer, AlertCircle, XCircle,
  ArrowUp, ArrowDown, Minus, ChevronRight, ChevronDown
} from 'lucide-react'

interface BatchJob {
  id: string
  type: 'kinetics_export' | 'agent_analysis' | 'consciousness_sync' | 'custom'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  estimatedDuration: number
  actualDuration?: number
  retryCount: number
  maxRetries: number
  error?: string
}

interface QueueMetrics {
  totalJobs: number
  queuedJobs: number
  processingJobs: number
  completedJobs: number
  failedJobs: number
  averageProcessingTime: number
  throughputPerHour: number
  resourceUtilization: {
    cpu: number
    memory: number
    activeWorkers: number
    maxWorkers: number
  }
  queueHealth: 'healthy' | 'degraded' | 'critical'
}

interface PerformanceAlert {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  timestamp: Date
  title: string
  description: string
  metric: string
  currentValue: number
  thresholdValue: number
  acknowledged: boolean
}

interface BottleneckAnalysis {
  type: 'cpu' | 'memory' | 'io' | 'network' | 'queue' | 'dependency'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact: string
  suggestedAction: string
}

export default function BatchProcessingDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'performance' | 'alerts'>('overview')
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null)
  const [jobs, setJobs] = useState<BatchJob[]>([])
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [bottlenecks, setBottlenecks] = useState<BottleneckAnalysis[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())

  // Mock data for demonstration
  const initializeMockData = useCallback(() => {
    const mockMetrics: QueueMetrics = {
      totalJobs: 156,
      queuedJobs: 12,
      processingJobs: 3,
      completedJobs: 135,
      failedJobs: 6,
      averageProcessingTime: 4200,
      throughputPerHour: 24,
      resourceUtilization: {
        cpu: 45 + Math.random() * 30,
        memory: 62 + Math.random() * 20,
        activeWorkers: 3,
        maxWorkers: 5
      },
      queueHealth: 'healthy'
    }

    const mockJobs: BatchJob[] = [
      {
        id: 'job_1731234567890_abc123',
        type: 'kinetics_export',
        priority: 'high',
        status: 'processing',
        progress: 75,
        createdAt: new Date(Date.now() - 300000),
        startedAt: new Date(Date.now() - 180000),
        estimatedDuration: 240000,
        retryCount: 0,
        maxRetries: 3
      },
      {
        id: 'job_1731234567891_def456',
        type: 'agent_analysis',
        priority: 'medium',
        status: 'queued',
        progress: 0,
        createdAt: new Date(Date.now() - 150000),
        estimatedDuration: 180000,
        retryCount: 0,
        maxRetries: 3
      },
      {
        id: 'job_1731234567892_ghi789',
        type: 'consciousness_sync',
        priority: 'low',
        status: 'completed',
        progress: 100,
        createdAt: new Date(Date.now() - 600000),
        startedAt: new Date(Date.now() - 480000),
        completedAt: new Date(Date.now() - 60000),
        estimatedDuration: 360000,
        actualDuration: 420000,
        retryCount: 0,
        maxRetries: 3
      }
    ]

    const mockAlerts: PerformanceAlert[] = [
      {
        id: 'alert_cpu_high',
        level: 'warning',
        timestamp: new Date(Date.now() - 120000),
        title: 'High CPU Usage',
        description: 'CPU usage is 78.5%',
        metric: 'cpu_usage',
        currentValue: 78.5,
        thresholdValue: 70,
        acknowledged: false
      }
    ]

    const mockBottlenecks: BottleneckAnalysis[] = [
      {
        type: 'memory',
        severity: 'medium',
        description: 'Memory usage approaching 80%',
        impact: 'Potential slowdown in job processing',
        suggestedAction: 'Consider increasing available memory or optimizing memory usage'
      }
    ]

    setMetrics(mockMetrics)
    setJobs(mockJobs)
    setAlerts(mockAlerts)
    setBottlenecks(mockBottlenecks)
  }, [])

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))

    initializeMockData()
    setIsRefreshing(false)
  }, [initializeMockData])

  useEffect(() => {
    initializeMockData()
  }, [initializeMockData])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(refreshData, 30000) // 30 seconds
    return () => clearInterval(interval)
  }, [autoRefresh, refreshData])

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedJobs(newExpanded)
  }

  const getStatusIcon = (status: BatchJob['status']) => {
    switch (status) {
      case 'queued': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'processing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: BatchJob['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-gray-600 bg-gray-50'
    }
  }

  const getAlertIcon = (level: PerformanceAlert['level']) => {
    switch (level) {
      case 'info': return <AlertCircle className="w-4 h-4 text-blue-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-600" />
                Batch Processing Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Real-time monitoring and management of batch operations</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Auto-refresh
              </label>
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'jobs', label: 'Job Queue', icon: FileText },
                { id: 'performance', label: 'Performance', icon: TrendingUp },
                { id: 'alerts', label: 'Alerts', icon: AlertTriangle }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'alerts' && alerts.filter(a => !a.acknowledged).length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {alerts.filter(a => !a.acknowledged).length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.totalJobs}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Queue</p>
                    <p className="text-2xl font-bold text-yellow-600">{metrics.queuedJobs}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Processing</p>
                    <p className="text-2xl font-bold text-blue-600">{metrics.processingJobs}</p>
                  </div>
                  <RefreshCw className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Throughput/hr</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.throughputPerHour}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Resources</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>{metrics.resourceUtilization.cpu.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          metrics.resourceUtilization.cpu > 80 ? 'bg-red-500' :
                          metrics.resourceUtilization.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${metrics.resourceUtilization.cpu}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{metrics.resourceUtilization.memory.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          metrics.resourceUtilization.memory > 80 ? 'bg-red-500' :
                          metrics.resourceUtilization.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${metrics.resourceUtilization.memory}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Active Workers</span>
                      <span>{metrics.resourceUtilization.activeWorkers}/{metrics.resourceUtilization.maxWorkers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${(metrics.resourceUtilization.activeWorkers / metrics.resourceUtilization.maxWorkers) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Health</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${
                    metrics.queueHealth === 'healthy' ? 'bg-green-500' :
                    metrics.queueHealth === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-lg font-medium capitalize">{metrics.queueHealth}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-green-600">{metrics.completedJobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Failed</span>
                    <span className="text-sm font-medium text-red-600">{metrics.failedJobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg. Processing Time</span>
                    <span className="text-sm font-medium">{formatDuration(metrics.averageProcessingTime)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottlenecks */}
            {bottlenecks.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Bottlenecks</h3>
                <div className="space-y-3">
                  {bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-yellow-900">{bottleneck.description}</h4>
                          <p className="text-sm text-yellow-700 mt-1">{bottleneck.impact}</p>
                          <p className="text-sm text-yellow-600 mt-2 font-medium">
                            Suggested: {bottleneck.suggestedAction}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Job Queue</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <div key={job.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => toggleJobExpansion(job.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedJobs.has(job.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      {getStatusIcon(job.status)}

                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{job.id}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(job.priority)}`}>
                            {job.priority}
                          </span>
                          <span className="text-sm text-gray-500">{job.type}</span>
                        </div>

                        {job.status === 'processing' && (
                          <div className="mt-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{job.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Created {new Date(job.createdAt).toLocaleTimeString()}
                      </p>
                      {job.completedAt && (
                        <p className="text-sm text-gray-600">
                          Completed {new Date(job.completedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {expandedJobs.has(job.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Estimated Duration:</span>
                          <p className="font-medium">{formatDuration(job.estimatedDuration)}</p>
                        </div>
                        {job.actualDuration && (
                          <div>
                            <span className="text-gray-600">Actual Duration:</span>
                            <p className="font-medium">{formatDuration(job.actualDuration)}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Retries:</span>
                          <p className="font-medium">{job.retryCount}/{job.maxRetries}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <p className="font-medium capitalize">{job.status}</p>
                        </div>
                      </div>

                      {job.error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-700 font-medium">Error:</p>
                          <p className="text-sm text-red-600">{job.error}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {metrics?.averageProcessingTime ? formatDuration(metrics.averageProcessingTime) : '0s'}
                  </div>
                  <div className="text-sm text-gray-600">Avg. Processing Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{metrics?.throughputPerHour || 0}</div>
                  <div className="text-sm text-gray-600">Jobs/Hour</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {metrics ? ((metrics.failedJobs / Math.max(1, metrics.totalJobs)) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Failure Rate</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Trends</h3>
              <p className="text-gray-600">
                Historical performance charts would be displayed here in a production environment,
                showing CPU usage, memory consumption, and throughput trends over time.
              </p>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Performance Alerts</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>No active alerts</p>
                  <p className="text-sm">All systems are operating normally</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="p-6">
                    <div className="flex items-start gap-4">
                      {getAlertIcon(alert.level)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{alert.description}</p>
                        <div className="mt-2 text-sm text-gray-500">
                          Current: {alert.currentValue} | Threshold: {alert.thresholdValue}
                        </div>
                        {!alert.acknowledged && (
                          <button className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
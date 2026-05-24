export type AdminHealthValue = 'healthy' | 'error' | 'unknown'

export type AdminUserSummary = {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
}

export type AdminActivityItem = {
  type: string
  description: string
  timestamp: string
}

export type AdminTopAgent = {
  id: string
  name: string
  interactions: number
}

export type AdminRecentChat = {
  id: string
  agentId: string
  agentName: string
  sessionId: string
  userMessage: string
  agentResponse: string
  responseTime: number | null
  modelUsed: string | null
  createdAt: string
}

export type AdminDashboardData = {
  users: {
    total: number
    newToday: number
    admins: number
    recent: AdminUserSummary[]
  }
  agents: {
    historical: number
    planetary: number
    created: number
    totalConversations: number
  }
  system: {
    database: 'healthy' | 'error'
    aiProviders: {
      openai: boolean
      anthropic: boolean
      google: boolean
      gateway: boolean
    }
    railwayBackend: AdminHealthValue
    vercelDeployment: {
      url: string
      lastDeploy: string | null
      commitSha?: string | null
    }
  }
  recentActivity: AdminActivityItem[]
  topAgents: AdminTopAgent[]
  recentChats: AdminRecentChat[]
}

export type AdminSystemStats = {
  overview: {
    totalUsers: number
    activeUsers: number
    totalInteractions: number
    recentInteractions: number
    totalAgentEvolutions: number
    recentEvolutions: number
    timeRange: string
  }
  performance: {
    systemHealth: unknown
    slowEndpoints: unknown[]
    systemMetrics: {
      memoryUsage: {
        heapUsed: number
        heapTotal: number
        external: number
        rss: number
      }
      uptime: number
      nodeVersion: string
      platform: string
      loadAverage: number[]
    }
  }
  users: {
    tierDistribution: Array<{ tier: string; count: number }>
    growthRate: string
  }
  agents: {
    popularAgents: Array<{ agentId: string; interactionCount: number }>
    evolutionLevels: Array<{ level: string; count: number }>
  }
  errors: {
    recentErrorLogs: Array<{
      id: string
      timestamp: string
      source: string
      message: string
    }>
    errorRate: number
  }
  timestamp: string
}

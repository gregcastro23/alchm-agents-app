import { getServerSession } from 'next-auth'

/**
 * Check if user has access to a feature
 * For testing purposes, all authenticated users have full access
 */
export async function hasFeatureAccess(feature: string): Promise<boolean> {
  const session = await getServerSession()

  // All authenticated users have full access during testing
  if (session?.user) {
    return true
  }

  // Guest users have limited access
  const guestAllowedFeatures = [
    'basic_chat',
    'view_agents',
    'view_charts'
  ]

  return guestAllowedFeatures.includes(feature)
}

/**
 * Get user tier with full access for authenticated users
 */
export async function getUserTier(): Promise<'master' | 'alchemist' | 'free'> {
  const session = await getServerSession()

  // All authenticated users get master tier for testing
  if (session?.user) {
    return 'master'
  }

  return 'free'
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession()
  return !!session?.user
}

/**
 * Get feature limits based on tier
 * For testing, authenticated users have unlimited access
 */
export function getFeatureLimits(tier: string) {
  if (tier === 'master') {
    return {
      agents: Infinity,
      chatsPerDay: Infinity,
      customAgents: true,
      apiAccess: true,
      groupConsciousness: true,
      advancedAnalytics: true,
      prioritySupport: true,
      exportData: true,
      allFeatures: true
    }
  }

  if (tier === 'alchemist') {
    return {
      agents: 40,
      chatsPerDay: Infinity,
      customAgents: false,
      apiAccess: false,
      groupConsciousness: true,
      advancedAnalytics: true,
      prioritySupport: false,
      exportData: true,
      allFeatures: false
    }
  }

  // Free tier
  return {
    agents: 3,
    chatsPerDay: 3,
    customAgents: false,
    apiAccess: false,
    groupConsciousness: false,
    advancedAnalytics: false,
    prioritySupport: false,
    exportData: false,
    allFeatures: false
  }
}
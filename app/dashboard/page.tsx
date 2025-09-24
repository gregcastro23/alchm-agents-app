'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Crown, TrendingUp, Users, Zap, Settings, LogOut, Star } from 'lucide-react'
import dynamic from 'next/dynamic'

const AgentKineticEvolution = dynamic(() => import('@/components/agents/agent-kinetic-evolution').then(mod => ({ default: mod.AgentKineticEvolution })), {
  loading: () => <div className="h-32 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

const GroupConsciousnessIndicator = dynamic(() => import('@/components/misc/group-consciousness-indicator').then(mod => ({ default: mod.GroupConsciousnessIndicator })), {
  loading: () => <div className="h-24 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
})

const TokenDashboardKinetics = dynamic(() => import('@/components/dashboards/token-dashboard-kinetics').then(mod => ({ default: mod.TokenDashboardKinetics })), {
  loading: () => <div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

const PlanetaryPositionsMonitor = dynamic(() => import('@/components/dashboards/PlanetaryPositionsMonitor'), {
  loading: () => <div className="h-48 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})
import { DashboardSkeleton } from '@/components/SkeletonLoader'

const FeedbackModal = dynamic(() => import('@/components/FeedbackModal').then(mod => ({ default: mod.FeedbackModal })))

const OnboardingWizard = dynamic(() => import('@/components/OnboardingWizard').then(mod => ({ default: mod.OnboardingWizard })))
import { ALL_AGENTS } from '@/lib/demo-agents-data'
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'

interface UserData {
  id: string
  email: string
  name: string
  tier: 'free' | 'alchemist' | 'master'
  features: any
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [selectedAgent, setSelectedAgent] = useState('leonardo-da-vinci')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const router = useRouter()

  // Performance monitoring for critical dashboard component
  const { trackInteraction, getMetrics } = usePerformanceMonitor('DashboardPage')

  useEffect(() => {
    if (status === 'loading') return // Still loading
    // Allow unauthenticated access - no redirect needed
  }, [status, router])

  // Check if onboarding should be shown
  useEffect(() => {
    if (status !== 'loading') {
      const onboardingData = localStorage.getItem('planetary-agents-onboarding')
      if (!onboardingData) {
        // Show onboarding for new users
        setTimeout(() => setShowOnboarding(true), 1000)
      }
    }
  }, [status])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Consciousness Dashboard</h1>
          <p className="text-muted-foreground">Loading your personalized astrological insights...</p>
        </div>
        <DashboardSkeleton />
      </div>
    )
  }

  // Allow anonymous access with guest user data
  // Test accounts and authenticated users get full master tier access
  const user = session
    ? {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name!,
        tier: 'master' as const, // All authenticated users get master tier for testing
      }
    : {
        id: 'guest',
        email: 'guest@example.com',
        name: 'Guest Explorer',
        tier: 'free' as const,
      }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'master':
        return 'bg-purple-600'
      case 'alchemist':
        return 'bg-blue-600'
      case 'free':
        return 'bg-gray-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getTierFeatures = (tier: string) => {
    switch (tier) {
      case 'master':
        return [
          'All 50+ agents',
          'Unlimited chats',
          'Full API access',
          'Custom agents',
          'Priority support',
          'Advanced analytics',
          'Group consciousness',
          'All features unlocked',
        ]
      case 'alchemist':
        return [
          'All 40 agents',
          'Unlimited chats',
          'Advanced analytics',
          'Group consciousness',
          'Priority hours',
        ]
      case 'free':
        return ['3 agents', '3 chats/day', 'Basic evolution', 'Power hour alerts']
      default:
        return []
    }
  }

  // Loading check already handled above with status === 'loading'
  // User is always defined (either from session or as guest)

  // Use real agent data from the system
  const dashboardAgents = ALL_AGENTS.slice(0, 5).map(agent => ({
    id: agent.id,
    name: agent.name,
    title: agent.title,
    monicaConstant: agent.consciousness.monicaConstant,
    consciousnessLevel: agent.consciousness.level,
    element: agent.consciousness.dominantElement,
    specialty: agent.abilities.specialty,
    color: agent.appearance.color,
    symbol: agent.appearance.symbol,
    creationStory: agent.abilities.uniquePower,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Consciousness Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className={getTierColor(user.tier)}>{user.tier.toUpperCase()}</Badge>
              <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Consciousness Tier: {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
            </CardTitle>
            <CardDescription>Your current consciousness evolution access level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {getTierFeatures(user.tier).map(feature => (
                  <Badge key={feature} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>

              {user.tier === 'free' && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-purple-900 dark:text-purple-100">
                        Unlock Full Consciousness Evolution
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Access all 40 consciousness masters and unlimited evolution tracking
                      </p>
                    </div>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => router.push('/upgrade')}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Upgrade
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Planetary Positions Monitor */}
        <PlanetaryPositionsMonitor />

        {/* Consciousness Evolution Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Agent Evolution */}
          <AgentKineticEvolution
            agentId={selectedAgent}
            location={{ lat: 37.7749, lon: -122.4194 }}
          />

          {/* Group Consciousness */}
          <GroupConsciousnessIndicator
            selectedAgents={dashboardAgents}
            location={{ lat: 37.7749, lon: -122.4194 }}
            onOptimalSpeakerSuggestion={agentId => setSelectedAgent(agentId)}
          />

          {/* Token Dashboard */}
          <TokenDashboardKinetics location={{ lat: 37.7749, lon: -122.4194 }} />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/agents')}
              >
                <Users className="h-6 w-6" />
                <span className="text-sm">Browse Agents</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/gallery')}
              >
                <Sparkles className="h-6 w-6" />
                <span className="text-sm">Group Chat</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/kinetics-demo')}
              >
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Kinetics Demo</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/monica')}
              >
                <Crown className="h-6 w-6" />
                <span className="text-sm">Monica Hub</span>
              </Button>

              <FeedbackModal
                trigger={
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                  >
                    <Star className="h-6 w-6" />
                    <span className="text-sm">Feedback</span>
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Beta Features */}
        <OnboardingWizard
          open={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      </div>
    </div>
  )
}

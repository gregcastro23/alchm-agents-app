'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, 
  Crown, 
  TrendingUp, 
  Users, 
  Zap, 
  Settings,
  LogOut,
  Star
} from 'lucide-react'
import { AgentKineticEvolution } from '@/components/agent-kinetic-evolution'
import { GroupConsciousnessIndicator } from '@/components/group-consciousness-indicator'
import { TokenDashboardKinetics } from '@/components/token-dashboard-kinetics'

interface UserData {
  id: string
  email: string
  name: string
  tier: 'free' | 'alchemist' | 'master'
  features: any
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState('leonardo-da-vinci')
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('consciousness_token')
    const userData = localStorage.getItem('user_data')
    
    if (!token || !userData) {
      router.push('/auth/signin')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/auth/signin')
      return
    }

    setLoading(false)
  }, [router])

  const handleSignOut = () => {
    localStorage.removeItem('consciousness_token')
    localStorage.removeItem('user_data')
    router.push('/')
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'master': return 'bg-purple-600'
      case 'alchemist': return 'bg-blue-600'
      case 'free': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const getTierFeatures = (tier: string) => {
    switch (tier) {
      case 'master':
        return ['All 40 agents', 'Unlimited chats', 'API access', 'Custom agents', 'Priority support']
      case 'alchemist':
        return ['All 40 agents', 'Unlimited chats', 'Advanced analytics', 'Group consciousness', 'Priority hours']
      case 'free':
        return ['3 agents', '3 chats/day', 'Basic evolution', 'Power hour alerts']
      default:
        return []
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading consciousness dashboard...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to signin
  }

  const mockAgents = [
    {
      id: 'leonardo-da-vinci',
      name: 'Leonardo da Vinci',
      title: 'Renaissance Master',
      monicaConstant: 4.2,
      consciousnessLevel: 'Advanced',
      element: 'Air',
      specialty: 'Innovation & Art',
      color: '#3b82f6',
      symbol: '🎨',
      creationStory: 'Master of multi-dimensional synthesis'
    },
    {
      id: 'shakespeare',
      name: 'William Shakespeare',
      title: 'Consciousness Poet',
      monicaConstant: 3.8,
      consciousnessLevel: 'Advanced',
      element: 'Water',
      specialty: 'Emotional Truth',
      color: '#8b5cf6',
      symbol: '📜',
      creationStory: 'Master of archetypal character creation'
    }
  ]

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
              <Badge className={getTierColor(user.tier)}>
                {user.tier.toUpperCase()}
              </Badge>
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
            <CardDescription>
              Your current consciousness evolution access level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {getTierFeatures(user.tier).map((feature) => (
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

        {/* Consciousness Evolution Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Agent Evolution */}
          <AgentKineticEvolution
            agentId={selectedAgent}
            location={{ lat: 37.7749, lon: -122.4194 }}
          />

          {/* Group Consciousness */}
          <GroupConsciousnessIndicator
            selectedAgents={mockAgents}
            location={{ lat: 37.7749, lon: -122.4194 }}
            onOptimalSpeakerSuggestion={(agentId) => setSelectedAgent(agentId)}
          />

          {/* Token Dashboard */}
          <TokenDashboardKinetics
            location={{ lat: 37.7749, lon: -122.4194 }}
          />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

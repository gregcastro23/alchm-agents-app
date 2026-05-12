import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { DashboardClient } from './DashboardClient'
import { backend } from '@/lib/backend'

export default async function DashboardPage() {
  const session = await getServerSession()

  // Use real agent data from the system
  let dashboardAgents: Array<{
    id: string
    name: string
    title: string
    monicaConstant: number
    consciousnessLevel: string
    element: string
    specialty: string
    color: string
    symbol: string
    creationStory: string
  }> = []
  try {
    const agents = await backend.agents.list({ limit: 5 })
    dashboardAgents = agents.map(agent => ({
      id: agent.agentId || agent.id,
      name: agent.name,
      title: agent.title,
      monicaConstant: agent.consciousness?.monicaConstant || agent.kalchmConstant || 0,
      consciousnessLevel: agent.consciousness?.level || 'Awakening',
      element: agent.consciousness?.dominantElement || 'Fire',
      specialty: agent.abilities?.specialty || 'General',
      color: agent.appearance?.color || '#6366f1',
      symbol: agent.appearance?.symbol || agent.name?.charAt(0)?.toUpperCase() || '✨',
      creationStory: agent.abilities?.uniquePower || 'Awakened through cosmic synchronization.',
    }))
  } catch (err) {
    console.error('Failed to fetch dashboard agents from backend:', err)
  }

  const user = session?.user
    ? {
        id: (session.user as any).id,
        email: session.user.email!,
        name: session.user.name || 'Explorer',
        tier: 'master' as const, // All authenticated users get master tier for testing
      }
    : {
        id: 'guest',
        email: 'guest@example.com',
        name: 'Guest Explorer',
        tier: 'free' as const,
      }

  return <DashboardClient user={user} dashboardAgents={dashboardAgents} />
}

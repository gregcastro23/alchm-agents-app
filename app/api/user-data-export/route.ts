import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

/**
 * User Data Export API - GDPR Compliance
 * Allows users to export all their personal data
 */

interface UserDataExport {
  user: {
    id: string
    email: string
    name: string | null
    createdAt: Date
    lastLogin: Date | null
    verified: boolean
    provider: string | null
  }
  profile: {
    birthInfo: any
    createdAt: Date
    updatedAt: Date
  } | null
  subscription: {
    tier: string
    status: string
    features: any
    createdAt: Date
    expiresAt: Date | null
  } | null
  settings: {
    preferences: any
    createdAt: Date
    updatedAt: Date
  } | null
  interactions: Array<{
    agentId: string
    interactionType: string
    powerGained: number
    planetaryInfluence: string
    elementalResonance: number
    createdAt: Date
    metadata: any
  }>
  agentEvolutions: Array<{
    agentId: string
    currentLevel: string
    totalPower: number
    interactionCount: number
    lastInteraction: Date
    specialAbilitiesUnlocked: any
    evolutionHistory: any
    affinityScores: any
  }>
  monicaInteractions: Array<{
    interactionType: string
    pageUrl: string
    sessionId: string
    userAction: string
    monicaResponse: string
    createdAt: Date
    contextData: any
  }>
  notifications: Array<{
    type: string
    subject: string
    content: string
    sentAt: Date
  }>
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'json'
    const includeMetadata = searchParams.get('includeMetadata') === 'true'

    // Gather all user data
    const [
      user,
      profile,
      subscription,
      settings,
      interactions,
      agentEvolutions,
      monicaInteractions
    ] = await Promise.all([
      // User basic data
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          lastLogin: true,
          verified: true,
          provider: true
        }
      }),

      // User profile with birth chart
      prisma.profile.findUnique({
        where: { userId },
        select: {
          birthInfo: true,
          createdAt: true,
          updatedAt: true
        }
      }),

      // Subscription data
      prisma.subscription.findUnique({
        where: { userId },
        select: {
          tier: true,
          status: true,
          features: true,
          createdAt: true,
          expiresAt: true
        }
      }),

      // User settings
      prisma.monicaUserSettings.findUnique({
        where: { userId },
        select: {
          personality: true,
          assistanceLevel: true,
          proactiveTips: true,
          explanationDepth: true,
          position: true,
          autoHide: true,
          preferredTime: true,
          learningStyle: true,
          interests: true,
          contextualAwareness: true,
          adaptivePersonality: true,
          memoryRetention: true,
          createdAt: true,
          updatedAt: true
        }
      }),

      // Consciousness interactions
      prisma.consciousnessInteraction.findMany({
        where: { userId },
        select: {
          agentId: true,
          interactionType: true,
          powerGained: true,
          planetaryInfluence: true,
          elementalResonance: true,
          createdAt: true,
          ...(includeMetadata && {
            planetaryContext: true,
            sessionMetadata: true
          })
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Agent evolution states
      prisma.agentEvolutionState.findMany({
        where: { userId },
        select: {
          agentId: true,
          currentLevel: true,
          totalPower: true,
          interactionCount: true,
          lastInteraction: true,
          specialAbilitiesUnlocked: true,
          evolutionHistory: true,
          affinityScores: true
        }
      }),

      // Monica interactions (limited to last 100 for privacy)
      prisma.monicaInteraction.findMany({
        where: { userId },
        select: {
          interactionType: true,
          pageUrl: true,
          sessionId: true,
          userAction: true,
          monicaResponse: includeMetadata,
          createdAt: true,
          ...(includeMetadata && {
            contextData: true
          })
        },
        take: 100,
        orderBy: { createdAt: 'desc' }
      })
    ])

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Extract notifications from Monica interactions
    const notifications = monicaInteractions
      .filter(interaction => interaction.interactionType === 'notification')
      .map(notif => {
        const contextData = includeMetadata && notif.contextData
          ? JSON.parse(notif.contextData as string)
          : {}

        return {
          type: contextData.notificationType || 'unknown',
          subject: contextData.subject || 'Notification',
          content: includeMetadata ? contextData.content : '[Content redacted]',
          sentAt: notif.createdAt
        }
      })

    // Build comprehensive export data
    const exportData: UserDataExport = {
      user,
      profile: profile ? {
        birthInfo: profile.birthInfo ? JSON.parse(profile.birthInfo as string) : null,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      } : null,
      subscription,
      settings: settings ? {
        preferences: {
          personality: settings.personality,
          assistanceLevel: settings.assistanceLevel,
          proactiveTips: settings.proactiveTips,
          explanationDepth: settings.explanationDepth,
          position: settings.position,
          autoHide: settings.autoHide,
          preferredTime: settings.preferredTime,
          learningStyle: settings.learningStyle,
          interests: settings.interests ? JSON.parse(settings.interests as string) : null,
          contextualAwareness: settings.contextualAwareness,
          adaptivePersonality: settings.adaptivePersonality,
          memoryRetention: settings.memoryRetention
        },
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt
      } : null,
      interactions: interactions.map(interaction => ({
        agentId: interaction.agentId,
        interactionType: interaction.interactionType,
        powerGained: interaction.powerGained,
        planetaryInfluence: interaction.planetaryInfluence,
        elementalResonance: interaction.elementalResonance,
        createdAt: interaction.createdAt,
        metadata: includeMetadata ? {
          planetaryContext: interaction.planetaryContext ? JSON.parse(interaction.planetaryContext as string) : null,
          sessionMetadata: interaction.sessionMetadata ? JSON.parse(interaction.sessionMetadata as string) : null
        } : null
      })),
      agentEvolutions: agentEvolutions.map(evolution => ({
        agentId: evolution.agentId,
        currentLevel: evolution.currentLevel,
        totalPower: evolution.totalPower,
        interactionCount: evolution.interactionCount,
        lastInteraction: evolution.lastInteraction,
        specialAbilitiesUnlocked: JSON.parse(evolution.specialAbilitiesUnlocked),
        evolutionHistory: JSON.parse(evolution.evolutionHistory),
        affinityScores: JSON.parse(evolution.affinityScores)
      })),
      monicaInteractions: monicaInteractions.map(interaction => ({
        interactionType: interaction.interactionType,
        pageUrl: interaction.pageUrl,
        sessionId: interaction.sessionId,
        userAction: interaction.userAction,
        monicaResponse: includeMetadata ? interaction.monicaResponse : '[Response redacted for privacy]',
        createdAt: interaction.createdAt,
        contextData: includeMetadata && interaction.contextData
          ? JSON.parse(interaction.contextData as string)
          : null
      })),
      notifications
    }

    // Generate export metadata
    const exportMetadata = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      format,
      includeMetadata,
      dataTypes: [
        'user_profile',
        'birth_chart',
        'subscription',
        'preferences',
        'consciousness_interactions',
        'agent_evolution_states',
        'monica_interactions',
        'notifications'
      ],
      recordCounts: {
        interactions: interactions.length,
        agentEvolutions: agentEvolutions.length,
        monicaInteractions: monicaInteractions.length,
        notifications: notifications.length
      },
      privacyNote: includeMetadata
        ? 'Full data export including metadata and conversation content'
        : 'Privacy-focused export with sensitive content redacted'
    }

    if (format === 'csv') {
      // For CSV, flatten the data structure
      const csvData = {
        interactions: interactions.map(i => ({
          date: i.createdAt.toISOString(),
          agent: i.agentId,
          type: i.interactionType,
          power_gained: i.powerGained,
          planetary_influence: i.planetaryInfluence,
          elemental_resonance: i.elementalResonance
        })),
        evolution_states: agentEvolutions.map(e => ({
          agent: e.agentId,
          level: e.currentLevel,
          total_power: e.totalPower,
          interaction_count: e.interactionCount,
          last_interaction: e.lastInteraction.toISOString()
        }))
      }

      return NextResponse.json({
        success: true,
        exportData: csvData,
        metadata: exportMetadata,
        downloadInfo: {
          filename: `planetary-agents-export-${user.id}-${new Date().toISOString().split('T')[0]}.csv`,
          format: 'csv',
          size: JSON.stringify(csvData).length
        }
      })
    }

    // Default JSON format
    return NextResponse.json({
      success: true,
      exportData,
      metadata: exportMetadata,
      downloadInfo: {
        filename: `planetary-agents-export-${user.id}-${new Date().toISOString().split('T')[0]}.json`,
        format: 'json',
        size: JSON.stringify(exportData).length
      }
    })

  } catch (error) {
    console.error('User data export error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to export user data'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { action } = await req.json()

    if (action === 'request_deletion') {
      // GDPR Right to be Forgotten
      // In production, this would trigger a review process

      // Log the deletion request
      await prisma.monicaInteraction.create({
        data: {
          userId,
          interactionType: 'data_deletion_request',
          pageUrl: '/api/user-data-export',
          sessionId: `deletion-request-${Date.now()}`,
          contextData: JSON.stringify({
            requestDate: new Date().toISOString(),
            status: 'pending_review'
          }),
          userAction: 'request_account_deletion',
          monicaResponse: 'Account deletion request logged for review',
          resultedInAction: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Account deletion request submitted',
        details: 'Your request will be reviewed within 30 days as per GDPR requirements'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('User data action error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process data request'
    }, { status: 500 })
  }
}
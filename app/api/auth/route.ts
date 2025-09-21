import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// This endpoint handles user registration only
// Login is handled by NextAuth at /api/auth/[...nextauth]

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, name, birthChart } = await req.json()

    if (action === 'register') {
      return await handleRegister(email, password, name, birthChart)
    }
    
    return NextResponse.json({ error: 'Use NextAuth for login' }, { status: 400 })
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

async function handleRegister(email: string, password: string, name?: string, birthChart?: any) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split('@')[0],
        verified: false,
        provider: 'email'
      }
    })

    // Create user profile with birth chart data if provided
    if (birthChart && birthChart.year && birthChart.month && birthChart.day) {
      await prisma.profile.create({
        data: {
          userId: user.id,
          name: user.name,
          birthInfo: JSON.stringify({
            year: birthChart.year,
            month: birthChart.month,
            day: birthChart.day,
            hour: birthChart.hour || 12,
            minute: birthChart.minute || 0,
            latitude: birthChart.latitude || 0,
            longitude: birthChart.longitude || 0,
            timezone: 'UTC', // Default timezone
            location: `${birthChart.latitude || 0}, ${birthChart.longitude || 0}`
          })
        }
      })
    }

    // Create default subscription (free tier)
    await prisma.subscription.create({
      data: {
        userId: user.id,
        tier: 'free',
        status: 'active',
        features: JSON.stringify({
          agentChatsPerDay: 3,
          agentsAvailable: ['leonardo-da-vinci', 'shakespeare', 'einstein'],
          evolutionTracking: 'basic',
          groupConsciousness: false,
          powerHourNotifications: true,
          tokenGeneration: 'limited'
        }),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }
    })

    // Create Monica user settings with default configuration
    const monicaSettings = await prisma.monicaUserSettings.create({
      data: {
        userId: user.id,
        personality: 'friendly',
        assistanceLevel: 2,
        proactiveTips: true,
        explanationDepth: 'detailed',
        position: 'bottom-right',
        autoHide: 'never',
        preferredTime: 'evening',
        learningStyle: 'hands-on',
        interests: JSON.stringify([]),
        contextualAwareness: true,
        adaptivePersonality: true,
        memoryRetention: true
      }
    })

    // Create Monica user progress tracking
    await prisma.monicaUserProgress.create({
      data: {
        userId: user.id,
        settingsId: monicaSettings.id,
        level: 1,
        totalXP: 0,
        xpToNextLevel: 100,
        completedTutorials: JSON.stringify([]),
        suggestedNext: JSON.stringify(['getting-started', 'understanding-agents']),
        totalInteractions: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date(),
        masteryCertificates: JSON.stringify([]),
        favoriteFeatures: JSON.stringify([]),
        averageSessionTime: 0,
        preferredDifficulty: 'intermediate',
        learningVelocity: 1.0
      }
    })

    // Create initial agent evolution states for starter agents
    const starterAgents = ['leonardo-da-vinci', 'shakespeare', 'einstein']
    for (const agentId of starterAgents) {
      await prisma.agentEvolutionState.create({
        data: {
          agentId,
          userId: user.id,
          currentLevel: 'bronze',
          totalPower: 0,
          interactionCount: 0,
          specialAbilitiesUnlocked: JSON.stringify([]),
          evolutionHistory: JSON.stringify([]),
          affinityScores: JSON.stringify({})
        }
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verified: user.verified,
        tier: 'free'
      },
      message: 'Registration successful. Please sign in.'
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}

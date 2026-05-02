import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, birthData } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.users.create({
      data: {
        id: randomUUID(),
        email,
        passwordHash: hashedPassword,
        name,
        verified: false, // Email verification can be added later
      },
    })

    // Create user profile with birth data if provided
    if (birthData) {
      try {
        await prisma.user_profiles.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            birthDate: new Date(birthData.year, birthData.month, birthData.day),
            birthTime:
              birthData.hour && birthData.minute
                ? `${birthData.hour.toString().padStart(2, '0')}:${birthData.minute.toString().padStart(2, '0')}`
                : null,
            birthLocation:
              birthData.latitude && birthData.longitude
                ? {
                    name: 'Birth Location',
                    latitude: birthData.latitude,
                    longitude: birthData.longitude,
                  }
                : { name: 'Unknown', latitude: 0, longitude: 0 },
            natalChart: birthData, // Store full birth data as natal chart
            monicaConstant: 0, // Will be calculated later
            dominantElement: 'Fire', // Default, will be calculated
            updatedAt: new Date(),
          },
        })
      } catch (profileError) {
        console.warn('Failed to create UserProfile:', profileError)
        // Continue without profile
      }

      try {
        // Also create basic profile entry
        await prisma.profiles.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            name: name,
            birthInfo: birthData,
            updatedAt: new Date(),
          },
        })
      } catch (basicProfileError) {
        console.warn('Failed to create basic Profile:', basicProfileError)
        // Continue without basic profile
      }
    }

    // Create default Monica settings
    await prisma.monica_user_settings.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        personality: 'mixed',
        assistanceLevel: 2,
        proactiveTips: true,
        explanationDepth: 'detailed',
        position: 'bottom-right',
        autoHide: 'never',
        preferredTime: 'evening',
        learningStyle: 'hands-on',
        contextualAwareness: true,
        adaptivePersonality: true,
        memoryRetention: true,
        interests: JSON.stringify({
          notifications: {
            powerHours: true,
            evolutionMilestones: true,
            weeklyProgress: true,
            agentRecommendations: true,
            emailFrequency: 'weekly',
          },
          privacy: {
            profileVisibility: 'private',
            shareEvolutionData: false,
            allowDataExport: true,
            analyticsOptOut: false,
          },
        }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: 'Account created successfully',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

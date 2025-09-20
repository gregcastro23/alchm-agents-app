import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'consciousness-evolution-secret-key'

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, name } = await req.json()

    switch (action) {
      case 'register':
        return await handleRegister(email, password, name)
      case 'login':
        return await handleLogin(email, password)
      case 'verify':
        return await handleVerifyToken(req)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

async function handleRegister(email: string, password: string, name?: string) {
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

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verified: user.verified,
        tier: 'free'
      },
      token
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}

async function handleLogin(email: string, password: string) {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Check password
    const passwordValid = await bcrypt.compare(password, user.passwordHash || '')
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verified: user.verified,
        tier: user.subscription?.tier || 'free',
        features: user.subscription?.features ? JSON.parse(user.subscription.features as string) : {}
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

async function handleVerifyToken(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        subscription: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verified: user.verified,
        tier: user.subscription?.tier || 'free',
        features: user.subscription?.features ? JSON.parse(user.subscription.features as string) : {}
      }
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

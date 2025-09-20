import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export const revalidate = 0

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const body = await req.json().catch(() => ({}))
    const birthInfo = body?.birthInfo
    const name = body?.name
    const avatarUrl = body?.avatarUrl

    if (!birthInfo || typeof birthInfo !== 'object') {
      return NextResponse.json({ error: 'Missing or invalid birthInfo' }, { status: 400 })
    }

    // Validate birthInfo structure
    const requiredFields = ['year', 'month', 'day', 'hour', 'minute', 'latitude', 'longitude']
    for (const field of requiredFields) {
      if (typeof birthInfo[field] !== 'number') {
        return NextResponse.json(
          { error: `Invalid birthInfo: ${field} must be a number` },
          { status: 400 }
        )
      }
    }

    // Validate ranges
    const currentYear = new Date().getFullYear()
    if (birthInfo.year < 1900 || birthInfo.year > currentYear) {
      return NextResponse.json(
        { error: `Birth year must be between 1900 and ${currentYear}` },
        { status: 400 }
      )
    }

    if (birthInfo.month < 0 || birthInfo.month > 11) {
      return NextResponse.json(
        { error: 'Birth month must be between 0 and 11 (zero-based)' },
        { status: 400 }
      )
    }

    if (birthInfo.latitude < -90 || birthInfo.latitude > 90) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90' },
        { status: 400 }
      )
    }

    if (birthInfo.longitude < -180 || birthInfo.longitude > 180) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180' },
        { status: 400 }
      )
    }

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        birthInfo: birthInfo as any,
        ...(name ? { name } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
      },
      create: {
        userId,
        birthInfo: birthInfo as any,
        name: name || 'Explorer',
        avatarUrl: avatarUrl || null,
      },
    })

    return NextResponse.json({ profile }, { status: 200 })
  } catch (e: any) {
    console.error('Profile update error:', e)
    return NextResponse.json(
      { error: 'Failed to update profile', details: e?.message || String(e) },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
    return NextResponse.json({ profile }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to load profile', details: e?.message || String(e) },
      { status: 500 }
    )
  }
}



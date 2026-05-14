import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ onboardingComplete: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const profile = await prisma.user_profiles.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json({ onboardingComplete: false })
    }

    // Check if profile has been completed (beyond placeholders)
    const isPlaceholder = 
      profile.birthDate.getTime() === 0 && 
      (profile.birthLocation as any)?.name === 'Pending Onboarding'

    return NextResponse.json({ 
      onboardingComplete: !isPlaceholder,
      profile: isPlaceholder ? null : profile
    })
  } catch (error) {
    console.error('Onboarding check error:', error)
    return NextResponse.json({ onboardingComplete: false, error: 'Internal server error' }, { status: 500 })
  }
}

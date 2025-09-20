import Image from 'next/image'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import CircularNatalHoroscope from '@/components/circular-natal-horoscope'
import { ConsciousnessVectorDisplay } from '@/components/temporal/consciousness-vector-display'
import ProfileOnboardingForm from '@/components/profile/onboarding-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { calculateMC } from '@/lib/monica/monica-constant-validator'
import alchemizerExport, { alchemize } from '@/lib/alchemizer'
import { generateAccurateHoroscope } from '@/lib/monica/horoscope-generator'

export const dynamic = 'force-dynamic'

export default async function MePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id
  const profile = await prisma.profile.findUnique({ where: { userId } })

  // Onboarding if no birth info
  if (!profile?.birthInfo) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4">
          {session.user.image ? (
            <Image src={session.user.image} alt={session.user.name || 'You'} width={48} height={48} className="rounded-full" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted" />
          )}
          <div>
            <h1 className="text-2xl font-bold">Welcome, {session.user.name || 'Explorer'}</h1>
            <p className="text-muted-foreground">Let's personalize your Alchm with your birth details.</p>
          </div>
        </div>
        <ProfileOnboardingForm />
      </div>
    )
  }

  // Compute natal/alchemical summary using existing utilities
  let alchm: any = {}
  let computationError: string | null = null
  
  try {
    const birth = profile.birthInfo as any
    if (!birth || typeof birth !== 'object') {
      throw new Error('Invalid birth info format')
    }
    
    // Validate required birth data
    const requiredFields = ['year', 'month', 'day', 'hour', 'minute']
    for (const field of requiredFields) {
      if (typeof birth[field] !== 'number') {
        throw new Error(`Missing or invalid ${field} in birth info`)
      }
    }
    
    // birth.month expected 0-based in codebase; horoscope expects 1-12
    const horoscope = generateAccurateHoroscope({
      year: birth.year,
      month: birth.month + 1,
      day: birth.day,
      hour: birth.hour,
      minute: birth.minute,
      latitude: birth.latitude ?? 0,
      longitude: birth.longitude ?? 0,
    })
    
    alchm = alchemize(birth, horoscope)
  } catch (error: any) {
    console.error('Alchemical computation error:', error)
    computationError = error?.message || 'Failed to compute alchemical data'
    // Provide fallback data
    alchm = {
      'Alchemy Effects': {
        'Total Spirit': 1,
        'Total Essence': 1,
        'Total Matter': 1,
        'Total Substance': 1,
      },
      'Total Effect Value': {
        Fire: 1,
        Water: 1,
        Air: 1,
        Earth: 1,
      },
      'Dominant Element': 'Fire',
      'Dominant Modality': 'Cardinal',
      Heat: 0,
      Entropy: 0,
      Reactivity: 0,
      Energy: 0,
    }
  }

  const spirit = Number(alchm?.['Alchemy Effects']?.['Total Spirit'] || 0)
  const essence = Number(alchm?.['Alchemy Effects']?.['Total Essence'] || 0)
  const matter = Number(alchm?.['Alchemy Effects']?.['Total Matter'] || 0)
  const substance = Number(alchm?.['Alchemy Effects']?.['Total Substance'] || 0)
  const fire = Number(alchm?.['Total Effect Value']?.['Fire'] || 0)
  const water = Number(alchm?.['Total Effect Value']?.['Water'] || 0)
  const air = Number(alchm?.['Total Effect Value']?.['Air'] || 0)
  const earth = Number(alchm?.['Total Effect Value']?.['Earth'] || 0)
  const Heat = Number(alchm?.['Heat'] || 0)
  const Entropy = Number(alchm?.['Entropy'] || 0)
  const Reactivity = Number(alchm?.['Reactivity'] || 0)
  const Energy = Number(alchm?.['Energy'] || 0)

  const monicaConstant = calculateMC(spirit, essence, matter, substance, fire, water, air, earth)
  const dominantElement = String(alchm?.['Dominant Element'] || 'Fire')

  const modality = String(alchm?.['Dominant Modality'] || '')

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        {session.user.image ? (
          <Image src={session.user.image} alt={session.user.name || 'You'} width={56} height={56} className="rounded-full" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-muted" />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Hi, {session.user.name || 'Explorer'} 👋</h1>
          <p className="text-muted-foreground">Your personalized alchemical profile</p>
        </div>
        <div className="flex gap-2">
          <form action="/api/logout" method="POST">
            <Button variant="outline" size="sm" type="submit">
              Sign Out
            </Button>
          </form>
        </div>
      </div>

      {computationError && (
        <div className="p-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
          ⚠️ Using fallback data due to computation issue: {computationError}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Dominant Element: {dominantElement}</Badge>
        {modality && <Badge variant="outline">Dominant Modality: {modality}</Badge>}
        <Badge>Monica Constant: {monicaConstant.toFixed(3)}</Badge>
        {profile.birthInfo && (
          <Badge variant="outline">
            Born: {new Date(
              (profile.birthInfo as any).year,
              (profile.birthInfo as any).month,
              (profile.birthInfo as any).day
            ).toLocaleDateString()}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CircularNatalHoroscope
          className="w-full"
          birthInfo={{
            name: profile.name || 'You',
            year: (profile.birthInfo as any)?.year || 1990,
            month: (profile.birthInfo as any)?.month || 0,
            day: (profile.birthInfo as any)?.day || 1,
            hour: (profile.birthInfo as any)?.hour || 12,
            minute: (profile.birthInfo as any)?.minute || 0,
            latitude: (profile.birthInfo as any)?.latitude ?? 0,
            longitude: (profile.birthInfo as any)?.longitude ?? 0,
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>Consciousness Vector</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsciousnessVectorDisplay
              alchmQuantities={{ spirit, essence, matter, substance, Heat, Entropy, Reactivity, Energy }}
              monicaConstant={monicaConstant}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



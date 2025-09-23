import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import CircularNatalHoroscope from '@/components/charts/circular-natal-horoscope'
import ProfileOnboardingForm from '@/components/profile/onboarding-form'
import { LiveConsciousnessDisplay } from '@/components/profile/live-consciousness-display'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { calculateMC } from '@/lib/monica/monica-constant-validator'
import alchemizerExport, { alchemize } from '@/lib/alchemizer'
import { generateAccurateHoroscope } from '@/lib/monica/horoscope-generator'

export const dynamic = 'force-dynamic'

export default async function MePage() {
  const session = await auth()

  // Allow anonymous access with guest experience
  if (!session?.user?.id) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">👤</div>
          <div>
            <h1 className="text-2xl font-bold">Welcome, Guest Explorer</h1>
            <p className="text-muted-foreground">
              Create an account to save your personalized astrological profile.
            </p>
          </div>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Guest Experience</h2>
          <p className="text-muted-foreground mb-4">
            You're exploring as a guest! All features are available, but your data won't be saved.
            Sign up to unlock personalized features like:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Personalized natal chart analysis</li>
            <li>Saved conversation history with agents</li>
            <li>Custom agent creation progress</li>
            <li>Consciousness evolution tracking</li>
          </ul>
          <div className="mt-6 flex gap-4">
            <Button asChild>
              <Link href="/auth/signup">Create Account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const userId = session.user.id
  const profile = await prisma.profile.findUnique({ where: { userId } })

  // Onboarding if no birth info
  if (!profile?.birthInfo) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || 'You'}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted" />
          )}
          <div>
            <h1 className="text-2xl font-bold">Welcome, {session.user.name || 'Explorer'}</h1>
            <p className="text-muted-foreground">
              Let's personalize your Alchm with your birth details.
            </p>
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

  // Extract elemental values for display
  const fire = Number(alchm?.['Total Effect Value']?.['Fire'] || 0)
  const water = Number(alchm?.['Total Effect Value']?.['Water'] || 0)
  const air = Number(alchm?.['Total Effect Value']?.['Air'] || 0)
  const earth = Number(alchm?.['Total Effect Value']?.['Earth'] || 0)

  // Extract thermodynamic values
  const Heat = Number(alchm?.['Heat'] || 0)
  const Entropy = Number(alchm?.['Entropy'] || 0)
  const Reactivity = Number(alchm?.['Reactivity'] || 0)
  const EnergyValue = Number(alchm?.['Energy'] || 0)

  const monicaConstant = calculateMC(spirit, essence, matter, substance, fire, water, air, earth)
  const dominantElement = String(alchm?.['Dominant Element'] || 'Fire')

  const modality = String(alchm?.['Dominant Modality'] || '')

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'You'}
            width={56}
            height={56}
            className="rounded-full"
          />
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
            Born:{' '}
            {new Date(
              (profile.birthInfo as any).year,
              (profile.birthInfo as any).month,
              (profile.birthInfo as any).day
            ).toLocaleDateString()}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Birth Chart with Kinetics */}
        <div className="lg:col-span-2">
          <CircularNatalHoroscope
            className="w-full"
            showKinetics={true}
            birthInfo={{
              name: profile.name || session.user.name || 'You',
              year: (profile.birthInfo as any)?.year || 1990,
              month: (profile.birthInfo as any)?.month || 0,
              day: (profile.birthInfo as any)?.day || 1,
              hour: (profile.birthInfo as any)?.hour || 12,
              minute: (profile.birthInfo as any)?.minute || 0,
              latitude: (profile.birthInfo as any)?.latitude ?? 0,
              longitude: (profile.birthInfo as any)?.longitude ?? 0,
            }}
          />
        </div>

        {/* Alchemical Transformation */}
        <Card>
          <CardHeader>
            <CardTitle>Alchemical Profile</CardTitle>
            <p className="text-sm text-muted-foreground">Your consciousness signature</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Core Alchemical Values */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{spirit.toFixed(1)}</div>
                <div className="text-xs text-red-700">Spirit</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{essence.toFixed(1)}</div>
                <div className="text-xs text-blue-700">Essence</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{matter.toFixed(1)}</div>
                <div className="text-xs text-green-700">Matter</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{substance.toFixed(1)}</div>
                <div className="text-xs text-yellow-700">Substance</div>
              </div>
            </div>

            {/* Thermodynamic Values */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Thermodynamic Properties</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Heat:</span>
                  <span className="font-mono">{Heat.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Entropy:</span>
                  <span className="font-mono">{Entropy.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reactivity:</span>
                  <span className="font-mono">{Reactivity.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Energy:</span>
                  <span className="font-mono">{EnergyValue.toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Elemental Distribution */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Elemental Distribution</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded"></div>
                    Fire
                  </span>
                  <span className="font-mono">{fire.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded"></div>
                    Water
                  </span>
                  <span className="font-mono">{water.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded"></div>
                    Air
                  </span>
                  <span className="font-mono">{air.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded"></div>
                    Earth
                  </span>
                  <span className="font-mono">{earth.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Consciousness Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Consciousness Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">
              Alchemical balance and thermodynamic properties
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Simple Alchemical Display */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{spirit.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Spirit</div>
                <div className="w-full bg-red-100 rounded-full h-2 mt-1">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (spirit / Math.max(spirit, essence, matter, substance)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{essence.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Essence</div>
                <div className="w-full bg-blue-100 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (essence / Math.max(spirit, essence, matter, substance)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{matter.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Matter</div>
                <div className="w-full bg-green-100 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (matter / Math.max(spirit, essence, matter, substance)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{substance.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Substance</div>
                <div className="w-full bg-yellow-100 rounded-full h-2 mt-1">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (substance / Math.max(spirit, essence, matter, substance)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Monica Constant Display */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{monicaConstant.toFixed(3)}</div>
              <div className="text-sm text-muted-foreground">Monica Constant</div>
              <div className="text-xs mt-1">
                {monicaConstant < 1
                  ? 'Foundational'
                  : monicaConstant < 2
                    ? 'Developing'
                    : monicaConstant < 3
                      ? 'Advanced'
                      : 'Transcendent'}{' '}
                Level
              </div>
            </div>

            {/* Thermodynamic Properties */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between p-2 bg-red-50 rounded">
                <span>Heat:</span>
                <span className="font-mono">{Heat.toFixed(3)}</span>
              </div>
              <div className="flex justify-between p-2 bg-blue-50 rounded">
                <span>Entropy:</span>
                <span className="font-mono">{Entropy.toFixed(3)}</span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 rounded">
                <span>Reactivity:</span>
                <span className="font-mono">{Reactivity.toFixed(3)}</span>
              </div>
              <div className="flex justify-between p-2 bg-yellow-50 rounded">
                <span>Energy:</span>
                <span className="font-mono">{EnergyValue.toFixed(3)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Consciousness Tracking */}
        <LiveConsciousnessDisplay
          birthInfo={birthInfo}
          userName={session.user.name || 'You'}
          birthAlchm={{
            spirit: safeAlchm.spirit,
            essence: safeAlchm.essence,
            matter: safeAlchm.matter,
            substance: safeAlchm.substance,
            Heat: safeAlchm.Heat,
            Energy: safeAlchm.EnergyValue,
            Entropy: safeAlchm.Entropy,
            Reactivity: safeAlchm.Reactivity,
          }}
          birthMC={monicaConstant}
        />

        {/* Chart Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Chart Insights</CardTitle>
            <p className="text-sm text-muted-foreground">Key patterns and recommendations</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-1">Dominant Patterns</h4>
                <div className="text-sm text-muted-foreground">
                  Your {dominantElement.toLowerCase()} dominance suggests a natural affinity for{' '}
                  {dominantElement === 'Fire'
                    ? 'creativity and leadership'
                    : dominantElement === 'Water'
                      ? 'intuition and emotional depth'
                      : dominantElement === 'Air'
                        ? 'communication and ideas'
                        : 'stability and practical manifestation'}
                  .
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">Monica Constant Analysis</h4>
                <div className="text-sm text-muted-foreground">
                  At {monicaConstant.toFixed(3)}, your consciousness operates at a{' '}
                  {monicaConstant < 1
                    ? 'foundational'
                    : monicaConstant < 2
                      ? 'developing'
                      : monicaConstant < 3
                        ? 'advanced'
                        : 'transcendent'}{' '}
                  level with strong potential for growth.
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">Alchemical Balance</h4>
                <div className="text-sm text-muted-foreground">
                  Your Spirit/Essence ratio of {(spirit / Math.max(essence, 0.1)).toFixed(2)}{' '}
                  indicates{' '}
                  {spirit > essence ? 'active initiation energy' : 'receptive integration capacity'}
                  , while your Matter/Substance foundation provides{' '}
                  {matter > substance ? 'structural stability' : 'connective flexibility'}.
                </div>
              </div>

              {computationError && (
                <div className="p-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded">
                  Note: Some calculations used fallback data due to: {computationError}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

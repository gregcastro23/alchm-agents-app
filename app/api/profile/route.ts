import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { generateAccurateHoroscope } from '@/lib/monica/horoscope-generator'
import { planetaryAPI } from '@/lib/planetary-api-client'
import { calculateMonicaConstant } from '@/lib/monica/monica-constant'

export const revalidate = 0

const BirthDataSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(0).max(11),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationName: z.string().min(1).max(200).optional(),
})

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json().catch(() => ({}))
    const name = typeof body?.name === 'string' ? body.name : undefined
    const avatarUrl = typeof body?.avatarUrl === 'string' ? body.avatarUrl : undefined
    const rawBirthInfo = body?.birthInfo
    const sharing = body?.sharingPreferences

    if (!rawBirthInfo) {
      return NextResponse.json({ error: 'Missing birthInfo' }, { status: 400 })
    }

    const parsedBirth = BirthDataSchema.safeParse(rawBirthInfo)
    if (!parsedBirth.success) {
      return NextResponse.json(
        { error: 'Invalid birthInfo', details: parsedBirth.error.format() },
        { status: 400 }
      )
    }

    const birthInfo = parsedBirth.data

    const birthDate = new Date(
      Date.UTC(birthInfo.year, birthInfo.month, birthInfo.day, birthInfo.hour, birthInfo.minute)
    )

    // Generate natal chart and alchemical metrics
    const horoscope = generateAccurateHoroscope({
      year: birthInfo.year,
      month: birthInfo.month + 1,
      day: birthInfo.day,
      hour: birthInfo.hour,
      minute: birthInfo.minute,
      latitude: birthInfo.latitude,
      longitude: birthInfo.longitude,
    })

    const alchm = await planetaryAPI.getAlchemicalQuantitiesLegacy(
      birthDate,
      birthInfo.latitude,
      birthInfo.longitude
    )

    const spirit = alchm?.['Alchemy Effects']?.['Total Spirit'] || 0
    const essence = alchm?.['Alchemy Effects']?.['Total Essence'] || 0
    const matter = alchm?.['Alchemy Effects']?.['Total Matter'] || 0
    const substance = alchm?.['Alchemy Effects']?.['Total Substance'] || 0

    const monica = calculateMonicaConstant({
      spirit,
      essence,
      matter,
      substance,
      Heat: alchm?.Heat || 0,
      Entropy: alchm?.Entropy || 0,
      Reactivity: alchm?.Reactivity || 0,
      Energy: alchm?.Energy || 0,
    })

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        birthDate,
        birthTime: `${String(birthInfo.hour).padStart(2, '0')}:${String(birthInfo.minute).padStart(2, '0')}`,
        birthLocation: {
          name: birthInfo.locationName || 'Unknown',
          latitude: birthInfo.latitude,
          longitude: birthInfo.longitude,
        },
        natalChart: horoscope,
        monicaConstant: monica.value,
        dominantElement: alchm?.['Dominant Element'] || 'Fire',
        ...(typeof sharing?.allowPublicAgents === 'boolean'
          ? { allowPublicAgents: sharing.allowPublicAgents }
          : {}),
        ...(typeof sharing?.shareChartWithAgents === 'boolean'
          ? { shareChartWithAgents: sharing.shareChartWithAgents }
          : {}),
      },
      create: {
        userId,
        birthDate,
        birthTime: `${String(birthInfo.hour).padStart(2, '0')}:${String(birthInfo.minute).padStart(2, '0')}`,
        birthLocation: {
          name: birthInfo.locationName || 'Unknown',
          latitude: birthInfo.latitude,
          longitude: birthInfo.longitude,
        },
        natalChart: horoscope,
        monicaConstant: monica.value,
        dominantElement: alchm?.['Dominant Element'] || 'Fire',
      },
    })

    if (name || avatarUrl) {
      await prisma.profile.upsert({
        where: { userId },
        update: {
          ...(name ? { name } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
          birthInfo: {
            year: birthInfo.year,
            month: birthInfo.month,
            day: birthInfo.day,
            hour: birthInfo.hour,
            minute: birthInfo.minute,
            latitude: birthInfo.latitude,
            longitude: birthInfo.longitude,
          },
        },
        create: {
          userId,
          name: name || 'Explorer',
          avatarUrl: avatarUrl || null,
          birthInfo: {
            year: birthInfo.year,
            month: birthInfo.month,
            day: birthInfo.day,
            hour: birthInfo.hour,
            minute: birthInfo.minute,
            latitude: birthInfo.latitude,
            longitude: birthInfo.longitude,
          },
        },
      })
    }

    return NextResponse.json({
      profile,
      calculations: {
        monicaConstant: monica,
        alchemy: {
          spirit,
          essence,
          matter,
          substance,
          dominantElement: alchm?.['Dominant Element'] || 'Fire',
        },
      },
    })
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
    const [basicProfile, detailedProfile] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: session.user.id } }),
      prisma.userProfile.findUnique({ where: { userId: session.user.id } }),
    ])

    return NextResponse.json({
      profile: detailedProfile,
      presentation: basicProfile,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to load profile', details: e?.message || String(e) },
      { status: 500 }
    )
  }
}

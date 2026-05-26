import { randomBytes, randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { EconomyService } from '@/lib/services/economyService'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const DEV_DESKTOP_API_KEY = process.env.DESKTOP_DEV_API_KEY || 'dev-desktop-token'
const DEV_DESKTOP_USER_ID = process.env.DESKTOP_DEV_USER_ID || 'desktop-local'
const DESKTOP_KEY_LABEL = 'Alchm Desktop Companion'

function createDesktopToken() {
  return `alchm_desktop_${randomBytes(32).toString('hex')}`
}

function localDevSession() {
  return {
    mode: 'local-dev',
    userId: DEV_DESKTOP_USER_ID,
    apiKey: DEV_DESKTOP_API_KEY,
    balances: {
      spirit: 150,
      essence: 150,
      matter: 150,
      substance: 150,
    },
  }
}

export async function GET() {
  const session = await getServerSession(authOptions).catch(() => null)
  const userId = (session?.user as { id?: string } | undefined)?.id

  if (!userId) {
    return NextResponse.json(localDevSession())
  }

  const token = createDesktopToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const desktopApiKey = (prisma as any).desktopApiKey

  try {
    if (desktopApiKey?.updateMany && desktopApiKey?.create) {
      await desktopApiKey.updateMany({
        where: {
          userId,
          label: DESKTOP_KEY_LABEL,
          isActive: true,
        },
        data: { isActive: false },
      })

      await desktopApiKey.create({
        data: {
          token,
          userId,
          label: DESKTOP_KEY_LABEL,
          expiresAt,
        },
      })
    } else {
      await prisma.$transaction([
        prisma.$executeRaw`
          UPDATE desktop_api_keys
          SET is_active = false
          WHERE user_id = ${userId}
            AND label = ${DESKTOP_KEY_LABEL}
            AND is_active = true
        `,
        prisma.$executeRaw`
          INSERT INTO desktop_api_keys (id, token, user_id, label, expires_at)
          VALUES (${randomUUID()}, ${token}, ${userId}, ${DESKTOP_KEY_LABEL}, ${expiresAt})
        `,
      ])
    }
  } catch (error) {
    console.warn('Unable to create desktop API key; falling back to local desktop session.', error)
    return NextResponse.json(localDevSession())
  }

  const balances = await EconomyService.getBalances(userId)

  return NextResponse.json({
    mode: 'authenticated',
    userId,
    apiKey: token,
    expiresAt: expiresAt.toISOString(),
    balances: {
      spirit: balances.spirit,
      essence: balances.essence,
      matter: balances.matter,
      substance: balances.substance,
    },
  })
}

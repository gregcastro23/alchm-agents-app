import { getServerSession } from 'next-auth'
import { authOptions } from './auth-options'
import { cookies } from 'next/headers'

export type SessionUser = {
  id: string
  name?: string | null
  image?: string | null
}

export type Session = {
  user: SessionUser
}

export async function auth(): Promise<Session | null> {
  // Try NextAuth session first (Google OAuth flow)
  try {
    const session = await getServerSession(authOptions)
    if (session?.user) {
      const u = session.user as any
      if (u.id) {
        return { user: { id: u.id, name: u.name ?? null, image: u.image ?? null } }
      }
    }
  } catch {}

  // Fall back to legacy cookie-based auth (manual login flow)
  try {
    const c = await cookies()
    const userId = c.get('userId')?.value
    if (!userId) return null
    const name = c.get('userName')?.value || 'Explorer'
    const image = c.get('userAvatar')?.value || null
    return { user: { id: userId, name, image } }
  } catch {
    return null
  }
}

export async function requireAuthOrRedirect(): Promise<SessionUser | null> {
  const session = await auth()
  return session?.user ?? null
}

// Minimal cookie-based auth helper to provide auth() in RSC
// This is a lightweight stand-in for NextAuth that reads user data from cookies.
// If cookies are absent, auth() returns null.

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

export function requireAuthOrRedirect(): SessionUser | null {
  const c = cookies()
  const userId = c.get('userId')?.value
  if (!userId) return null
  const name = c.get('userName')?.value || 'Explorer'
  const image = c.get('userAvatar')?.value || null
  return { id: userId, name, image }
}

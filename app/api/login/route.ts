import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = body?.name || 'Explorer'
    const avatarUrl = body?.avatarUrl || ''
    // Generate a simple user id cookie for demo auth
    const userId = body?.userId || `user-${Math.random().toString(36).slice(2)}`

    const c = await cookies()
    c.set('userId', userId, { httpOnly: false, sameSite: 'lax', path: '/' })
    c.set('userName', name, { httpOnly: false, sameSite: 'lax', path: '/' })
    if (avatarUrl) c.set('userAvatar', avatarUrl, { httpOnly: false, sameSite: 'lax', path: '/' })

    return NextResponse.json({ ok: true, userId }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Login failed', details: e?.message || String(e) },
      { status: 500 }
    )
  }
}

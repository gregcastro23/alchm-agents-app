import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const c = await cookies()

    // Clear all auth cookies
    c.delete('userId')
    c.delete('userName')
    c.delete('userAvatar')

    // Redirect to login page after logout
    return NextResponse.redirect(
      new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000')
    )
  } catch (e) {
    return NextResponse.json(
      { error: 'Logout failed', details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}

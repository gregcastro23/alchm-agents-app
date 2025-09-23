import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Logout failed', details: e?.message || String(e) },
      { status: 500 }
    )
  }
}

import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth-options'

/**
 * Get the current authenticated user from NextAuth session
 * Returns null if not authenticated
 */
export async function getCurrentUser(req?: NextRequest) {
  try {
    // Try NextAuth session first
    const session = await getServerSession(authOptions)

    if (session?.user) {
      return {
        id: (session.user as any).id || session.user.email,
        email: session.user.email,
        name: session.user.name,
        tier: (session.user as any).tier || 'free',
      }
    }

    // Fallback to cookie-based auth for demo/development
    try {
      const cookieStore = await cookies()
      const userId = cookieStore.get('userId')?.value
      const userName = cookieStore.get('userName')?.value

      if (userId) {
        return {
          id: userId,
          email: null,
          name: userName || 'Explorer',
          tier: 'free',
        }
      }
    } catch (cookieError) {
      // Cookies not available (e.g., in API routes without request context)
    }

    // No authentication found
    return null
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

/**
 * Get user ID from request, returns 'anonymous' if not authenticated
 * For backward compatibility with existing code
 */
export function getUserIdFromRequest(req: NextRequest): string {
  // Try to get user ID from cookies
  const cookieHeader = req.headers.get('cookie')
  if (cookieHeader) {
    const userIdMatch = cookieHeader.match(/userId=([^;]+)/)
    if (userIdMatch) {
      return userIdMatch[1]
    }
  }

  // Fallback to anonymous for development
  // In production, consider throwing an error or redirecting to login
  return 'anonymous'
}

/**
 * Require authentication or throw error
 * Use this in API routes that must have an authenticated user
 */
export async function requireAuth(req?: NextRequest) {
  const user = await getCurrentUser(req)

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

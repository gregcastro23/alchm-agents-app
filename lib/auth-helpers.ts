import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// NextAuth configuration for server-side session retrieval
const authOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET || 'consciousness-evolution-secret-dev-only',
  session: {
    strategy: 'jwt' as const
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.tier = user.tier
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id
        session.user.tier = token.tier
      }
      return session
    }
  }
}

export async function getCurrentUser(req?: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return null
    }
    return {
      id: session.user.id,
      email: session.user.email,
      tier: (session.user as any).tier || 'free'
    }
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

export function getUserIdFromRequest(req: NextRequest): string {
  // For now, return a default user ID if no session
  // This allows the system to work without authentication during development
  // In production, this should throw an error or redirect to login
  return 'anonymous'
}
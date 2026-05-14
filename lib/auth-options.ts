import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/db'

const DB_TIMEOUT_MS = 5000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('DB timeout')), ms)),
  ])
}

export const authOptions: import('next-auth').NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'consciousness-evolution-secret-dev-only',
  jwt: {
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const email = profile?.email || user?.email
        if (!email) {
          console.error('Google login failed: No email provided')
          return false
        }

        try {
          let dbUser = await withTimeout(
            prisma.users.findUnique({ where: { email } }),
            DB_TIMEOUT_MS
          )

          if (!dbUser) {
            dbUser = await withTimeout(
              prisma.users.create({
                data: {
                  email,
                  name: profile?.name || user?.name || email.split('@')[0],
                  provider: 'google',
                  verified: true,
                },
              }),
              DB_TIMEOUT_MS
            )
          } else {
            await withTimeout(
              prisma.users.update({ where: { id: dbUser.id }, data: { lastLogin: new Date() } }),
              DB_TIMEOUT_MS
            ).catch(() => {})
          }
          return true
        } catch (error) {
          console.error('Error during Google sign-in mapping:', error)
          // Allow sign-in even if DB is unreachable — profile can be created later
          return true
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === 'google') {
        try {
          const dbUser = await withTimeout(
            prisma.users.findUnique({ where: { email: user.email! } }),
            DB_TIMEOUT_MS
          )
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role || 'user'
          }
        } catch (error) {
          console.error('Error resolving database user ID for Google:', error)
        }
      }
      token.tier = token.role === 'admin' ? 'premium_pro' : 'master'
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        const sessionUser = session.user as typeof session.user & {
          id?: string
          role?: string
          tier?: string
        }
        sessionUser.id = token.id as string
        sessionUser.role = (token.role as string) || 'user'
        sessionUser.tier = (token.tier as string) || 'master'
      }
      return session
    },
  },
}

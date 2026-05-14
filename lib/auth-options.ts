import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'

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
          // Use a transaction to ensure atomicity
          await prisma.$transaction(async (tx) => {
            let dbUser = await tx.users.findUnique({
              where: { email },
              include: { user_profiles: true },
            })

            if (!dbUser) {
              // New user - create all required rows
              const userId = randomUUID()
              const name = profile?.name || user?.name || email.split('@')[0]
              
              await tx.users.create({
                data: {
                  id: userId,
                  email,
                  name,
                  provider: 'google',
                  verified: true,
                  lastLogin: new Date(),
                },
              })

              await tx.user_profiles.create({
                data: {
                  userId,
                  birthDate: new Date(0), // Placeholder
                  birthLocation: { name: 'Pending Onboarding', latitude: 0, longitude: 0 },
                  natalChart: {},
                  monicaConstant: 0,
                  dominantElement: 'Fire',
                },
              })

              await tx.profiles.create({
                data: {
                  userId,
                  name,
                },
              })

              await tx.monica_user_settings.create({
                data: {
                  userId,
                  interests: '[]',
                },
              })
            } else {
              // Existing user - update last login
              await tx.users.update({
                where: { id: dbUser.id },
                data: { lastLogin: new Date() },
              })

              // Ensure profile exists (migration for legacy users)
              if (!dbUser.user_profiles) {
                await tx.user_profiles.create({
                  data: {
                    userId: dbUser.id,
                    birthDate: new Date(0),
                    birthLocation: { name: 'Pending Onboarding', latitude: 0, longitude: 0 },
                    natalChart: {},
                    monicaConstant: 0,
                    dominantElement: 'Fire',
                  },
                })
              }
            }
          })
          return true
        } catch (error) {
          console.error('Error during Google sign-in transaction:', error)
          // Crucial: return false to prevent ghost sessions if DB fails
          return false
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

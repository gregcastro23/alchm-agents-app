import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/db'

export const authOptions: import('next-auth').NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'consciousness-evolution-secret-dev-only',
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
          // Check if user exists in db
          let dbUser = await prisma.users.findUnique({
            where: { email },
          })

          if (!dbUser) {
            // Automatically create a user record
            dbUser = await prisma.users.create({
              data: {
                email,
                name: profile?.name || user?.name || email.split('@')[0],
                provider: 'google',
                verified: true,
              },
            })
          } else {
            // Update lastLogin
            await prisma.users.update({
              where: { id: dbUser.id },
              data: {
                lastLogin: new Date(),
              },
            })
          }
          return true
        } catch (error) {
          console.error('Error during Google sign-in mapping:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === 'google') {
        try {
          const dbUser = await prisma.users.findUnique({
            where: { email: user.email! },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role || 'user'
          }
        } catch (error) {
          console.error('Error resolving database user ID for Google:', error)
        }
      }
      // Tier based on role: admin gets premium_pro, others get master
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

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

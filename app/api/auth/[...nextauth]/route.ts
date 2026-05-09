import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitlabProvider from 'next-auth/providers/gitlab'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Wrap NextAuth to handle database connection errors gracefully
export const authOptions: import('next-auth').NextAuthOptions = {
  providers: [
    GitlabProvider({
      clientId: process.env.GITLAB_CLIENT_ID || '',
      clientSecret: process.env.GITLAB_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user in database
          const user = await prisma.users.findUnique({
            where: { email: credentials.email },
            include: { subscriptions: true },
          })

          if (!user || !user.passwordHash) {
            return null
          }

          // Verify password
          const passwordValid = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!passwordValid) {
            return null
          }

          // Update last login
          await prisma.users.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            tier: 'master', // All authenticated users get master tier for testing
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'consciousness-evolution-secret-dev-only',
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'gitlab') {
        const email = profile?.email || user?.email
        if (!email) {
          console.error('GitLab login failed: No email provided')
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
                provider: 'gitlab',
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
          console.error('Error during GitLab sign-in mapping:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'gitlab') {
          try {
            const dbUser = await prisma.users.findUnique({
              where: { email: user.email! },
            })
            if (dbUser) {
              token.id = dbUser.id
            }
          } catch (error) {
            console.error('Error resolving database user ID for GitLab:', error)
          }
        } else {
          token.id = user.id
        }
        token.tier = 'master' // Ensure master tier for all authenticated users
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        const sessionUser = session.user as typeof session.user & {
          id?: string
          tier?: unknown
        }
        sessionUser.id = token.id as string
        sessionUser.tier = token.tier
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

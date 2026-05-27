import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import YieldHub from './YieldHub'

export const dynamic = 'force-dynamic'

export default async function YieldPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user
    ? {
        id: (session.user as { id?: string }).id,
        name: session.user.name || null,
        email: session.user.email || null,
      }
    : null

  return <YieldHub user={user} />
}

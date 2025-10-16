import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Allow guest access to all routes (auth is optional)
    return null
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow guest access to all routes in matcher
        // Authentication provides enhanced features but is not required
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/monica/:path*',
    '/gallery/:path*',
    '/rune-forge/:path*',
    '/philosophers-stone/:path*',
    '/time-laboratory/:path*',
  ],
}

import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Allow access to dashboard for development (guest users supported)
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      return null // Allow access
    }

    // For other protected routes, require authentication
    return null
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to dashboard even without token (guest access)
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return true
        }

        // For other routes, require authentication
        return !!token
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

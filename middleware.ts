export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/monica/:path*',
    '/gallery/:path*',
    '/rune-forge/:path*',
    '/philosophers-stone/:path*',
    '/time-laboratory/:path*'
  ]
}

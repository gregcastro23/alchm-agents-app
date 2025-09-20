import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

export async function getCurrentUser(req?: NextRequest) {
  try {
    // For now, return null in development since NextAuth isn't fully configured
    // This allows the system to work with anonymous users
    return null
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
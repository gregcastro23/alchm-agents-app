import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(prefix?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`
}

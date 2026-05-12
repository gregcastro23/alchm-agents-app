import { NextResponse } from 'next/server'

export async function GET() {
  throw new Error('Test error')
}
export async function POST() {
  throw new Error('Test error POST')
}

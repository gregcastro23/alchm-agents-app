// API endpoint to migrate static agents to database
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'Migration disabled in Path C',
    timestamp: new Date().toISOString(),
  })
}

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Migration disabled in Path C',
    timestamp: new Date().toISOString(),
  })
}

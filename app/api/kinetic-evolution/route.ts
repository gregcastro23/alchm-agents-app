import { NextRequest, NextResponse } from 'next/server'
import { routeTask } from '../../../../lib/agents/router'

export async function POST(req: NextRequest) {
  try {
    const { agentId, location } = await req.json()

    const result = await routeTask({
      kind: 'kinetics',
      payload: {
        agentId,
        location: location || { lat: 37.7749, lon: -122.4194 },
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Kinetic evolution API error:', error)
    return NextResponse.json({ error: 'Failed to fetch kinetic evolution data' }, { status: 500 })
  }
}

import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/monica-agent/train-alchemical/route'

describe('Monica Train Alchemical Route', () => {
  it('returns explicit backend-unavailable status for POST', async () => {
    const request = new NextRequest('http://localhost/api/monica-agent/train-alchemical', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'standard',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(501)
    expect(data.success).toBe(false)
    expect(data.error).toBe('MONICA_TRAINING_UNAVAILABLE')
  })

  it('returns explicit backend-unavailable status for sample GET', async () => {
    const request = new NextRequest(
      'http://localhost/api/monica-agent/train-alchemical?mode=sample',
      {
        method: 'GET',
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(501)
    expect(data.success).toBe(false)
    expect(data.error).toBe('MONICA_TRAINING_UNAVAILABLE')
  })
})

// app/api/monica-agent/train-alchemical/route.ts
//
// The training pipeline (`@/lib/monica/alchemical-trainer`) was deleted as part
// of the Railway backend migration. The route is preserved with stubbed
// responses so the frontend's request/response contract still works; once
// the training service is reimplemented on Railway this route should call it.
import { NextResponse } from 'next/server'

const UNAVAILABLE_PAYLOAD = {
  status: 'unavailable',
  message: 'training migrated to Railway backend',
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      mode = 'standard', // 'standard', 'hourly', 'retrograde'
      exportFormat, // 'json', 'csv', 'summary'
    } = body

    // Build a placeholder payload that matches the legacy shape consumers
    // already destructure (statistics/patterns/insights/samples/metadata),
    // so the frontend renders an empty/unavailable state instead of crashing.
    const stubResults: any = {
      ...UNAVAILABLE_PAYLOAD,
      metadata: { numSamples: 0, mode },
      statistics: { averages: {} },
      patterns: [],
      insights: [],
      samples: [],
    }

    let formattedResults: any = stubResults
    if (exportFormat === 'summary') {
      formattedResults = {
        ...UNAVAILABLE_PAYLOAD,
        mode,
        timestamp: new Date().toISOString(),
        summary: {
          numSamples: 0,
          statistics: {},
          patterns: [],
          topInsights: [],
        },
      }
    } else if (exportFormat === 'csv') {
      formattedResults = {
        ...UNAVAILABLE_PAYLOAD,
        csv: 'hour,spirit,essence,matter,substance,heat,entropy',
        metadata: stubResults.metadata,
      }
    }

    return NextResponse.json({
      success: true,
      ...UNAVAILABLE_PAYLOAD,
      mode,
      data: formattedResults,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Alchemical training error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error occurred',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

// Add GET endpoint for retrieving cached results
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode') || 'info'

    if (mode === 'info') {
      return NextResponse.json({
        success: true,
        info: {
          description: "Monica's Alchemical Training System",
          version: '2.0',
          capabilities: [
            'Standard training with statistical analysis',
            'Hourly alchemical calculations',
            'Retrograde impact analysis',
            'Multiple export formats (JSON, CSV, Summary)',
            'Planetary hour integration',
            'Location-based calculations',
            'Pattern recognition and insights',
          ],
          endpoints: {
            POST: {
              parameters: {
                mode: ['standard', 'hourly', 'retrograde'],
                numSamples: 'number (1-1000)',
                location: '{ latitude: number, longitude: number }',
                exportFormat: ['json', 'csv', 'summary'],
              },
            },
            GET: {
              parameters: {
                mode: ['info', 'sample'],
              },
            },
          },
        },
      })
    } else if (mode === 'sample') {
      // Training is unavailable post-migration; return an empty stub that
      // mirrors the previous shape so the frontend's destructuring is safe.
      return NextResponse.json({
        success: true,
        ...UNAVAILABLE_PAYLOAD,
        sample: {
          statistics: {},
          firstInsight: null,
          patterns: [],
        },
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid mode parameter',
      },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

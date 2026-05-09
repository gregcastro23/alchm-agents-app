import { NextResponse } from 'next/server'

const UNAVAILABLE_MESSAGE =
  'Monica alchemical training is not exposed by the current backend surface.'

export async function POST(req: Request) {
  try {
    await req.json()

    return NextResponse.json({
      success: false,
      error: 'MONICA_TRAINING_UNAVAILABLE',
      message: UNAVAILABLE_MESSAGE,
      backendRequired: true,
    }, { status: 501 })
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
          status: 'unavailable',
          backendRequired: true,
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
      return NextResponse.json({
        success: false,
        error: 'MONICA_TRAINING_UNAVAILABLE',
        message: UNAVAILABLE_MESSAGE,
        backendRequired: true,
      }, { status: 501 })
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

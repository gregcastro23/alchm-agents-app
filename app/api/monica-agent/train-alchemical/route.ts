// app/api/monica-agent/train-alchemical/route.ts
import { NextResponse } from 'next/server';
import { 
  trainOnAlchemicalValues, 
  todayHourlyAlchemize,
  trainWithRetrogrades 
} from '@/lib/monica/alchemical-trainer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      mode = 'standard', // 'standard', 'hourly', 'retrograde'
      numSamples = 15,
      location,
      exportFormat // 'json', 'csv', 'summary'
    } = body;
    
    let results;
    
    switch (mode) {
      case 'hourly':
        results = await todayHourlyAlchemize(location);
        break;
        
      case 'retrograde':
        results = await trainWithRetrogrades(numSamples);
        break;
        
      default:
        results = await trainOnAlchemicalValues(numSamples);
    }
    
    // Format results based on export format
    let formattedResults = results;
    if (exportFormat === 'summary') {
      formattedResults = {
        mode,
        timestamp: new Date().toISOString(),
        summary: {
          numSamples: results.metadata?.numSamples || numSamples,
          statistics: results.statistics?.averages,
          patterns: results.patterns,
          topInsights: results.insights?.slice(0, 5)
        }
      };
    } else if (exportFormat === 'csv') {
      // Create CSV format for samples
      if (results.samples && results.samples.length > 0) {
        const headers = ['hour', 'spirit', 'essence', 'matter', 'substance', 'heat', 'entropy'];
        const rows = results.samples.map((s: any) => {
          return [
            s.hour || s.birthInfo?.hour || 0,
            s.spirit || s.alchmData?.spirit || 0,
            s.essence || s.alchmData?.essence || 0,
            s.matter || s.alchmData?.matter || 0,
            s.substance || s.alchmData?.substance || 0,
            s.heat || s.alchmData?.Heat || 0,
            s.entropy || s.alchmData?.Entropy || 0
          ].join(',');
        });
        formattedResults = {
          csv: [headers.join(','), ...rows].join('\n'),
          metadata: results.metadata
        };
      }
    }
    
    return NextResponse.json({ 
      success: true,
      mode,
      data: formattedResults,
      message: `Alchemical training complete - ${mode} analysis with refined insights!`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Alchemical training error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Add GET endpoint for retrieving cached results
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'info';
    
    if (mode === 'info') {
      return NextResponse.json({
        success: true,
        info: {
          description: 'Monica\'s Alchemical Training System',
          version: '2.0',
          capabilities: [
            'Standard training with statistical analysis',
            'Hourly alchemical calculations',
            'Retrograde impact analysis',
            'Multiple export formats (JSON, CSV, Summary)',
            'Planetary hour integration',
            'Location-based calculations',
            'Pattern recognition and insights'
          ],
          endpoints: {
            POST: {
              parameters: {
                mode: ['standard', 'hourly', 'retrograde'],
                numSamples: 'number (1-1000)',
                location: '{ latitude: number, longitude: number }',
                exportFormat: ['json', 'csv', 'summary']
              }
            },
            GET: {
              parameters: {
                mode: ['info', 'sample']
              }
            }
          }
        }
      });
    } else if (mode === 'sample') {
      // Return a small sample for testing
      const sampleResult = await trainOnAlchemicalValues(3);
      return NextResponse.json({
        success: true,
        sample: {
          statistics: sampleResult.statistics.averages,
          firstInsight: sampleResult.insights[0],
          patterns: sampleResult.patterns
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid mode parameter'
    }, { status: 400 });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
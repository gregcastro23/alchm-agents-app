import { getRealPlanetaryPositions } from '../src/services/alchm-client.js'

async function main(): Promise<void> {
  try {
    const nyc = { lat: 40.7128, lon: -74.0060 }
    const data = await getRealPlanetaryPositions(nyc)
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ success: true, location: nyc, data }, null, 2))
    process.exit(0)
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ success: false, error: error?.message || String(error) }, null, 2))
    process.exit(1)
  }
}

void main()



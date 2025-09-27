// Quick test to verify the planetary positions hook fix
const fetch = require('node-fetch')

async function testPlanetaryHook() {
  console.log('Testing planetary positions API...')

  try {
    const response = await fetch('http://localhost:3000/api/philosophers-stone/positions')
    const data = await response.json()

    console.log('✅ API Response Status:', response.status)
    console.log('✅ Has planetary positions:', !!data.planetaryPositions)
    console.log('✅ Has alchemical quantities:', !!data.alchmQuantities)
    console.log('✅ Sample position:', data.planetaryPositions?.[0])
    console.log('✅ Sample alchemical data:', data.alchmQuantities)
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testPlanetaryHook()

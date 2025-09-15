// Simple test to verify API fallback functionality
const { fetchAlchmAlchemize, fetchAstrologizeWheel } = require('./lib/astrologize.ts')

async function testAPIFallback() {
  console.log('🧪 Testing API Fallback Functionality...')

  const testBirth = {
    name: "Test User",
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    latitude: 40.7128,
    longitude: -74.0060
  }

  try {
    console.log('📊 Testing Alchemize API fallback...')
    const alchmResult = await fetchAlchmAlchemize(testBirth)
    console.log('✅ Alchemize Result:', {
      spirit: alchmResult.spirit,
      essence: alchmResult.essence,
      matter: alchmResult.matter,
      substance: alchmResult.substance,
      isFallback: alchmResult.meta?.fallback,
      isDegraded: alchmResult.meta?.degraded
    })
  } catch (error) {
    console.log('❌ Alchemize Error:', error.message)
  }

  try {
    console.log('🔮 Testing Astrologize API fallback...')
    const astroResult = await fetchAstrologizeWheel(testBirth)
    console.log('✅ Astrologize Result:', {
      hasSvg: !!astroResult.svg,
      hasImage: !!astroResult.imageUrl,
      isFallback: astroResult.meta?.fallback,
      isDegraded: astroResult.meta?.degraded
    })
  } catch (error) {
    console.log('❌ Astrologize Error:', error.message)
  }

  console.log('✨ Fallback test complete!')
}

// Run the test
testAPIFallback().catch(console.error)

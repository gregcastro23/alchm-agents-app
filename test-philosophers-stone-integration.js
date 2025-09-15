const { fetchAlchmAlchemize, fetchAstrologizeWheel } = require('./lib/astrologize.ts')

async function testPhilosophersStoneIntegration() {
  console.log("🧪 Testing Philosopher's Stone Integration...")

  // Test current moment birth info
  const currentMomentBirth = {
    name: 'Current Moment',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    hour: new Date().getHours(),
    minute: new Date().getMinutes(),
    latitude: 40.7128,
    longitude: -74.006,
  }

  console.log('📊 Testing Alchemize API...')
  try {
    const alchmQuantities = await fetchAlchmAlchemize(currentMomentBirth)
    console.log('✅ Alchemize API Success:', {
      spirit: alchmQuantities.spirit,
      essence: alchmQuantities.essence,
      matter: alchmQuantities.matter,
      substance: alchmQuantities.substance,
    })
  } catch (error) {
    console.log('❌ Alchemize API Error:', error.message)
  }

  console.log('🔮 Testing Astrologize API...')
  try {
    const horoscope = await fetchAstrologizeWheel(currentMomentBirth)
    console.log('✅ Astrologize API Success:', {
      hasSvg: !!horoscope.svg,
      hasImage: !!horoscope.imageUrl,
      meta: horoscope.meta,
    })
  } catch (error) {
    console.log('❌ Astrologize API Error:', error.message)
  }

  console.log('✨ Integration test complete!')
}

// Run the test
testPhilosophersStoneIntegration().catch(console.error)

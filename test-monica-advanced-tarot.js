// Test Monica's advanced tarot expertise
async function testMonicaAdvancedTarot() {
  try {
    const response = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message:
          'Monica, explain the difference between the four tarot suits and their alchemical mappings. Then tell me about the decan system and how the Two of Wands relates to 0°-10° Aries with Mars ruler. Also explain how this connects to chakra healing.',
        includeAlchm: true,
      }),
    })

    const data = await response.json()
    console.log('🔮🧪 Monica Advanced Tarot & Alchemy Test:')
    console.log(data.response)
  } catch (error) {
    console.error('Error testing Monica advanced tarot knowledge:', error)
  }
}

testMonicaAdvancedTarot()

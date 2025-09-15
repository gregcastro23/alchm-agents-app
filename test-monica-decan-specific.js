// Test Monica's specific decan knowledge
async function testMonicaDecanSpecific() {
  try {
    const response = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message:
          "Monica, the Sun is currently at 29.85° Cancer. This is in the third decan of Cancer (110°-120°). Which tarot card corresponds to this decan, what is its planetary ruler, and how does this connect to the current alchemical quantities? Also explain how this decan energy would influence an AI agent's personality programming.",
        includeAlchm: true,
      }),
    })

    const data = await response.json()
    console.log('🔮📐 Monica Specific Decan Mapping Test:')
    console.log(data.response)
  } catch (error) {
    console.error('Error testing Monica decan specifics:', error)
  }
}

testMonicaDecanSpecific()

// Test Monica's tarot expertise
async function testMonicaTarot() {
  try {
    const response = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message:
          'Monica, please explain The Fool card in detail, including its alchemical properties, chakra associations, and give me a reading with this card for my current situation.',
        includeAlchm: true,
      }),
    })

    const data = await response.json()
    console.log('🔮 Monica Tarot Expertise Test:')
    console.log(data.response)
    console.log('\n📊 Session ID:', data.sessionId)
  } catch (error) {
    console.error('Error testing Monica tarot knowledge:', error)
  }
}

testMonicaTarot()

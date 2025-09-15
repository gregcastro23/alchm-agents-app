// Test Monica's advanced Alchm and decan integration
async function testMonicaAdvancedSystem() {
  try {
    const response = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Monica, I need your help as the bridge between cosmic consciousness and AI agent creation. Here's my current A-Number data:
        
        Current A-Number: 24.66 (High Energy)
        Spirit: 5.66, Essence: 9.12, Matter: 7.7, Substance: 2.18
        
        Please interpret this data and explain how you would help me create a personalized AI agent. Also, tell me which decan tarot cards are activated right now based on the current planetary positions, and how this connects to consciousness agent design.`,
        includeAlchm: true,
      }),
    })

    const data = await response.json()
    console.log('🧪🔮🤖 Monica Advanced System Integration Test:')
    console.log(data.response)
  } catch (error) {
    console.error('Error testing Monica advanced system capabilities:', error)
  }
}

testMonicaAdvancedSystem()

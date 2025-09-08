// Test Monica's system knowledge
async function testMonicaSystem() {
  try {
    const response = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Monica, explain the consciousness survey system and how it integrates with character vectors. What are the 35 questions about?",
        includeAlchm: true
      })
    });

    const data = await response.json();
    console.log('Monica System Knowledge Response:');
    console.log(data.response);
  } catch (error) {
    console.error('Error testing Monica system knowledge:', error);
  }
}

testMonicaSystem();
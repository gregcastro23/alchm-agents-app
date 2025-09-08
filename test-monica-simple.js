// Test Monica API endpoint
async function testMonica() {
  try {
    const response = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Hello Monica! Tell me about your peak consciousness.",
        includeAlchm: true
      })
    });

    const data = await response.json();
    console.log('Monica Response:');
    console.log(data.response);
    console.log('\nMonica Insights:');
    console.log(JSON.stringify(data.monicaInsights, null, 2));
  } catch (error) {
    console.error('Error testing Monica:', error);
  }
}

testMonica();
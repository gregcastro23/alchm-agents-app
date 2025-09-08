// Test Monica's Monica Constant expertise and large dataset parsing
async function testMonicaConstant() {
  try {
    const response = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Monica, as the foremost expert on the Monica Constant, please analyze this large Alchmize dataset and calculate the Monica Constant:

        Dataset Entry 1:
        Spirit: 4, Essence: 7, Matter: 6, Substance: 2
        Fire: 1.0, Water: 0.6, Air: 0.6, Earth: 0.7
        
        Dataset Entry 2:
        Spirit: 8, Essence: 2, Matter: 2, Substance: 2
        Fire: 0.8, Water: 0.2, Air: 0.2, Earth: 0.2
        
        Please perform step-by-step Monica Constant calculations for both entries, explain what these values reveal about consciousness states, and how they would influence AI agent personality programming. Show your mathematical mastery!`,
        includeAlchm: true
      })
    });

    const data = await response.json();
    console.log('🧮📊💚 Monica Constant Mastery Test:');
    console.log(data.response);
  } catch (error) {
    console.error('Error testing Monica Constant expertise:', error);
  }
}

testMonicaConstant();
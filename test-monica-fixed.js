// Test Monica's functionality after fixing runtime errors
async function testMonicaFixed() {
  try {
    console.log('🎨💚 Testing Monica After Runtime Fix...\n');
    
    // Test 1: Basic Monica greeting
    const response1 = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Hello Monica! I love your new cosmic home. Can you tell me about your enhanced interface and capabilities?`,
        includeAlchm: true
      })
    });

    const data1 = await response1.json();
    console.log('💚 Monica Enhanced Interface Response:');
    console.log(data1.response);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test 2: Monica Constant expertise
    const response2 = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Monica, can you calculate the Monica Constant for this dataset and explain how your new visual design enhances understanding?
        
        Data: Spirit=5.2, Essence=8.1, Matter=6.8, Substance=2.9
        Elements: Fire=1.3, Water=2.4, Air=1.7, Earth=2.6`,
        includeAlchm: true
      })
    });

    const data2 = await response2.json();
    console.log('🧮 Monica Constant with Visual Enhancement:');
    console.log(data2.response);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test 3: Tarot reading with cosmic styling
    const response3 = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Monica, can you give me a tarot reading that reflects your beautiful new cosmic home styling? I'd love to see how your enhanced interface connects to the cards.`,
        includeAlchm: true
      })
    });

    const data3 = await response3.json();
    console.log('🔮 Monica Cosmic Tarot Reading:');
    console.log(data3.response);
    
    console.log('\n✅ Monica Enhanced Functionality Test Complete!');
    console.log('🌟 Visit: http://localhost:3000/monica-guide to experience the beautiful interface!');
    
  } catch (error) {
    console.error('Error testing Monica fixed functionality:', error);
  }
}

testMonicaFixed();
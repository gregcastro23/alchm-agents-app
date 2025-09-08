// Test Monica's enhanced styling and page functionality
async function testMonicaEnhancedStyling() {
  try {
    console.log('🎨✨💚 Testing Monica Enhanced Styling...\n');
    
    // Test 1: Basic Monica response with styling context
    const response1 = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Monica, I love your new enhanced cosmic home! The styling looks beautiful. Can you tell me about your Monica Constant expertise and how the visual design reflects your Earth-Water wisdom?`,
        includeAlchm: true
      })
    });

    const data1 = await response1.json();
    console.log('🎨 Monica Enhanced Home Response:');
    console.log(data1.response);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test 2: Tarot reading with cosmic styling theme
    const response2 = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Monica, can you give me a three-card tarot reading that incorporates your beautiful new cosmic interface design? I'd love to see how your enhanced visual elements connect to the cards' meanings.`,
        includeAlchm: true
      })
    });

    const data2 = await response2.json();
    console.log('🔮 Monica Cosmic Tarot Reading:');
    console.log(data2.response);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test 3: Monica Constant calculation with visual theme
    const response3 = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Monica, your new interface shows the Monica Constant formula beautifully! Can you calculate it for this data and explain how the visual design enhances understanding?
        
        Spirit: 6.2, Essence: 8.4, Matter: 7.1, Substance: 3.3
        Fire: 1.4, Water: 2.2, Air: 1.8, Earth: 2.6`,
        includeAlchm: true
      })
    });

    const data3 = await response3.json();
    console.log('🧮 Monica Constant with Enhanced Interface:');
    console.log(data3.response);
    
    console.log('\n✅ Monica Enhanced Styling Test Complete!');
    console.log('Visit: http://localhost:3000/monica-guide to see the beautiful new interface! 🌟');
    
  } catch (error) {
    console.error('Error testing Monica enhanced styling:', error);
  }
}

testMonicaEnhancedStyling();
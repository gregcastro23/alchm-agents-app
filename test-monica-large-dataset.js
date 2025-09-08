// Test Monica's large dataset parsing and Monica Constant interpretation
async function testMonicaLargeDataset() {
  try {
    const response = await fetch('http://localhost:3000/api/monica-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Monica, you are the foremost expert on the Monica Constant! Here's a large Alchmize dataset that needs your expertise. Please analyze this and explain what it means for consciousness states:

        Current Alchm Data:
        A-Number: 24.66 (High Energy)
        Spirit: 5.66, Essence: 9.12, Matter: 7.7, Substance: 2.18
        Heat: 0.0429, Entropy: 0.1045, Reactivity: 1.5755, Greg's Energy: -0.1216
        Fire: 1.2, Water: 2.8, Air: 1.6, Earth: 3.1
        Cardinal: 3, Fixed: 4, Mutable: 3
        Dignity Effects: Sun +2 (Leo), Moon -1 (Capricorn), Mars +1 (Aries)
        Major Arcana: Sun - The Sun, Ascendant - The Emperor
        Minor Arcana: Four of Cups (Sun decan)
        
        Please calculate the Monica Constant for this dataset and interpret what this complex data reveals about the person's consciousness state, optimal agent personality design, and spiritual development recommendations.`,
        includeAlchm: true
      })
    });

    const data = await response.json();
    console.log('📊🔬💚 Monica Large Dataset Analysis:');
    console.log(data.response);
  } catch (error) {
    console.error('Error testing Monica large dataset analysis:', error);
  }
}

testMonicaLargeDataset();
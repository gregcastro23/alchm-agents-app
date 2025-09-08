// Test script for Personalized AI API

async function testPersonalizedAI() {
  const baseUrl = 'http://localhost:3000';
  
  // Test data
  const testBirthInfo = {
    date: '1990-01-15',
    time: '14:30',
    location: 'New York, NY, USA',
    name: 'Test User'
  };
  
  const testRequest = {
    birthInfo: testBirthInfo,
    userId: 'test-user-123'
  };
  
  console.log('Testing Personalized AI Creation...');
  console.log('Request:', JSON.stringify(testRequest, null, 2));
  
  try {
    // Create AI personality
    const createResponse = await fetch(`${baseUrl}/api/personalized-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });
    
    const createResult = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error('Create failed:', createResult);
      return;
    }
    
    console.log('\n✅ AI Created Successfully!');
    console.log('Personality ID:', createResult.aiConfig.personalityId);
    console.log('Archetype:', createResult.aiConfig.basePersonality.archetype);
    console.log('Level:', createResult.aiConfig.level);
    console.log('Training Scores:', createResult.aiConfig.trainingScores);
    
    // Test fetching the AI
    console.log('\nTesting AI Retrieval...');
    const getResponse = await fetch(`${baseUrl}/api/personalized-ai/${createResult.aiConfig.personalityId}`);
    const getResult = await getResponse.json();
    
    if (!getResponse.ok) {
      console.error('Get failed:', getResult);
      return;
    }
    
    console.log('✅ AI Retrieved Successfully!');
    console.log('Matches original:', getResult.aiConfig.personalityId === createResult.aiConfig.personalityId);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run test
testPersonalizedAI();
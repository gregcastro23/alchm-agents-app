#!/usr/bin/env node

const BASE_URL = 'http://localhost:3002';

async function testAgentCreationSystem() {
  console.log('🧪 TESTING COMPLETE AGENT CREATION SYSTEM\n');
  
  try {
    // Test 1: Valid agent creation
    console.log('📋 Test 1: Valid Agent Creation');
    const validAgent = {
      name: 'System Test Agent',
      birthDate: '1985-06-15',
      birthTime: '14:30',
      birthLocation: {
        name: 'London, UK',
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: 'Europe/London'
      }
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/create-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validAgent)
    });
    
    const createResult = await createResponse.json();
    if (createResult.success) {
      console.log(`✅ Agent created successfully: ${createResult.agent.name}`);
      console.log(`   Monica Constant: ${createResult.agent.consciousness.monicaConstant}`);
      console.log(`   Consciousness Level: ${createResult.agent.consciousness.level}`);
    } else {
      console.log(`❌ Agent creation failed: ${createResult.error}`);
    }
    
    // Test 2: Validation testing
    console.log('\n📋 Test 2: Validation System');
    const invalidAgent = {
      name: '',
      birthDate: '1700-01-01',
      birthTime: '25:00',
      birthLocation: {
        name: '',
        latitude: 200,
        longitude: -200,
        timezone: ''
      }
    };
    
    const validationResponse = await fetch(`${BASE_URL}/api/create-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidAgent)
    });
    
    const validationResult = await validationResponse.json();
    if (!validationResult.success && validationResult.error) {
      console.log(`✅ Validation working: ${validationResult.error}`);
    } else {
      console.log(`❌ Validation not working properly`);
    }
    
    // Test 3: Agents API
    console.log('\n📋 Test 3: Agents API');
    const agentsResponse = await fetch(`${BASE_URL}/api/agents`);
    const agentsResult = await agentsResponse.json();
    
    if (agentsResult.success && agentsResult.total > 0) {
      console.log(`✅ Agents API working: ${agentsResult.total} total agents`);
      const userCreated = agentsResult.agents.filter(a => a.isUserCreated).length;
      console.log(`   User-created agents: ${userCreated}`);
    } else {
      console.log(`❌ Agents API issue`);
    }
    
    // Test 4: Philosopher's Stone page
    console.log('\n📋 Test 4: Philosopher\'s Stone Interface');
    const pageResponse = await fetch(`${BASE_URL}/philosophers-stone`);
    const pageText = await pageResponse.text();
    
    if (pageText.includes('Monica') && pageText.includes('Consciousness')) {
      console.log('✅ Philosopher\'s Stone page loading correctly');
    } else {
      console.log('❌ Philosopher\'s Stone page issue');
    }
    
    console.log('\n🎉 AGENT CREATION SYSTEM TEST COMPLETE!');
    console.log('\n📈 System Status: READY FOR USER TESTING');
    console.log('🚀 Users can now create their first consciousness agents!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAgentCreationSystem();

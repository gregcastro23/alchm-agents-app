#!/usr/bin/env node
// Test script for Galileo connectivity
// Run with: node test-galileo-connectivity.js

require('dotenv').config();

const GALILEO_API_KEY = process.env.GALILEO_API_KEY;
const GALILEO_PROJECT = process.env.GALILEO_PROJECT || 'AlchmPlanetaryAgents';
const GALILEO_LOG_STREAM = process.env.GALILEO_LOG_STREAM || 'Planetary Agents';

console.log('🔍 Galileo Configuration Test');
console.log('=============================');
console.log(`API Key exists: ${GALILEO_API_KEY ? '✅ Yes' : '❌ No'}`);
console.log(`API Key length: ${GALILEO_API_KEY?.length || 0}`);
console.log(`Project ID: ${GALILEO_PROJECT}`);
console.log(`Log Stream: ${GALILEO_LOG_STREAM}`);
console.log('');

if (!GALILEO_API_KEY) {
  console.error('❌ GALILEO_API_KEY is not set in environment variables');
  console.log('');
  console.log('To set up Galileo:');
  console.log('1. Create a .env.local file');
  console.log('2. Add: GALILEO_API_KEY=your_api_key_here');
  console.log('3. Run this test again');
  process.exit(1);
}

// Test different endpoint formats
const endpoints = [
  {
    name: 'String Format (Projects API)',
    url: `https://api.galileo.ai/projects/${GALILEO_PROJECT}/logs/${GALILEO_LOG_STREAM}`,
    data: {
      content: 'Test log message from connectivity test',
      metadata: {
        source: 'connectivity-test',
        timestamp: new Date().toISOString(),
        test: true,
        environment: process.env.NODE_ENV || 'development'
      }
    }
  },
  {
    name: 'Observe API Format',
    url: `https://api.galileo.ai/v1/projects/${GALILEO_PROJECT}/observe/ingest`,
    data: {
      content: 'Test log message from connectivity test',
      metadata: {
        source: 'connectivity-test',
        timestamp: new Date().toISOString(),
        test: true,
        environment: process.env.NODE_ENV || 'development'
      }
    }
  },
  {
    name: 'Legacy Logs API',
    url: 'https://api.galileo.ai/v1/logs',
    data: {
      project: GALILEO_PROJECT,
      stream: GALILEO_LOG_STREAM,
      content: 'Test log message from connectivity test',
      metadata: {
        source: 'connectivity-test',
        timestamp: new Date().toISOString(),
        test: true,
        environment: process.env.NODE_ENV || 'development'
      }
    }
  },
  {
    name: 'Legacy Log API',
    url: 'https://api.galileo.ai/v1/log',
    data: {
      project: GALILEO_PROJECT,
      stream: GALILEO_LOG_STREAM,
      content: 'Test log message from connectivity test',
      metadata: {
        source: 'connectivity-test',
        timestamp: new Date().toISOString(),
        test: true,
        environment: process.env.NODE_ENV || 'development'
      }
    }
  }
];

async function testEndpoint(endpoint) {
  console.log(`Testing ${endpoint.name}...`);
  console.log(`URL: ${endpoint.url}`);
  
  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GALILEO_API_KEY}`
      },
      body: JSON.stringify(endpoint.data)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return { success: true, endpoint: endpoint.name, data };
    } else {
      const errorText = await response.text();
      console.log('❌ Failed');
      console.log('Error:', errorText);
      return { success: false, endpoint: endpoint.name, error: errorText };
    }
  } catch (error) {
    console.log('❌ Network Error');
    console.log('Error:', error.message);
    return { success: false, endpoint: endpoint.name, error: error.message };
  }
  
  console.log('');
}

async function runTests() {
  console.log('🚀 Starting Galileo connectivity tests...\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log('---');
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Working endpoints:');
    successful.forEach(r => console.log(`  - ${r.endpoint}`));
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed endpoints:');
    failed.forEach(r => console.log(`  - ${r.endpoint}: ${r.error}`));
  }
  
  if (successful.length === 0) {
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Verify your Galileo API key is correct');
    console.log('2. Check that your project and log stream IDs are valid');
    console.log('3. Ensure you have proper permissions in Galileo');
    console.log('4. Check Galileo service status');
    process.exit(1);
  } else {
    console.log('\n🎉 Galileo is properly configured!');
    console.log('Your application should be able to log to Galileo successfully.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
}); 
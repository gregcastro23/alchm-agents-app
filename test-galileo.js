// Test script to check Galileo connectivity
require('dotenv').config();

const GALILEO_API_KEY = process.env.GALILEO_API_KEY;
const GALILEO_PROJECT = process.env.GALILEO_PROJECT || '1e7fd4a1-3e28-4fe1-a719-744f239a13be';
const GALILEO_LOG_STREAM = process.env.GALILEO_LOG_STREAM || '6ed50263-a348-4ad6-ab63-bd04d3a4ffdd';

console.log('Testing Galileo API connectivity:');
console.log(`API Key exists: ${!!GALILEO_API_KEY}`);
console.log(`API Key length: ${GALILEO_API_KEY?.length || 0}`);
console.log(`Project ID: ${GALILEO_PROJECT}`);
console.log(`Log Stream: ${GALILEO_LOG_STREAM}`);

// Test sending a log
async function testGalileoLog() {
  try {
    const logData = {
      project: GALILEO_PROJECT,
      stream: GALILEO_LOG_STREAM,
      content: 'Test log message',
      metadata: {
        source: 'test-script',
        timestamp: new Date().toISOString(),
        environment: 'development'
      }
    };

    console.log('Sending log data to Galileo:', JSON.stringify(logData, null, 2));

    const response = await fetch('https://api.galileo.ai/v1/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GALILEO_API_KEY}`
      },
      body: JSON.stringify(logData)
    });

    if (!response.ok) {
      console.error(`Galileo API responded with status: ${response.status}`);
      console.error('Response text:', await response.text());
      return;
    }

    const responseData = await response.json();
    console.log('Galileo API response:', responseData);
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error testing Galileo API:', error);
  }
}

// Run the test
testGalileoLog(); 
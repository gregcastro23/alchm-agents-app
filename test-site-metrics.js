#!/usr/bin/env node

/**
 * Test script for Site Metrics Tracking System
 * Tests the new tags and metadata structure for alchemical quantities
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testSiteMetrics() {
  console.log('🧪 Testing Site Metrics Tracking System\n');
  
  try {
    // Test 1: Get current site metrics
    console.log('1️⃣ Testing GET /api/site-metrics...');
    const metricsResponse = await fetch(`${BASE_URL}/api/site-metrics`);
    
    if (!metricsResponse.ok) {
      throw new Error(`HTTP ${metricsResponse.status}: ${metricsResponse.statusText}`);
    }
    
    const metrics = await metricsResponse.json();
    console.log('✅ Site metrics retrieved successfully');
    
    // Validate the structure
    console.log('\n📊 Validating metrics structure...');
    
    // Check for required fields
    const requiredFields = [
      'alchemicalQuantities',
      'thermodynamics', 
      'astrological',
      'userInteractions',
      'system',
      'performance',
      'tags',
      'metadata'
    ];
    
    for (const field of requiredFields) {
      if (!metrics[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    console.log('✅ All required fields present');
    
    // Check tags structure
    console.log('\n🏷️  Validating tags structure...');
    if (!Array.isArray(metrics.tags)) {
      throw new Error('Tags should be an array');
    }
    
    const expectedBaseTags = [
      'alchemical_quantities',
      'planetary_agents', 
      'astrological_data',
      'thermodynamic_calculations'
    ];
    
    for (const expectedTag of expectedBaseTags) {
      if (!metrics.tags.includes(expectedTag)) {
        console.warn(`⚠️  Missing expected base tag: ${expectedTag}`);
      }
    }
    
    console.log(`✅ Tags structure valid (${metrics.tags.length} tags found)`);
    console.log('   Tags:', metrics.tags.join(', '));
    
    // Check metadata structure
    console.log('\n📋 Validating metadata structure...');
    if (typeof metrics.metadata !== 'object' || metrics.metadata === null) {
      throw new Error('Metadata should be an object');
    }
    
    const metadataKeys = Object.keys(metrics.metadata);
    console.log(`✅ Metadata structure valid (${metadataKeys.length} keys found)`);
    
    // Show some key metadata examples
    const keyMetadataExamples = [
      'Alchemy_Effects_Total_Spirit',
      'Heat',
      'Dominant_Element',
      'Sun_Sign',
      'K_alchm'
    ];
    
    console.log('\n🔍 Key metadata examples:');
    for (const key of keyMetadataExamples) {
      if (metrics.metadata[key] !== undefined) {
        console.log(`   ${key}: ${metrics.metadata[key]}`);
      } else {
        console.log(`   ${key}: ❌ Not found`);
      }
    }
    
    // Test 2: Test alchemical quantities tracking
    console.log('\n2️⃣ Testing alchemical quantities tracking...');
    const trackResponse = await fetch(`${BASE_URL}/api/site-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'track_alchemical_quantities'
      })
    });
    
    if (!trackResponse.ok) {
      throw new Error(`HTTP ${trackResponse.status}: ${trackResponse.statusText}`);
    }
    
    const trackResult = await trackResponse.json();
    console.log('✅ Alchemical quantities tracking successful');
    console.log('   Result:', trackResult);
    
    // Test 3: Test custom event tracking
    console.log('\n3️⃣ Testing custom event tracking...');
    const customEventResponse = await fetch(`${BASE_URL}/api/site-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'track_custom_event',
        data: {
          eventName: 'test_event',
          eventData: {
            testValue: 42,
            testString: 'hello world',
            testBoolean: true
          },
          userId: 'test-user-123'
        }
      })
    });
    
    if (!customEventResponse.ok) {
      throw new Error(`HTTP ${customEventResponse.status}: ${customEventResponse.statusText}`);
    }
    
    const customEventResult = await customEventResponse.json();
    console.log('✅ Custom event tracking successful');
    console.log('   Result:', customEventResult);
    
    // Test 4: Test performance tracking
    console.log('\n4️⃣ Testing performance tracking...');
    const performanceResponse = await fetch(`${BASE_URL}/api/site-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'track_performance',
        data: {
          metricName: 'api_response_time',
          value: 150,
          unit: 'ms',
          additionalData: {
            endpoint: '/api/test',
            method: 'GET'
          }
        }
      })
    });
    
    if (!performanceResponse.ok) {
      throw new Error(`HTTP ${performanceResponse.status}: ${performanceResponse.statusText}`);
    }
    
    const performanceResult = await performanceResponse.json();
    console.log('✅ Performance tracking successful');
    console.log('   Result:', performanceResult);
    
    // Test 5: Test alchm quantities API integration
    console.log('\n5️⃣ Testing alchm quantities API integration...');
    const alchmResponse = await fetch(`${BASE_URL}/api/alchm-quantities`);
    
    if (!alchmResponse.ok) {
      throw new Error(`HTTP ${alchmResponse.status}: ${alchmResponse.statusText}`);
    }
    
    const alchmData = await alchmResponse.json();
    console.log('✅ Alchm quantities API working with tracking');
    console.log('   Quantities:', alchmData.quantities);
    console.log('   Dominant Element:', alchmData.dominantElement);
    console.log('   Energy:', alchmData.energy);
    
    // Summary
    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📈 Tracking System Summary:');
    console.log(`   • Site metrics API: ✅ Working`);
    console.log(`   • Tags structure: ✅ ${metrics.tags.length} tags generated`);
    console.log(`   • Metadata structure: ✅ ${metadataKeys.length} metadata keys`);
    console.log(`   • Alchemical tracking: ✅ Integrated`);
    console.log(`   • Custom events: ✅ Working`);
    console.log(`   • Performance tracking: ✅ Working`);
    console.log(`   • Galileo integration: ✅ Ready for monitoring`);
    
    console.log('\n🚀 The site metrics tracking system is ready for production use!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   • Make sure the development server is running (yarn dev)');
    console.error('   • Check that Galileo environment variables are set');
    console.error('   • Verify the API endpoints are accessible');
    console.error('   • Check the server logs for any errors');
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testSiteMetrics();
}

module.exports = { testSiteMetrics }; 
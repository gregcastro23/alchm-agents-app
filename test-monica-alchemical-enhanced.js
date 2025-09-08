// Test enhanced Monica's Alchemical Training System
const baseUrl = 'http://localhost:3000';

async function testAlchemicalTraining() {
  console.log('🧪 Testing Monica\'s Enhanced Alchemical Training System\n');
  console.log('=' .repeat(60));
  
  // Test 1: Get API info
  console.log('\n📋 Test 1: Getting API Information');
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical?mode=info`);
    const data = await response.json();
    console.log('✅ API Info:', JSON.stringify(data.info, null, 2));
  } catch (error) {
    console.error('❌ Error getting API info:', error.message);
  }
  
  // Test 2: Standard training with statistical analysis
  console.log('\n📊 Test 2: Standard Training with Statistical Analysis');
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'standard',
        numSamples: 10,
        exportFormat: 'summary'
      })
    });
    const data = await response.json();
    if (data.success) {
      console.log('✅ Training Complete!');
      console.log('  Statistics:', data.data.summary.statistics);
      console.log('  Patterns:', data.data.summary.patterns);
      console.log('  Top Insights:');
      data.data.summary.topInsights?.forEach((insight, i) => {
        console.log(`    ${i + 1}. ${insight}`);
      });
    } else {
      console.error('❌ Training failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error in standard training:', error.message);
  }
  
  // Test 3: Hourly alchemical analysis
  console.log('\n⏰ Test 3: Today\'s Hourly Alchemical Analysis');
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'hourly',
        location: { latitude: 37.7749, longitude: -122.4194 } // San Francisco
      })
    });
    const data = await response.json();
    if (data.success) {
      console.log('✅ Hourly Analysis Complete!');
      const result = data.data;
      console.log('  Averages:', result.averages);
      console.log('  Peak Hours:');
      console.log(`    Spirit peaks at ${result.peaks.spirit.hour}:00 (value: ${result.peaks.spirit.value}, ruler: ${result.peaks.spirit.ruler})`);
      console.log(`    Essence peaks at ${result.peaks.essence.hour}:00 (value: ${result.peaks.essence.value}, ruler: ${result.peaks.essence.ruler})`);
      console.log(`    Energy peaks at ${result.peaks.energy.hour}:00 (value: ${result.peaks.energy.value}, ruler: ${result.peaks.energy.ruler})`);
      console.log('  Insights:');
      result.insights?.forEach((insight, i) => {
        console.log(`    ${i + 1}. ${insight}`);
      });
    } else {
      console.error('❌ Hourly analysis failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error in hourly analysis:', error.message);
  }
  
  // Test 4: Retrograde impact analysis
  console.log('\n🔄 Test 4: Retrograde Impact Analysis');
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'retrograde',
        numSamples: 5
      })
    });
    const data = await response.json();
    if (data.success) {
      console.log('✅ Retrograde Analysis Complete!');
      const result = data.data;
      console.log('  Current Retrogrades:', result.retrogradeAnalysis.currentRetrogrades);
      console.log('  Impact Modifiers:', result.retrogradeAnalysis.impact);
      console.log('  Recommendations:');
      result.retrogradeAnalysis.recommendations?.forEach((rec, i) => {
        console.log(`    ${i + 1}. ${rec}`);
      });
    } else {
      console.error('❌ Retrograde analysis failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error in retrograde analysis:', error.message);
  }
  
  // Test 5: CSV export format
  console.log('\n📄 Test 5: CSV Export Format');
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'standard',
        numSamples: 3,
        exportFormat: 'csv'
      })
    });
    const data = await response.json();
    if (data.success) {
      console.log('✅ CSV Export Complete!');
      console.log('  CSV Preview (first 5 lines):');
      const lines = data.data.csv.split('\n').slice(0, 5);
      lines.forEach(line => console.log('    ' + line));
      console.log('  ...');
    } else {
      console.error('❌ CSV export failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error in CSV export:', error.message);
  }
  
  // Test 6: Different locations
  console.log('\n🌍 Test 6: Location-Based Analysis');
  const locations = [
    { name: 'New York', latitude: 40.7128, longitude: -74.0060 },
    { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
    { name: 'London', latitude: 51.5074, longitude: -0.1278 }
  ];
  
  for (const loc of locations) {
    try {
      const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'hourly',
          location: { latitude: loc.latitude, longitude: loc.longitude },
          exportFormat: 'summary'
        })
      });
      const data = await response.json();
      if (data.success) {
        const peaks = data.data.summary || data.data.peaks;
        console.log(`  ${loc.name}: Spirit peak at ${peaks.spirit?.hour || 'N/A'}:00`);
      }
    } catch (error) {
      console.error(`  ❌ Error for ${loc.name}:`, error.message);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✨ All tests completed!');
}

// Run the tests
testAlchemicalTraining().catch(console.error);
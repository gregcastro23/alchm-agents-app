// Direct test of the alchemical trainer module
import {
  trainOnAlchemicalValues,
  todayHourlyAlchemize,
  trainWithRetrogrades,
} from './lib/monica/alchemical-trainer.js'

console.log('🧪 Direct Testing of Enhanced Alchemical Trainer\n')
console.log('='.repeat(60))

async function runTests() {
  // Test 1: Basic training
  console.log('\n📊 Test 1: Basic Training (3 samples)')
  try {
    const result = await trainOnAlchemicalValues(3)
    console.log('✅ Training successful!')
    console.log('  Samples generated:', result.samples.length)
    console.log('  Statistics:', {
      spirit: result.statistics.averages.spirit?.toFixed(2),
      essence: result.statistics.averages.essence?.toFixed(2),
      entropy: result.statistics.averages.Entropy?.toFixed(2),
    })
    console.log('  Dominant Element:', result.patterns.dominantElement)
    console.log('  First Insight:', result.insights[0])
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  // Test 2: Hourly analysis
  console.log("\n⏰ Test 2: Today's Hourly Analysis")
  try {
    const result = await todayHourlyAlchemize()
    console.log('✅ Hourly analysis successful!')
    console.log('  Hours analyzed:', result.samples.length)
    console.log('  Peak Spirit Hour:', result.peaks.spirit.hour + ':00')
    console.log('  Peak Essence Hour:', result.peaks.essence.hour + ':00')
    console.log('  Average Entropy:', result.averages.entropy?.toFixed(2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  // Test 3: Retrograde analysis
  console.log('\n🔄 Test 3: Retrograde Analysis')
  try {
    const result = await trainWithRetrogrades(5)
    console.log('✅ Retrograde analysis successful!')
    console.log('  Entropy Modifier:', result.retrogradeAnalysis.impact.entropyModifier)
    console.log('  Essence Modifier:', result.retrogradeAnalysis.impact.essenceModifier)
    console.log('  Recommendations:', result.retrogradeAnalysis.recommendations.length)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✨ Tests completed!')
}

runTests().catch(console.error)

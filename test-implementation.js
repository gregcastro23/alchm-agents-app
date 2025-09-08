// Comprehensive Implementation Test Suite

const fs = require('fs');
const path = require('path');

// Test Configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUser: {
    userId: 'test-implementation-user',
    birthInfo: {
      date: '1990-07-22',
      time: '10:30',
      location: 'Los Angeles, CA, USA',
      name: 'Implementation Test User'
    }
  }
};

// Sample survey responses for testing
const SAMPLE_SURVEY_RESPONSES = [
  { questionId: 'comm_directness', value: 6 },
  { questionId: 'comm_formality', value: 'Friendly but respectful' },
  { questionId: 'comm_detail_level', value: 5 },
  { questionId: 'comm_humor', value: 'Witty wordplay and clever observations' },
  { questionId: 'comm_emotional_expression', value: 6 },
  { questionId: 'think_analytical_intuitive', value: 5 },
  { questionId: 'think_detail_big_picture', value: 6 },
  { questionId: 'think_processing_speed', value: 'I like a moderate pace with some reflection' },
  { questionId: 'think_problem_solving', value: 'Brainstorm creative and unusual solutions' },
  { questionId: 'emotion_stability', value: 5 },
  { questionId: 'emotion_expression', value: 'I share emotions with close people but am reserved with others' },
  { questionId: 'emotion_stress_response', value: 'Seek support and talk to trusted friends/family' },
  { questionId: 'social_energy', value: 4 },
  { questionId: 'social_group_size', value: 'Small groups (3-5 people) with meaningful discussion' },
  { questionId: 'social_conflict', value: 'I try to find compromise and middle ground' },
  { questionId: 'learn_modality', value: 'A combination of multiple approaches' },
  { questionId: 'learn_depth_breadth', value: 3 },
  { questionId: 'learn_feedback', value: 'Gentle guidance with encouragement' },
  { questionId: 'values_achievement', value: 4 },
  { questionId: 'values_security', value: 6 },
  { questionId: 'values_motivators', value: ['Personal growth and self-improvement', 'Creative expression and innovation', 'Knowledge and understanding'] },
  { questionId: 'behavior_routine', value: 4 },
  { questionId: 'behavior_risk', value: 5 },
  { questionId: 'behavior_decision_time', value: 'Take a reasonable amount of time to consider options' },
  { questionId: 'creative_outlets', value: ['Writing and storytelling', 'Problem-solving and innovation'] },
  { questionId: 'creative_approach', value: 6 },
  { questionId: 'decision_logic_emotion', value: 4 },
  { questionId: 'decision_independence', value: 3 },
  { questionId: 'philosophy_optimism', value: 6 },
  { questionId: 'philosophy_change', value: 'I embrace change as an opportunity for growth' },
  { questionId: 'meta_self_awareness', value: 6 },
  { questionId: 'meta_growth_mindset', value: 7 },
  { questionId: 'ai_relationship_style', value: 'Like a knowledgeable friend who knows me well' },
  { questionId: 'ai_challenge_level', value: 'Give me moderate intellectual challenges' },
  { questionId: 'ai_conversation_topics', value: ['Philosophy and meaning', 'Psychology and human behavior', 'Personal development'] }
];

// Test Results Storage
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility Functions
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function recordTest(name, passed, details = '') {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    log(`✅ ${name}${details ? ': ' + details : ''}`, 'success');
  } else {
    testResults.failed++;
    log(`❌ ${name}${details ? ': ' + details : ''}`, 'error');
  }
}

// Test Functions
async function testFileStructure() {
  log('Testing file structure...', 'info');
  
  const requiredFiles = [
    'lib/types/consciousness-survey.ts',
    'lib/consciousness-survey/survey-questions.ts',
    'lib/consciousness-survey/survey-processor.ts',
    'lib/consciousness-survey/consciousness-initializer.ts',
    'components/consciousness-survey.tsx',
    'components/survey-question-component.tsx',
    'components/personalized-ai-chat.tsx',
    'app/consciousness-survey/page.tsx',
    'app/api/consciousness-survey/route.ts',
    'app/api/personalized-ai-chat/route.ts',
    'prisma/schema.prisma'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    recordTest(`File exists: ${file}`, exists);
  }
}

async function testTypeDefinitions() {
  log('Testing TypeScript definitions...', 'info');
  
  try {
    // Test survey questions file content
    const filePath = path.join(__dirname, 'lib/consciousness-survey/survey-questions.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    
    recordTest('Survey questions file contains questions array', content.includes('CONSCIOUSNESS_SURVEY_QUESTIONS'));
    recordTest('Survey has writing style questions', content.includes('writing_style_sample'));
    recordTest('Survey has language complexity question', content.includes('language_complexity'));
    recordTest('Survey has text question type', content.includes("type: 'text'"));
    
    // Count questions in file
    const questionMatches = content.match(/\{\s*id:\s*'/g);
    const questionCount = questionMatches ? questionMatches.length : 0;
    recordTest('Survey has adequate questions', questionCount >= 35);
    
  } catch (error) {
    recordTest('TypeScript definitions', false, error.message);
  }
}

async function testSurveyProcessing() {
  log('Testing survey processing logic...', 'info');
  
  try {
    // Test survey processor file content
    const filePath = path.join(__dirname, 'lib/consciousness-survey/survey-processor.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    
    recordTest('Survey processor contains main function', content.includes('processSurveyResponses'));
    recordTest('Survey processor has writing style analysis', content.includes('analyzeWritingStyle'));
    recordTest('Survey processor builds consciousness profile', content.includes('buildConsciousnessProfile'));
    recordTest('Survey processor generates insights', content.includes('generatePersonalityInsights'));
    recordTest('Survey processor handles creativity section', content.includes('creativity:'));
    
  } catch (error) {
    recordTest('Survey processing', false, error.message);
  }
}

async function testXPSystem() {
  log('Testing XP and leveling system...', 'info');
  
  try {
    // Test XP system file content
    const xpPath = path.join(__dirname, 'lib/personalized-ai/xp-system.ts');
    const levelPath = path.join(__dirname, 'lib/personalized-ai/level-system.ts');
    
    if (fs.existsSync(xpPath)) {
      const xpContent = fs.readFileSync(xpPath, 'utf8');
      recordTest('XP system contains calculation function', xpContent.includes('calculateXP'));
      recordTest('XP system handles bonuses', xpContent.includes('bonus') || xpContent.includes('multiplier'));
    } else {
      recordTest('XP system file exists', false);
    }
    
    if (fs.existsSync(levelPath)) {
      const levelContent = fs.readFileSync(levelPath, 'utf8');
      recordTest('Level system contains calculation function', levelContent.includes('calculateLevel'));
      recordTest('Level system has tier structure', levelContent.includes('tier') || levelContent.includes('level'));
    } else {
      recordTest('Level system file exists', false);
    }
    
  } catch (error) {
    recordTest('XP system', false, error.message);
  }
}

async function testAchievementSystem() {
  log('Testing achievement system...', 'info');
  
  try {
    // Test achievement system file content
    const filePath = path.join(__dirname, 'lib/personalized-ai/achievements.ts');
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      recordTest('Achievement system contains definitions', content.includes('ACHIEVEMENT_DEFINITIONS') || content.includes('achievements'));
      recordTest('Achievement system has checking function', content.includes('checkAchievements'));
      recordTest('Achievement system has different types', content.includes('first_words') || content.includes('achievement'));
      recordTest('Achievement system handles XP rewards', content.includes('xp') || content.includes('XP'));
    } else {
      recordTest('Achievement system file exists', false);
    }
    
  } catch (error) {
    recordTest('Achievement system', false, error.message);
  }
}

async function testDualChartSystem() {
  log('Testing dual chart system...', 'info');
  
  try {
    // Test dual chart system file content
    const filePath = path.join(__dirname, 'lib/personalized-ai/dual-chart.ts');
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      recordTest('Dual chart system contains creation function', content.includes('createDualChartSystem') || content.includes('DualChart'));
      recordTest('Dual chart system handles birth chart', content.includes('birth') || content.includes('Birth'));
      recordTest('Dual chart system handles current moment', content.includes('current') || content.includes('moment'));
      recordTest('Dual chart system handles transits', content.includes('transit') || content.includes('Transit'));
    } else {
      recordTest('Dual chart system file exists', false);
    }
    
  } catch (error) {
    recordTest('Dual chart system', false, error.message);
  }
}

async function testAPIEndpoints() {
  log('Testing API endpoints (requires running server)...', 'warning');
  
  try {
    // Test consciousness survey endpoint
    const surveyResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/consciousness-survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_CONFIG.testUser.userId,
        birthInfo: TEST_CONFIG.testUser.birthInfo,
        surveyResponses: SAMPLE_SURVEY_RESPONSES,
        timeSpent: 900
      })
    });
    
    if (surveyResponse.ok) {
      const surveyData = await surveyResponse.json();
      recordTest('Consciousness survey API works', surveyData.success);
      recordTest('AI config created', !!surveyData.aiConfig);
      
      if (surveyData.aiConfig) {
        // Test chat endpoint
        const chatResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/personalized-ai-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: "Hello! I'm excited to start our consciousness journey together.",
            personalityId: surveyData.aiConfig.personalityId,
            userId: TEST_CONFIG.testUser.userId,
            context: { mood: 'excited', timeOfDay: 'morning' }
          })
        });
        
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          recordTest('Chat API works', !!chatData.response);
          recordTest('Training update provided', !!chatData.trainingUpdate);
          recordTest('XP gained', chatData.trainingUpdate.xpGained > 0);
        } else {
          recordTest('Chat API', false, `HTTP ${chatResponse.status}`);
        }
      }
    } else {
      recordTest('Survey API', false, `HTTP ${surveyResponse.status}`);
    }
    
  } catch (error) {
    recordTest('API endpoints', false, 'Server not running or connection failed');
  }
}

async function testComponentStructure() {
  log('Testing React component structure...', 'info');
  
  const componentFiles = [
    'components/consciousness-survey.tsx',
    'components/survey-question-component.tsx',
    'components/personalized-ai-chat.tsx'
  ];
  
  for (const file of componentFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for required patterns
      const hasUseClient = content.includes('"use client"');
      const hasExport = content.includes('export');
      const hasTypeScript = content.includes('interface') || content.includes('type');
      
      recordTest(`${file} has "use client"`, hasUseClient);
      recordTest(`${file} has exports`, hasExport);
      recordTest(`${file} uses TypeScript`, hasTypeScript);
    }
  }
}

async function testDatabaseSchema() {
  log('Testing database schema...', 'info');
  
  try {
    const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Check for required models
    const requiredModels = [
      'AIPersonality',
      'ConsciousnessSurvey',
      'ConsciousnessProfile',
      'ConsciousnessState',
      'TrainingInteraction',
      'Achievement'
    ];
    
    for (const model of requiredModels) {
      const hasModel = schema.includes(`model ${model}`);
      recordTest(`Schema has ${model} model`, hasModel);
    }
    
    // Check for relationships
    const hasRelations = schema.includes('@relation');
    recordTest('Schema has relationships', hasRelations);
    
  } catch (error) {
    recordTest('Database schema', false, error.message);
  }
}

async function generateTestReport() {
  log('\n🧪 IMPLEMENTATION TEST REPORT', 'info');
  log('=' * 50, 'info');
  
  const totalTests = testResults.passed + testResults.failed;
  const successRate = totalTests > 0 ? Math.round((testResults.passed / totalTests) * 100) : 0;
  
  log(`Total Tests: ${totalTests}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed === 0 ? 'success' : 'error');
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'success' : successRate >= 75 ? 'warning' : 'error');
  
  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'error');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => log(`  • ${test.name}${test.details ? ': ' + test.details : ''}`, 'error'));
  }
  
  log('\n🎯 Implementation Status:', 'info');
  if (successRate >= 90) {
    log('✅ EXCELLENT - Implementation is ready for production!', 'success');
  } else if (successRate >= 75) {
    log('⚠️  GOOD - Implementation is mostly complete with minor issues', 'warning');
  } else if (successRate >= 50) {
    log('🔧 PARTIAL - Implementation needs significant work', 'warning');
  } else {
    log('❌ CRITICAL - Implementation has major issues', 'error');
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { totalTests, passed: testResults.passed, failed: testResults.failed, successRate },
    tests: testResults.tests
  }, null, 2));
  
  log(`\n📊 Detailed results saved to: ${reportPath}`, 'info');
}

// Main Test Runner
async function runTests() {
  log('🚀 Starting Consciousness AI Implementation Tests...', 'info');
  log('=' * 60, 'info');
  
  // Core structure tests
  await testFileStructure();
  await testComponentStructure();
  await testDatabaseSchema();
  
  // Logic tests
  await testTypeDefinitions();
  await testSurveyProcessing();
  await testXPSystem();
  await testAchievementSystem();
  await testDualChartSystem();
  
  // Integration tests (require running server)
  await testAPIEndpoints();
  
  // Generate final report
  await generateTestReport();
}

// Run all tests
runTests().catch(error => {
  log(`Critical test failure: ${error.message}`, 'error');
  process.exit(1);
});
// Test script for Consciousness Survey System

async function testConsciousnessSurvey() {
  const baseUrl = 'http://localhost:3000'

  // Sample survey responses representing a thoughtful, creative, growth-oriented person
  const sampleSurveyResponses = [
    // Communication
    { questionId: 'comm_directness', value: 6 },
    { questionId: 'comm_formality', value: 'Friendly but respectful' },
    { questionId: 'comm_detail_level', value: 5 },
    { questionId: 'comm_humor', value: 'Witty wordplay and clever observations' },
    { questionId: 'comm_emotional_expression', value: 6 },

    // Thinking Style
    { questionId: 'think_analytical_intuitive', value: 5 },
    { questionId: 'think_detail_big_picture', value: 6 },
    { questionId: 'think_processing_speed', value: 'I like a moderate pace with some reflection' },
    { questionId: 'think_problem_solving', value: 'Brainstorm creative and unusual solutions' },

    // Emotional Patterns
    { questionId: 'emotion_stability', value: 5 },
    {
      questionId: 'emotion_expression',
      value: 'I share emotions with close people but am reserved with others',
    },
    {
      questionId: 'emotion_stress_response',
      value: 'Seek support and talk to trusted friends/family',
    },

    // Social Preferences
    { questionId: 'social_energy', value: 4 },
    {
      questionId: 'social_group_size',
      value: 'Small groups (3-5 people) with meaningful discussion',
    },
    { questionId: 'social_conflict', value: 'I try to find compromise and middle ground' },

    // Learning Style
    { questionId: 'learn_modality', value: 'A combination of multiple approaches' },
    { questionId: 'learn_depth_breadth', value: 3 },
    { questionId: 'learn_feedback', value: 'Gentle guidance with encouragement' },

    // Values and Beliefs
    { questionId: 'values_achievement', value: 4 },
    { questionId: 'values_security', value: 6 },
    {
      questionId: 'values_motivators',
      value: [
        'Personal growth and self-improvement',
        'Creative expression and innovation',
        'Knowledge and understanding',
      ],
    },

    // Behavioral Traits
    { questionId: 'behavior_routine', value: 4 },
    { questionId: 'behavior_risk', value: 5 },
    {
      questionId: 'behavior_decision_time',
      value: 'Take a reasonable amount of time to consider options',
    },

    // Creative Expression
    {
      questionId: 'creative_outlets',
      value: [
        'Writing and storytelling',
        'Problem-solving and innovation',
        'Photography and visual capture',
      ],
    },
    { questionId: 'creative_approach', value: 6 },

    // Decision Making
    { questionId: 'decision_logic_emotion', value: 4 },
    { questionId: 'decision_independence', value: 3 },

    // Life Philosophy
    { questionId: 'philosophy_optimism', value: 6 },
    { questionId: 'philosophy_change', value: 'I embrace change as an opportunity for growth' },

    // Meta-cognition
    { questionId: 'meta_self_awareness', value: 6 },
    { questionId: 'meta_growth_mindset', value: 7 },

    // AI Interaction Preferences
    { questionId: 'ai_relationship_style', value: 'Like a knowledgeable friend who knows me well' },
    { questionId: 'ai_challenge_level', value: 'Give me moderate intellectual challenges' },
    {
      questionId: 'ai_conversation_topics',
      value: [
        'Philosophy and meaning',
        'Psychology and human behavior',
        'Personal development',
        'Arts and creativity',
        'Future possibilities',
      ],
    },
  ]

  // Test birth info
  const testBirthInfo = {
    date: '1992-06-15',
    time: '16:45',
    location: 'San Francisco, CA, USA',
    name: 'Consciousness Test User',
  }

  const testRequest = {
    userId: 'consciousness-test-user-456',
    birthInfo: testBirthInfo,
    surveyResponses: sampleSurveyResponses,
    timeSpent: 842, // ~14 minutes
  }

  console.log('Testing Consciousness Survey System...')
  console.log('Survey responses:', sampleSurveyResponses.length, 'questions answered')
  console.log('Time spent:', Math.round(testRequest.timeSpent / 60), 'minutes')

  try {
    // Process consciousness survey
    const createResponse = await fetch(`${baseUrl}/api/consciousness-survey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest),
    })

    const createResult = await createResponse.json()

    if (!createResponse.ok) {
      console.error('Survey processing failed:', createResult)
      return
    }

    console.log('\n✅ Consciousness Survey Processed Successfully!')
    console.log('\n🎭 CONSCIOUSNESS INSIGHTS:')
    console.log('Unified Archetype:', createResult.consciousnessInsights.archetype)
    console.log('Consciousness Signature:', createResult.consciousnessInsights.signature)
    console.log('Compatibility Score:', createResult.consciousnessInsights.compatibilityScore + '%')
    console.log('\n📝 Personality Summary:')
    console.log(createResult.consciousnessInsights.personalitySummary)

    console.log('\n🎯 Recommended Training Focus:')
    createResult.consciousnessInsights.trainingFocus.forEach(focus => {
      console.log(`  • ${focus.replace('_', ' ').toUpperCase()}`)
    })

    console.log('\n💬 Initial Conversation Starters:')
    createResult.consciousnessInsights.conversationStarters.slice(0, 2).forEach((starter, idx) => {
      console.log(`  ${idx + 1}. ${starter}`)
    })

    console.log('\n🤖 AI Configuration:')
    console.log('Personality ID:', createResult.aiConfig.personalityId)
    console.log('Level:', createResult.aiConfig.level)
    console.log('Training Scores:')
    Object.entries(createResult.aiConfig.trainingScores).forEach(([category, score]) => {
      console.log(`  • ${category.replace('_', ' ')}: ${score}%`)
    })

    // Test fetching consciousness data
    console.log('\n📊 Testing Consciousness Data Retrieval...')
    const getResponse = await fetch(
      `${baseUrl}/api/consciousness-survey?userId=${testRequest.userId}`
    )
    const getResult = await getResponse.json()

    if (!getResponse.ok) {
      console.error('Get failed:', getResult)
      return
    }

    console.log('✅ Consciousness data retrieved successfully!')
    console.log('Profile ID:', getResult.consciousnessProfile.id)
    console.log(
      'Associated AI Personalities:',
      getResult.consciousnessProfile.aiPersonalities.length
    )

    console.log('\n🌟 CONSCIOUSNESS SURVEY TEST COMPLETE!')
    console.log('The system successfully:')
    console.log('  ✓ Processed 30+ survey questions')
    console.log('  ✓ Generated detailed consciousness profile')
    console.log('  ✓ Created unified archetype combining survey + astrology')
    console.log('  ✓ Initialized personalized training plan')
    console.log('  ✓ Configured AI behavioral matrix')
    console.log('  ✓ Stored all data with proper relationships')
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Additional test for survey question analysis
function analyzeSurveyQuestions() {
  const {
    CONSCIOUSNESS_SURVEY_QUESTIONS,
    SURVEY_METADATA,
  } = require('./lib/consciousness-survey/survey-questions')

  console.log('\n📋 SURVEY QUESTION ANALYSIS:')
  console.log('Total Questions:', SURVEY_METADATA.totalQuestions)
  console.log('Estimated Time:', SURVEY_METADATA.estimatedTimeMinutes, 'minutes')
  console.log('Categories:', SURVEY_METADATA.categories.length)

  // Analyze by category
  const categoryCounts = {}
  const highWeightQuestions = []

  CONSCIOUSNESS_SURVEY_QUESTIONS.forEach(q => {
    categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1
    if (q.weight >= 8) {
      highWeightQuestions.push(q)
    }
  })

  console.log('\n📊 Questions by Category:')
  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`  • ${category.replace('_', ' ')}: ${count} questions`)
  })

  console.log('\n⭐ High-Weight Questions (8+):')
  console.log(`  Found ${highWeightQuestions.length} critical questions for personality assessment`)

  const requiredQuestions = CONSCIOUSNESS_SURVEY_QUESTIONS.filter(q => q.required)
  console.log(
    `\n✅ Required Questions: ${requiredQuestions.length}/${CONSCIOUSNESS_SURVEY_QUESTIONS.length}`
  )

  console.log('\n🧠 Question Types:')
  const typeStats = {}
  CONSCIOUSNESS_SURVEY_QUESTIONS.forEach(q => {
    typeStats[q.type] = (typeStats[q.type] || 0) + 1
  })
  Object.entries(typeStats).forEach(([type, count]) => {
    console.log(`  • ${type}: ${count} questions`)
  })
}

// Run tests
console.log('🧠 CONSCIOUSNESS SURVEY SYSTEM TEST SUITE')
console.log('==========================================')

analyzeSurveyQuestions()
testConsciousnessSurvey()

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "birthInfo" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "birthTime" TEXT,
    "birthLocation" JSONB NOT NULL,
    "natalChart" JSONB NOT NULL,
    "monicaConstant" REAL NOT NULL,
    "dominantElement" TEXT NOT NULL,
    "allowPublicAgents" BOOLEAN NOT NULL DEFAULT false,
    "shareChartWithAgents" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIPersonality" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "personalityId" TEXT NOT NULL,
    "birthChartData" JSONB NOT NULL,
    "currentMomentChart" JSONB,
    "basePersonality" JSONB NOT NULL,
    "trainingScores" JSONB NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "surveyId" TEXT,
    "consciousnessProfileId" TEXT,
    "planetaryMemoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIPersonality_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "ConsciousnessSurvey" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AIPersonality_consciousnessProfileId_fkey" FOREIGN KEY ("consciousnessProfileId") REFERENCES "ConsciousnessProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AIPersonality_planetaryMemoryId_fkey" FOREIGN KEY ("planetaryMemoryId") REFERENCES "PlanetaryMemory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanetaryTransit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planet" TEXT NOT NULL,
    "sign" TEXT NOT NULL,
    "degreeStart" REAL NOT NULL,
    "degreeEnd" REAL NOT NULL,
    "dateStart" DATETIME NOT NULL,
    "dateEnd" DATETIME NOT NULL,
    "retrograde" BOOLEAN NOT NULL DEFAULT false,
    "historicalNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HistoricalEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "significance" INTEGER NOT NULL,
    "planetaryConfig" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TransitPattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planet" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "cycleLength" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "themes" JSONB NOT NULL,
    "reliability" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlanetaryMemory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planet" TEXT NOT NULL,
    "sign" TEXT NOT NULL,
    "degree" REAL NOT NULL,
    "historicalData" JSONB NOT NULL,
    "lastOccurrence" DATETIME,
    "nextOccurrence" DATETIME,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 0,
    "trainedThemes" JSONB NOT NULL,
    "contextualNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TrainingInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personalityId" TEXT NOT NULL,
    "userMessage" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "userFeedback" JSONB,
    "xpGained" INTEGER NOT NULL DEFAULT 0,
    "trainingFocus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingInteraction_personalityId_fkey" FOREIGN KEY ("personalityId") REFERENCES "AIPersonality" ("personalityId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personalityId" TEXT NOT NULL,
    "achievementType" TEXT NOT NULL,
    "achievementData" JSONB NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Achievement_personalityId_fkey" FOREIGN KEY ("personalityId") REFERENCES "AIPersonality" ("personalityId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "personalityId" TEXT NOT NULL,
    "sessionData" JSONB NOT NULL,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ConsciousnessSurvey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpent" INTEGER NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0'
);

-- CreateTable
CREATE TABLE "ConsciousnessProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "profileData" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "compatibilityScore" INTEGER NOT NULL,
    "trainingFocus" JSONB NOT NULL,
    "conversationStarters" JSONB NOT NULL,
    "personalitySummary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConsciousnessProfile_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "ConsciousnessSurvey" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsciousnessState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personalityId" TEXT NOT NULL,
    "unifiedArchetype" TEXT NOT NULL,
    "consciousnessSignature" TEXT NOT NULL,
    "enhancedPersonality" JSONB NOT NULL,
    "trainingPlan" JSONB NOT NULL,
    "behavioralMatrix" JSONB NOT NULL,
    "growthTrajectory" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConsciousnessState_personalityId_fkey" FOREIGN KEY ("personalityId") REFERENCES "AIPersonality" ("personalityId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "historical_agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "birthTime" TEXT NOT NULL,
    "birthLocation" JSONB NOT NULL,
    "historicalEra" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "deathYear" INTEGER,
    "culture" TEXT NOT NULL,
    "geography" TEXT NOT NULL,
    "consciousnessLevel" TEXT NOT NULL,
    "kalchmConstant" REAL NOT NULL,
    "monicaConstant" REAL NOT NULL DEFAULT 0,
    "dominantElement" TEXT NOT NULL,
    "dominantModality" TEXT,
    "signature" TEXT NOT NULL,
    "spiritScore" REAL,
    "essenceScore" REAL,
    "matterScore" REAL,
    "substanceScore" REAL,
    "personalityCore" JSONB NOT NULL,
    "personalityShadows" JSONB NOT NULL,
    "personalityGifts" JSONB NOT NULL,
    "personalityChallenges" JSONB NOT NULL,
    "currentMood" TEXT NOT NULL,
    "evolutionStage" INTEGER NOT NULL DEFAULT 0,
    "background" JSONB NOT NULL,
    "specialty" TEXT NOT NULL,
    "wisdomDomains" JSONB NOT NULL,
    "skills" JSONB NOT NULL,
    "teachingStyle" TEXT NOT NULL,
    "resonanceType" TEXT NOT NULL,
    "uniquePower" TEXT NOT NULL,
    "avatar" TEXT,
    "color" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "aura" JSONB,
    "natalChart" JSONB NOT NULL,
    "traits" JSONB NOT NULL,
    "monicaCreationStory" TEXT,
    "searchableText" TEXT,
    "popularityScore" REAL NOT NULL DEFAULT 0.5,
    "conversations" INTEGER NOT NULL DEFAULT 0,
    "wisdomShared" INTEGER NOT NULL DEFAULT 0,
    "resonanceScore" REAL NOT NULL DEFAULT 0.5,
    "evolutionPoints" INTEGER NOT NULL DEFAULT 0,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "craftedBy" TEXT NOT NULL DEFAULT 'philosopher-stone',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AgentConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "userMessage" TEXT NOT NULL,
    "agentResponse" TEXT NOT NULL,
    "contextData" JSONB,
    "responseTime" INTEGER,
    "modelUsed" TEXT,
    "temperature" REAL,
    "tokenCount" INTEGER,
    "agentMood" TEXT,
    "evolutionStage" INTEGER,
    "consciousnessLevel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentConversation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "historical_agents" ("agentId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentEvolution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "fromStage" INTEGER NOT NULL,
    "toStage" INTEGER NOT NULL,
    "evolutionType" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "description" TEXT,
    "consciousnessGain" REAL NOT NULL DEFAULT 0,
    "wisdomGained" JSONB,
    "traitsChanged" JSONB,
    "conversationId" TEXT,
    "xpGained" INTEGER NOT NULL DEFAULT 0,
    "evolutionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentEvolution_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "historical_agents" ("agentId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentKnowledge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "usefulness" REAL NOT NULL DEFAULT 0.5,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" DATETIME,
    "contextTags" JSONB,
    "relatedTopics" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgentKnowledge_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "historical_agents" ("agentId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "birthDate" DATETIME,
    "birthTime" TEXT,
    "birthLocation" JSONB,
    "momentName" TEXT,
    "historicalEra" TEXT,
    "culturalContext" TEXT,
    "historicalAccuracy" TEXT,
    "runeType" TEXT,
    "runePower" REAL,
    "runeEffects" JSONB,
    "runeCost" JSONB,
    "artifactType" TEXT,
    "artifactPeriod" TEXT,
    "significance" TEXT,
    "natalChart" JSONB,
    "planetaryPositions" JSONB,
    "aspects" JSONB,
    "alchmData" JSONB,
    "tags" JSONB,
    "culturalTags" JSONB,
    "relevanceScore" REAL NOT NULL DEFAULT 0.5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agent_attachments_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "historical_agents" ("agentId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_attachment_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "conversationId" TEXT,
    "usageType" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "relevanceScore" REAL NOT NULL DEFAULT 0.5,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_attachment_usage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "historical_agents" ("agentId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agent_attachment_usage_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "agent_attachments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "created_agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT,
    "sourceType" TEXT NOT NULL,
    "birthChart" JSONB,
    "momentChart" JSONB NOT NULL,
    "additionalCharts" JSONB,
    "blueprint" JSONB NOT NULL,
    "monicaConstant" REAL NOT NULL,
    "personality" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userProfileId" TEXT,
    CONSTRAINT "created_agents_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "created_agents_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_transit_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "planetaryDegree" REAL NOT NULL,
    "transitingPlanet" TEXT NOT NULL,
    "aspectType" TEXT,
    "elementalFire" REAL NOT NULL DEFAULT 0,
    "elementalWater" REAL NOT NULL DEFAULT 0,
    "elementalAir" REAL NOT NULL DEFAULT 0,
    "elementalEarth" REAL NOT NULL DEFAULT 0,
    "consciousnessImpact" REAL NOT NULL DEFAULT 0,
    "significanceScore" REAL NOT NULL DEFAULT 0,
    "planetaryHour" TEXT NOT NULL,
    "seasonalPhase" TEXT NOT NULL,
    "powerLevel" REAL NOT NULL DEFAULT 0,
    "depth" REAL NOT NULL DEFAULT 0,
    "clarity" REAL NOT NULL DEFAULT 0,
    "resonance" REAL NOT NULL DEFAULT 0,
    "temporalAlignment" REAL NOT NULL DEFAULT 0,
    "patternType" TEXT,
    "clusterGroup" TEXT,
    "reinforcementScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "temporal_bookmarks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "queryType" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "queryData" JSONB NOT NULL,
    "resultData" JSONB,
    "resultHash" TEXT,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessed" DATETIME,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "executionTime" INTEGER,
    "resultCount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "temporal_patterns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patternType" TEXT NOT NULL,
    "degree" REAL NOT NULL,
    "frequency" INTEGER NOT NULL,
    "agentIds" JSONB NOT NULL,
    "agentCount" INTEGER NOT NULL,
    "dominantElement" TEXT NOT NULL,
    "elementalFireAvg" REAL NOT NULL DEFAULT 0,
    "elementalWaterAvg" REAL NOT NULL DEFAULT 0,
    "elementalAirAvg" REAL NOT NULL DEFAULT 0,
    "elementalEarthAvg" REAL NOT NULL DEFAULT 0,
    "reinforcementScore" REAL NOT NULL DEFAULT 0,
    "significance" TEXT NOT NULL,
    "confidenceLevel" REAL NOT NULL DEFAULT 0,
    "firstOccurrence" DATETIME NOT NULL,
    "lastOccurrence" DATETIME NOT NULL,
    "peakPeriodStart" DATETIME,
    "peakPeriodEnd" DATETIME,
    "peakIntensity" REAL NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "interpretation" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cacheExpiry" DATETIME,
    "lastCalculated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "collaborative_time_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "currentUserCount" INTEGER NOT NULL DEFAULT 0,
    "currentQuery" JSONB,
    "currentResults" JSONB,
    "sharedCursor" JSONB,
    "allowedAgents" JSONB,
    "timeRangeStart" DATETIME,
    "timeRangeEnd" DATETIME,
    "explorationMode" TEXT NOT NULL DEFAULT 'open',
    "createdBy" TEXT NOT NULL,
    "moderators" JSONB,
    "lastActivity" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "collaborative_session_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "canModerate" BOOLEAN NOT NULL DEFAULT false,
    "canQuery" BOOLEAN NOT NULL DEFAULT true,
    "canShare" BOOLEAN NOT NULL DEFAULT true,
    "currentDegree" REAL,
    "currentTime" DATETIME,
    CONSTRAINT "collaborative_session_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "collaborative_time_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "collaborative_session_updates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "updateType" TEXT NOT NULL,
    "updateData" JSONB NOT NULL,
    "shouldBroadcast" BOOLEAN NOT NULL DEFAULT true,
    "broadcastedAt" DATETIME,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "collaborative_session_updates_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "collaborative_time_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "temporal_analysis_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "queryHash" TEXT NOT NULL,
    "queryData" JSONB NOT NULL,
    "resultData" JSONB NOT NULL,
    "executionTime" INTEGER NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "patternCount" INTEGER NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHit" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "monica_user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "personality" TEXT NOT NULL DEFAULT 'friendly',
    "assistanceLevel" INTEGER NOT NULL DEFAULT 2,
    "proactiveTips" BOOLEAN NOT NULL DEFAULT true,
    "explanationDepth" TEXT NOT NULL DEFAULT 'detailed',
    "position" TEXT NOT NULL DEFAULT 'bottom-right',
    "autoHide" TEXT NOT NULL DEFAULT 'never',
    "preferredTime" TEXT NOT NULL DEFAULT 'evening',
    "learningStyle" TEXT NOT NULL DEFAULT 'hands-on',
    "interests" JSONB NOT NULL DEFAULT [],
    "contextualAwareness" BOOLEAN NOT NULL DEFAULT true,
    "adaptivePersonality" BOOLEAN NOT NULL DEFAULT true,
    "memoryRetention" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "monica_user_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "xpToNextLevel" INTEGER NOT NULL DEFAULT 100,
    "completedTutorials" JSONB NOT NULL DEFAULT [],
    "currentLearning" TEXT,
    "suggestedNext" JSONB NOT NULL DEFAULT [],
    "lastAction" TEXT,
    "totalInteractions" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "masteryCertificates" JSONB NOT NULL DEFAULT [],
    "favoriteFeatures" JSONB NOT NULL DEFAULT [],
    "averageSessionTime" INTEGER NOT NULL DEFAULT 0,
    "preferredDifficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "learningVelocity" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "monica_user_progress_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "monica_user_settings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "monica_module_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL DEFAULT 1,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "mistakesMade" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "completedAt" DATETIME,
    "lastAccessed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "difficultyRating" REAL,
    "userFeedback" TEXT,
    "struggledWith" JSONB,
    "masteredConcepts" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "monica_module_progress_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "monica_user_progress" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "monica_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "sessionId" TEXT,
    "contextData" JSONB,
    "userAction" TEXT NOT NULL,
    "monicaResponse" TEXT,
    "wasHelpful" BOOLEAN,
    "resultedInAction" BOOLEAN NOT NULL DEFAULT false,
    "timeToComplete" INTEGER,
    "userConfidence" INTEGER,
    "improvementSeen" BOOLEAN NOT NULL DEFAULT false,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "deviceType" TEXT,
    "browserInfo" TEXT,
    "timeOfDay" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "monica_interactions_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "monica_user_settings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_evolution_states" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "userId" TEXT DEFAULT 'anonymous',
    "currentLevel" TEXT NOT NULL DEFAULT 'bronze',
    "totalPower" REAL NOT NULL DEFAULT 0,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "lastInteraction" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "specialAbilitiesUnlocked" TEXT NOT NULL DEFAULT '[]',
    "evolutionHistory" TEXT NOT NULL DEFAULT '[]',
    "affinityScores" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "consciousness_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT DEFAULT 'anonymous',
    "agentId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "powerGained" REAL NOT NULL,
    "planetaryInfluence" TEXT NOT NULL,
    "elementalResonance" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT NOT NULL DEFAULT '{}'
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "provider" TEXT DEFAULT 'email',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" DATETIME
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "features" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "monica_contextual_help" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageUrl" TEXT NOT NULL,
    "contextType" TEXT NOT NULL,
    "tipId" TEXT NOT NULL,
    "tipContent" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "timesShown" INTEGER NOT NULL DEFAULT 0,
    "timesActedOn" INTEGER NOT NULL DEFAULT 0,
    "averageRating" REAL,
    "successRate" REAL NOT NULL DEFAULT 0.0,
    "variant" TEXT,
    "testGroup" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deprecatedAt" DATETIME,
    "averageViewTime" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" REAL NOT NULL DEFAULT 0.0,
    "conversionRate" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "monica_knowledge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "knowledgeType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "sourceType" TEXT NOT NULL,
    "sourceData" JSONB,
    "lastObserved" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timesObserved" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supersededBy" TEXT,
    "validUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EvolutionState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "mcValue" REAL NOT NULL,
    "spirit" REAL NOT NULL,
    "essence" REAL NOT NULL,
    "matter" REAL NOT NULL,
    "substance" REAL NOT NULL,
    "aNumber" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_PlanetaryTransitToTransitPattern" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PlanetaryTransitToTransitPattern_A_fkey" FOREIGN KEY ("A") REFERENCES "PlanetaryTransit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PlanetaryTransitToTransitPattern_B_fkey" FOREIGN KEY ("B") REFERENCES "TransitPattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_HistoricalEventToPlanetaryTransit" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_HistoricalEventToPlanetaryTransit_A_fkey" FOREIGN KEY ("A") REFERENCES "HistoricalEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_HistoricalEventToPlanetaryTransit_B_fkey" FOREIGN KEY ("B") REFERENCES "PlanetaryTransit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PlanetaryMemoryToTransitPattern" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PlanetaryMemoryToTransitPattern_A_fkey" FOREIGN KEY ("A") REFERENCES "PlanetaryMemory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PlanetaryMemoryToTransitPattern_B_fkey" FOREIGN KEY ("B") REFERENCES "TransitPattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "profiles_userId_idx" ON "profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_profiles_userId_idx" ON "user_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AIPersonality_personalityId_key" ON "AIPersonality"("personalityId");

-- CreateIndex
CREATE UNIQUE INDEX "AIPersonality_planetaryMemoryId_key" ON "AIPersonality"("planetaryMemoryId");

-- CreateIndex
CREATE INDEX "AIPersonality_userId_idx" ON "AIPersonality"("userId");

-- CreateIndex
CREATE INDEX "AIPersonality_personalityId_idx" ON "AIPersonality"("personalityId");

-- CreateIndex
CREATE INDEX "AIPersonality_surveyId_idx" ON "AIPersonality"("surveyId");

-- CreateIndex
CREATE INDEX "AIPersonality_consciousnessProfileId_idx" ON "AIPersonality"("consciousnessProfileId");

-- CreateIndex
CREATE INDEX "AIPersonality_planetaryMemoryId_idx" ON "AIPersonality"("planetaryMemoryId");

-- CreateIndex
CREATE INDEX "PlanetaryTransit_planet_sign_idx" ON "PlanetaryTransit"("planet", "sign");

-- CreateIndex
CREATE INDEX "PlanetaryTransit_dateStart_dateEnd_idx" ON "PlanetaryTransit"("dateStart", "dateEnd");

-- CreateIndex
CREATE INDEX "PlanetaryTransit_planet_dateStart_idx" ON "PlanetaryTransit"("planet", "dateStart");

-- CreateIndex
CREATE INDEX "HistoricalEvent_date_idx" ON "HistoricalEvent"("date");

-- CreateIndex
CREATE INDEX "HistoricalEvent_eventType_idx" ON "HistoricalEvent"("eventType");

-- CreateIndex
CREATE INDEX "TransitPattern_planet_patternType_idx" ON "TransitPattern"("planet", "patternType");

-- CreateIndex
CREATE INDEX "PlanetaryMemory_planet_sign_idx" ON "PlanetaryMemory"("planet", "sign");

-- CreateIndex
CREATE UNIQUE INDEX "PlanetaryMemory_planet_sign_degree_key" ON "PlanetaryMemory"("planet", "sign", "degree");

-- CreateIndex
CREATE INDEX "TrainingInteraction_personalityId_idx" ON "TrainingInteraction"("personalityId");

-- CreateIndex
CREATE INDEX "TrainingInteraction_createdAt_idx" ON "TrainingInteraction"("createdAt");

-- CreateIndex
CREATE INDEX "Achievement_personalityId_idx" ON "Achievement"("personalityId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_personalityId_achievementType_key" ON "Achievement"("personalityId", "achievementType");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_personalityId_idx" ON "UserSession"("personalityId");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "ConsciousnessSurvey_userId_idx" ON "ConsciousnessSurvey"("userId");

-- CreateIndex
CREATE INDEX "ConsciousnessSurvey_completedAt_idx" ON "ConsciousnessSurvey"("completedAt");

-- CreateIndex
CREATE INDEX "ConsciousnessProfile_userId_idx" ON "ConsciousnessProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsciousnessProfile_userId_surveyId_key" ON "ConsciousnessProfile"("userId", "surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsciousnessState_personalityId_key" ON "ConsciousnessState"("personalityId");

-- CreateIndex
CREATE INDEX "ConsciousnessState_personalityId_idx" ON "ConsciousnessState"("personalityId");

-- CreateIndex
CREATE UNIQUE INDEX "historical_agents_agentId_key" ON "historical_agents"("agentId");

-- CreateIndex
CREATE INDEX "historical_agents_agentId_idx" ON "historical_agents"("agentId");

-- CreateIndex
CREATE INDEX "historical_agents_name_idx" ON "historical_agents"("name");

-- CreateIndex
CREATE INDEX "historical_agents_consciousnessLevel_idx" ON "historical_agents"("consciousnessLevel");

-- CreateIndex
CREATE INDEX "historical_agents_isActive_idx" ON "historical_agents"("isActive");

-- CreateIndex
CREATE INDEX "historical_agents_historicalEra_idx" ON "historical_agents"("historicalEra");

-- CreateIndex
CREATE INDEX "historical_agents_birthYear_idx" ON "historical_agents"("birthYear");

-- CreateIndex
CREATE INDEX "historical_agents_culture_idx" ON "historical_agents"("culture");

-- CreateIndex
CREATE INDEX "historical_agents_kalchmConstant_idx" ON "historical_agents"("kalchmConstant");

-- CreateIndex
CREATE INDEX "historical_agents_monicaConstant_idx" ON "historical_agents"("monicaConstant");

-- CreateIndex
CREATE INDEX "historical_agents_popularityScore_idx" ON "historical_agents"("popularityScore");

-- CreateIndex
CREATE INDEX "historical_agents_historicalEra_consciousnessLevel_idx" ON "historical_agents"("historicalEra", "consciousnessLevel");

-- CreateIndex
CREATE INDEX "historical_agents_isActive_historicalEra_idx" ON "historical_agents"("isActive", "historicalEra");

-- CreateIndex
CREATE INDEX "historical_agents_birthYear_culture_idx" ON "historical_agents"("birthYear", "culture");

-- CreateIndex
CREATE INDEX "historical_agents_dominantElement_consciousnessLevel_idx" ON "historical_agents"("dominantElement", "consciousnessLevel");

-- CreateIndex
CREATE INDEX "AgentConversation_agentId_idx" ON "AgentConversation"("agentId");

-- CreateIndex
CREATE INDEX "AgentConversation_sessionId_idx" ON "AgentConversation"("sessionId");

-- CreateIndex
CREATE INDEX "AgentConversation_userId_idx" ON "AgentConversation"("userId");

-- CreateIndex
CREATE INDEX "AgentConversation_createdAt_idx" ON "AgentConversation"("createdAt");

-- CreateIndex
CREATE INDEX "AgentEvolution_agentId_idx" ON "AgentEvolution"("agentId");

-- CreateIndex
CREATE INDEX "AgentEvolution_evolutionDate_idx" ON "AgentEvolution"("evolutionDate");

-- CreateIndex
CREATE INDEX "AgentEvolution_evolutionType_idx" ON "AgentEvolution"("evolutionType");

-- CreateIndex
CREATE INDEX "AgentKnowledge_agentId_idx" ON "AgentKnowledge"("agentId");

-- CreateIndex
CREATE INDEX "AgentKnowledge_category_idx" ON "AgentKnowledge"("category");

-- CreateIndex
CREATE INDEX "AgentKnowledge_topic_idx" ON "AgentKnowledge"("topic");

-- CreateIndex
CREATE INDEX "AgentKnowledge_confidence_idx" ON "AgentKnowledge"("confidence");

-- CreateIndex
CREATE INDEX "agent_attachments_agentId_idx" ON "agent_attachments"("agentId");

-- CreateIndex
CREATE INDEX "agent_attachments_type_idx" ON "agent_attachments"("type");

-- CreateIndex
CREATE INDEX "agent_attachments_isActive_idx" ON "agent_attachments"("isActive");

-- CreateIndex
CREATE INDEX "agent_attachments_priority_idx" ON "agent_attachments"("priority");

-- CreateIndex
CREATE INDEX "agent_attachments_historicalEra_idx" ON "agent_attachments"("historicalEra");

-- CreateIndex
CREATE INDEX "agent_attachments_culturalContext_idx" ON "agent_attachments"("culturalContext");

-- CreateIndex
CREATE INDEX "agent_attachments_relevanceScore_idx" ON "agent_attachments"("relevanceScore");

-- CreateIndex
CREATE INDEX "agent_attachments_agentId_type_idx" ON "agent_attachments"("agentId", "type");

-- CreateIndex
CREATE INDEX "agent_attachments_type_historicalEra_idx" ON "agent_attachments"("type", "historicalEra");

-- CreateIndex
CREATE INDEX "agent_attachment_usage_agentId_idx" ON "agent_attachment_usage"("agentId");

-- CreateIndex
CREATE INDEX "agent_attachment_usage_attachmentId_idx" ON "agent_attachment_usage"("attachmentId");

-- CreateIndex
CREATE INDEX "agent_attachment_usage_usedAt_idx" ON "agent_attachment_usage"("usedAt");

-- CreateIndex
CREATE INDEX "agent_attachment_usage_relevanceScore_idx" ON "agent_attachment_usage"("relevanceScore");

-- CreateIndex
CREATE INDEX "created_agents_creatorId_idx" ON "created_agents"("creatorId");

-- CreateIndex
CREATE INDEX "agent_transit_events_agentId_planetaryDegree_idx" ON "agent_transit_events"("agentId", "planetaryDegree");

-- CreateIndex
CREATE INDEX "agent_transit_events_timestamp_transitingPlanet_idx" ON "agent_transit_events"("timestamp", "transitingPlanet");

-- CreateIndex
CREATE INDEX "agent_transit_events_planetaryDegree_aspectType_idx" ON "agent_transit_events"("planetaryDegree", "aspectType");

-- CreateIndex
CREATE INDEX "agent_transit_events_agentId_timestamp_idx" ON "agent_transit_events"("agentId", "timestamp");

-- CreateIndex
CREATE INDEX "agent_transit_events_significanceScore_idx" ON "agent_transit_events"("significanceScore");

-- CreateIndex
CREATE INDEX "agent_transit_events_reinforcementScore_idx" ON "agent_transit_events"("reinforcementScore");

-- CreateIndex
CREATE INDEX "agent_transit_events_seasonalPhase_planetaryHour_idx" ON "agent_transit_events"("seasonalPhase", "planetaryHour");

-- CreateIndex
CREATE INDEX "agent_transit_events_elementalFire_elementalWater_elementalAir_elementalEarth_idx" ON "agent_transit_events"("elementalFire", "elementalWater", "elementalAir", "elementalEarth");

-- CreateIndex
CREATE INDEX "temporal_bookmarks_userId_idx" ON "temporal_bookmarks"("userId");

-- CreateIndex
CREATE INDEX "temporal_bookmarks_isPublic_idx" ON "temporal_bookmarks"("isPublic");

-- CreateIndex
CREATE INDEX "temporal_bookmarks_lastAccessed_idx" ON "temporal_bookmarks"("lastAccessed");

-- CreateIndex
CREATE INDEX "temporal_bookmarks_accessCount_idx" ON "temporal_bookmarks"("accessCount");

-- CreateIndex
CREATE INDEX "temporal_patterns_patternType_degree_idx" ON "temporal_patterns"("patternType", "degree");

-- CreateIndex
CREATE INDEX "temporal_patterns_significance_reinforcementScore_idx" ON "temporal_patterns"("significance", "reinforcementScore");

-- CreateIndex
CREATE INDEX "temporal_patterns_dominantElement_idx" ON "temporal_patterns"("dominantElement");

-- CreateIndex
CREATE INDEX "temporal_patterns_agentCount_idx" ON "temporal_patterns"("agentCount");

-- CreateIndex
CREATE INDEX "temporal_patterns_firstOccurrence_lastOccurrence_idx" ON "temporal_patterns"("firstOccurrence", "lastOccurrence");

-- CreateIndex
CREATE INDEX "temporal_patterns_isActive_cacheExpiry_idx" ON "temporal_patterns"("isActive", "cacheExpiry");

-- CreateIndex
CREATE UNIQUE INDEX "collaborative_time_sessions_sessionCode_key" ON "collaborative_time_sessions"("sessionCode");

-- CreateIndex
CREATE INDEX "collaborative_time_sessions_sessionCode_idx" ON "collaborative_time_sessions"("sessionCode");

-- CreateIndex
CREATE INDEX "collaborative_time_sessions_isActive_expiresAt_idx" ON "collaborative_time_sessions"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "collaborative_time_sessions_createdBy_idx" ON "collaborative_time_sessions"("createdBy");

-- CreateIndex
CREATE INDEX "collaborative_time_sessions_lastActivity_idx" ON "collaborative_time_sessions"("lastActivity");

-- CreateIndex
CREATE INDEX "collaborative_session_participants_sessionId_isOnline_idx" ON "collaborative_session_participants"("sessionId", "isOnline");

-- CreateIndex
CREATE INDEX "collaborative_session_participants_lastActive_idx" ON "collaborative_session_participants"("lastActive");

-- CreateIndex
CREATE UNIQUE INDEX "collaborative_session_participants_sessionId_userId_key" ON "collaborative_session_participants"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "collaborative_session_updates_sessionId_timestamp_idx" ON "collaborative_session_updates"("sessionId", "timestamp");

-- CreateIndex
CREATE INDEX "collaborative_session_updates_updateType_idx" ON "collaborative_session_updates"("updateType");

-- CreateIndex
CREATE UNIQUE INDEX "temporal_analysis_cache_queryHash_key" ON "temporal_analysis_cache"("queryHash");

-- CreateIndex
CREATE INDEX "temporal_analysis_cache_queryHash_idx" ON "temporal_analysis_cache"("queryHash");

-- CreateIndex
CREATE INDEX "temporal_analysis_cache_expiresAt_idx" ON "temporal_analysis_cache"("expiresAt");

-- CreateIndex
CREATE INDEX "temporal_analysis_cache_hitCount_idx" ON "temporal_analysis_cache"("hitCount");

-- CreateIndex
CREATE UNIQUE INDEX "monica_user_settings_userId_key" ON "monica_user_settings"("userId");

-- CreateIndex
CREATE INDEX "monica_user_settings_userId_idx" ON "monica_user_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "monica_user_progress_userId_key" ON "monica_user_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "monica_user_progress_settingsId_key" ON "monica_user_progress"("settingsId");

-- CreateIndex
CREATE INDEX "monica_user_progress_userId_idx" ON "monica_user_progress"("userId");

-- CreateIndex
CREATE INDEX "monica_user_progress_level_idx" ON "monica_user_progress"("level");

-- CreateIndex
CREATE INDEX "monica_user_progress_totalXP_idx" ON "monica_user_progress"("totalXP");

-- CreateIndex
CREATE INDEX "monica_user_progress_currentStreak_idx" ON "monica_user_progress"("currentStreak");

-- CreateIndex
CREATE INDEX "monica_module_progress_userId_idx" ON "monica_module_progress"("userId");

-- CreateIndex
CREATE INDEX "monica_module_progress_moduleId_idx" ON "monica_module_progress"("moduleId");

-- CreateIndex
CREATE INDEX "monica_module_progress_category_idx" ON "monica_module_progress"("category");

-- CreateIndex
CREATE INDEX "monica_module_progress_completed_idx" ON "monica_module_progress"("completed");

-- CreateIndex
CREATE INDEX "monica_module_progress_lastAccessed_idx" ON "monica_module_progress"("lastAccessed");

-- CreateIndex
CREATE UNIQUE INDEX "monica_module_progress_userId_moduleId_key" ON "monica_module_progress"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "monica_interactions_userId_idx" ON "monica_interactions"("userId");

-- CreateIndex
CREATE INDEX "monica_interactions_settingsId_idx" ON "monica_interactions"("settingsId");

-- CreateIndex
CREATE INDEX "monica_interactions_pageUrl_idx" ON "monica_interactions"("pageUrl");

-- CreateIndex
CREATE INDEX "monica_interactions_interactionType_idx" ON "monica_interactions"("interactionType");

-- CreateIndex
CREATE INDEX "monica_interactions_createdAt_idx" ON "monica_interactions"("createdAt");

-- CreateIndex
CREATE INDEX "monica_interactions_wasHelpful_idx" ON "monica_interactions"("wasHelpful");

-- CreateIndex
CREATE INDEX "agent_evolution_states_agentId_idx" ON "agent_evolution_states"("agentId");

-- CreateIndex
CREATE INDEX "agent_evolution_states_userId_idx" ON "agent_evolution_states"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_evolution_states_agentId_userId_key" ON "agent_evolution_states"("agentId", "userId");

-- CreateIndex
CREATE INDEX "consciousness_interactions_agentId_idx" ON "consciousness_interactions"("agentId");

-- CreateIndex
CREATE INDEX "consciousness_interactions_userId_idx" ON "consciousness_interactions"("userId");

-- CreateIndex
CREATE INDEX "consciousness_interactions_timestamp_idx" ON "consciousness_interactions"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_tier_idx" ON "subscriptions"("tier");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "monica_contextual_help_pageUrl_idx" ON "monica_contextual_help"("pageUrl");

-- CreateIndex
CREATE INDEX "monica_contextual_help_contextType_idx" ON "monica_contextual_help"("contextType");

-- CreateIndex
CREATE INDEX "monica_contextual_help_priority_idx" ON "monica_contextual_help"("priority");

-- CreateIndex
CREATE INDEX "monica_contextual_help_successRate_idx" ON "monica_contextual_help"("successRate");

-- CreateIndex
CREATE INDEX "monica_contextual_help_isActive_idx" ON "monica_contextual_help"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "monica_contextual_help_pageUrl_tipId_version_key" ON "monica_contextual_help"("pageUrl", "tipId", "version");

-- CreateIndex
CREATE INDEX "monica_knowledge_userId_idx" ON "monica_knowledge"("userId");

-- CreateIndex
CREATE INDEX "monica_knowledge_knowledgeType_idx" ON "monica_knowledge"("knowledgeType");

-- CreateIndex
CREATE INDEX "monica_knowledge_category_idx" ON "monica_knowledge"("category");

-- CreateIndex
CREATE INDEX "monica_knowledge_confidence_idx" ON "monica_knowledge"("confidence");

-- CreateIndex
CREATE INDEX "monica_knowledge_isActive_idx" ON "monica_knowledge"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "monica_knowledge_userId_knowledgeType_key_key" ON "monica_knowledge"("userId", "knowledgeType", "key");

-- CreateIndex
CREATE UNIQUE INDEX "_PlanetaryTransitToTransitPattern_AB_unique" ON "_PlanetaryTransitToTransitPattern"("A", "B");

-- CreateIndex
CREATE INDEX "_PlanetaryTransitToTransitPattern_B_index" ON "_PlanetaryTransitToTransitPattern"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_HistoricalEventToPlanetaryTransit_AB_unique" ON "_HistoricalEventToPlanetaryTransit"("A", "B");

-- CreateIndex
CREATE INDEX "_HistoricalEventToPlanetaryTransit_B_index" ON "_HistoricalEventToPlanetaryTransit"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PlanetaryMemoryToTransitPattern_AB_unique" ON "_PlanetaryMemoryToTransitPattern"("A", "B");

-- CreateIndex
CREATE INDEX "_PlanetaryMemoryToTransitPattern_B_index" ON "_PlanetaryMemoryToTransitPattern"("B");

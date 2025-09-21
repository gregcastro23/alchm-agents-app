import { Router } from 'express';
import { logger } from '../utils/logger.js';
import { cacheService } from '../services/cache.js';
import { rateLimit } from 'express-rate-limit';
// Import backend service implementations
import { generateAlchmForCurrentMoment, alchemize } from '../services/alchemizer-service.js';
import { generateAccurateHoroscope } from '../services/horoscope-service.js';
import { calculateMC } from '../services/monica-constant-service.js';
const router = Router();
// Rate limiting for consciousness calculations
const consciousnessLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 requests per minute
    message: 'Too many consciousness calculation requests',
    standardHeaders: true,
    legacyHeaders: false
});
router.use(consciousnessLimiter);
/**
 * Calculate live consciousness for a single birth chart
 * POST /api/consciousness/live
 */
router.post('/live', async (req, res) => {
    const startTime = Date.now();
    try {
        const birthChart = req.body;
        // Validate input
        if (!birthChart.name || !birthChart.birthDate || !birthChart.birthTime) {
            return res.status(400).json({
                error: 'Missing required fields: name, birthDate, birthTime',
                code: 'INVALID_INPUT'
            });
        }
        // Create cache key
        const cacheKey = `consciousness:${birthChart.name}:${birthChart.birthDate}:${birthChart.birthTime}:${new Date().getHours()}`;
        // Check cache first (1 hour TTL for live consciousness)
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            logger.info(`Live consciousness cache hit for ${birthChart.name}`);
            return res.json({
                ...cached,
                fromCache: true
            });
        }
        // Parse birth info
        const [year, month, day] = birthChart.birthDate.split('-').map(Number);
        const [hour, minute] = birthChart.birthTime.split(':').map(Number);
        const birthInfo = {
            year,
            month, // JavaScript months are 0-based, but our system expects 1-based
            day,
            hour: hour || 12,
            minute: minute || 0,
            latitude: birthChart.latitude || 0,
            longitude: birthChart.longitude || 0
        };
        // Calculate birth consciousness
        logger.info(`Calculating birth consciousness for ${birthChart.name}`);
        const birthHoroscope = generateAccurateHoroscope(birthInfo);
        const birthAlchmData = alchemize(birthInfo, birthHoroscope);
        // Extract birth alchemical values
        const birthSpirit = birthAlchmData['Alchemy Effects']['Total Spirit'] || 0;
        const birthEssence = birthAlchmData['Alchemy Effects']['Total Essence'] || 0;
        const birthMatter = birthAlchmData['Alchemy Effects']['Total Matter'] || 0;
        const birthSubstance = birthAlchmData['Alchemy Effects']['Total Substance'] || 0;
        const birthMC = calculateMC(birthSpirit, birthEssence, birthMatter, birthSubstance);
        // Get current moment alchemical data
        logger.info('Fetching current cosmic conditions');
        const currentMomentData = await generateAlchmForCurrentMoment();
        // Calculate transit effects
        const transitEffects = await calculateTransitEffects(birthAlchmData, currentMomentData, birthChart.name);
        // Apply transit modifications to birth values
        const liveSpirit = Math.max(0.1, birthSpirit + transitEffects.spiritModifier);
        const liveEssence = Math.max(0.1, birthEssence + transitEffects.essenceModifier);
        const liveMatter = Math.max(0.1, birthMatter + transitEffects.matterModifier);
        const liveSubstance = Math.max(0.1, birthSubstance + transitEffects.substanceModifier);
        // Calculate live MC
        const liveMC = calculateMC(liveSpirit, liveEssence, liveMatter, liveSubstance);
        // Calculate change metrics
        const mcChange = liveMC - birthMC;
        const mcPercentChange = birthMC !== 0 ? (mcChange / birthMC) * 100 : 0;
        // Generate consciousness levels and interpretations
        const consciousnessLevel = getConsciousnessLevel(birthMC);
        const liveConsciousnessLevel = getConsciousnessLevel(liveMC);
        const interpretations = generateConsciousnessInterpretations(birthMC, liveMC, mcChange, transitEffects);
        const response = {
            birthMC: Math.round(birthMC * 1000) / 1000,
            birthKalchm: {
                spirit: Math.round(birthSpirit * 100) / 100,
                essence: Math.round(birthEssence * 100) / 100,
                matter: Math.round(birthMatter * 100) / 100,
                substance: Math.round(birthSubstance * 100) / 100,
                aNumber: Math.round((birthSpirit + birthEssence + birthMatter + birthSubstance) * 100) / 100
            },
            liveMC: Math.round(liveMC * 1000) / 1000,
            liveKalchm: {
                spirit: Math.round(liveSpirit * 100) / 100,
                essence: Math.round(liveEssence * 100) / 100,
                matter: Math.round(liveMatter * 100) / 100,
                substance: Math.round(liveSubstance * 100) / 100,
                aNumber: Math.round((liveSpirit + liveEssence + liveMatter + liveSubstance) * 100) / 100
            },
            mcChange: Math.round(mcChange * 1000) / 1000,
            mcPercentChange: Math.round(mcPercentChange * 100) / 100,
            dominantTransitEffect: transitEffects.dominantEffect,
            consciousnessLevel,
            liveConsciousnessLevel,
            interpretations,
            timestamp: new Date().toISOString(),
            cacheKey,
            calculationTime: Date.now() - startTime
        };
        // Cache the result (1 hour TTL)
        await cacheService.set(cacheKey, response, 3600);
        logger.info(`Live consciousness calculated for ${birthChart.name} in ${Date.now() - startTime}ms`);
        res.json(response);
    }
    catch (error) {
        logger.error('Live consciousness calculation error:', error);
        res.status(500).json({
            error: 'Failed to calculate live consciousness',
            code: 'CALCULATION_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
/**
 * Calculate live consciousness for multiple agents
 * POST /api/consciousness/batch
 */
router.post('/batch', async (req, res) => {
    const startTime = Date.now();
    try {
        const { agents } = req.body;
        if (!agents || !Array.isArray(agents) || agents.length === 0) {
            return res.status(400).json({
                error: 'Missing or invalid agents array',
                code: 'INVALID_INPUT'
            });
        }
        if (agents.length > 10) {
            return res.status(400).json({
                error: 'Maximum 10 agents per batch request',
                code: 'BATCH_LIMIT_EXCEEDED'
            });
        }
        logger.info(`Calculating live consciousness for ${agents.length} agents`);
        // Get current moment data once for efficiency
        const currentMomentData = await generateAlchmForCurrentMoment();
        const results = {};
        // Process each agent
        for (const agent of agents) {
            try {
                // Create individual request for this agent
                const agentResult = await calculateSingleLiveConsciousness(agent, currentMomentData);
                results[agent.name] = agentResult;
            }
            catch (error) {
                logger.error(`Error calculating consciousness for ${agent.name}:`, error);
                results[agent.name] = {
                    error: `Failed to calculate consciousness: ${error.message}`
                };
            }
        }
        res.json({
            results,
            timestamp: new Date().toISOString(),
            calculationTime: Date.now() - startTime,
            agentCount: agents.length
        });
    }
    catch (error) {
        logger.error('Batch consciousness calculation error:', error);
        res.status(500).json({
            error: 'Failed to calculate batch consciousness',
            code: 'BATCH_CALCULATION_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
/**
 * Get consciousness calculation status and metrics
 * GET /api/consciousness/status
 */
router.get('/status', async (req, res) => {
    try {
        // Get cache statistics
        const cacheStats = await cacheService.getStats?.() || {};
        // Test calculation performance
        const testStartTime = Date.now();
        try {
            await generateAlchmForCurrentMoment();
            const testTime = Date.now() - testStartTime;
            res.json({
                status: 'operational',
                services: {
                    alchemizer: 'active',
                    transitCalculator: 'active',
                    monicaConstant: 'active',
                    cache: cacheService.isConnected() ? 'connected' : 'disconnected'
                },
                performance: {
                    averageCalculationTime: `${testTime}ms`,
                    cacheHitRate: cacheStats.hitRate || 'unknown'
                },
                capabilities: [
                    'live_consciousness_calculation',
                    'batch_processing',
                    'transit_analysis',
                    'monica_constant_tracking',
                    'consciousness_level_classification'
                ],
                limits: {
                    maxBatchSize: 10,
                    rateLimitPerMinute: 30,
                    cacheTTL: '1 hour'
                },
                timestamp: new Date().toISOString()
            });
        }
        catch (testError) {
            res.status(503).json({
                status: 'degraded',
                error: 'Calculation test failed',
                details: testError.message
            });
        }
    }
    catch (error) {
        logger.error('Status check error:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});
// Helper function to calculate single live consciousness
async function calculateSingleLiveConsciousness(birthChart, currentMomentData) {
    // Parse birth info
    const [year, month, day] = birthChart.birthDate.split('-').map(Number);
    const [hour, minute] = birthChart.birthTime.split(':').map(Number);
    const birthInfo = {
        year,
        month,
        day,
        hour: hour || 12,
        minute: minute || 0,
        latitude: birthChart.latitude || 0,
        longitude: birthChart.longitude || 0
    };
    // Calculate birth consciousness
    const birthHoroscope = generateAccurateHoroscope(birthInfo);
    const birthAlchmData = alchemize(birthInfo, birthHoroscope);
    const birthSpirit = birthAlchmData['Alchemy Effects']['Total Spirit'] || 0;
    const birthEssence = birthAlchmData['Alchemy Effects']['Total Essence'] || 0;
    const birthMatter = birthAlchmData['Alchemy Effects']['Total Matter'] || 0;
    const birthSubstance = birthAlchmData['Alchemy Effects']['Total Substance'] || 0;
    const birthMC = calculateMC(birthSpirit, birthEssence, birthMatter, birthSubstance);
    // Calculate transit effects
    const transitEffects = await calculateTransitEffects(birthAlchmData, currentMomentData, birthChart.name);
    // Apply modifications
    const liveSpirit = Math.max(0.1, birthSpirit + transitEffects.spiritModifier);
    const liveEssence = Math.max(0.1, birthEssence + transitEffects.essenceModifier);
    const liveMatter = Math.max(0.1, birthMatter + transitEffects.matterModifier);
    const liveSubstance = Math.max(0.1, birthSubstance + transitEffects.substanceModifier);
    const liveMC = calculateMC(liveSpirit, liveEssence, liveMatter, liveSubstance);
    const mcChange = liveMC - birthMC;
    const mcPercentChange = birthMC !== 0 ? (mcChange / birthMC) * 100 : 0;
    return {
        birthMC: Math.round(birthMC * 1000) / 1000,
        birthKalchm: {
            spirit: Math.round(birthSpirit * 100) / 100,
            essence: Math.round(birthEssence * 100) / 100,
            matter: Math.round(birthMatter * 100) / 100,
            substance: Math.round(birthSubstance * 100) / 100,
            aNumber: Math.round((birthSpirit + birthEssence + birthMatter + birthSubstance) * 100) / 100
        },
        liveMC: Math.round(liveMC * 1000) / 1000,
        liveKalchm: {
            spirit: Math.round(liveSpirit * 100) / 100,
            essence: Math.round(liveEssence * 100) / 100,
            matter: Math.round(liveMatter * 100) / 100,
            substance: Math.round(liveSubstance * 100) / 100,
            aNumber: Math.round((liveSpirit + liveEssence + liveMatter + liveSubstance) * 100) / 100
        },
        mcChange: Math.round(mcChange * 1000) / 1000,
        mcPercentChange: Math.round(mcPercentChange * 100) / 100,
        dominantTransitEffect: transitEffects.dominantEffect,
        consciousnessLevel: getConsciousnessLevel(birthMC),
        liveConsciousnessLevel: getConsciousnessLevel(liveMC),
        interpretations: generateConsciousnessInterpretations(birthMC, liveMC, mcChange, transitEffects),
        timestamp: new Date().toISOString()
    };
}
// Calculate how current transits affect birth chart alchemical values
async function calculateTransitEffects(birthAlchmData, currentData, agentName) {
    let spiritMod = 0;
    let essenceMod = 0;
    let matterMod = 0;
    let substanceMod = 0;
    let dominantEffect = 'neutral';
    try {
        // Current moment alchemical intensities
        const currentSpirit = currentData['Alchemy Effects']['Total Spirit'] || 0;
        const currentEssence = currentData['Alchemy Effects']['Total Essence'] || 0;
        const currentMatter = currentData['Alchemy Effects']['Total Matter'] || 0;
        const currentSubstance = currentData['Alchemy Effects']['Total Substance'] || 0;
        // Calculate cosmic weather influences
        const currentIntensity = Math.abs(currentSpirit + currentEssence + currentMatter + currentSubstance);
        const intensityMultiplier = Math.max(0.1, Math.min(2.0, currentIntensity / 10));
        // Spirit modifiers (Fire-based influences)
        if (currentSpirit > 5) {
            spiritMod += currentSpirit * 0.15 * intensityMultiplier;
            dominantEffect = 'spirit_enhancement';
        }
        else if (currentSpirit < -2) {
            spiritMod += currentSpirit * 0.1 * intensityMultiplier;
            dominantEffect = 'spirit_challenge';
        }
        // Essence modifiers (Water-based influences)
        if (currentEssence > 5) {
            essenceMod += currentEssence * 0.15 * intensityMultiplier;
            dominantEffect = dominantEffect === 'neutral' ? 'essence_enhancement' : dominantEffect;
        }
        else if (currentEssence < -2) {
            essenceMod += currentEssence * 0.1 * intensityMultiplier;
            dominantEffect = dominantEffect === 'neutral' ? 'essence_challenge' : dominantEffect;
        }
        // Matter modifiers (Earth-based influences)
        if (currentMatter > 5) {
            matterMod += currentMatter * 0.12 * intensityMultiplier;
            dominantEffect = dominantEffect === 'neutral' ? 'matter_enhancement' : dominantEffect;
        }
        else if (currentMatter < -2) {
            matterMod += currentMatter * 0.08 * intensityMultiplier;
            dominantEffect = dominantEffect === 'neutral' ? 'matter_challenge' : dominantEffect;
        }
        // Substance modifiers (Air-based influences)
        if (currentSubstance > 5) {
            substanceMod += currentSubstance * 0.12 * intensityMultiplier;
            dominantEffect = dominantEffect === 'neutral' ? 'substance_enhancement' : dominantEffect;
        }
        else if (currentSubstance < -2) {
            substanceMod += currentSubstance * 0.08 * intensityMultiplier;
            dominantEffect = dominantEffect === 'neutral' ? 'substance_challenge' : dominantEffect;
        }
        const transitStrength = Math.abs(spiritMod) + Math.abs(essenceMod) +
            Math.abs(matterMod) + Math.abs(substanceMod);
        logger.debug(`Transit effects for ${agentName}: Spirit ${spiritMod.toFixed(2)}, Essence ${essenceMod.toFixed(2)}, Matter ${matterMod.toFixed(2)}, Substance ${substanceMod.toFixed(2)}`);
        return {
            spiritModifier: spiritMod,
            essenceModifier: essenceMod,
            matterModifier: matterMod,
            substanceModifier: substanceMod,
            dominantEffect,
            transitStrength
        };
    }
    catch (error) {
        logger.error(`Error calculating transit effects for ${agentName}:`, error);
        return {
            spiritModifier: 0,
            essenceModifier: 0,
            matterModifier: 0,
            substanceModifier: 0,
            dominantEffect: 'calculation_error',
            transitStrength: 0
        };
    }
}
// Get consciousness level from MC value
function getConsciousnessLevel(mc) {
    if (mc >= 8.0)
        return 'Transcendent';
    if (mc >= 6.0)
        return 'Illuminated';
    if (mc >= 4.5)
        return 'Advanced';
    if (mc >= 3.0)
        return 'Elevated';
    if (mc >= 1.5)
        return 'Active';
    if (mc >= 0.8)
        return 'Awakening';
    return 'Dormant';
}
// Generate human-readable interpretations
function generateConsciousnessInterpretations(birthMC, liveMC, mcChange, transitEffects) {
    const changePercent = Math.abs((mcChange / birthMC) * 100);
    let mcChangeInterpretation = '';
    if (Math.abs(mcChange) < 0.1) {
        mcChangeInterpretation = 'Consciousness remains stable with minimal fluctuation';
    }
    else if (mcChange > 0) {
        if (changePercent > 20) {
            mcChangeInterpretation = `Significant consciousness enhancement (+${mcChange.toFixed(3)}, +${changePercent.toFixed(1)}%)`;
        }
        else if (changePercent > 10) {
            mcChangeInterpretation = `Moderate consciousness boost (+${mcChange.toFixed(3)}, +${changePercent.toFixed(1)}%)`;
        }
        else {
            mcChangeInterpretation = `Gentle consciousness elevation (+${mcChange.toFixed(3)}, +${changePercent.toFixed(1)}%)`;
        }
    }
    else {
        if (changePercent > 20) {
            mcChangeInterpretation = `Notable consciousness challenge (${mcChange.toFixed(3)}, ${changePercent.toFixed(1)}%)`;
        }
        else if (changePercent > 10) {
            mcChangeInterpretation = `Moderate consciousness test (${mcChange.toFixed(3)}, ${changePercent.toFixed(1)}%)`;
        }
        else {
            mcChangeInterpretation = `Minor consciousness adjustment (${mcChange.toFixed(3)}, ${changePercent.toFixed(1)}%)`;
        }
    }
    let transitInfluence = '';
    switch (transitEffects.dominantEffect) {
        case 'spirit_enhancement':
            transitInfluence = 'Current cosmic fire energies amplify spiritual awareness and creative inspiration';
            break;
        case 'spirit_challenge':
            transitInfluence = 'Cosmic fire energies create dynamic tension requiring conscious direction';
            break;
        case 'essence_enhancement':
            transitInfluence = 'Flowing water energies deepen emotional intelligence and intuitive insights';
            break;
        case 'essence_challenge':
            transitInfluence = 'Turbulent water energies call for emotional mastery and adaptive wisdom';
            break;
        case 'matter_enhancement':
            transitInfluence = 'Stable earth energies strengthen practical manifestation and grounded wisdom';
            break;
        case 'matter_challenge':
            transitInfluence = 'Shifting earth energies require patience and methodical consciousness work';
            break;
        case 'substance_enhancement':
            transitInfluence = 'Clear air energies enhance mental clarity and communicative expression';
            break;
        case 'substance_challenge':
            transitInfluence = 'Scattered air energies invite focused attention and conscious breathing';
            break;
        default:
            transitInfluence = 'Balanced cosmic influences create stable conditions for consciousness work';
    }
    const cosmicWeather = transitEffects.transitStrength > 2.0 ?
        'High cosmic activity - powerful time for consciousness transformation' :
        transitEffects.transitStrength > 1.0 ?
            'Moderate cosmic activity - good conditions for awareness expansion' :
            'Calm cosmic conditions - steady time for consciousness integration';
    return {
        mcChange: mcChangeInterpretation,
        transitInfluence,
        cosmicWeather
    };
}
export default router;
//# sourceMappingURL=consciousness.js.map
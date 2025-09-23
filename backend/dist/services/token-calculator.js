import { logger } from '../utils/logger.js';
import { cacheService } from './cache.js';
import { planetaryHoursService } from './planetary-hours.js';
class TokenCalculatorService {
    baseRates = {
        Spirit: 1.0,
        Essence: 0.8,
        Matter: 0.6,
        Substance: 0.4
    };
    /**
     * Calculate token rates with planetary and temporal influences
     */
    async calculateTokens(request) {
        const startTime = Date.now();
        const timestamp = request.timestamp || new Date();
        const cacheKey = `tokens:${timestamp.getTime()}:${request.location.lat}:${request.location.lon}`;
        try {
            const cached = await cacheService.get(cacheKey);
            if (cached) {
                logger.debug('Returning cached token calculation');
                return cached;
            }
        }
        catch (error) {
            logger.warn('Cache check failed for token calculation:', error);
        }
        // Get current planetary influence
        const planetaryHour = await planetaryHoursService.getCurrentPlanetaryHour(timestamp, request.location);
        // Apply planetary modifiers to base rates
        const planetaryRates = this.applyPlanetaryInfluence(request.tokens, planetaryHour.planet);
        // Apply temporal modifiers (time of day, season, etc.)
        const temporalRates = this.applyTemporalInfluence(planetaryRates, timestamp);
        // Calculate harmonic patterns
        const harmonics = this.calculateHarmonics(temporalRates, timestamp);
        // Generate projections
        const projections = await this.generateProjections(temporalRates, request.location, timestamp);
        // Identify significant events
        const events = await this.identifyEvents(temporalRates, request.location, timestamp);
        // Calculate metadata
        const marketPhase = this.determineMarketPhase(temporalRates, harmonics);
        const volatilityIndex = this.calculateVolatilityIndex(harmonics);
        const totalValue = Object.values(temporalRates).reduce((sum, rate) => sum + rate, 0);
        const result = {
            rates: temporalRates,
            projections,
            harmonics,
            events,
            metadata: {
                computeTime: Date.now() - startTime,
                planetaryInfluence: planetaryHour.planet,
                marketPhase,
                volatilityIndex,
                totalValue
            }
        };
        // Cache for 5 minutes (market-like behavior)
        try {
            await cacheService.set(cacheKey, result, 300);
        }
        catch (error) {
            logger.warn('Failed to cache token calculation:', error);
        }
        return result;
    }
    /**
     * Apply planetary influences to token rates
     */
    applyPlanetaryInfluence(baseRates, planet) {
        const planetaryMultipliers = {
            Sun: { Spirit: 1.3, Essence: 1.1, Matter: 0.9, Substance: 0.8 },
            Moon: { Spirit: 0.9, Essence: 1.4, Matter: 1.1, Substance: 0.9 },
            Mercury: { Spirit: 1.2, Essence: 0.9, Matter: 0.8, Substance: 1.3 },
            Venus: { Spirit: 0.8, Essence: 1.3, Matter: 1.2, Substance: 1.0 },
            Mars: { Spirit: 1.4, Essence: 0.8, Matter: 1.3, Substance: 0.7 },
            Jupiter: { Spirit: 1.2, Essence: 1.2, Matter: 0.9, Substance: 1.1 },
            Saturn: { Spirit: 0.7, Essence: 0.9, Matter: 1.4, Substance: 1.2 }
        };
        const multipliers = planetaryMultipliers[planet] || {};
        return {
            Spirit: baseRates.Spirit * (multipliers.Spirit || 1.0),
            Essence: baseRates.Essence * (multipliers.Essence || 1.0),
            Matter: baseRates.Matter * (multipliers.Matter || 1.0),
            Substance: baseRates.Substance * (multipliers.Substance || 1.0)
        };
    }
    /**
     * Apply temporal influences (time of day, season, etc.)
     */
    applyTemporalInfluence(rates, timestamp) {
        const hour = timestamp.getHours();
        const dayOfYear = this.getDayOfYear(timestamp);
        // Time of day influence (dawn/dusk peaks)
        const timeMultiplier = 1 + 0.2 * Math.sin((hour * Math.PI) / 12);
        // Seasonal influence
        const seasonalMultiplier = 1 + 0.15 * Math.sin((dayOfYear * 2 * Math.PI) / 365);
        // Weekly cycle (subtle)
        const weeklyMultiplier = 1 + 0.05 * Math.sin((timestamp.getDay() * 2 * Math.PI) / 7);
        const totalMultiplier = timeMultiplier * seasonalMultiplier * weeklyMultiplier;
        return {
            Spirit: rates.Spirit * totalMultiplier * (1 + 0.1 * Math.sin(hour * Math.PI / 6)),
            Essence: rates.Essence * totalMultiplier * (1 + 0.1 * Math.cos(hour * Math.PI / 8)),
            Matter: rates.Matter * totalMultiplier * (1 + 0.05 * Math.sin(dayOfYear * Math.PI / 180)),
            Substance: rates.Substance * totalMultiplier * (1 + 0.08 * Math.cos(dayOfYear * Math.PI / 365))
        };
    }
    /**
     * Calculate harmonic wave patterns for each token
     */
    calculateHarmonics(rates, timestamp) {
        const hour = timestamp.getHours();
        const minute = timestamp.getMinutes();
        const timeValue = hour + minute / 60;
        return {
            Spirit: this.analyzeHarmonic(rates.Spirit, timeValue, 1.2),
            Essence: this.analyzeHarmonic(rates.Essence, timeValue, 0.8),
            Matter: this.analyzeHarmonic(rates.Matter, timeValue, 0.6),
            Substance: this.analyzeHarmonic(rates.Substance, timeValue, 0.4) // Very slow frequency
        };
    }
    /**
     * Analyze harmonic properties for a single token
     */
    analyzeHarmonic(rate, timeValue, baseFreq) {
        const frequency = baseFreq * (1 + 0.1 * Math.sin(timeValue));
        const amplitude = rate * 0.2; // 20% of current rate
        const phase = (timeValue * frequency) % (2 * Math.PI);
        // Determine resonance based on phase alignment
        let resonance;
        if (Math.abs(Math.sin(phase)) > 0.8) {
            resonance = 'constructive';
        }
        else if (Math.abs(Math.cos(phase)) > 0.8) {
            resonance = 'destructive';
        }
        else {
            resonance = 'neutral';
        }
        return { frequency, amplitude, phase, resonance };
    }
    /**
     * Generate near-term and seasonal projections
     */
    async generateProjections(rates, location, timestamp) {
        const nearTerm = [];
        const seasonal = [];
        // Near-term projections (next 24 hours)
        for (let hours = 1; hours <= 24; hours += 6) {
            const futureTime = new Date(timestamp.getTime() + hours * 60 * 60 * 1000);
            const planetaryHour = await planetaryHoursService.getCurrentPlanetaryHour(futureTime, location);
            const projectedRates = this.applyPlanetaryInfluence(rates, planetaryHour.planet);
            const avgRate = Object.values(projectedRates).reduce((sum, rate) => sum + rate, 0) / 4;
            nearTerm.push({
                timeframe: `+${hours}h`,
                expectedRate: avgRate,
                confidence: Math.max(0.5, 1 - hours * 0.02),
                factors: [`Planetary: ${planetaryHour.planet}`, 'Temporal cycles']
            });
        }
        // Seasonal projections (next 4 seasons)
        const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
        for (let i = 0; i < 4; i++) {
            const seasonalMultiplier = 1 + 0.15 * Math.sin((i * Math.PI) / 2);
            const avgRate = Object.values(rates).reduce((sum, rate) => sum + rate, 0) / 4;
            seasonal.push({
                timeframe: seasons[i],
                expectedRate: avgRate * seasonalMultiplier,
                confidence: 0.7 - i * 0.1,
                factors: [`Seasonal: ${seasons[i]}`, 'Long-term cycles']
            });
        }
        return { nearTerm, seasonal };
    }
    /**
     * Identify significant upcoming events
     */
    async identifyEvents(rates, location, timestamp) {
        const events = [];
        // Look for planetary transitions in next 48 hours
        for (let hours = 1; hours <= 48; hours++) {
            const futureTime = new Date(timestamp.getTime() + hours * 60 * 60 * 1000);
            const planetaryHour = await planetaryHoursService.getCurrentPlanetaryHour(futureTime, location);
            // Check for high-impact planetary hours
            if (['Sun', 'Jupiter', 'Mars'].includes(planetaryHour.planet)) {
                events.push({
                    type: 'peak',
                    timestamp: futureTime,
                    description: `${planetaryHour.planet} hour - increased activity expected`,
                    impact: 'high',
                    tokens: planetaryHour.planet === 'Sun' ? ['Spirit'] :
                        planetaryHour.planet === 'Jupiter' ? ['Spirit', 'Essence'] : ['Matter', 'Spirit']
                });
            }
        }
        // Add confluence events (multiple tokens peaking)
        const highRates = Object.entries(rates)
            .filter(([, rate]) => rate > 1.2)
            .map(([token]) => token);
        if (highRates.length >= 2) {
            events.push({
                type: 'confluence',
                timestamp: new Date(timestamp.getTime() + 60 * 60 * 1000),
                description: `Multiple tokens showing elevated activity: ${highRates.join(', ')}`,
                impact: 'high',
                tokens: highRates
            });
        }
        return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    /**
     * Determine current market phase
     */
    determineMarketPhase(rates, harmonics) {
        const avgRate = Object.values(rates).reduce((sum, rate) => sum + rate, 0) / 4;
        const constructiveCount = Object.values(harmonics).filter(h => h.resonance === 'constructive').length;
        if (avgRate > 1.2 && constructiveCount >= 3)
            return 'Bull Market';
        if (avgRate < 0.8 && constructiveCount <= 1)
            return 'Bear Market';
        if (constructiveCount >= 2)
            return 'Accumulation';
        return 'Consolidation';
    }
    /**
     * Calculate volatility index
     */
    calculateVolatilityIndex(harmonics) {
        const amplitudes = Object.values(harmonics).map(h => h.amplitude);
        const avgAmplitude = amplitudes.reduce((sum, amp) => sum + amp, 0) / amplitudes.length;
        const variance = amplitudes.reduce((sum, amp) => sum + Math.pow(amp - avgAmplitude, 2), 0) / amplitudes.length;
        return Math.sqrt(variance) / avgAmplitude;
    }
    /**
     * Get day of year
     */
    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date.getTime() - start.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    /**
     * Get historical token data for analysis
     */
    async getHistoricalData(startDate, endDate, location, interval = 60 // minutes
    ) {
        const data = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            const request = {
                tokens: this.baseRates,
                location,
                timestamp: new Date(current)
            };
            const result = await this.calculateTokens(request);
            data.push({
                timestamp: new Date(current),
                rates: result.rates
            });
            current.setMinutes(current.getMinutes() + interval);
        }
        return data;
    }
}
// Singleton instance
export const tokenCalculatorService = new TokenCalculatorService();
export default tokenCalculatorService;
//# sourceMappingURL=token-calculator.js.map
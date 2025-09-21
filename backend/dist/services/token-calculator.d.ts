import { type Location } from './planetary-hours.js';
export interface TokenRates {
    Spirit: number;
    Essence: number;
    Matter: number;
    Substance: number;
}
export interface TokenCalculationRequest {
    tokens: TokenRates;
    planetaryHour?: string;
    location: Location;
    timestamp?: Date;
}
export interface TokenProjection {
    timeframe: string;
    expectedRate: number;
    confidence: number;
    factors: string[];
}
export interface HarmonicAnalysis {
    frequency: number;
    amplitude: number;
    phase: number;
    resonance: 'constructive' | 'destructive' | 'neutral';
}
export interface TokenEvent {
    type: 'peak' | 'trough' | 'transition' | 'confluence';
    timestamp: Date;
    description: string;
    impact: 'high' | 'medium' | 'low';
    tokens: (keyof TokenRates)[];
}
export interface TokenCalculationResult {
    rates: TokenRates;
    projections: {
        nearTerm: TokenProjection[];
        seasonal: TokenProjection[];
    };
    harmonics: {
        [K in keyof TokenRates]: HarmonicAnalysis;
    };
    events: TokenEvent[];
    metadata: {
        computeTime: number;
        planetaryInfluence: string;
        marketPhase: string;
        volatilityIndex: number;
        totalValue: number;
    };
}
declare class TokenCalculatorService {
    private baseRates;
    /**
     * Calculate token rates with planetary and temporal influences
     */
    calculateTokens(request: TokenCalculationRequest): Promise<TokenCalculationResult>;
    /**
     * Apply planetary influences to token rates
     */
    private applyPlanetaryInfluence;
    /**
     * Apply temporal influences (time of day, season, etc.)
     */
    private applyTemporalInfluence;
    /**
     * Calculate harmonic wave patterns for each token
     */
    private calculateHarmonics;
    /**
     * Analyze harmonic properties for a single token
     */
    private analyzeHarmonic;
    /**
     * Generate near-term and seasonal projections
     */
    private generateProjections;
    /**
     * Identify significant upcoming events
     */
    private identifyEvents;
    /**
     * Determine current market phase
     */
    private determineMarketPhase;
    /**
     * Calculate volatility index
     */
    private calculateVolatilityIndex;
    /**
     * Get day of year
     */
    private getDayOfYear;
    /**
     * Get historical token data for analysis
     */
    getHistoricalData(startDate: Date, endDate: Date, location: Location, interval?: number): Promise<Array<{
        timestamp: Date;
        rates: TokenRates;
    }>>;
}
export declare const tokenCalculatorService: TokenCalculatorService;
export default tokenCalculatorService;

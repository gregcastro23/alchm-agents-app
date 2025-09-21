export interface KineticsData {
    power: Array<{
        hour: number;
        power: number;
        planetary: string;
    }>;
    timing: {
        planetaryHours: string[];
        seasonalInfluence: string;
    };
    elemental: {
        totals: {
            Fire: number;
            Water: number;
            Air: number;
            Earth: number;
        };
    };
}
export interface AgentOptimization {
    recommendedAgents: string[];
    powerAmplification: number;
    harmonyScore: number;
}
export interface PowerPrediction {
    nextPeak: string;
    trend: 'ascending' | 'stable' | 'descending';
    confidence: number;
}
export interface GroupDynamics {
    harmony: number;
    powerAmplification: number;
    momentumFlow: 'accelerating' | 'sustained' | 'decelerating';
    resonances: Record<string, any>;
    optimalConfiguration: {
        recommended: string[];
        alternativeArrangements: string[][];
    };
}
/**
 * Calculate enhanced kinetics with real planetary data
 */
export declare function calculateEnhancedKinetics(location: {
    lat: number;
    lon: number;
}, options?: {
    includeAgentOptimization?: boolean;
    includePowerPrediction?: boolean;
    includeResonanceMap?: boolean;
    agentIds?: string[];
}): Promise<{
    base: KineticsData;
    agentOptimization?: AgentOptimization;
    powerPrediction?: PowerPrediction;
    resonanceMap?: Record<string, any>;
}>;
/**
 * Calculate group dynamics for multiple agents
 */
export declare function calculateGroupDynamics(agentIds: string[], location: {
    lat: number;
    lon: number;
}): GroupDynamics;
/**
 * Calculate token-specific kinetics
 */
export declare function calculateTokenKinetics(baseTokenRate: number, baseNFTRarity: number, location: {
    lat: number;
    lon: number;
}): any;

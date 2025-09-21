import { AlchemicalData } from './alchemical-trainer';
export interface MonicaConstantResult {
    value: number;
    interpretation: string;
    consciousnessState: ConsciousnessState;
    personalityInfluence: PersonalityInfluence;
    recommendations: string[];
    formula: string;
}
export interface ConsciousnessState {
    level: 'dormant' | 'awakening' | 'active' | 'elevated' | 'transcendent';
    stability: 'volatile' | 'fluctuating' | 'stable' | 'harmonious' | 'unified';
    potential: 'limited' | 'developing' | 'moderate' | 'high' | 'unlimited';
    description: string;
}
export interface PersonalityInfluence {
    primaryTrait: string;
    secondaryTrait: string;
    elementalBalance: string;
    communicationStyle: string;
    decisionMaking: string;
    emotionalPattern: string;
}
/**
 * Calculate the Monica Constant
 * Formula: MC = (Spirit × φ + Essence) / (Matter + Substance + 1)
 * Where φ (phi) is the golden ratio (1.618...)
 */
export declare function calculateMonicaConstant(data: AlchemicalData): MonicaConstantResult;
/**
 * Batch calculate Monica Constants for multiple samples
 */
export declare function batchCalculateMonicaConstants(samples: AlchemicalData[]): MonicaConstantResult[];
/**
 * Calculate average Monica Constant from multiple samples
 */
export declare function calculateAverageMonicaConstant(samples: AlchemicalData[]): {
    average: number;
    min: number;
    max: number;
    stdDev: number;
    interpretation: string;
};

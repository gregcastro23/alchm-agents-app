import { AlchemicalElements } from './alchemizer-service.js';
export interface MonicaConstantResult {
    value: number;
    components: {
        baseGoldenRatio: number;
        elementalBalance: number;
        totalWeight: number;
        consciousnessLevel: number;
    };
    interpretation: string;
}
/**
 * Calculates the Monica Constant (MC)
 * MC = φ * (1 + (E/T)) * (1 + (C/10))
 * Where:
 * φ = Golden Ratio (1.618)
 * E = Elemental Balance
 * T = Total Elemental Weight
 * C = Consciousness Level
 */
export declare function calculateMC(alchemicalElements: AlchemicalElements, consciousnessLevel?: number): MonicaConstantResult;
/**
 * Calculate Monica Constant evolution between two states
 */
export declare function calculateMCEvolution(birthMC: MonicaConstantResult, currentMC: MonicaConstantResult): {
    change: number;
    percentageChange: number;
    trend: 'ascending' | 'stable' | 'descending';
    momentum: 'accelerating' | 'steady' | 'decelerating';
};

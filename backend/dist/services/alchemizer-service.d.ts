export interface AlchemicalElements {
    spirit: number;
    essence: number;
    matter: number;
    substance: number;
    aNumber: number;
}
export interface PlanetaryPosition {
    planet: string;
    sign: string;
    degree: number;
    retrograde: boolean;
}
/**
 * Generates alchemical values for the current moment
 * Backend implementation - simplified for production
 */
export declare function generateAlchmForCurrentMoment(): AlchemicalElements;
/**
 * Alchemizes values based on birth chart data
 * Simplified implementation for backend
 */
export declare function alchemize(birthData: any): AlchemicalElements;

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
export declare function generateAlchmForCurrentMoment(): Promise<AlchemicalElements>;
/**
 * Alchemizes values based on birth chart data
 * Simplified implementation for backend
 */
export declare function alchemize(birthData: any): Promise<AlchemicalElements>;

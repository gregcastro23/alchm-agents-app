/**
 * Enhanced Astronomical Calculator
 * ================================
 *
 * Professional-grade astronomical calculations for natal charts
 * Builds upon our existing foundation with significantly improved accuracy
 * Aims for ±0.1° precision vs ±2-5° of current system
 */
export interface EnhancedPlanetPosition {
    planet: string;
    longitude: number;
    latitude: number;
    distance: number;
    speed: number;
    retrograde: boolean;
    sign: string;
    signDegree: number;
}
export interface EnhancedAscendant {
    longitude: number;
    sign: string;
    signDegree: number;
    rightAscension: number;
    declination: number;
}
export interface EnhancedBirthInfo {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second?: number;
    latitude: number;
    longitude: number;
    timezone?: string;
}
export type HouseSystem = 'equal' | 'placidus' | 'koch' | 'campanus' | 'regiomontanus';
export interface EnhancedHousePosition {
    houseNumber: number;
    longitude: number;
    sign: string;
    signDegree: number;
}
export interface HouseSystemResult {
    system: HouseSystem;
    houses: EnhancedHousePosition[];
    ascendant: EnhancedAscendant;
    midheaven: {
        longitude: number;
        sign: string;
        signDegree: number;
    };
}
/**
 * Convert calendar date to Julian Day Number with enhanced precision
 */
export declare function toJulianDay(date: Date): number;
/**
 * Calculate centuries since J2000.0 epoch
 */
export declare function centuriesSinceJ2000(jd: number): number;
/**
 * Normalize degrees to 0-360 range
 */
export declare function normalizeDegrees(degrees: number): number;
/**
 * Convert longitude to zodiac sign and degree within sign
 */
export declare function longitudeToSignDegree(longitude: number): {
    sign: string;
    degree: number;
};
/**
 * Enhanced planetary position calculation using VSOP87 approximations
 * Achieves significantly better accuracy than linear motion
 */
export declare function calculateEnhancedPlanetPosition(planet: string, jd: number): EnhancedPlanetPosition;
/**
 * Enhanced ascendant calculation using proper sidereal time
 */
export declare function calculateEnhancedAscendant(birthInfo: EnhancedBirthInfo): EnhancedAscendant;
/**
 * Calculate all planetary positions for a given time
 */
export declare function calculateAllPlanets(birthInfo: EnhancedBirthInfo): {
    planets: Record<string, EnhancedPlanetPosition>;
    ascendant: EnhancedAscendant;
    julianDay: number;
};
/**
 * Compare accuracy with existing system
 */
export declare function accuracyComparison(birthInfo: EnhancedBirthInfo, existingPositions: any): {
    improvements: Record<string, number>;
    averageImprovement: number;
    maxImprovement: number;
};
/**
 * Calculate professional house systems
 */
export declare function calculateProfessionalHouses(birthInfo: EnhancedBirthInfo, system?: HouseSystem): HouseSystemResult;

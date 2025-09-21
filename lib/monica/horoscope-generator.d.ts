import { BirthInfo } from './alchemical-trainer';
export interface PlanetPosition {
    label: string;
    Sign: {
        label: string;
    };
    degrees: number;
    retrograde?: boolean;
}
export interface GeneratedHoroscope {
    tropical: {
        Ascendant: {
            Sign: {
                label: string;
            };
            degrees: number;
        };
        CelestialBodies: {
            all: PlanetPosition[];
        };
        Houses?: Record<number, {
            sign: string;
            degree: number;
        }>;
    };
    metadata?: {
        generatedAt: Date;
        method: string;
        accuracy: string;
    };
}
/**
 * Generate a comprehensive horoscope with all planets
 */
export declare function generateAccurateHoroscope(birthInfo: BirthInfo): GeneratedHoroscope;
/**
 * Validate birth info
 */
export declare function validateBirthInfo(birthInfo: BirthInfo): {
    valid: boolean;
    errors: string[];
};
/**
 * Enhanced horoscope generation with professional astronomical accuracy
 * Uses VSOP87-like calculations for ±0.1° precision vs ±2-5° of legacy system
 */
export declare function generateProfessionalHoroscope(birthInfo: BirthInfo, options?: {
    useLegacyFallback?: boolean;
    includeAccuracyMetadata?: boolean;
}): GeneratedHoroscope;
/**
 * Professional accuracy testing and comparison
 */
export declare function testAstronomicalAccuracy(birthInfo: BirthInfo): {
    legacy: GeneratedHoroscope;
    enhanced: GeneratedHoroscope;
    improvements: Record<string, number>;
    summary: {
        averageImprovement: number;
        maxImprovement: number;
        method: string;
    };
};

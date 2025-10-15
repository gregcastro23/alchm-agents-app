/**
 * Test fixtures for integration tests
 * Real data structures matching production formats
 */
export declare const validBirthInfo: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    latitude: number;
    longitude: number;
};
export declare const validLocation: {
    lat: number;
    lon: number;
};
export declare const validTokens: {
    spirit: number;
    essence: number;
    matter: number;
    substance: number;
};
export declare const validAstrologicalEvent: {
    type: string;
    severity: string;
    planet: string;
    aspectType: string;
};
export declare const expectedHoroscopeStructure: {
    tropical: {
        CelestialBodies: {
            all: any;
            sun: any;
            moon: any;
        };
        Ascendant: any;
        Aspects: any;
    };
};
export declare const expectedAlchemyResponse: {
    success: any;
    alchemicalProfile: {
        spirit: any;
        essence: any;
        matter: any;
        substance: any;
        dominantElement: any;
        heat: any;
        entropy: any;
    };
};
/**
 * Generate test birth data with variations
 */
export declare function generateBirthData(overrides?: Partial<typeof validBirthInfo>): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    latitude: number;
    longitude: number;
};
/**
 * Generate test location data with variations
 */
export declare function generateLocation(overrides?: Partial<typeof validLocation>): {
    lat: number;
    lon: number;
};
/**
 * Generate random date within range
 */
export declare function generateRandomDate(startDate: Date, endDate: Date): Date;
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;

/**
 * Calculates the current positions of planets based on reference positions and orbital speeds
 * Optionally accepts a timestamp to prevent caching
 * @param timestamp Optional timestamp to force recalculation
 * @returns Object with planet names as keys and their current sign, degree, and retrograde status
 */
export declare function getCurrentPlanetaryPositions(timestamp?: number): Record<string, {
    sign: string;
    degree: number;
    retrograde: boolean;
}>;
/**
 * Gets the raw planetary positions directly from calculations
 * This is used for debugging purposes
 */
export declare function getRawPlanetaryPositions(): {
    timestamp: number;
    currentPositions: Record<string, {
        sign: string;
        degree: number;
        retrograde: boolean;
    }>;
    lastUpdated: string;
    calculationMethod: string;
    referenceDate: string;
    transitData: Record<string, any>;
};

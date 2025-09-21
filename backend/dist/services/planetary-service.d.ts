export interface PlanetPosition {
    name: string;
    sign: string;
    degree: number;
    retrograde: boolean;
    house?: number;
}
export interface PlanetaryPositions {
    sun: PlanetPosition;
    moon: PlanetPosition;
    mercury: PlanetPosition;
    venus: PlanetPosition;
    mars: PlanetPosition;
    jupiter: PlanetPosition;
    saturn: PlanetPosition;
    uranus?: PlanetPosition;
    neptune?: PlanetPosition;
    pluto?: PlanetPosition;
}
/**
 * Gets current planetary positions
 * Simplified calculation for backend service
 */
export declare function getCurrentPlanetaryPositions(date?: Date): PlanetaryPositions;
/**
 * Calculate planetary hour for a given time and location
 * Returns the ruling planet for the current planetary hour
 */
export declare function getPlanetaryHour(date?: Date, latitude?: number): string;

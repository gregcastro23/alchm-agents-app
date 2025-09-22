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
export declare function getCurrentPlanetaryPositions(date?: Date): Promise<PlanetaryPositions>;
export declare function getPlanetaryHour(date: Date, latitude: number): string;

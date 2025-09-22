export interface Location {
    lat: number;
    lon: number;
}
export interface PlanetaryHourInfo {
    planet: string;
    dayType: 'day' | 'night';
    hourIndex: number;
    startTime: Date;
    endTime: Date;
    nextTransition: Date;
    modifiers: {
        [key: string]: number;
    };
}
export interface PlanetaryForecast {
    datetime: Date;
    planetaryHour: PlanetaryHourInfo;
    influence: {
        spirit: number;
        essence: number;
        matter: number;
        substance: number;
        fire: number;
        water: number;
        air: number;
        earth: number;
    };
}
declare class PlanetaryHoursService {
    /**
     * Calculate sunrise and sunset times for a given location and date
     * Using simplified solar calculations
     */
    private calculateSunTimes;
    private getDayOfYear;
    /**
     * Get the current planetary hour for a given time and location
     */
    getCurrentPlanetaryHour(datetime: Date, location: Location): Promise<PlanetaryHourInfo>;
    /**
     * Get planetary hour forecast for a date range
     */
    getForecast(startDate: Date, endDate: Date, location: Location, intervalMinutes?: number): Promise<PlanetaryForecast[]>;
    /**
     * Calculate how planetary hours influence alchemical properties
     */
    private calculatePlanetaryInfluence;
    /**
     * Get optimal times for specific planetary influences
     */
    getOptimalTimes(date: Date, location: Location, targetPlanet: string): Promise<PlanetaryHourInfo[]>;
}
export declare const planetaryHoursService: PlanetaryHoursService;
export default planetaryHoursService;

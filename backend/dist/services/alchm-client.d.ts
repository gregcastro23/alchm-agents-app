export declare function getRealHoroscope(birthData: any): Promise<any>;
export declare function getRealPlanetaryPositions(location: {
    lat: number;
    lon: number;
}): Promise<any>;
export declare const alchmClient: {
    calculateAlchemy(payload: {
        birthInfo: any;
        options?: any;
    }): Promise<any>;
    imaginize(payload: {
        birthInfo: any;
        horoscope?: any;
        options?: any;
    }): Promise<any>;
    healthCheck(): Promise<{
        healthy: boolean;
        responseTime?: number;
        error?: string;
    }>;
    getStatus(): any;
};

export interface AlchemicalSample {
    birthInfo: BirthInfo;
    alchmData: AlchemicalData;
    planetaryHour?: {
        planet: string;
        hourNumber: number;
        isDaytime: boolean;
    };
    timestamp: Date;
}
export interface BirthInfo {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    latitude: number;
    longitude: number;
}
export interface AlchemicalData {
    spirit: number;
    essence: number;
    matter: number;
    substance: number;
    Heat: number;
    Entropy: number;
    Reactivity: number;
    Energy: number;
    [key: string]: any;
}
export interface TrainingResult {
    samples: AlchemicalSample[];
    statistics: {
        averages: Record<string, number>;
        stdDeviation: Record<string, number>;
        correlations: Record<string, number>;
        quartiles: Record<string, {
            q1: number;
            median: number;
            q3: number;
        }>;
    };
    patterns: {
        dominantElement: string;
        peakHours: Record<string, number>;
        criticalDegrees: number[];
    };
    insights: string[];
    monicaConstant?: {
        average: number;
        min: number;
        max: number;
        stdDev: number;
        interpretation: string;
    };
    metadata: {
        numSamples: number;
        dateRange: {
            start: Date;
            end: Date;
        };
        locations: Array<{
            latitude: number;
            longitude: number;
        }>;
        errors?: string[];
    };
}
export declare function trainOnAlchemicalValues(numSamples?: number): Promise<TrainingResult>;
export declare function todayHourlyAlchemize(location?: {
    latitude: number;
    longitude: number;
}, useBatchAPI?: boolean): Promise<any>;
export declare function trainWithRetrogrades(numSamples?: number): Promise<any>;

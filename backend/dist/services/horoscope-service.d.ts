export interface HoroscopeData {
    sign: string;
    ascendant?: string;
    houses?: Record<number, string>;
    aspects?: string[];
    summary?: string;
}
/**
 * Generates accurate horoscope based on birth data
 * Simplified backend implementation
 */
export declare function generateAccurateHoroscope(birthData: any): HoroscopeData;

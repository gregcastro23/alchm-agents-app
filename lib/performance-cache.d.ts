interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}
declare class PerformanceCache {
    private cache;
    private readonly PLANETARY_POSITIONS_TTL;
    private readonly ALCHEMICAL_TTL;
    private readonly ELEMENTAL_TTL;
    get<T>(key: string): T | null;
    set<T>(key: string, data: T, ttl?: number): void;
    setPlanetaryPositions<T>(data: T): void;
    getPlanetaryPositions<T>(): T | null;
    setAlchemicalData<T>(birthInfoHash: string, data: T): void;
    getAlchemicalData<T>(birthInfoHash: string): T | null;
    setElementalData<T>(requestHash: string, data: T): void;
    getElementalData<T>(requestHash: string): T | null;
    private cleanup;
    getStats(): {
        size: number;
        keys: string[];
        entries: {
            key: string;
            age: number;
            ttl: number;
            expired: boolean;
        }[];
    };
    clear(): void;
    clearType(type: 'planetary' | 'alchemical' | 'elemental'): void;
}
export declare function createBirthInfoHash(birthInfo: any): string;
export declare function createRequestHash(request: any): string;
export declare const performanceCache: PerformanceCache;
export type { CacheEntry };
export { PerformanceCache };

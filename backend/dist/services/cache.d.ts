declare class CacheService {
    private redisClient;
    private memoryCache;
    private cleanupInterval;
    private isConnected;
    connect(): Promise<void>;
    private setupMemoryCache;
    private cleanupMemoryCache;
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    flush(): Promise<boolean>;
    keys(pattern: string): Promise<string[]>;
    getStats(): {
        type: 'redis' | 'memory';
        connected: boolean;
        memoryItems: number;
        redisConnected: boolean;
    };
    disconnect(): void;
}
export declare const cacheService: CacheService;
export default cacheService;

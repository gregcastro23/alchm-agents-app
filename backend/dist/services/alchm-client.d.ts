export interface AlchmBackendConfig {
    baseURL: string;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
}
export interface ImaginizeRequest {
    birthInfo: {
        year: number;
        month: number;
        day: number;
        hour: number;
        minute: number;
        latitude: number;
        longitude: number;
    };
    horoscope?: any;
    options?: {
        style?: string;
        format?: 'png' | 'jpg' | 'webp';
        quality?: number;
        width?: number;
        height?: number;
    };
}
export interface ImaginizeResponse {
    success: boolean;
    imageUrl?: string;
    metadata?: {
        alchmData: any;
        generationTime: number;
        style: string;
    };
    error?: string;
}
export interface AlchemicalCalculationRequest {
    birthInfo: {
        year: number;
        month: number;
        day: number;
        hour: number;
        minute: number;
        latitude: number;
        longitude: number;
    };
    options?: {
        includeAspects?: boolean;
        includeTransits?: boolean;
        includePlanetary?: boolean;
    };
}
export interface AlchemicalCalculationResponse {
    success: boolean;
    data?: {
        alchmData: any;
        horoscope: any;
        computeTime: number;
    };
    error?: string;
}
declare class AlchmClientService {
    private client;
    private config;
    private circuitBreaker;
    constructor();
    private setupInterceptors;
    private retryRequest;
    private delay;
    private getCacheKey;
    /**
     * Generate an alchemical image using the /imaginize endpoint
     */
    imaginize(request: ImaginizeRequest): Promise<ImaginizeResponse>;
    /**
     * Perform alchemical calculations
     */
    calculateAlchemy(request: AlchemicalCalculationRequest): Promise<AlchemicalCalculationResponse>;
    /**
     * Check if the alchm-backend is healthy
     */
    healthCheck(): Promise<{
        healthy: boolean;
        responseTime?: number;
        error?: string;
    }>;
    /**
     * Get circuit breaker status
     */
    getStatus(): {
        circuitBreakerState: string;
        failureCount: number;
        lastFailureTime?: number;
    };
}
export declare const alchmClient: AlchmClientService;
export default alchmClient;

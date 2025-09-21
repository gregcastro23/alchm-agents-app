export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
}
export declare enum CircuitBreakerState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export default class CircuitBreaker {
    private config;
    private state;
    private failureCount;
    private lastFailureTime?;
    private nextAttempt?;
    constructor(config: CircuitBreakerConfig);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private shouldAttemptReset;
    getState(): string;
    getFailureCount(): number;
    getLastFailureTime(): number | undefined;
    reset(): void;
}

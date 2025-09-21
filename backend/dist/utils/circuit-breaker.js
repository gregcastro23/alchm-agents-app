import { logger } from './logger.js';
export var CircuitBreakerState;
(function (CircuitBreakerState) {
    CircuitBreakerState["CLOSED"] = "CLOSED";
    CircuitBreakerState["OPEN"] = "OPEN";
    CircuitBreakerState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitBreakerState || (CircuitBreakerState = {}));
export default class CircuitBreaker {
    config;
    state = CircuitBreakerState.CLOSED;
    failureCount = 0;
    lastFailureTime;
    nextAttempt;
    constructor(config) {
        this.config = config;
    }
    async execute(operation) {
        if (this.state === CircuitBreakerState.OPEN) {
            if (this.shouldAttemptReset()) {
                this.state = CircuitBreakerState.HALF_OPEN;
                logger.info('Circuit breaker moving to HALF_OPEN state');
            }
            else {
                throw new Error('Circuit breaker is OPEN - operation not allowed');
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failureCount = 0;
        this.state = CircuitBreakerState.CLOSED;
        logger.debug('Circuit breaker reset to CLOSED state');
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.config.failureThreshold) {
            this.state = CircuitBreakerState.OPEN;
            this.nextAttempt = Date.now() + this.config.recoveryTimeout;
            logger.warn(`Circuit breaker opened after ${this.failureCount} failures`);
        }
    }
    shouldAttemptReset() {
        return this.nextAttempt !== undefined && Date.now() >= this.nextAttempt;
    }
    getState() {
        return this.state;
    }
    getFailureCount() {
        return this.failureCount;
    }
    getLastFailureTime() {
        return this.lastFailureTime;
    }
    reset() {
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.lastFailureTime = undefined;
        this.nextAttempt = undefined;
        logger.info('Circuit breaker manually reset');
    }
}
//# sourceMappingURL=circuit-breaker.js.map
import axios from 'axios';
import { logger } from '../utils/logger.js';
import CircuitBreaker from '../utils/circuit-breaker.js';
import { cacheService } from './cache.js';
const breaker = new CircuitBreaker({ failureThreshold: 3, recoveryTimeout: 5000, monitoringPeriod: 60000 });
const ALCHM_BACKEND_URL = process.env.ALCHM_BACKEND_URL || 'https://alchm-backend.onrender.com';
const apiClient = axios.create({
    baseURL: ALCHM_BACKEND_URL,
    timeout: 7000,
    headers: { 'Content-Type': 'application/json' }
});
// Simple stable stringify to generate deterministic cache keys
function stableStringify(value) {
    const seen = new WeakSet();
    const stringify = (val) => {
        if (val === null || typeof val !== 'object') {
            return JSON.stringify(val);
        }
        if (seen.has(val)) {
            return '"[Circular]"';
        }
        seen.add(val);
        if (Array.isArray(val)) {
            return '[' + val.map((item) => stringify(item)).join(',') + ']';
        }
        const keys = Object.keys(val).sort();
        return '{' + keys.map((k) => JSON.stringify(k) + ':' + stringify(val[k])).join(',') + '}';
    };
    return stringify(value);
}
function createCacheKey(endpoint, payload) {
    return `alchm:${endpoint}:${payload ? stableStringify(payload) : 'nopayload'}`;
}
// In-flight request deduplication
const inFlightRequests = new Map();
// Circuit breaker wrapped POST
const protectedPost = async (endpoint, data) => breaker.execute(async () => {
    const response = await apiClient.post(endpoint, data);
    return response.data;
});
async function cachedPost(endpoint, data, ttlSeconds) {
    const cacheKey = createCacheKey(`POST${endpoint}`, data);
    try {
        const cached = await cacheService.get(cacheKey);
        if (cached !== null) {
            return cached;
        }
    }
    catch (error) {
        logger.warn('Cache get failed (post):', error);
    }
    if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey);
    }
    const reqPromise = (async () => {
        try {
            const result = await protectedPost(endpoint, data);
            await cacheService.set(cacheKey, result, ttlSeconds);
            return result;
        }
        catch (error) {
            // On failure, serve last known cached value if available
            const fallback = await cacheService.get(cacheKey);
            if (fallback !== null) {
                logger.warn(`Serving cached fallback for ${endpoint}`);
                return fallback;
            }
            throw error;
        }
        finally {
            inFlightRequests.delete(cacheKey);
        }
    })();
    inFlightRequests.set(cacheKey, reqPromise);
    return reqPromise;
}
async function cachedGet(endpoint, ttlSeconds) {
    const cacheKey = createCacheKey(`GET${endpoint}`);
    try {
        const cached = await cacheService.get(cacheKey);
        if (cached !== null) {
            return cached;
        }
    }
    catch (error) {
        logger.warn('Cache get failed (get):', error);
    }
    if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey);
    }
    const reqPromise = (async () => {
        try {
            const start = Date.now();
            const resp = await apiClient.get(endpoint);
            const result = { healthy: resp.status === 200, responseTime: Date.now() - start };
            await cacheService.set(cacheKey, result, ttlSeconds);
            return result;
        }
        catch (error) {
            const result = { healthy: false, responseTime: undefined, error: error?.message };
            // Cache failures briefly to avoid hot loops
            await cacheService.set(cacheKey, result, Math.max(15, Math.min(ttlSeconds, 60)));
            return result;
        }
        finally {
            inFlightRequests.delete(cacheKey);
        }
    })();
    inFlightRequests.set(cacheKey, reqPromise);
    return reqPromise;
}
export async function getRealHoroscope(birthData) {
    try {
        // Stable data for a specific birth chart; safe to cache longer
        return await cachedPost('/horoscope', birthData, 24 * 60 * 60);
    }
    catch (error) {
        logger.error('Horoscope API error:', error);
        throw error;
    }
}
export async function getRealPlanetaryPositions(location) {
    try {
        // Planetary positions change frequently; short cache
        return await cachedPost('/planetary', { location }, 5 * 60);
    }
    catch (error) {
        logger.error('Planetary API error:', error);
        throw error;
    }
}
// Named client used by routes
export const alchmClient = {
    async calculateAlchemy(payload) {
        try {
            // Derived from static birth info; moderate cache
            return await cachedPost('/alchemy/calculate', payload, 60 * 60);
        }
        catch (error) {
            logger.error('calculateAlchemy error:', error);
            return { success: false, error: 'calculateAlchemy_failed' };
        }
    },
    async imaginize(payload) {
        try {
            // Imaginize can vary with options; shorter cache
            return await cachedPost('/alchemy/imaginize', payload, 15 * 60);
        }
        catch (error) {
            logger.error('imaginize error:', error);
            return { success: false, error: 'imaginize_failed' };
        }
    },
    async healthCheck() {
        // Cache health result briefly to avoid spamming external service
        return await cachedGet('/health', 60);
    },
    getStatus() {
        // Minimal status; circuit breaker wrapper may expose state in your implementation
        return { open: false };
    }
};
//# sourceMappingURL=alchm-client.js.map
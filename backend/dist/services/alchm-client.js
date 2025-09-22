import axios from 'axios';
import { logger } from '../utils/logger.js';
import CircuitBreaker from '../utils/circuit-breaker.js';
const breaker = new CircuitBreaker({ failureThreshold: 3, recoveryTimeout: 5000, monitoringPeriod: 60000 });
const ALCHM_BACKEND_URL = process.env.ALCHM_BACKEND_URL || 'https://alchm-backend.onrender.com';
const apiClient = axios.create({
    baseURL: ALCHM_BACKEND_URL,
    timeout: 7000,
    headers: { 'Content-Type': 'application/json' }
});
// Circuit breaker wrapped POST
const protectedPost = async (endpoint, data) => breaker.execute(async () => {
    const response = await apiClient.post(endpoint, data);
    return response.data;
});
export async function getRealHoroscope(birthData) {
    try {
        return await protectedPost('/horoscope', birthData);
    }
    catch (error) {
        logger.error('Horoscope API error:', error);
        throw error;
    }
}
export async function getRealPlanetaryPositions(location) {
    try {
        return await protectedPost('/planetary', { location });
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
            return await protectedPost('/alchemy/calculate', payload);
        }
        catch (error) {
            logger.error('calculateAlchemy error:', error);
            return { success: false, error: 'calculateAlchemy_failed' };
        }
    },
    async imaginize(payload) {
        try {
            return await protectedPost('/alchemy/imaginize', payload);
        }
        catch (error) {
            logger.error('imaginize error:', error);
            return { success: false, error: 'imaginize_failed' };
        }
    },
    async healthCheck() {
        const start = Date.now();
        try {
            const resp = await apiClient.get('/health');
            return { healthy: resp.status === 200, responseTime: Date.now() - start };
        }
        catch (error) {
            return { healthy: false, responseTime: Date.now() - start, error: error?.message };
        }
    },
    getStatus() {
        // Minimal status; circuit breaker wrapper may expose state in your implementation
        return { open: false };
    }
};
//# sourceMappingURL=alchm-client.js.map
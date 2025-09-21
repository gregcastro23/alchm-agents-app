import { Router } from 'express';
import { alchmClient } from '../services/alchm-client.js';
import { cacheService } from '../services/cache.js';
import { asyncHandler } from '../middleware/error-handler.js';
const router = Router();
/**
 * GET /api/health
 * Basic health check endpoint
 */
router.get('/', asyncHandler(async (req, res) => {
    const startTime = Date.now();
    // Check external service health
    const alchmBackendHealth = await alchmClient.healthCheck();
    // Check cache service
    const cacheStats = cacheService.getStats();
    // Check circuit breaker status
    const circuitBreakerStatus = alchmClient.getStatus();
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: Date.now() - startTime,
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
            alchmBackend: {
                healthy: alchmBackendHealth.healthy,
                responseTime: alchmBackendHealth.responseTime,
                error: alchmBackendHealth.error,
                circuitBreaker: circuitBreakerStatus
            },
            cache: {
                type: cacheStats.type,
                connected: cacheStats.connected,
                memoryItems: cacheStats.memoryItems
            }
        },
        featureFlags: {
            planetaryHoursBackend: process.env.PLANETARY_HOURS_BACKEND === 'true',
            thermodynamicsBackend: process.env.THERMODYNAMICS_BACKEND === 'true',
            tokenCalculationsBackend: process.env.TOKEN_CALCULATIONS_BACKEND === 'true',
            kineticsBackend: process.env.KINETICS_BACKEND === 'true'
        }
    };
    // Determine overall health status
    const isHealthy = alchmBackendHealth.healthy && cacheStats.connected;
    const statusCode = isHealthy ? 200 : 503;
    if (!isHealthy) {
        health.status = 'degraded';
    }
    res.status(statusCode).json(health);
}));
/**
 * GET /api/health/detailed
 * Detailed health check with dependency testing
 */
router.get('/detailed', asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const checks = [];
    // Test cache operations
    try {
        const testKey = 'health-check-test';
        const testValue = { test: true, timestamp: Date.now() };
        await cacheService.set(testKey, testValue, 10);
        const retrieved = await cacheService.get(testKey);
        await cacheService.del(testKey);
        checks.push({
            name: 'Cache Operations',
            status: 'pass',
            responseTime: Date.now() - startTime,
            details: 'Set, get, and delete operations successful'
        });
    }
    catch (error) {
        checks.push({
            name: 'Cache Operations',
            status: 'fail',
            error: error instanceof Error ? error.message : 'Unknown error',
            responseTime: Date.now() - startTime
        });
    }
    // Test external service connectivity
    const alchmHealth = await alchmClient.healthCheck();
    checks.push({
        name: 'Alchm Backend',
        status: alchmHealth.healthy ? 'pass' : 'fail',
        responseTime: alchmHealth.responseTime,
        error: alchmHealth.error
    });
    // Memory usage
    const memoryUsage = process.memoryUsage();
    checks.push({
        name: 'Memory Usage',
        status: memoryUsage.heapUsed < 500 * 1024 * 1024 ? 'pass' : 'warn', // 500MB threshold
        details: {
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        }
    });
    const allPassed = checks.every(check => check.status === 'pass');
    const hasWarnings = checks.some(check => check.status === 'warn');
    const result = {
        status: allPassed ? 'healthy' : hasWarnings ? 'degraded' : 'unhealthy',
        timestamp: new Date().toISOString(),
        totalResponseTime: Date.now() - startTime,
        checks
    };
    const statusCode = allPassed ? 200 : hasWarnings ? 200 : 503;
    res.status(statusCode).json(result);
}));
export default router;
//# sourceMappingURL=health.js.map
import { createClient } from 'redis';
import { logger } from '../utils/logger.js';
class CacheService {
    redisClient = null;
    memoryCache = new Map();
    cleanupInterval = null;
    isConnected = false;
    async connect() {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
            try {
                this.redisClient = createClient({ url: redisUrl });
                this.redisClient.on('error', (err) => {
                    logger.error('Redis client error:', err);
                    this.isConnected = false;
                });
                this.redisClient.on('connect', () => {
                    logger.info('Redis client connected');
                    this.isConnected = true;
                });
                this.redisClient.on('disconnect', () => {
                    logger.warn('Redis client disconnected');
                    this.isConnected = false;
                });
                await this.redisClient.connect();
                logger.info('Cache service initialized with Redis');
            }
            catch (error) {
                logger.error('Failed to connect to Redis:', error);
                this.redisClient = null;
                this.setupMemoryCache();
            }
        }
        else {
            this.setupMemoryCache();
        }
    }
    setupMemoryCache() {
        logger.info('Cache service initialized with memory fallback');
        // Cleanup expired items every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupMemoryCache();
        }, 5 * 60 * 1000);
    }
    cleanupMemoryCache() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, item] of this.memoryCache.entries()) {
            if (item.expiresAt <= now) {
                this.memoryCache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger.debug(`Cleaned ${cleaned} expired items from memory cache`);
        }
    }
    async get(key) {
        try {
            // Try Redis first if available
            if (this.redisClient && this.isConnected) {
                const value = await this.redisClient.get(key);
                if (value) {
                    return JSON.parse(value);
                }
                return null;
            }
            // Fallback to memory cache
            const item = this.memoryCache.get(key);
            if (item) {
                if (item.expiresAt > Date.now()) {
                    return item.value;
                }
                else {
                    // Expired item
                    this.memoryCache.delete(key);
                }
            }
            return null;
        }
        catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    }
    async set(key, value, ttlSeconds = 3600) {
        try {
            // Try Redis first if available
            if (this.redisClient && this.isConnected) {
                await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
                return true;
            }
            // Fallback to memory cache
            const expiresAt = Date.now() + (ttlSeconds * 1000);
            this.memoryCache.set(key, { value, expiresAt });
            return true;
        }
        catch (error) {
            logger.error('Cache set error:', error);
            return false;
        }
    }
    async del(key) {
        try {
            // Try Redis first if available
            if (this.redisClient && this.isConnected) {
                await this.redisClient.del(key);
            }
            // Also remove from memory cache
            this.memoryCache.delete(key);
            return true;
        }
        catch (error) {
            logger.error('Cache delete error:', error);
            return false;
        }
    }
    async exists(key) {
        try {
            // Try Redis first if available
            if (this.redisClient && this.isConnected) {
                const exists = await this.redisClient.exists(key);
                return exists === 1;
            }
            // Fallback to memory cache
            const item = this.memoryCache.get(key);
            if (item && item.expiresAt > Date.now()) {
                return true;
            }
            return false;
        }
        catch (error) {
            logger.error('Cache exists error:', error);
            return false;
        }
    }
    async flush() {
        try {
            // Try Redis first if available
            if (this.redisClient && this.isConnected) {
                await this.redisClient.flushDb();
            }
            // Also clear memory cache
            this.memoryCache.clear();
            return true;
        }
        catch (error) {
            logger.error('Cache flush error:', error);
            return false;
        }
    }
    async keys(pattern) {
        try {
            // Try Redis first if available
            if (this.redisClient && this.isConnected) {
                return await this.redisClient.keys(pattern);
            }
            // Fallback to memory cache with simple pattern matching
            const keys = [];
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            for (const key of this.memoryCache.keys()) {
                if (regex.test(key)) {
                    keys.push(key);
                }
            }
            return keys;
        }
        catch (error) {
            logger.error('Cache keys error:', error);
            return [];
        }
    }
    getStats() {
        return {
            type: this.redisClient ? 'redis' : 'memory',
            connected: this.isConnected,
            memoryItems: this.memoryCache.size,
            redisConnected: this.redisClient !== null && this.isConnected
        };
    }
    disconnect() {
        if (this.redisClient) {
            this.redisClient.disconnect();
        }
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.memoryCache.clear();
        logger.info('Cache service disconnected');
    }
}
// Singleton instance
export const cacheService = new CacheService();
export default cacheService;
//# sourceMappingURL=cache.js.map
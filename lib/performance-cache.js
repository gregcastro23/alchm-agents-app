// Performance Cache System
// Implements intelligent caching for expensive calculations
class PerformanceCache {
  cache = new Map()
  // Cache planetary positions for 5 minutes (they don't change that often)
  PLANETARY_POSITIONS_TTL = 5 * 60 * 1000 // 5 minutes
  // Cache alchemical calculations for 30 seconds (user-specific but short-lived)
  ALCHEMICAL_TTL = 30 * 1000 // 30 seconds
  // Cache elemental info for 1 minute
  ELEMENTAL_TTL = 60 * 1000 // 1 minute
  get(key) {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }
  set(key, data, ttl) {
    const entry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.ALCHEMICAL_TTL,
    }
    this.cache.set(key, entry)
    // Clean up expired entries periodically
    if (this.cache.size > 1000) {
      this.cleanup()
    }
  }
  // Specialized methods for different types of data
  setPlanetaryPositions(data) {
    this.set('planetary-positions', data, this.PLANETARY_POSITIONS_TTL)
  }
  getPlanetaryPositions() {
    return this.get('planetary-positions')
  }
  setAlchemicalData(birthInfoHash, data) {
    this.set(`alchemical-${birthInfoHash}`, data, this.ALCHEMICAL_TTL)
  }
  getAlchemicalData(birthInfoHash) {
    return this.get(`alchemical-${birthInfoHash}`)
  }
  setElementalData(requestHash, data) {
    this.set(`elemental-${requestHash}`, data, this.ELEMENTAL_TTL)
  }
  getElementalData(requestHash) {
    return this.get(`elemental-${requestHash}`)
  }
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        expired: Date.now() > entry.timestamp + entry.ttl,
      })),
    }
  }
  // Clear all cache
  clear() {
    this.cache.clear()
  }
  // Clear specific type of cache
  clearType(type) {
    for (const key of this.cache.keys()) {
      if (key.includes(type)) {
        this.cache.delete(key)
      }
    }
  }
}
// Utility functions for creating cache keys
export function createBirthInfoHash(birthInfo) {
  // Create a hash from birth info for caching
  const key = JSON.stringify({
    date: birthInfo.date,
    time: birthInfo.time,
    location: birthInfo.location,
    hour: birthInfo.hour,
  })
  // Simple hash function
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}
export function createRequestHash(request) {
  const key = JSON.stringify(request)
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}
// Global cache instance
export const performanceCache = new PerformanceCache()
export { PerformanceCache }
//# sourceMappingURL=performance-cache.js.map

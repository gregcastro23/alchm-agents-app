import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { logger } from '../utils/logger.js'
import { cacheService } from './cache.js'
import CircuitBreaker from '../utils/circuit-breaker.js'

export interface AlchmBackendConfig {
  baseURL: string
  timeout: number
  maxRetries: number
  retryDelay: number
}

export interface ImaginizeRequest {
  birthInfo: {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    latitude: number
    longitude: number
  }
  horoscope?: any
  options?: {
    style?: string
    format?: 'png' | 'jpg' | 'webp'
    quality?: number
    width?: number
    height?: number
  }
}

export interface ImaginizeResponse {
  success: boolean
  imageUrl?: string
  metadata?: {
    alchmData: any
    generationTime: number
    style: string
  }
  error?: string
}

export interface AlchemicalCalculationRequest {
  birthInfo: {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    latitude: number
    longitude: number
  }
  options?: {
    includeAspects?: boolean
    includeTransits?: boolean
    includePlanetary?: boolean
  }
}

export interface AlchemicalCalculationResponse {
  success: boolean
  data?: {
    alchmData: any
    horoscope: any
    computeTime: number
  }
  error?: string
}

class AlchmClientService {
  private client: AxiosInstance
  private config: AlchmBackendConfig
  private circuitBreaker: CircuitBreaker

  constructor() {
    this.config = {
      baseURL: process.env.ALCHM_BACKEND_URL || 'https://alchm-backend.onrender.com',
      timeout: parseInt(process.env.ALCHM_BACKEND_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.ALCHM_BACKEND_MAX_RETRIES || '3'),
      retryDelay: 1000
    }

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Planetary-Agents-Backend/1.0.0'
      }
    })

    // Circuit breaker for resilience
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('AlchmClient request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          timeout: config.timeout
        })
        return config
      },
      (error) => {
        logger.error('AlchmClient request error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('AlchmClient response:', {
          status: response.status,
          url: response.config.url,
          responseTime: Date.now() - (response.config as any).requestStartTime
        })
        return response
      },
      (error) => {
        logger.error('AlchmClient response error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        })
        return Promise.reject(error)
      }
    )
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    try {
      return await requestFn()
    } catch (error) {
      if (retries > 0) {
        logger.warn(`Request failed, retrying... (${retries} attempts left)`)
        await this.delay(this.config.retryDelay)
        return this.retryRequest(requestFn, retries - 1)
      }
      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private getCacheKey(endpoint: string, params: any): string {
    const paramString = JSON.stringify(params)
    return `alchm-client:${endpoint}:${Buffer.from(paramString).toString('base64')}`
  }

  /**
   * Generate an alchemical image using the /imaginize endpoint
   */
  async imaginize(request: ImaginizeRequest): Promise<ImaginizeResponse> {
    const cacheKey = this.getCacheKey('imaginize', request)
    
    // Check cache first (images can be cached for longer periods)
    try {
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        logger.debug('Returning cached imaginize result')
        return cached as ImaginizeResponse
      }
    } catch (error) {
      logger.warn('Cache check failed for imaginize:', error)
    }

    return this.circuitBreaker.execute(async () => {
      const startTime = Date.now()
      
      const response = await this.retryRequest(async () => {
        return this.client.post<ImaginizeResponse>('/imaginize', request, {
          timeout: 45000 // Longer timeout for image generation
        } as AxiosRequestConfig & { requestStartTime: number })
      })

      const result: ImaginizeResponse = {
        ...response.data,
        metadata: {
          ...response.data.metadata,
          generationTime: Date.now() - startTime
        }
      }

      // Cache successful results for 1 hour
      if (result.success && result.imageUrl) {
        try {
          await cacheService.set(cacheKey, result, 3600)
        } catch (error) {
          logger.warn('Failed to cache imaginize result:', error)
        }
      }

      return result
    })
  }

  /**
   * Perform alchemical calculations
   */
  async calculateAlchemy(request: AlchemicalCalculationRequest): Promise<AlchemicalCalculationResponse> {
    const cacheKey = this.getCacheKey('calculate', request)
    
    // Check cache first
    try {
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        logger.debug('Returning cached alchemy calculation')
        return cached as AlchemicalCalculationResponse
      }
    } catch (error) {
      logger.warn('Cache check failed for alchemy calculation:', error)
    }

    return this.circuitBreaker.execute(async () => {
      const startTime = Date.now()
      
      const response = await this.retryRequest(async () => {
        return this.client.post<AlchemicalCalculationResponse>('/calculate', request)
      })

      const result: AlchemicalCalculationResponse = {
        ...response.data,
        data: response.data.data ? {
          ...response.data.data,
          computeTime: Date.now() - startTime
        } : undefined
      }

      // Cache successful results for 5 minutes (calculations can change with time)
      if (result.success) {
        try {
          await cacheService.set(cacheKey, result, 300)
        } catch (error) {
          logger.warn('Failed to cache alchemy calculation:', error)
        }
      }

      return result
    })
  }

  /**
   * Check if the alchm-backend is healthy
   */
  async healthCheck(): Promise<{ healthy: boolean; responseTime?: number; error?: string }> {
    try {
      const startTime = Date.now()
      const response = await this.client.get('/health', { timeout: 5000 })
      const responseTime = Date.now() - startTime
      
      return {
        healthy: response.status === 200,
        responseTime
      }
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get circuit breaker status
   */
  getStatus(): {
    circuitBreakerState: string
    failureCount: number
    lastFailureTime?: number
  } {
    return {
      circuitBreakerState: this.circuitBreaker.getState(),
      failureCount: this.circuitBreaker.getFailureCount(),
      lastFailureTime: this.circuitBreaker.getLastFailureTime()
    }
  }
}

// Singleton instance
export const alchmClient = new AlchmClientService()
export default alchmClient

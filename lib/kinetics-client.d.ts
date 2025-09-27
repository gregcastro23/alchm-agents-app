/**
 * Kinetics API Client
 * Centralized wrapper for GET/POST/PUT endpoints in /api/alchm-kinetics
 */
/// <reference types="node" />
export type KineticsGetParams = {
  lat: number
  lon: number
  date: string
  window?: number
  includeElemental?: boolean
  includePlanetary?: boolean
  validateTraditional?: boolean
}
export type KineticsPostBody = {
  lat: number
  lon: number
  startTime: string
  endTime: string
  intervalMinutes?: number
  includeElemental?: boolean
  includePlanetary?: boolean
  validateTraditional?: boolean
}
export type KineticsPutBody = {
  lat: number
  lon: number
  'start-time': string
  'end-time': string
  'time-interval'?: number
  exportFormat?: 'csv' | 'json'
}
export declare class AlchemicalKineticsClient {
  static get(params: KineticsGetParams): Promise<any>
  static post(body: KineticsPostBody): Promise<any>
  static put(body: KineticsPutBody): Promise<Response>
  /**
   * Fallback data for when kinetics API is unavailable
   */
  static getFallbackData(params: Partial<KineticsGetParams>): any
}

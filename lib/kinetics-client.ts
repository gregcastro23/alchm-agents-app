/**
 * Kinetics API Client
 * Centralized wrapper for GET/POST/PUT endpoints in /api/alchm-kinetics
 */

export type KineticsGetParams = {
  lat: number;
  lon: number;
  date: string; // YYYY-MM-DD
  window?: number;
  includeElemental?: boolean;
  includePlanetary?: boolean;
  validateTraditional?: boolean;
};

export type KineticsPostBody = {
  lat: number;
  lon: number;
  startTime: string; // ISO
  endTime: string; // ISO
  intervalMinutes?: number;
  includeElemental?: boolean;
  includePlanetary?: boolean;
  validateTraditional?: boolean;
};

export type KineticsPutBody = {
  lat: number;
  lon: number;
  'start-time': string; // ISO
  'end-time': string; // ISO
  'time-interval'?: number;
  exportFormat?: 'csv' | 'json';
};

export class AlchemicalKineticsClient {
  static async get(params: KineticsGetParams): Promise<any> {
    const url = new URL('/api/alchm-kinetics', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    url.searchParams.set('lat', String(params.lat))
    url.searchParams.set('lon', String(params.lon))
    url.searchParams.set('date', params.date)
    if (params.window) url.searchParams.set('window', String(params.window))
    url.searchParams.set('includeElemental', String(params.includeElemental !== false))
    url.searchParams.set('includePlanetary', String(params.includePlanetary !== false))
    url.searchParams.set('validateTraditional', String(params.validateTraditional === true))
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Kinetics GET failed: ${res.status}`)
    return res.json()
  }

  static async post(body: KineticsPostBody): Promise<any> {
    const res = await fetch('/api/alchm-kinetics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error(`Kinetics POST failed: ${res.status}`)
    return res.json()
  }

  static async put(body: KineticsPutBody): Promise<Response> {
    return fetch('/api/alchm-kinetics', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }
}



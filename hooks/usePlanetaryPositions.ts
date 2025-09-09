// Unified hook for consistent planetary positions across all components
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { getCurrentPlanetaryPositions } from '@/lib/calculate-transits'
import { generateAlchmForCurrentMoment } from '@/lib/alchemizer'
import { calculateMC } from '@/lib/monica/monica-constant-validator'

export interface PlanetaryPosition {
  planet: string;
  sign: string;
  degree: number;
  retrograde?: boolean;
}

export interface AlchemicalQuantities {
  spirit: number;
  essence: number;
  matter: number;
  substance: number;
  Heat: number;
  Entropy: number;
  Reactivity: number;
  Energy: number;
}

export interface UnifiedPlanetaryData {
  timestamp: string;
  planetaryPositions: PlanetaryPosition[];
  alchmQuantities: AlchemicalQuantities;
  monicaConstant: number;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UsePlanetaryPositionsOptions {
  refreshInterval?: number; // milliseconds, default 30000 (30 seconds)
  useApi?: boolean; // Use API endpoint vs direct calculation, default false
  retryAttempts?: number; // Number of retry attempts, default 3
}

const DEFAULT_OPTIONS: Required<UsePlanetaryPositionsOptions> = {
  refreshInterval: 30000, // 30 seconds
  useApi: false, // Use direct calculation by default for consistency
  retryAttempts: 3
};

// Shared cache to ensure all components get the same data at the same time
const sharedCache = {
  data: null as UnifiedPlanetaryData | null,
  lastFetch: 0,
  subscribers: new Set<() => void>(),
  isLoading: false
};

export function usePlanetaryPositions(options: UsePlanetaryPositionsOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [data, setData] = useState<UnifiedPlanetaryData>({
    timestamp: new Date().toISOString(),
    planetaryPositions: [],
    alchmQuantities: {
      spirit: 0,
      essence: 0,
      matter: 0,
      substance: 0,
      Heat: 0,
      Entropy: 0,
      Reactivity: 0,
      Energy: 0
    },
    monicaConstant: 0,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const retryCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPlanetaryData = useCallback(async (force: boolean = false): Promise<void> => {
    const now = Date.now();
    
    // Use shared cache if data is fresh (within 30 seconds) and not forced
    if (!force && sharedCache.data && (now - sharedCache.lastFetch) < 30000) {
      setData(prev => ({ ...sharedCache.data!, loading: false }));
      return;
    }

    // Prevent multiple simultaneous fetches
    if (sharedCache.isLoading && !force) {
      return;
    }

    sharedCache.isLoading = true;

    try {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      setData(prev => ({ ...prev, loading: true, error: null }));

      let result: UnifiedPlanetaryData;

      if (opts.useApi) {
        // Use API endpoint (matches Philosopher's Stone approach)
        const response = await fetch('/api/philosophers-stone/positions', {
          signal: abortControllerRef.current.signal,
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const apiData = await response.json();
        result = {
          ...apiData,
          loading: false,
          error: null,
          lastUpdated: new Date()
        };
      } else {
        // Use direct calculation (matches other components)
        const timestamp = new Date().toISOString();
        const positions = getCurrentPlanetaryPositions(Date.now());
        const alchm = await generateAlchmForCurrentMoment();

        const planetaryPositions = [
          'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'
        ].map(planet => ({
          planet,
          sign: positions[planet]?.sign || 'Aries',
          degree: parseFloat(String(positions[planet]?.degree || '0')),
          retrograde: positions[planet]?.retrograde || false
        }));

        const spirit = alchm?.['Alchemy Effects']?.['Total Spirit'] || 0;
        const essence = alchm?.['Alchemy Effects']?.['Total Essence'] || 0;
        const matter = alchm?.['Alchemy Effects']?.['Total Matter'] || 0;
        const substance = alchm?.['Alchemy Effects']?.['Total Substance'] || 0;

        const fire = alchm?.['Total Effect Value']?.['Fire'] || 0;
        const water = alchm?.['Total Effect Value']?.['Water'] || 0;
        const air = alchm?.['Total Effect Value']?.['Air'] || 0;
        const earth = alchm?.['Total Effect Value']?.['Earth'] || 0;

        const monicaConstant = calculateMC(
          spirit,
          essence,
          matter,
          substance,
          fire,
          water,
          air,
          earth
        );

        result = {
          timestamp,
          planetaryPositions,
          alchmQuantities: {
            spirit,
            essence,
            matter,
            substance,
            Heat: alchm?.['Heat'] || 0,
            Entropy: alchm?.['Entropy'] || 0,
            Reactivity: alchm?.['Reactivity'] || 0,
            Energy: alchm?.['Energy'] || 0
          },
          monicaConstant,
          loading: false,
          error: null,
          lastUpdated: new Date()
        };
      }

      // Update shared cache
      sharedCache.data = result;
      sharedCache.lastFetch = now;
      
      // Notify all subscribers
      sharedCache.subscribers.forEach(callback => callback());
      
      setData(result);
      retryCountRef.current = 0; // Reset retry count on success
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore aborted requests
      }

      console.error('Error fetching planetary positions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Retry logic
      if (retryCountRef.current < opts.retryAttempts) {
        retryCountRef.current++;
        console.log(`Retrying planetary positions fetch (${retryCountRef.current}/${opts.retryAttempts})...`);
        
        // Exponential backoff: 1s, 2s, 4s
        const retryDelay = Math.pow(2, retryCountRef.current - 1) * 1000;
        setTimeout(() => fetchPlanetaryData(force), retryDelay);
        return;
      }

      setData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    } finally {
      sharedCache.isLoading = false;
    }
  }, [opts.useApi, opts.retryAttempts]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchPlanetaryData(true);
  }, [fetchPlanetaryData]);

  // Subscribe to shared cache updates
  useEffect(() => {
    const updateFromCache = () => {
      if (sharedCache.data) {
        setData(prev => ({ ...sharedCache.data!, loading: false }));
      }
    };

    sharedCache.subscribers.add(updateFromCache);

    return () => {
      sharedCache.subscribers.delete(updateFromCache);
    };
  }, []);

  // Initial fetch and interval setup
  useEffect(() => {
    fetchPlanetaryData();

    // Set up refresh interval
    if (opts.refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchPlanetaryData();
      }, opts.refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPlanetaryData, opts.refreshInterval]);

  return {
    ...data,
    refresh,
    isStale: data.lastUpdated ? (Date.now() - data.lastUpdated.getTime()) > opts.refreshInterval : true
  };
}

// Helper hook for legacy components that just need positions
export function usePlanetaryPositionsOnly(options: UsePlanetaryPositionsOptions = {}) {
  const { planetaryPositions, loading, error, refresh } = usePlanetaryPositions(options);
  
  // Convert to legacy format for backward compatibility
  const legacyPositions = planetaryPositions.reduce((acc, pos) => {
    acc[pos.planet] = {
      sign: pos.sign,
      degree: pos.degree.toString(),
      retrograde: pos.retrograde || false
    };
    return acc;
  }, {} as Record<string, { sign: string; degree: string; retrograde: boolean }>);

  return {
    positions: legacyPositions,
    loading,
    error,
    refresh
  };
}

export default usePlanetaryPositions;
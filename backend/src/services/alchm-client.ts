import axios from 'axios';
import { logger } from '../utils/logger.js';
import { circuitBreaker } from '../utils/circuit-breaker.js';

const ALCHM_BACKEND_URL = process.env.ALCHM_BACKEND_URL || 'https://alchm-backend.onrender.com';

const apiClient = axios.create({
  baseURL: ALCHM_BACKEND_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Circuit breaker wrapped request
const protectedRequest = circuitBreaker(async (endpoint: string, data: any) => {
  const response = await apiClient.post(endpoint, data);
  return response.data;
});

// Get real horoscope data
export async function getRealHoroscope(birthData: any): Promise<any> {
  try {
    return await protectedRequest('/horoscope', birthData);
  } catch (error) {
    logger.error('Horoscope API error:', error);
    throw error;
  }
}

// Get real planetary positions
export async function getRealPlanetaryPositions(location: { lat: number; lon: number }): Promise<any> {
  try {
    return await protectedRequest('/planetary', { location });
  } catch (error) {
    logger.error('Planetary API error:', error);
    throw error;
  }
}

// ... add other endpoints as needed

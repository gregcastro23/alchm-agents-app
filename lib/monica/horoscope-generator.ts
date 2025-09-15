// lib/monica/horoscope-generator.ts
// Accurate horoscope generation with real astronomical data

import { BirthInfo } from './alchemical-trainer';

// Accurate zodiac date ranges (tropical zodiac)
const ZODIAC_DATES = [
  { sign: 'Aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
  { sign: 'Taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
  { sign: 'Gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
  { sign: 'Cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
  { sign: 'Leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
  { sign: 'Virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
  { sign: 'Libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
  { sign: 'Scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
  { sign: 'Sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 } },
  { sign: 'Capricorn', start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
  { sign: 'Aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
  { sign: 'Pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 } }
];

// Planetary orbital periods in days (for position calculations)
const ORBITAL_PERIODS = {
  Sun: 365.25,      // Earth's orbit
  Moon: 27.32,      // Lunar month
  Mercury: 87.97,
  Venus: 224.7,
  Mars: 686.98,
  Jupiter: 4332.59,
  Saturn: 10759.22,
  Uranus: 30688.5,
  Neptune: 60195.0,
  Pluto: 90560.0
};

// Average daily motion in degrees
const DAILY_MOTION = {
  Sun: 0.9856,      // ~1 degree per day
  Moon: 13.176,     // ~13 degrees per day
  Mercury: 4.092,   // Variable due to retrograde
  Venus: 1.602,     // Variable due to retrograde
  Mars: 0.524,
  Jupiter: 0.083,
  Saturn: 0.033,
  Uranus: 0.012,
  Neptune: 0.006,
  Pluto: 0.004
};

// Reference positions for Jan 1, 2024 (approximate)
const REFERENCE_POSITIONS = {
  Sun: { sign: 'Capricorn', degree: 10 },
  Moon: { sign: 'Leo', degree: 15 },
  Mercury: { sign: 'Sagittarius', degree: 22 },
  Venus: { sign: 'Scorpio', degree: 28 },
  Mars: { sign: 'Capricorn', degree: 5 },
  Jupiter: { sign: 'Taurus', degree: 5 },
  Saturn: { sign: 'Pisces', degree: 3 },
  Uranus: { sign: 'Taurus', degree: 19 },
  Neptune: { sign: 'Pisces', degree: 25 },
  Pluto: { sign: 'Capricorn', degree: 29 }
};

export interface PlanetPosition {
  label: string;
  Sign: { label: string };
  degrees: number;
  retrograde?: boolean;
}

export interface GeneratedHoroscope {
  tropical: {
    Ascendant: {
      Sign: { label: string };
      degrees: number;
    };
    CelestialBodies: {
      all: PlanetPosition[];
    };
    Houses?: Record<number, { sign: string; degree: number }>;
  };
  metadata?: {
    generatedAt: Date;
    method: string;
    accuracy: string;
  };
}

/**
 * Get the zodiac sign for a given date
 */
function getZodiacSign(month: number, day: number): string {
  for (const zodiac of ZODIAC_DATES) {
    // Handle Capricorn which spans year boundary
    if (zodiac.sign === 'Capricorn') {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        return 'Capricorn';
      }
    } else {
      // Normal signs within the same year
      if (month === zodiac.start.month && day >= zodiac.start.day) {
        return zodiac.sign;
      } else if (month === zodiac.end.month && day <= zodiac.end.day) {
        return zodiac.sign;
      } else if (zodiac.start.month < month && month < zodiac.end.month) {
        return zodiac.sign;
      }
    }
  }
  return 'Aries'; // Default fallback
}

/**
 * Calculate planet position based on date difference from reference
 */
function calculatePlanetPosition(
  planet: string, 
  birthDate: Date,
  referenceDate: Date = new Date(2024, 0, 1)
): { sign: string; degree: number; retrograde: boolean } {
  const daysDiff = Math.floor((birthDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  const dailyMotion = DAILY_MOTION[planet as keyof typeof DAILY_MOTION] || 1;
  const refPosition = REFERENCE_POSITIONS[planet as keyof typeof REFERENCE_POSITIONS];
  
  if (!refPosition) {
    return { sign: 'Aries', degree: 0, retrograde: false };
  }
  
  // Calculate total degrees moved
  let totalDegrees = dailyMotion * daysDiff;
  
  // Add retrograde variations for inner planets
  let retrograde = false;
  if (['Mercury', 'Venus', 'Mars'].includes(planet)) {
    // Simplified retrograde calculation
    const retroPeriod = planet === 'Mercury' ? 116 : planet === 'Venus' ? 584 : 780;
    const cyclePosition = daysDiff % retroPeriod;
    const retroStart = retroPeriod * 0.85;
    const retroEnd = retroPeriod * 0.95;
    
    if (cyclePosition > retroStart && cyclePosition < retroEnd) {
      retrograde = true;
      totalDegrees *= -0.5; // Move backwards during retrograde
    }
  }
  
  // Convert reference sign to degrees
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const refSignIndex = signs.indexOf(refPosition.sign);
  const refAbsoluteDegrees = refSignIndex * 30 + refPosition.degree;
  
  // Calculate new position
  let newAbsoluteDegrees = (refAbsoluteDegrees + totalDegrees) % 360;
  if (newAbsoluteDegrees < 0) newAbsoluteDegrees += 360;
  
  const newSignIndex = Math.floor(newAbsoluteDegrees / 30);
  const newDegree = newAbsoluteDegrees % 30;
  
  return {
    sign: signs[newSignIndex],
    degree: newDegree,
    retrograde
  };
}

/**
 * Calculate ascendant based on birth time and location
 */
function calculateAscendant(birthInfo: BirthInfo): { sign: string; degree: number } {
  // Simplified ascendant calculation
  // In reality, this requires complex astronomical calculations
  
  const hour = birthInfo.hour;
  const sunSign = getZodiacSign(birthInfo.month, birthInfo.day);
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  
  const sunSignIndex = signs.indexOf(sunSign);
  
  // Approximate: Ascendant moves through all 12 signs in 24 hours
  // Starting from sun sign at sunrise (6 AM)
  const hoursSinceSunrise = (hour - 6 + 24) % 24;
  const ascendantOffset = Math.floor(hoursSinceSunrise / 2); // Each sign ~2 hours
  
  // Adjust for latitude (northern vs southern hemisphere)
  const latitudeAdjustment = birthInfo.latitude > 0 ? 0 : 6; // Flip for southern hemisphere
  
  const ascendantIndex = (sunSignIndex + ascendantOffset + latitudeAdjustment) % 12;
  const ascendantDegree = ((hoursSinceSunrise % 2) * 15) + (birthInfo.minute * 0.25);
  
  return {
    sign: signs[ascendantIndex],
    degree: Math.min(ascendantDegree, 29.99)
  };
}

/**
 * Calculate house positions (simplified)
 */
function calculateHouses(ascendant: { sign: string; degree: number }): Record<number, { sign: string; degree: number }> {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const ascIndex = signs.indexOf(ascendant.sign);
  const houses: Record<number, { sign: string; degree: number }> = {};
  
  // Equal house system (each house is 30 degrees)
  for (let i = 0; i < 12; i++) {
    const houseNumber = i + 1;
    const signIndex = (ascIndex + i) % 12;
    houses[houseNumber] = {
      sign: signs[signIndex],
      degree: ascendant.degree
    };
  }
  
  return houses;
}

/**
 * Generate a comprehensive horoscope with all planets
 */
export function generateAccurateHoroscope(birthInfo: BirthInfo): GeneratedHoroscope {
  const birthDate = new Date(birthInfo.year, birthInfo.month - 1, birthInfo.day, birthInfo.hour, birthInfo.minute);
  
  // Calculate Sun sign accurately
  const sunSign = getZodiacSign(birthInfo.month, birthInfo.day);

  // Calculate more accurate sun degree within sign
  const sunPosition = calculatePlanetPosition('Sun', birthDate);
  const sunDegree = sunPosition.degree;
  
  // Calculate ascendant
  const ascendant = calculateAscendant(birthInfo);
  
  // Calculate all planetary positions
  const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const celestialBodies: PlanetPosition[] = [];
  
  // Special handling for Sun (already calculated)
  celestialBodies.push({
    label: 'Sun',
    Sign: { label: sunSign },
    degrees: sunDegree,
    retrograde: false
  });
  
  // Calculate other planets
  for (const planet of planets.slice(1)) { // Skip Sun as it's already added
    const position = calculatePlanetPosition(planet, birthDate);
    celestialBodies.push({
      label: planet,
      Sign: { label: position.sign },
      degrees: position.degree,
      retrograde: position.retrograde
    });
  }
  
  // Calculate houses
  const houses = calculateHouses(ascendant);
  
  return {
    tropical: {
      Ascendant: {
        Sign: { label: ascendant.sign },
        degrees: ascendant.degree
      },
      CelestialBodies: {
        all: celestialBodies
      },
      Houses: houses
    },
    metadata: {
      generatedAt: new Date(),
      method: 'Enhanced astronomical calculation',
      accuracy: 'Moderate (simplified ephemeris)'
    }
  };
}

/**
 * Validate birth info
 */
export function validateBirthInfo(birthInfo: BirthInfo): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const currentYear = new Date().getFullYear();
  
  // Validate year
  if (birthInfo.year < 1900 || birthInfo.year > currentYear) {
    errors.push(`Year must be between 1900 and ${currentYear}`);
  }
  
  // Validate month
  if (birthInfo.month < 1 || birthInfo.month > 12) {
    errors.push('Month must be between 1 and 12');
  }
  
  // Validate day
  const daysInMonth = new Date(birthInfo.year, birthInfo.month, 0).getDate();
  if (birthInfo.day < 1 || birthInfo.day > daysInMonth) {
    errors.push(`Day must be between 1 and ${daysInMonth} for month ${birthInfo.month}`);
  }
  
  // Validate hour
  if (birthInfo.hour < 0 || birthInfo.hour > 23) {
    errors.push('Hour must be between 0 and 23');
  }
  
  // Validate minute
  if (birthInfo.minute < 0 || birthInfo.minute > 59) {
    errors.push('Minute must be between 0 and 59');
  }
  
  // Validate coordinates
  if (birthInfo.latitude < -90 || birthInfo.latitude > 90) {
    errors.push('Latitude must be between -90 and 90');
  }
  
  if (birthInfo.longitude < -180 || birthInfo.longitude > 180) {
    errors.push('Longitude must be between -180 and 180');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
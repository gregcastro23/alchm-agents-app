import { alchemize, generateAlchmForCurrentMoment } from '../../src/services/alchemizer-service';

describe('Alchemizer Service', () => {
  const mockBirthInfo = {
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    latitude: 0,
    longitude: 0
  };

  const mockHoroscope = {
    tropical: {
      CelestialBodies: { /* mock data */ },
      Ascendant: { Sign: { label: 'Aries' } },
      Aspects: { /* mock aspects */ }
    }
  };

  test('alchemize calculates correct elements', async () => {
    const result = await alchemize(mockBirthInfo, mockHoroscope);
    expect(result.DominantElement).toBeDefined();
    expect(result.Heat).toBeGreaterThan(0);
  });

  test('generateAlchmForCurrentMoment returns valid data', async () => {
    const result = await generateAlchmForCurrentMoment();
    expect(result.AlchemyEffects.TotalSpirit).toBeDefined();
  });

  // Add more tests for effects, aspects, etc.
});

import { alchemize, generateAlchmForCurrentMoment } from '../../../src/services/alchemizer-service.js'

// Mock cache service
jest.mock('../../../src/services/cache.js', () => ({
  cacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  },
}))

// Mock planetary hours service
jest.mock('../../../src/services/planetary-hours.js', () => ({
  PLANETARY_HOUR_SEQUENCE: ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'],
}))

describe('Alchemizer Service', () => {
  const mockBirthInfo = {
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    latitude: 0,
    longitude: 0,
  }

  const mockHoroscope = {
    tropical: {
      CelestialBodies: {
        all: [
          {
            label: 'Sun',
            Sign: { label: 'Leo' },
            House: { label: '1' },
            ChartPosition: {
              Ecliptic: { ArcDegreesFormatted30: '15°00' }
            }
          },
          {
            label: 'Moon',
            Sign: { label: 'Cancer' },
            House: { label: '2' },
            ChartPosition: {
              Ecliptic: { ArcDegreesFormatted30: '20°00' }
            }
          },
          {
            label: 'Mercury',
            Sign: { label: 'Virgo' },
            House: { label: '3' },
            ChartPosition: {
              Ecliptic: { ArcDegreesFormatted30: '10°00' }
            }
          },
          {
            label: 'Venus',
            Sign: { label: 'Libra' },
            House: { label: '4' },
            ChartPosition: {
              Ecliptic: { ArcDegreesFormatted30: '5°00' }
            }
          },
          {
            label: 'Mars',
            Sign: { label: 'Aries' },
            House: { label: '5' },
            ChartPosition: {
              Ecliptic: { ArcDegreesFormatted30: '25°00' }
            }
          },
          {
            label: 'Jupiter',
            Sign: { label: 'Pisces' },
            House: { label: '6' },
            ChartPosition: {
              Ecliptic: { ArcDegreesFormatted30: '12°00' }
            }
          },
          {
            label: 'Saturn',
            Sign: { label: 'Capricorn' },
            House: { label: '7' },
            ChartPosition: {
              Ecliptic: { ArcDegreesFormatted30: '8°00' }
            }
          },
          {
            label: 'Uranus',
            Sign: { label: 'Aquarius' },
            House: { label: '8' },
            ChartPosition: {
              Ecliptic: { ArcDegreesFormatted30: '18°00' }
            }
          },
          {
            label: 'Neptune',
            Sign: { label: 'Pisces' },
            House: { label: '9' },
            ChartPosition: {
              Ecliptic: { ArcDegreesFormatted30: '22°00' }
            }
          },
          {
            label: 'Pluto',
            Sign: { label: 'Scorpio' },
            House: { label: '10' },
            ChartPosition: {
              Ecliptic: { ArcDegreesFormatted30: '28°00' }
            }
          }
        ],
        sun: {
          label: 'Sun',
          Sign: { label: 'Leo' },
          House: { label: '1' },
          ChartPosition: {
            Ecliptic: { ArcDegreesFormatted30: '15°00' }
          }
        },
        moon: {
          label: 'Moon',
          Sign: { label: 'Cancer' },
          House: { label: '2' },
          ChartPosition: {
            Ecliptic: { ArcDegreesFormatted30: '20°00' }
          }
        },
        mercury: {
          label: 'Mercury',
          Sign: { label: 'Virgo' },
          House: { label: '3' },
          ChartPosition: {
            Ecliptic: { ArcDegreesFormatted30: '10°00' }
          }
        },
        venus: {
          label: 'Venus',
          Sign: { label: 'Libra' },
          House: { label: '4' },
          ChartPosition: {
            Ecliptic: { ArcDegreesFormatted30: '5°00' }
          }
        },
        mars: {
          label: 'Mars',
          Sign: { label: 'Aries' },
          House: { label: '5' },
          ChartPosition: {
            Ecliptic: { ArcDegreesFormatted30: '25°00' }
          }
        },
        jupiter: {
          label: 'Jupiter',
          Sign: { label: 'Pisces' },
          House: { label: '6' },
          ChartPosition: {
            Ecliptic: { ArcDegreesFormatted30: '12°00' }
          }
        },
        saturn: {
          label: 'Saturn',
          Sign: { label: 'Capricorn' },
          House: { label: '7' },
          ChartPosition: {
            Ecliptic: { ArcDegreesFormatted30: '8°00' }
          }
        },
        uranus: {
          label: 'Uranus',
          Sign: { label: 'Aquarius' },
          House: { label: '8' },
          ChartPosition: {
            Ecliptic: { ArcDegreesFormatted30: '18°00' }
          }
        },
        neptune: {
          label: 'Neptune',
          Sign: { label: 'Pisces' },
          House: { label: '9' },
          ChartPosition: {
            Ecliptic: { ArcDegreesFormatted30: '22°00' }
          }
        },
        pluto: {
          label: 'Pluto',
          Sign: { label: 'Scorpio' },
          House: { label: '10' },
          ChartPosition: {
            Ecliptic: { ArcDegreesFormatted30: '28°00' }
          }
        }
      },
      Ascendant: { Sign: { label: 'Aries' } },
      Aspects: {
        points: {}
      },
    },
  }

  test('alchemize calculates correct elements', async () => {
    const result = await alchemize(mockBirthInfo, mockHoroscope)
    expect(result).toBeDefined()
    expect(result['Dominant Element']).toBeDefined()
    expect(result.Heat).toBeGreaterThan(0)
  })

  test('generateAlchmForCurrentMoment returns valid data', async () => {
    const result = await generateAlchmForCurrentMoment()
    expect(result).toBeDefined()
    expect(result).toHaveProperty('Alchemy Effects')
    expect(result['Alchemy Effects']['Total Spirit']).toBeDefined()
  })

  // Add more tests for effects, aspects, etc.
})

const express = require('express');
const app = express();
const PORT = process.env.PORT || 9000;

app.use(express.json());

// Mock horoscope data - comprehensive birth chart
const mockHoroscope = {
  tropical: {
    CelestialBodies: {
      all: [
        {
          label: 'Sun',
          Sign: { label: 'Leo' },
          House: { label: '1' },
          ChartPosition: { Ecliptic: { ArcDegreesFormatted30: '15°00' } }
        },
        {
          label: 'Moon',
          Sign: { label: 'Cancer' },
          House: { label: '2' },
          ChartPosition: { Ecliptic: { ArcDegreesFormatted30: '20°00' } }
        },
        {
          label: 'Mercury',
          Sign: { label: 'Virgo' },
          House: { label: '3' },
          ChartPosition: { Ecliptic: { ArcDegreesFormatted30: '10°00' } }
        },
        {
          label: 'Venus',
          Sign: { label: 'Libra' },
          House: { label: '4' },
          ChartPosition: { Ecliptic: { ArcDegreesFormatted30: '5°00' } }
        },
        {
          label: 'Mars',
          Sign: { label: 'Aries' },
          House: { label: '5' },
          ChartPosition: { Ecliptic: { ArcDegreesFormatted30: '25°00' } }
        }
      ],
      sun: {
        label: 'Sun',
        Sign: { label: 'Leo' },
        House: { label: '1' },
        ChartPosition: { Ecliptic: { ArcDegreesFormatted30: '15°00' } }
      },
      moon: {
        label: 'Moon',
        Sign: { label: 'Cancer' },
        House: { label: '2' },
        ChartPosition: { Ecliptic: { ArcDegreesFormatted30: '20°00' } }
      }
    },
    Ascendant: { Sign: { label: 'Aries' } },
    Aspects: { points: {} }
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mock-alchm-backend' });
});

// Horoscope endpoint
app.post('/horoscope', (req, res) => {
  const { year, month, day, hour, minute, latitude, longitude } = req.body;

  // Validate input
  if (!year || !month || !day) {
    return res.status(400).json({ error: 'Missing required birth data' });
  }

  res.json(mockHoroscope);
});

// Planetary positions endpoint
app.post('/planetary', (req, res) => {
  const { location } = req.body;

  if (!location || !location.lat || !location.lon) {
    return res.status(400).json({ error: 'Missing location data' });
  }

  res.json({
    timestamp: new Date().toISOString(),
    location,
    positions: {
      Sun: { longitude: 120.5, latitude: 0.0, sign: 'Leo' },
      Moon: { longitude: 90.3, latitude: 5.2, sign: 'Cancer' },
      Mercury: { longitude: 150.7, latitude: 2.1, sign: 'Virgo' }
    }
  });
});

// Alchemy calculation endpoint
app.post('/alchemy/calculate', (req, res) => {
  const { birthInfo, options } = req.body;

  if (!birthInfo) {
    return res.status(400).json({ error: 'Missing birth info' });
  }

  res.json({
    success: true,
    alchemicalProfile: {
      spirit: 0.35,
      essence: 0.25,
      matter: 0.20,
      substance: 0.20,
      dominantElement: 'Fire',
      heat: 75,
      entropy: 45
    }
  });
});

// Imaginize endpoint
app.post('/alchemy/imaginize', (req, res) => {
  const { birthInfo, horoscope, options } = req.body;

  res.json({
    success: true,
    imageUrl: 'https://example.com/sigil.png',
    style: options?.style || 'nordic',
    metadata: {
      generatedAt: new Date().toISOString()
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Mock API error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Mock alchm-backend API running on port ${PORT}`);
});

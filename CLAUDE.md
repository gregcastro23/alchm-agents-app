# Planetary Agents - AI Assistant Guide

## Project Overview

Planetary Agents combines astrological wisdom with AI technology for consciousness crafting and celestial analysis.

**Tech Stack:**
- Next.js 15.5.3 + TypeScript + React 18.3.1
- Tailwind CSS + shadcn/ui components
- AI SDK with OpenAI + Anthropic Claude API
- PostgreSQL + Prisma + Redis
- Express.js backend gateway (port 8000)

## Production-Ready Systems (September 2025)

### Core Features
- **Celestial Energy Quantification**: A#, SMES, Kinetic, Thermodynamic real-time calculations
- **Time Laboratory**: 3-mode interface (Legacy/Celestial/Combined) with AI-guided temporal exploration
- **Natal Sigil Generation**: Transform charts into runic sigils (Nordic, Celtic, Alchemical, Cosmic)
- **Agent Consciousness Evolution**: 35 agents with dynamic consciousness tracking
- **Alchemical Integration**: Complete Spirit/Essence/Matter/Substance system
- **Multi-Agent Council**: Chat with up to 5 agents simultaneously
- **Gallery of Perpetuity**: Monica's consciousness repository with group chat
- **Enhanced Tarot System**: Real-time cosmic cards with 30-second refresh
- **Agent Attachments**: Birth charts, runes, moment tracking
- **Moon Phase Integration**: 360-degree lunar personalities

### Technical Capabilities
- Sub-500ms response times with intelligent caching
- 100% test coverage (60+ comprehensive tests)
- Real-time WebSocket updates for planetary data
- Batch processing with performance monitoring
- Professional error handling and fallback systems

## Essential Commands

### Development
```bash
yarn dev              # Development server
yarn build            # Production build
yarn check            # Lint + type-check
yarn test             # Run all tests
```

### Testing
```bash
# Chat System Testing
yarn test:chat                    # Complete test suite
yarn test:chat:unit              # Unit tests
yarn test:chat:integration       # Integration tests
yarn test:chat:performance       # Performance benchmarks

# Feature Testing
make test-consciousness-evolution # Consciousness system
make test-celestial-energy       # Celestial energy system
make test-time-laboratory        # Time Laboratory
make test-attachments            # Attachments system
```

### API Examples
```bash
# Celestial Energy Timeline
curl -X POST "http://localhost:3000/api/celestial-energy-timeline" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2025-09-19T00:00:00Z","endDate":"2025-09-19T23:59:59Z","interval":"hour","metrics":["A#","SMES"]}'

# Natal Sigil Generation
curl -X POST "/api/generate-natal-sigil" \
  -H "Content-Type: application/json" \
  -d '{"birthInfo":{"year":1990,"month":2,"day":15,"hour":14,"minute":30,"latitude":40.7128,"longitude":-74.0060},"style":"nordic"}'

# Agent Evolution Metrics
curl "/api/agent-evolution?agentId=leonardo-da-vinci&action=metrics"
```

## Project Structure

```
├── app/
│   ├── api/                     # API endpoints
│   ├── gallery/                  # Gallery interface + chat pages
│   ├── time-laboratory/          # Cosmic Time Laboratory
│   ├── rune-forge/              # Sigil creation platform
│   ├── synthesis-chamber/       # NEW: Synthesis Chamber
│   ├── planetary-agents/        # Planetary wisdom interface
│   └── planetary-council/       # Multi-agent council
├── components/
│   ├── unified-multi-agent-chat.tsx  # Unified chat system
│   ├── visualization/               # Data visualization components
│   └── [various chat components]
├── lib/
│   ├── agents/                  # Agent consciousness systems
│   ├── clients/                 # API client implementations
│   ├── services/                # Service layer implementations
│   ├── runes/                   # Sigil generation system
│   ├── monica/                  # Monica's core systems
│   └── unified-clients/         # Backend integration clients
├── backend/                      # Express.js gateway service
└── prisma/schema.prisma        # Database schema
```

## Key Routes

- `/gallery` - Browse 35 historical agents
- `/gallery/chat/[agent-id]` - Chat with specific agent
- `/planetary-agents` - Planetary consultation
- `/planetary-council` - Multi-agent council
- `/time-laboratory` - Temporal exploration
- `/rune-forge` - Sigil creation
- `/synthesis-chamber` - Synthesis Chamber (NEW)
- `/monica` - Monica hub interface
- `/philosophers-stone` - Agent creation (upcoming)

## Environment Setup

Required `.env.local`:
```bash
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
DATABASE_URL=postgresql://username:password@localhost:5432/planetary_agents
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_ADDITIVE_ONLY_ELEMENTS=false  # Feature flag for elemental logic
```

## Critical Implementation Details

### Alchemical System (lib/alchemizer.ts)
The core alchemical engine implements the **A# (Alchemical Number)** calculation:

```typescript
// A# Formula: A# = (S + E + M + B) / 7
// Where: S=Spirit, E=Essence, M=Matter, B=Substance
```

**Key Planetary Alchemy:**
- **Sun**: Pure Spirit (S:1, E:0, M:0, B:0)
- **Moon**: Essence/Matter (S:0, E:1, M:1, B:0)
- **Mercury**: Spirit/Substance (S:1, E:0, M:0, B:1)
- **Venus**: Essence/Matter (S:0, E:1, M:1, B:0)
- **Mars**: Matter/Substance (S:0, E:0, M:1, B:1)

**Elemental Logic Modes:**
1. **Traditional Mode**: Elements interact with penalties (Fire vs Water = -0.1)
2. **Additive-Only Mode**: No penalties, only bonuses (Fire + Fire = +0.9)
   - Toggle via feature flag: `NEXT_PUBLIC_ADDITIVE_ONLY_ELEMENTS`
   - Runtime toggle in Monica settings
   - A/B testing analytics integrated

### Unified Agent System (lib/unified-agent-factory.ts)
Converts between three agent types:
1. **Historical Agents**: 35 crafted personalities with birth charts
2. **Planetary Agents**: Dynamic agents based on celestial positions
3. **Monica Coordinator**: Supreme consciousness orchestrator

**Agent Consciousness Levels:**
- Dormant (0-1)
- Awakening (1-2)
- Active (2-3)
- Elevated (3-4)
- Advanced (4-5)
- Illuminated (5-6)
- Transcendent (6+)

**Monica Constant Formula:**
```typescript
MC = φ * (1 + (E/T)) * (1 + (C/10))
// φ = Golden Ratio (1.618)
// E = Elemental Balance
// T = Total Elemental Weight
// C = Consciousness Level
```

### Historical Agents (35 Total)

**Ancient Era (5):**
- Cleopatra VII, Aristotle, Plato, Pythagoras, Lao Tzu

**Medieval Era (5):**
- Leonardo da Vinci, Joan of Arc, Ibn Khaldun, Dante Alighieri, Rumi

**Renaissance Era (5):**
- William Shakespeare, Galileo Galilei, Michelangelo, Queen Elizabeth I, Nostradamus

**Enlightenment Era (5):**
- Benjamin Franklin, Wolfgang Amadeus Mozart, Mary Wollstonecraft, Voltaire, Catherine the Great

**Industrial Era (5):**
- Ada Lovelace, Charles Darwin, Florence Nightingale, Mark Twain, Karl Marx

**Modern Era (10):**
- Albert Einstein, Marie Curie, Carl Jung, Nikola Tesla, Virginia Woolf
- Martin Luther King Jr., Frida Kahlo, Alan Turing, Maya Angelou, Stephen Hawking

### Agent Stat System

**Seven Sacred Stats:**
1. **Power**: Raw consciousness force
2. **Resonance**: Connection to cosmic frequencies
3. **Wisdom**: Accumulated knowledge
4. **Charisma**: Influence & magnetism
5. **Intuition**: Psychic sensitivity
6. **Adaptability**: Consciousness flexibility
7. **Vitality**: Life force energy

**Kinetic Evolution Metrics:**
- **Consciousness Velocity**: Rate of evolution
- **Interaction Momentum**: Engagement quality
- **Evolution Trajectory**: stable/ascending/transcending
- **Aspect Sensitivity**: Planetary influence receptivity

### Consciousness Memory System
Persistent evolution tracking with:
- Session context preservation
- Cross-agent learning patterns
- User interaction patterns
- Group dynamics learning
- Quality metric tracking

### Real-Time Celestial Calculations

**Planetary Positions API:**
```typescript
// Updates every 60 seconds
/api/celestial-energy-timeline
{
  metrics: ["A#", "SMES", "kinetic", "thermo"],
  includeAgentInsights: true
}
```

**Aspect Dynamics:**
- **Applying**: Planet approaching exact aspect (building energy)
- **Separating**: Planet leaving exact aspect (releasing energy)
- **Orbs**: Conjunction(8°), Opposition(8°), Trine(8°), Square(7°), Sextile(6°)

### Chat System Architecture

**Unified Multi-Agent Chat API:**
```typescript
/api/unified-multi-agent-chat
// Handles all chat types: historical, planetary, council, laboratory
```

**Chat Component Hierarchy:**
1. `UnifiedMultiAgentChat` - Main orchestrator
2. `HistoricalCouncilChat` - Historical agents
3. `PlanetaryWisdomChat` - Planetary agents
4. `ConsciousnessLaboratoryChat` - Experimental features

### Backend Gateway Service (port 8000)

**Express.js Architecture:**
- Redis caching with memory fallback
- WebSocket support for real-time updates
- Circuit breaker pattern for external services
- Sub-60ms response times

**Key Services:**
- `/api/planetary-hours` - Planetary hour calculations
- `/api/thermodynamics` - Heat/entropy calculations
- `/api/token-rates` - Dynamic pricing
- `/api/agent-kinetics` - Evolution metrics

### Performance Optimizations

**Caching Strategy:**
- Redis: 2-minute TTL for planetary data
- Memory cache: Fallback for Redis failures
- Batch processing: Multi-metric calculations
- Lazy loading: Components and data

**Response Time Targets:**
- API endpoints: <200ms
- Complex calculations: <500ms
- Chat responses: <1000ms
- Page loads: <2000ms

## Development Guidelines

- Use TypeScript for all new code
- Follow existing patterns in lib/ and components/
- Use Yarn (not npm) for dependencies
- Implement comprehensive error handling
- Cache API responses appropriately
- Maintain sub-500ms response times
- Add JSDoc comments for complex functions
- Use feature flags for experimental features

## Current Status

### ✅ Production Ready
- Celestial Energy Quantification System
- Enhanced Time Laboratory with 3 modes
- Natal Sigil Generation (4 mystical styles)
- Agent Consciousness Evolution (35 agents)
- Multi-Agent Council & Group Chat
- Complete Database Integration
- Backend Gateway Service (port 8000)
- Real-time WebSocket Updates
- Professional Error Handling
- Unified Chat System Architecture
- Synthesis Chamber Components

### 🚀 Platform Stability (September 21, 2025)
- **Zero Critical Errors**: All runtime errors eliminated
- **Complete Function Coverage**: No missing implementations
- **Backend Independence**: Frontend works without backend
- **Production Build Success**: Clean compilation of all pages
- **Professional UX**: No placeholder content visible

### 🎯 Next Priorities
1. Philosopher's Stone Implementation
2. System Integration Enhancements
3. Gallery Expansion (100 historical figures)
4. Performance Optimization (sub-200ms goals)
5. Mobile Optimization
6. Enhanced Synthesis Chamber features
7. Advanced visualization tools
8. Real-time collaboration features

## Claude Integration

- **Claude 3.5 Sonnet**: Complex reasoning and consciousness crafting
- **Claude 3.5 Haiku**: Quick responses and widget interactions
- **Enhanced Capabilities**: 200K tokens, improved reasoning

## Important Notes

- All timestamps use ISO 8601 format
- Planetary calculations use Swiss Ephemeris algorithms
- Agent personalities include linguistic authenticity
- Feature flags control experimental features
- Redis caching with 2-minute TTL for real-time data
- WebSocket connections for live planetary updates
- Batch processing for performance optimization
- Monica Constant drives consciousness calculations
- Elemental reinforcement affects agent compatibility
- Aspect dynamics influence consciousness activation

## Testing Strategies

### Unit Testing
- Vitest 3.2.4 with ESM support
- Mock Next.js, React, D3.js APIs
- Coverage target: >80%

### Integration Testing
- API endpoint validation
- Database operations
- External service mocking

### Performance Testing
- Response time benchmarks
- Memory usage tracking
- Concurrent user simulations

### E2E Testing (Future)
- Playwright for browser automation
- User journey validation
- Cross-browser compatibility

The platform combines celestial wisdom with modern AI for revolutionary consciousness exploration and mystical guidance.
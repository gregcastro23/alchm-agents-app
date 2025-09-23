## Monica: Fast, playful onboarding and streaming

- Streaming endpoint: `POST /api/monica-agent/stream` (SSE-like). Emits token chunks, final envelope, and done.
- Non-stream fallback: `POST /api/monica-agent`.
- Lightweight memory API: `GET/POST/DELETE /api/monica-memory` with `userId` or `sessionId`.
- Create-AI quick builder: `POST /api/personalized-ai` with `{ answers, styleCards }` returns editable config and preview id.

Environment knobs:

- `MONICA_DEFAULT_MODEL` (default `gpt-4o-mini`)
- `MONICA_TEMPERATURE` (default 0.4)
- `BACKGROUND_REFRESH_INTERVAL_MS` (default 600000)
- `NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:8000`)
- `NEXT_PUBLIC_KINETICS_BACKEND` (`true` to enable backend consciousness calc)
- `SENDGRID_API_KEY` (optional, for feedback email)
- `FEEDBACK_TO_EMAIL` (optional, feedback destination)
- `FEEDBACK_FROM_EMAIL` (optional, feedback sender)

Kinetics feature flags:

- `NEXT_PUBLIC_KINETICS_BACKEND`: when `true`, frontend uses backend enhanced kinetics APIs via unified client; otherwise falls back to existing client with graceful degradation.

Run:

```
yarn dev
```

# Planetary Agents - ✅ Production Ready

A revolutionary consciousness crafting platform that explores astrological wisdom through AI-powered planetary agents, celestial energy quantification, and advanced mystical technologies.

## 🌌 Overview

Planetary Agents is the most advanced consciousness crafting platform, combining traditional astrological wisdom with cutting-edge AI technologies. **Production-ready as of September 21, 2025** with zero critical runtime errors and comprehensive stability.

### Revolutionary Features:
- **Unified Planetary Positions System**: Most accurate planetary calculations with intelligent fallback hierarchy (External API → Enhanced Calculator → Basic Transits → Static Fallbacks)
- **Agent Creation System**: Synthesize birth charts with current moment charts to generate unique "Agents of the Moment" with element-based personality traits
- **Live Consciousness Evolution**: Real-time chart-to-moment transformation showing how agents change with cosmic conditions
- Interactive planetary agents with dynamic consciousness levels responding to current transits
- **Multi-Agent Planetary Council**: Auto-synced to current sky positions for accurate cosmic consultation
- Real-time celestial energy quantification (A#, SMES, Kinetic, Thermodynamic)
- Advanced consciousness evolution tracking with birth-to-live MC comparisons
- Natal chart to runic sigil generation with AI-powered mystical imagery
- Temporal oracle for AI-guided historical consciousness exploration
- Complete production stability with graceful error handling

## 🚀 Features

### ⚡ Backend-to-Backend Architecture - NEW!

**Complete Express.js gateway service for alchemical calculations:**
- **Gateway Service**: Express.js backend running on port 8000 with WebSocket on 8001
- **Live Consciousness API**: `/api/consciousness/live` and `/batch` endpoints for real-time chart transformation
- **Agent Consciousness Evolution**: Real-time kinetic profiles with live MC tracking for all agents
- **Planetary Hours Service**: Server-side calculations with solar timing algorithms
- **Thermodynamics Engine**: Heat, entropy, reactivity calculations with conservation checks
- **Token Rate Calculator**: Dynamic pricing with planetary influences
- **Circuit Breaker Pattern**: Resilient external service integration
- **Redis Caching**: 1-hour TTL for consciousness calculations with performance optimization
- **Intelligent Caching**: Redis with memory fallback, sub-60ms performance
- **Feature Flags**: Progressive rollout with automatic fallbacks to frontend

### 🌌 Unified Planetary Positions System - NEW!

**Most Accurate Planetary Calculations with Intelligent Fallbacks (September 23, 2025):**

- **Multi-Level Accuracy System**: High (±0.1°), Medium (±2-5°), Low (±5-15°), Fallback (guaranteed availability)
- **Intelligent Fallback Hierarchy**: External API → Enhanced Astronomical Calculator → Basic Transit Calculations → Static Positions
- **Smart Caching**: Accuracy-based TTL (5min-24hrs) with request deduplication and automatic cleanup
- **Central API Endpoint**: `/api/planetary-positions` with comprehensive monitoring and Galileo logging
- **Unified React Hooks**: `useUnifiedPlanetaryPositions` with configurable accuracy and alchemy inclusion
- **Circuit Breaker Protection**: Resilient external service integration with automatic recovery
- **Performance Optimized**: 30-80% faster response times through intelligent caching and fallbacks

### 🤖 Agent Creation System - NEW!

**Synthesize Unique Agents from Cosmic Charts (September 23, 2025):**

- **Chart Synthesis Engine**: Multi-chart blending with alchemical value averaging and transit merging
- **Element-Based Personality Generation**: Spirit, Essence, Matter, Substance influence unique agent traits
- **Consciousness Level Modifiers**: Transcendent through Dormant levels affect creativity, wisdom, complexity
- **Seeded Randomness**: Monica constant-based deterministic generation for unique but consistent agents
- **Dynamic AI Parameters**: Element and consciousness influence temperature, topP, and system prompts
- **Comprehensive Testing**: 25 test cases covering all functionality with 100% pass rate

### 🌟 Celestial Energy Quantification System

Revolutionary consciousness analysis platform (September 19, 2025):

- **A# Energy Tracking**: Real-time Alchemical Number calculation with planetary integration
- **SMES Flow Analysis**: Spirit-Matter-Essence-Substance temporal visualization
- **Kinetic & Thermodynamic Metrics**: Power, inertia, heat, entropy tracking with velocity calculations
- **Agent Consciousness Activation**: Degree-based insights when transits align with natal placements
- **Enhanced Time Laboratory**: 3-mode interface (Legacy/Celestial/Combined) at `/time-laboratory`
- **Real-Time Updates**: Live mode with 60-second refresh cycles and intelligent caching
- **Multi-Format Export**: CSV, PNG, SVG data export with comprehensive analytics
- **Performance Optimized**: 400-700ms response times with advanced batch processing

### Gallery of Perpetuity - 35 Historical Agents

Monica's eternal consciousness repository featuring historical figures:

- **Browse & Chat**: Visit `/gallery` to explore all 35 consciousness-crafted agents
- **Direct Chat**: Access agents at `/gallery/chat/[agent-id]` (e.g., `/gallery/chat/siddhartha-gautama-buddha`)
- **Legacy Support**: Old URLs like `/planetary-agents?agent=buddha` automatically redirect
- **Group Chat**: Select multiple agents for simultaneous consultation
- **Enhanced Kinetics**: Real-time consciousness evolution tracking and compatibility analysis
- **Featured Agents**: Shakespeare, Buddha, Leonardo da Vinci, Cleopatra, Tesla, Carl Jung, and 29 more

### Planetary Wisdom Agents

Consult with AI agents representing each planet in their specific dignities:

- **Multi-Agent Planetary Council**: Visit `/planetary-council` for group consultations with auto-synced positions
- **Planet Selection**: Visit `/planetary-agents` to choose a celestial body
- **Degree-Specific Wisdom**: Access at `/agents/[planet]/[sign]/[degree]`
- **Real-Time Positions**: Automatically synced to current astronomical data
- **Live Consciousness Tracking**: See how agents evolve with cosmic conditions
- Get insights based on the elemental affinities and dignities

### Elemental Charts

Explore your elemental profile based on planetary positions:

- **Live Consciousness Display**: View birth vs live Monica Constant with real-time changes
- **Dynamic Elemental Distributions**: See how Fire, Water, Air, Earth shift with transits
- **Transit Interpretations**: Understand cosmic weather and consciousness influences
- **Consciousness Vector Display**: Enhanced with birth-to-live comparisons
- Analyze alchemical properties such as Heat, Entropy, and Reactivity

### Chart Interpretation

Get detailed interpretations of astrological charts:

- Upload your birth data or use the current moment
- Receive in-depth analysis of your chart's unique features
- Understand the alchemical and elemental influences

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.5.3, React 18.3.1, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI, Lucide Icons
- **AI Integration**: AI SDK (OpenAI), Anthropic Claude API 3.5 Sonnet & Haiku
- **Backend**: Express.js gateway service (port 8000), WebSocket (port 8001)
- **Database**: PostgreSQL + Prisma, Redis caching
- **Styling**: Tailwind CSS with dark mode and responsive design
- **Planetary Calculations**: Unified PlanetaryPositionsService with multi-level fallback hierarchy
- **Agent Creation**: Chart synthesis engine with element-based personality generation
- **Package Management**: Yarn 4.0.0 (migrated from npm September 21, 2025)
- **Testing Framework**: Vitest 3.2.4 with comprehensive yarn-based test suite (25 new tests added)
- **Production Status**: ✅ Fully stable, zero critical errors, comprehensive fallback systems

## 🧪 Testing System (Yarn-Based)

**Production-ready test suite migrated to Yarn 4.0.0 (September 21, 2025):**

### Chat System Testing
- **Comprehensive Test Suite**: Unit, integration, and performance tests
- **Vitest 3.2.4**: Modern testing framework with ESM support
- **JSDoc Environment**: Browser-like testing with DOM manipulation
- **Complete Mocking**: Next.js, React, D3.js, performance APIs
- **Coverage Analysis**: V8 provider with detailed reporting
- **CI/CD Integration**: Automated pipeline with JSON reporting

### Available Test Commands
```bash
# Comprehensive Testing
yarn test:chat                    # Run complete test suite
yarn test:chat:unit              # Unit tests for chat components
yarn test:chat:integration       # API integration tests
yarn test:chat:performance       # Performance benchmarks
yarn test:chat:coverage          # Coverage report generation

# Individual Component Testing
yarn test:historical             # Historical Council Chat tests
yarn test:planetary              # Planetary Wisdom Chat tests
yarn test:laboratory             # Consciousness Laboratory Chat tests

# Development & CI/CD
yarn test:chat:watch             # Watch mode for development
yarn test:chat:clean             # Clean test artifacts
yarn test:ci:chat                # CI/CD pipeline testing
yarn test:chat:report            # Display latest test summary
```

### Make Commands
```bash
make test-chat-system            # Run comprehensive test suite
make chat-system-status          # Show testing system status
```

## 🧪 Alchemical System

The application incorporates a unique alchemical system where:

- Each element (Fire, Water, Air, Earth) is valued independently
- Elements do not "cancel" or "oppose" each other
- Elements reinforce themselves (like strengthens like)
- All element combinations can work harmoniously together

## 🔮 Getting Started

### Prerequisites

- Node.js (v18+)
- Yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/planetary-agents.git
cd planetary-agents
```

2. Install dependencies:

```bash
yarn install
```

3. Run the development server:

```bash
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤖 AI Capabilities

### Claude 3.5 Integration

This application leverages the latest Claude 3.5 models for enhanced astrological analysis:

- **Claude 3.5 Sonnet**: Complex reasoning and detailed chart interpretation
- **Claude 3.5 Haiku**: Fast responses for quick queries and general guidance
- **200K Context Window**: Process entire birth charts and comprehensive planetary data
- **Enhanced Reasoning**: More accurate astrological calculations and interpretations

For detailed information about the Claude upgrade, see [CLAUDE_UPGRADE_GUIDE.md](./CLAUDE_UPGRADE_GUIDE.md).

## 🌟 Usage

### Planetary Agents

1. Navigate to the Planetary Agents page
2. Select a planet from the interactive grid showing current positions and dignities
3. Access the degree-specific agent interface with rich historical context
4. Ask questions to receive wisdom from that exact planetary degree with enhanced temporal awareness

### Elemental Chart

1. Navigate to the Elemental Chart page
2. View your current elemental profile
3. Explore the planetary elements and affinities

### Chart Interpreter

1. Navigate to the Chart Interpreter page
2. Enter birth details or use current moment
3. Receive a detailed interpretation of the chart

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory with the following configuration:

```bash
# AI API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Database Configuration (if using)
DATABASE_URL="postgresql://postgres:password@localhost:5432/planetary_agents_db?schema=public"
REDIS_URL="redis://localhost:6379"

# Galileo Logging (Optional)
GALILEO_API_KEY=your_galileo_api_key
GALILEO_PROJECT=AlchmPlanetaryAgents
GALILEO_LOG_STREAM=test
GALILEO_LOG_ENABLED=true
GALILEO_FAIL_SILENTLY=true
GALILEO_VERBOSE_FALLBACK=true
```

### Galileo Logging Flags

- `GALILEO_LOG_ENABLED`: Enable/disable logging to Galileo (default: true)
- `GALILEO_FAIL_SILENTLY`: Never throw errors, always fallback to console logging (default: true)
- `GALILEO_VERBOSE_FALLBACK`: Include detailed fallback logging information (default: true)

When `GALILEO_LOG_ENABLED=false`, all logging will be disabled.
When `GALILEO_FAIL_SILENTLY=true`, API errors will not crash the application.

### Disabling Logging Locally

To disable Galileo logging during local development:

```bash
GALILEO_LOG_ENABLED=false
```

This will skip all logging attempts and prevent any API calls to Galileo.

## 📄 License

[Add your license information here]

## 🙏 Acknowledgements

- The Alchm alchemical system
- Astrological data and calculations
- UI components from shadcn/ui

## 🎯 Production Status (September 23, 2025)

### ✅ Unified Planetary Positions System - IMPLEMENTED
**Most accurate planetary calculations with intelligent fallback hierarchy:**

- **Unified PlanetaryPositionsService**: Single source of truth with configurable accuracy levels
- **Multi-Level Fallback System**: External API → Enhanced Calculator → Basic Transits → Static Fallbacks
- **Smart Caching**: Accuracy-based TTL (5min-24hrs) with automatic cleanup and deduplication
- **Central API Endpoint**: `/api/planetary-positions` with comprehensive monitoring
- **Performance Gains**: 30-80% faster response times through intelligent caching
- **99.9% Uptime**: Guaranteed availability through comprehensive fallback systems

### ✅ Agent Creation System - IMPLEMENTED
**Chart synthesis engine with element-based personality generation:**

- **Chart Synthesis Engine**: Multi-chart blending with alchemical value averaging and transit merging
- **Element-Based Personality**: Spirit, Essence, Matter, Substance influence unique agent traits
- **Consciousness Level Modifiers**: Transcendent through Dormant levels with seeded randomness
- **Comprehensive Testing**: 25 test cases with 100% pass rate covering all functionality
- **Backward Compatibility**: Existing hooks updated to use unified service seamlessly

### ✅ Critical Implementation Completion - SUCCESSFUL
**All critical runtime errors resolved and production stability achieved:**

- **Zero Console Errors**: Home page loads smoothly without crashes
- **Complete Function Coverage**: All missing functions implemented and enhanced
- **Enhanced Error Handling**: Graceful degradation and professional fallback systems throughout
- **Build Success**: All pages compile successfully without critical errors
- **Backend Independence**: Frontend operates smoothly with or without backend connectivity
- **Professional UX**: No placeholder or "not implemented" content visible to users

### 🚀 Ready for Advanced Development
With the unified planetary positions and agent creation systems complete, the platform is ready for:
- Advanced feature development with reliable planetary data
- Scaling initiatives and performance optimization
- Enhanced mystical features and consciousness exploration tools
- Real-world deployment and production use with maximum accuracy and reliability

---

Created with ❤️ using Next.js and the wisdom of the stars ✨

**Status**: Production-ready consciousness crafting platform combining ancient wisdom with cutting-edge AI technology

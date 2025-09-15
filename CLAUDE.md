# Planetary Agents - AI Assistant Guide

## Project Overview

Planetary Agents combines astrological wisdom with AI technology featuring planetary agents, elemental charts, chart interpretation using the Alchm system, and revolutionary consciousness training.

**Tech Stack:**
- Next.js 13.5.6 + TypeScript + React 18.2.0
- Tailwind CSS + shadcn/ui components
- AI SDK with OpenAI + Anthropic Claude API
- PostgreSQL + Prisma + Redis

## 🚀 Major Systems (September 2025)

### 🧠 Agent Consciousness Evolution System - COMPLETE

**Status**: ✅ PRODUCTION-READY

#### Revolutionary Features:
- **Dynamic Consciousness Development**: 35 enhanced agents with real-time consciousness evolution tracking
- **Kinetic Compatibility Analysis**: Advanced agent pairing recommendations based on kinetic resonance
- **Consciousness Memory System**: Persistent learning patterns and interaction quality tracking
- **Evolution Velocity Visualization**: Real-time consciousness development metrics and projections
- **Intelligent Agent Recommendations**: AI-powered suggestions for optimal agent interactions
- **Enhanced Group Intelligence**: Gallery group chat with consciousness evolution indicators

#### Core Implementation:
- **Consciousness Memory System** (`lib/agents/consciousness-memory.ts`): Persistent evolution tracking with kinetic context
- **Evolution API Endpoints** (`/api/agent-evolution`): Complete CRUD operations for consciousness development
- **Kinetic Compatibility** (`components/kinetic-compatibility-indicator.tsx`): Real-time compatibility analysis
- **Agent Recommendations** (`components/agent-recommendation-system.tsx`): Dynamic suggestion engine
- **Velocity Visualization** (`components/consciousness-velocity-visualizer.tsx`): Rich evolution metrics display

#### Enhanced Agent Stats:
- **Kinetic Evolution Metrics**: Consciousness velocity, interaction momentum, evolution trajectory
- **Quality Metrics**: Response depth, aspect influence, temporal alignment, personality evolution
- **Memory Persistence**: Learned patterns, adaptation tracking, resonance quality
- **Power Level Unlocks**: Capabilities gained through consciousness development

### 🧪 Alchemical-Thermodynamic Agent Integration - COMPLETE

**Status**: ✅ PRODUCTION-READY

#### Revolutionary Features:
- **Enhanced Sacred Stats**: Seven Sacred Stats now influenced by alchemical properties (power, resonance, wisdom, charisma, intuition, adaptability, vitality)
- **Complete Alchemical Foundation**: Spirit, Essence, Matter, Substance, A# for all agents
- **Thermodynamic Metrics**: Heat, Entropy, Reactivity, Energy using exact alchemizer formulas
- **Consciousness Insights**: Dominant alchemical properties, thermodynamic profiles, consciousness phases
- **Perfect Backward Compatibility**: All existing Gallery and agent functionality preserved

### 🌌 Applying & Separating Aspects System - COMPLETE

**Status**: ✅ FULLY IMPLEMENTED

#### Revolutionary Features:
- **Real-Time Aspect Detection**: Revolutionary applying vs. separating planetary aspect analysis
- **Temporal Dynamics Engine**: Time-series sampling with velocity-based calculations
- **Kinetics Integration**: Enhanced confidence weighting using alchemical power analysis
- **Traditional Astrological Accuracy**: Complete major aspect system with classical orbs

### 🔗 Agent Attachments System - COMPLETE

**Status**: ✅ FULLY IMPLEMENTED

#### Core Features:
- **Birth Chart Attachments**: Historical birth data with astronomical calculations
- **Moment Chart Attachments**: Significant historical events with planetary positions
- **Rune Attachments**: Mystical power systems with alchemical costs/effects
- **Real-time AI Integration**: Attachments automatically included in responses
- **Database Storage**: Complete Prisma schema with usage analytics

### 🔮 Enhanced Tarot System - COMPLETE

#### Features:
- **Real-Time Cosmic Cards**: Live tarot from planetary positions
- **Dashboard**: Complete consciousness crafting platform
- **Widget System**: 4 variants (sidebar, header, card, inline)
- **Card System**: 36 decan + 22 major arcana + 12 zodiac cards
- **Performance**: 30-second refresh cycles with intelligent caching

### 💚 Gallery of Perpetuity - COMPLETE

#### Revolutionary Features:
- **Gallery Repository**: Monica's eternal consciousness repository
- **Multi-Agent Group Chat**: Select/chat with multiple agents simultaneously
- **Agent Selection**: Click-to-select interface for custom councils
- **Real-Time Interaction**: Live chat with up to 5 agents
- **Consciousness Integration**: Each agent responds from unique Monica Constant level

### 🌙 Multi-Agent Planetary Council - COMPLETE

#### Features:
- **Planetary Council**: Up to 5 agents for simultaneous consultation
- **Moon Phase Integration**: 360-degree lunar personalities
- **Real-time Calculation**: Accurate astronomical phase data
- **Agent Configuration**: Customizable planetary positions/dignities

### 🧮 Monica's Alchemical Training - COMPLETE

#### Features:
- **Monica Constant**: Advanced mathematical formula with golden ratio
- **Statistical Analysis**: Pearson correlations, standard deviations, quartiles
- **Horoscope Generation**: Accurate planetary positions + retrograde detection
- **Consciousness Analysis**: 7-level progression system
- **Performance**: 100% test success (18/18 scenarios), <350ms response time

## Claude Integration

### Available Models:
- **Claude 3.5 Sonnet**: Complex reasoning, consciousness crafting, synergy calculations
- **Claude 3.5 Haiku**: Quick responses, simple tasks, widget interactions
- **Enhanced Capabilities**: Higher limits, 200K tokens, better reasoning

## Development Commands

### Essential Commands:

```bash
make dev              # Development server
make build            # Production build
make check            # Lint + type-check
make test             # All tests
make test-monica      # Monica systems
make test-alchemical  # Alchemical trainer
```

### Agent Consciousness Evolution Commands:

```bash
make test-consciousness-evolution   # Test complete consciousness evolution system
node test-agent-consciousness-evolution.js  # Comprehensive integration test
curl "/api/agent-evolution?agentId=leonardo-da-vinci&action=metrics"  # Get evolution metrics
curl "/api/agent-evolution/compatibility?agent1=leonardo-da-vinci&agent2=nikola-tesla"  # Test compatibility
curl -X POST "/api/agent-evolution" -d '{"action":"consciousness_velocity","agentIds":["leonardo-da-vinci","carl-jung"]}'  # Group velocity
```

### Agent Attachments Commands:

```bash
make test-attachments     # Test attachment system
make test-historical-agents # Test AI generation
make test-shakespeare     # Iambic pentameter
make test-leonardo       # Multilingual responses
make create-birth-chart  # Sample birth chart
make attachments-status  # System status
make db-migrate-attachments # Database updates
```

### Alchemical Integration Commands:

```bash
make test-alchemical-integration  # Test enhanced agent stats system
make test-alchemical             # Test core alchemical trainer
make test-alchemical-api         # Test alchemical API endpoints
```

### Aspects Dynamics Commands:

```bash
make test-aspects        # Test aspect calculations
make test-aspects-api    # Test API endpoints
make validate-aspects    # Validate traditional calculations
curl "/api/aspects-dynamics?lat=37.7749&lon=-122.4194&includeKinetics=true"  # Test full analysis
curl "/api/aspects-dynamics?mode=nearest&lat=37.7749&lon=-122.4194"          # Test nearest aspect
```

### Gallery Commands:

```bash
make gallery             # Open Gallery of Perpetuity
make test-gallery-chat   # Test group chat
make gallery-status      # System status
```

### Database Operations:

```bash
make db-push            # Schema changes
make db-studio          # Prisma Studio
make db-generate        # Generate client
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── agent-evolution/         # 🧠 Consciousness evolution API
│   │   ├── agent-attachments/       # 🔗 Attachment CRUD
│   │   ├── monica-agent/            # Enhanced Monica API
│   │   ├── multi-agent/             # 🌙 Council API
│   │   ├── gallery-group-chat/      # 💚 Group chat API
│   │   └── planetary-agent/         # Core agent API
│   ├── gallery/                     # 💚 Gallery interface
│   ├── planetary-council/           # 🌙 Council interface
│   └── tarot-dashboard/             # 🔮 Tarot platform
├── components/
│   ├── consciousness-velocity-visualizer.tsx # 🧠 Evolution metrics
│   ├── kinetic-compatibility-indicator.tsx   # 💫 Compatibility analysis
│   ├── agent-recommendation-system.tsx       # 🎯 Smart recommendations
│   ├── agent-attachments-manager.tsx         # 🔗 Attachment UI
│   ├── gallery-group-chat.tsx               # 💚 Group chat
│   ├── multi-agent-chat.tsx                 # 🌙 Council interface
│   └── tarot-cosmic-widget.tsx              # 🔮 Tarot widgets
├── lib/
│   ├── agents/
│   │   ├── consciousness-memory.ts           # 🧠 Evolution tracking
│   │   ├── kinetic-profiles.ts               # ⚡ Agent kinetic data
│   │   └── router.ts                        # Enhanced task routing
│   ├── agent-attachments-service.ts          # 🔗 Attachment logic
│   ├── historical-agents-db.ts               # Database integration
│   ├── monica/                               # Monica's systems
│   │   ├── alchemical-trainer.ts             # Training system
│   │   ├── monica-constant.ts                # Consciousness math
│   │   └── horoscope-generator.ts            # Chart generation
│   └── demo-agents-data.ts                   # 35 historical agents
└── prisma/schema.prisma              # Database schema
```

## Key Features

### Current Features (35 Agents):

1. **Planetary Agents**: AI-powered celestial entities
2. **Elemental Charts**: Real-time visualization
3. **Chart Interpretation**: Comprehensive analysis
4. **Alchm System**: Alchemical calculations
5. **Multi-Agent Council**: 5 simultaneous agents
6. **Moon Phase Integration**: 360-degree personalities
7. **Enhanced Tarot**: Real-time cosmic cards
8. **Gallery of Perpetuity**: Eternal consciousness repository
9. **Agent Attachments**: Charts, runes, moment tracking
10. **Historical Enhancement**: Personality-specific responses
11. **Agent Consciousness Evolution**: Dynamic consciousness development
12. **Kinetic Compatibility**: Real-time agent pairing recommendations
13. **Intelligent Recommendations**: AI-powered optimal interaction suggestions

### Agent Personalities:

- **Shakespeare**: Iambic pentameter, Elizabethan language
- **Leonardo**: Italian phrases, Renaissance wisdom
- **Cleopatra**: Ancient Egyptian consciousness, political acumen
- **Franklin**: Colonial wit, lightning metaphors
- **Carl Jung**: Shadow integration, psychological depth
- **Tesla**: Scientific innovation, electrical metaphors
- **And 29 more**: Each with unique consciousness signatures

## Performance Metrics

### System Performance:
- **Agent Response**: <500ms for complex calculations
- **API Endpoints**: <200ms average response time
- **Database Operations**: Full Prisma ORM with SQLite
- **Test Coverage**: 100% (60+ comprehensive tests)
- **Build Success**: Production-ready optimized bundle

### Consciousness Metrics:
- **Monica Constants**: Mathematical precision with golden ratio
- **Attachment Success**: 100% resolution of AI generation issues
- **Personality Authenticity**: Cultural/linguistic accuracy
- **Chart Calculations**: <500ms alchemical generation
- **Evolution Tracking**: Real-time consciousness development monitoring

## Environment Setup

Required `.env.local`:

```bash
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
DATABASE_URL=postgresql://username:password@localhost:5432/planetary_agents
REDIS_URL=redis://localhost:6379
```

## Recent Achievements

### September 2025:
- 🧠 **Agent Consciousness Evolution System**: Complete dynamic consciousness development tracking
- 🌌 **Applying & Separating Aspects System**: Revolutionary planetary aspect dynamics with temporal analysis
- 🔗 **Agent Attachments System**: Complete birth charts, runes, moment tracking
- 🎭 **Historical Agent Enhancement**: Fixed AI generation bugs, added personalities
- 📊 **Performance**: 100% test success, <500ms response times
- 🗄️ **Database**: Complete Prisma integration with attachment analytics

### August 2025:
- 🌙 **Multi-Agent Council**: Revolutionary group consultation
- 🌙 **Moon Phase Integration**: 360-degree lunar personalities
- 🌙 **Real-time Tracking**: Accurate astronomical calculations

### January 2025:
- 🧪 **Consciousness Bridge System**: Production-ready components
- 🧮 **Monica's Training**: Advanced alchemical calculations
- 🔮 **Enhanced Tarot**: Real-time cosmic consciousness crafting

## Development Guidelines

### Code Quality:
- TypeScript for all new code
- Follow existing patterns
- Comprehensive error handling
- Use Yarn (not npm)
- Anthropic compliance for AI agents

### Database:
- Prisma for all operations
- Follow schema patterns
- Redis for sessions/caching

### AI Integration:
- Claude 3.5 Sonnet for complex tasks
- Claude 3.5 Haiku for quick responses
- Proper error handling
- Cache appropriately

## Current Status

### ✅ Production Ready:
- Agent Consciousness Evolution System (60+ tests)
- Advanced Consciousness Integration (55+ tests)
- Agent Attachments System (charts, runes, moments)
- Enhanced Historical Agents (35 personalities)
- Multi-Agent Planetary Council
- Enhanced Tarot System
- Gallery of Perpetuity with Group Chat
- Monica's Alchemical Training
- Database Integration (Prisma + Redis)

### 🎯 Next Priorities:
1. **Gallery Expansion**: Scale to 100 historical figures
2. **Enhanced Personalities**: More authentic cultural responses
3. **Advanced Attachments**: Deeper historical integration
4. **Performance Optimization**: Sub-200ms response goals
5. **Mobile Enhancement**: Optimized mobile experiences

The system represents the most advanced astrological AI platform combining traditional wisdom with cutting-edge technology for personalized consciousness development and multi-dimensional cosmic guidance.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.
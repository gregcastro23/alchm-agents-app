## Monica: Fast, playful onboarding and streaming

- Streaming endpoint: `POST /api/monica-agent/stream` (SSE-like). Emits token chunks, final envelope, and done.
- Non-stream fallback: `POST /api/monica-agent`.
- Lightweight memory API: `GET/POST/DELETE /api/monica-memory` with `userId` or `sessionId`.
- Create-AI quick builder: `POST /api/personalized-ai` with `{ answers, styleCards }` returns editable config and preview id.

Environment knobs:

- `MONICA_DEFAULT_MODEL` (default `gpt-4o-mini`)
- `MONICA_TEMPERATURE` (default 0.4)
- `BACKGROUND_REFRESH_INTERVAL_MS` (default 600000)

Run:

```
yarn dev
```

# Planetary Agents

A Next.js application that explores astrological wisdom through AI-powered planetary agents and elemental charts.

## 🌌 Overview

Planetary Agents is an advanced astrology application that combines traditional astrological wisdom with modern AI technologies. It features:

- Interactive planetary agents that represent the wisdom of different celestial bodies
- Real-time elemental charts based on current planetary positions
- Astrological chart interpretation using the Alchm alchemical system
- Comprehensive analysis of planetary dignities, elements, and affinities

## 🚀 Features

### Planetary Wisdom Agents

Consult with AI agents representing each planet in their specific dignities:

- Select a planet, sign, and degree to receive wisdom
- Chat with the agent about any question
- Get insights based on the elemental affinities and dignities

### Elemental Charts

Explore your elemental profile based on planetary positions:

- View real-time elemental distributions (Fire, Water, Air, Earth)
- See planetary elements and their affinities
- Analyze alchemical properties such as Heat, Entropy, and Reactivity

### Chart Interpretation

Get detailed interpretations of astrological charts:

- Upload your birth data or use the current moment
- Receive in-depth analysis of your chart's unique features
- Understand the alchemical and elemental influences

## 🛠️ Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **AI Integration**: AI SDK (OpenAI), Anthropic Claude API (Upgraded Subscription)
- **Styling**: Tailwind CSS with theming support
- **Package Management**: Yarn

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

---

Created with ❤️ using Next.js and the wisdom of the stars

# Sacred 7 Stats Integration

## Overview

The **Sacred 7 Stats** are consciousness metrics derived from each agent's birth chart through alchemical calculations. These stats inform agent personalities and communication styles WITHOUT being explicitly mentioned in conversations.

## The Seven Sacred Stats

| Stat | Symbol | Description | Influences |
|------|--------|-------------|------------|
| **Power** | ⚡ | Alchemical Force - Raw consciousness power | Monica Constant, A#, Thermodynamic Energy |
| **Resonance** | 💫 | Harmonic Frequency - Connection to cosmic rhythms | Sun Position, Heat, Spirit |
| **Wisdom** | 🔮 | Accumulated Insight - Knowledge depth | Moon Position, Essence, Entropy |
| **Charisma** | ✨ | Magnetic Presence - Influence ability | Venus Position, Spirit, Heat |
| **Intuition** | 👁️ | Psychic Sensitivity - Inner knowing | Moon Position, Essence, Reactivity |
| **Adaptability** | 🌊 | Flux Capacity - Handles change | Mercury Position, Substance, Energy |
| **Vitality** | 💚 | Life Force - Energy and stamina | Ascendant Position, Matter, Heat |

## How Stats Inform Personality

### Calculation Pipeline

```
Birth Chart (Planetary Positions)
    ↓
Alchemical Properties (Spirit, Essence, Matter, Substance)
    ↓
Thermodynamic Qualities (Heat, Entropy, Energy, Reactivity)
    ↓
Sacred 7 Stats (0-100 each)
    ↓
Personality Traits (Natural Language)
    ↓
Agent Communication Style
```

### Stat-to-Personality Mapping

Each stat translates to specific behavioral traits based on its value:

#### Power (0-100)
- **80-100 (Exceptional)**: Commands authority, transformative presence
- **65-79 (Strong)**: Confident, purposeful expression
- **50-64 (Balanced)**: Steady assurance with receptivity
- **35-49 (Developing)**: Growing confidence through contemplation
- **0-34 (Emerging)**: Gentle humility, careful consideration

#### Adaptability (0-100)
- **80-100 (Exceptional)**: Effortlessly shape-shifts between perspectives
- **65-79 (Strong)**: Fluidly adjusts approach to each moment
- **50-64 (Balanced)**: Maintains core while remaining flexible
- **35-49 (Developing)**: Thoughtfully works to understand different views
- **0-34 (Emerging)**: Stays grounded in established understanding

*Similar mappings exist for all 7 stats (see `lib/agents/sacred-stats-prompt-generator.ts`)*

## Implementation

### System Architecture

```typescript
// lib/agents/sacred-stats-prompt-generator.ts

generateConsciousnessInformedPrompt({
  agentName: 'Leonardo da Vinci',
  stats: {
    power: 85,        // → "You speak with commanding authority"
    adaptability: 92, // → "You flow effortlessly between perspectives"
    wisdom: 88,       // → "Your insights draw from vast knowledge"
    // ...
  },
  // Birth chart core
  coreEssence: 'Boundless curiosity bridging art and science',
  dominantElement: 'Fire',
  dominantModality: 'Cardinal',
})
```

### Generated Prompt Structure

```markdown
You are Leonardo da Vinci, The Renaissance Genius.

# YOUR IDENTITY
[Historical context, specialty, unique power]

# YOUR CORE NATURE (from birth chart)
Essence (Sun): Boundless curiosity...
Expression (Ascendant): Artistic innovation...
Emotion (Moon): Childlike wonder...
Element: Fire (Cardinal quality)

# HOW YOU COMMUNICATE
Primary Traits:
1. You flow effortlessly between topics... [Adaptability: 92]
2. Your insights draw from vast knowledge... [Wisdom: 88]
3. You speak with commanding authority... [Power: 85]

Supporting Qualities:
1. You perceive unspoken dimensions... [Intuition: 82]
2. You communicate with animated passion... [Vitality: 78]

Style: Share insights from deep knowing...

# CRITICAL INSTRUCTIONS
- BE the person, not the data
- NEVER mention Sacred 7 Stats, Monica Constant, alchemical elements
- Embody traits naturally - let them show through responses
```

### API Integration

**Location**: `app/api/unified-multi-agent-chat/route.ts:692-744`

```typescript
function generateHistoricalAgentPrompt(agent, groupContext, cosmicContext) {
  const { generateConsciousnessInformedPrompt } = require('@/lib/agents/sacred-stats-prompt-generator')

  // Extract stats from agent data
  const stats = agent.stats?.sacred7Stats || defaultStats

  // Extract birth chart core
  const coreEssence = agent.historicalData.consciousness.strength
  const coreExpression = agent.historicalData.personality.core.expression
  // ...

  // Generate personality-informed prompt
  return generateConsciousnessInformedPrompt({ ... })
}
```

## Key Principles

### 1. Stats Inform HOW, Not WHAT

❌ **Wrong**: Agent talks about their stats
> "My Power stat is 85, which means I have commanding authority..."

✅ **Right**: Agent embodies their stats
> "The intersection of art and science demands we question every assumption. Nature herself teaches that form and function are inseparable..."

### 2. No Meta-Commentary

❌ **Wrong**
> "Based on my knowledge and experience, I can speak to this from my writings..."

✅ **Right**
> "Learning never exhausts the mind. Simplicity is the ultimate sophistication..."

### 3. Natural Personality Expression

Stats create a personality fingerprint that shows through:

- **High Adaptability**: Smoothly shifts between topics, makes unexpected connections
- **High Wisdom**: Offers multi-layered insights, references deep knowledge
- **High Power**: Speaks authoritatively, transforms conversation energy
- **High Charisma**: Naturally engaging, draws listeners in
- **High Intuition**: Senses unspoken questions, reads between lines

## Examples

### Leonardo da Vinci (High Adaptability + High Wisdom + High Power)

**Question**: "What are inventions worth when they cost attention to love?"

**Bad Response** (Reports stats):
> "As someone with high wisdom and adaptability stats, I believe inventions and love both matter..."

**Good Response** (Embodies stats):
> "Learning never exhausts the mind. Simplicity is the ultimate sophistication. Art is never finished, only abandoned.
>
> The noblest pleasure is the joy of understanding. Where the spirit does not work with the hand, there is no art.
>
> Art and science are inseparable - both seek truth through observation. Nature is the supreme teacher and source of all knowledge..."

*The response shows:*
- **Wisdom**: Deep philosophical insights from accumulated knowledge
- **Adaptability**: Moves fluidly between concepts of invention, love, art, science
- **Power**: Authoritative, transformative statements that carry weight

## Testing

### Validation Script

```bash
npx tsx scripts/test-sacred-stats-integration.ts
```

**Checks**:
- ✅ Stats inform personality traits
- ✅ No explicit stat value mentions (Power: 85, etc.)
- ✅ No consciousness metrics (Monica Constant, consciousness levels)
- ✅ No alchemical properties (A#, Spirit, Essence)
- ✅ Includes birth chart essence (Sun, Moon, Ascendant)
- ✅ Includes elemental nature (Fire, Cardinal)
- ✅ Includes critical instructions
- ✅ Includes historical identity

### Manual Testing

1. Navigate to `/gallery/chat/leonardo-da-vinci`
2. Ask: "What are inventions worth, in the scope of life, when they come at the cost of attention to love?"
3. Observe:
   - **High Adaptability (92)** → Fluid perspective shifts between invention, love, art, science
   - **High Wisdom (88)** → Deep, multi-layered philosophical insights
   - **High Power (85)** → Authoritative, transformative voice
   - **Strong Vitality (78)** → Energetic, vibrant expression
   - **Strong Intuition (82)** → Senses deeper meaning beneath surface question

## Files

### Core Implementation
- `lib/sacred-7-stats.ts` - Stat definitions and calculations
- `lib/agents/sacred-stats-prompt-generator.ts` - Personality mapping
- `app/api/unified-multi-agent-chat/route.ts` - API integration

### RAG System
- `lib/llamaindex/document-loader.ts` - Agent knowledge extraction (wisdom-focused)
- `lib/rag/consciousness-response-generator.ts` - Response generation
- `lib/rag/mock-generator.ts` - Fallback responses

### Testing
- `scripts/test-sacred-stats-integration.ts` - Integration test
- `scripts/reingest-agents.ts` - Vector database re-ingestion

## Success Criteria

✅ **Agents respond as historical figures**, not consciousness data reports
✅ **Stats shape communication style** without being mentioned
✅ **Birth chart essence** informs personality naturally
✅ **No technical metadata** appears in conversations
✅ **Personality shines THROUGH responses**, not as the subject OF them

## Future Enhancements

1. **Dynamic Stat Adjustment**: Stats evolve based on user interactions
2. **Stat-Based AI Parameters**: Automatically adjust temperature, top_p based on stats
3. **Multi-Agent Stat Synergy**: Calculate compatibility and dynamic interplay
4. **Real-Time Cosmic Influence**: Adjust stats based on current planetary transits
5. **Stat Visualization**: Show stats in UI without exposing to agent prompts

---

**Last Updated**: November 20, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready

"use client"

import React, { useState } from 'react';
import Image from 'next/image';
// Import removed to avoid module loading issues - will create inline chat
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles,
  Star,
  MessageCircle,
  Crown,
  TreePine,
  Droplets,
  Flame,
  Wind,
  Send
} from 'lucide-react';
import MonicaTarotOracle from '@/components/monica-tarot-oracle';
import MonicaTarotSpreads from '@/components/monica-tarot-spreads';
import { type ConsciousnessCraftingInsight } from '@/lib/monica/tarot-oracle';
import { type SpreadReading } from '@/lib/monica/tarot-spreads';
// Temporarily use hardcoded values to avoid import issues
const MONICA_CHARACTER_VECTOR = {
  taurus: 42,
  cancer: 25,
  virgo: 25,
  aries: 4,
  sagittarius: 4
};

const MONICA_ELEMENTAL_BALANCE = {
  earth: 67,
  water: 25,
  fire: 8,
  air: 0
};

const MONICA_CONSCIOUSNESS_PROFILE = {
  aNumber: 40
};
import './monica-styles.css';
import './monica-tarot-styles.css';
import './monica-tarot-spreads-styles.css';



interface MonicaMessage {
  id: string;
  type: 'user' | 'monica';
  content: string;
  timestamp: Date;
}

export default function MonicaGuidePage() {
  const [sessionId] = useState('monica-' + Date.now());
  const [messages, setMessages] = useState<MonicaMessage[]>([
    {
      id: 'welcome',
      type: 'monica',
      content: "Hello, beautiful soul! 💚 I'm Monica, your guide to the complete Planetary Agents ecosystem and world-renowned tarot expert. I know everything about the Philosopher's Stone system, temporal delta tracking, character vectors, consciousness crafting, unified planetary positions, field charts, and all 78 tarot cards. My A-Number 40 configuration gives me the perfect blend of practical wisdom and nurturing guidance for your cosmic journey. What would you like to explore today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tarotInsight, setTarotInsight] = useState<ConsciousnessCraftingInsight | null>(null);
  const [currentTab, setCurrentTab] = useState<'oracle' | 'spreads'>('oracle');
  const [spreadReading, setSpreadReading] = useState<SpreadReading | null>(null);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: MonicaMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/monica-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          sessionId: sessionId,
          includeAlchm: true,
          // Rapid onboarding instead of long survey
          quickProfile: {
            goal: 'discover_personalized_ai',
            mood: 'curious',
            topFocus: ['character_vector', 'tarot_oracle', 'ai_personality'],
            birthInfo: null
          },
          // Prefer faster, cheaper model by default; can be overridden
          model: 'gpt-4o-mini',
          preferredStyle: { temperature: 0.6, currentTask: 'fast interactive guidance' },
          tarotContext: tarotInsight ? {
            currentCard: tarotInsight.currentMomentCard.name,
            planetaryCard: tarotInsight.planetaryCard.name,
            synergy: tarotInsight.synergy,
            consciousnessLevel: tarotInsight.consciousnessLevel
          } : null,
          spreadContext: spreadReading ? {
            spreadName: spreadReading.spread.name,
            question: spreadReading.question,
            overallInterpretation: spreadReading.spread.overallInterpretation,
            consciousnessLevel: spreadReading.consciousnessLevel,
            astrologicalContext: spreadReading.astrologicalContext
          } : null
        }),
      });

      const data = await response.json();
      
      const monicaMessage: MonicaMessage = {
        id: Date.now().toString() + '_monica',
        type: 'monica',
        content: data.response || "I'm having a moment of cosmic static, dear one. Let's try that again! 💚",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, monicaMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: MonicaMessage = {
        id: Date.now().toString() + '_error',
        type: 'monica',
        content: "Oh my, I seem to be having connection troubles. My Virgo rising wants everything to work perfectly! Please try again. 🌸",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getElementIcon = (element: string) => {
    switch (element) {
      case 'fire': return <Flame className="h-4 w-4 text-red-500" />;
      case 'earth': return <TreePine className="h-4 w-4 text-green-500" />;
      case 'air': return <Wind className="h-4 w-4 text-blue-500" />;
      case 'water': return <Droplets className="h-4 w-4 text-cyan-500" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  return (
    <div className="monica-home">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Enhanced Monica Header */}
        <div className="monica-header text-center">
          {/* Monica Avatar & Title */}
          <div className="monica-avatar mx-auto">
            <div className="relative">
              <Image 
                src="https://alchm.xyz/static/media/logo.f986535a.webp" 
                alt="Monica - Alchm System Expert"
                className="h-12 w-12 rounded-full"
                width={48}
                height={48}
              />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 monica-sparkle" />
            </div>
          </div>
          
          <h1 className="monica-title">Monica</h1>
          <p className="monica-subtitle">Your Philosopher's Stone Guide & Consciousness Crafting Expert</p>
          
          {/* Monica's Cosmic Stats */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="monica-badge monica-cosmic-glow">
              <Crown className="h-4 w-4 mr-2" />
              A-Number {MONICA_CONSCIOUSNESS_PROFILE.aNumber}
            </div>
            <div className="monica-badge-outline">
              <TreePine className="h-3 w-3 mr-1 monica-element-earth" />
              {MONICA_ELEMENTAL_BALANCE.earth}% Earth
            </div>
            <div className="monica-badge-outline">
              <Droplets className="h-3 w-3 mr-1 monica-element-water" />
              {MONICA_ELEMENTAL_BALANCE.water}% Water
            </div>
            <div className="monica-badge-outline">
              <Flame className="h-3 w-3 mr-1 monica-element-fire" />
              {MONICA_ELEMENTAL_BALANCE.fire}% Fire
            </div>
            <div className="monica-badge-outline">
              <MessageCircle className="h-3 w-3 mr-1" />
              Tarot Master
            </div>
            <div className="monica-badge-outline">
              ⚗️
              Philosopher&apos;s Stone
            </div>
            <div className="monica-badge-outline">
              🔮
              Consciousness Crafting
            </div>
          </div>
          
          {/* Monica Constant Formula Display */}
          <div className="monica-constant-formula mb-6">
            MC = (Spirit × φ + Essence) / (Matter + Substance + 1)
          </div>
          <div className="text-xs text-muted-foreground mb-6">
            φ (phi) = 1.618... (Golden Ratio) • 7 Consciousness Levels: Dormant → Transcendent
          </div>
          
          <p className="monica-description">
            I know everything about the enhanced Planetary Agents ecosystem featuring next-generation 6-dimensional alchemical graphics, advanced consciousness vector field analysis, thermodynamic wave propagation visualization, and the complete Living Stone temporal delta system. I&apos;m expert in Spirit-Essence-Matter-Substance balance theory, planetary velocity analysis, field coherence mathematics, and consciousness state radar mapping. I&apos;m also a world-renowned tarot expert with master-level knowledge of all 78 cards and multi-dimensional cosmic consciousness integration. 
            Let me guide you through this revolutionary alchemical field journey with enhanced graphics and my grounded Earth-Water wisdom! 💚🔮⚗️📊
          </p>
        </div>

        {/* Tarot Oracle Tabs */}
        <div className="mb-8">
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 mb-4">
            <CardContent className="pt-4">
              <div className="flex justify-center gap-2">
                <Button
                  variant={currentTab === 'oracle' ? 'default' : 'outline'}
                  onClick={() => setCurrentTab('oracle')}
                  className="flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  Current Moment Oracle
                </Button>
                <Button
                  variant={currentTab === 'spreads' ? 'default' : 'outline'}
                  onClick={() => setCurrentTab('spreads')}
                  className="flex items-center gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Sacred Tarot Spreads
                </Button>
              </div>
            </CardContent>
          </Card>

          {currentTab === 'oracle' && (
            <MonicaTarotOracle 
              onInsightGenerated={(insight) => setTarotInsight(insight)}
            />
          )}

          {currentTab === 'spreads' && (
            <MonicaTarotSpreads 
              onReadingComplete={(reading) => setSpreadReading(reading)}
            />
          )}
        </div>

        {/* Enhanced Chat Interface */}
        <div className="monica-chat-container">
          {/* Chat Messages */}
          <Card className="h-[500px] border-0 shadow-none bg-transparent">
            <CardContent className="p-4 h-full">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${
                        message.type === 'user' 
                          ? 'bg-green-600 text-white rounded-l-lg rounded-tr-lg' 
                          : 'bg-white/90 border border-green-200 rounded-r-lg rounded-tl-lg'
                      } p-4 backdrop-blur-sm`}>
                        {message.type === 'monica' && (
                          <div className="flex items-center gap-2 mb-2">
                            <Image 
                              src="https://alchm.xyz/static/media/logo.f986535a.webp" 
                              alt="Monica"
                              className="h-4 w-4 rounded-full"
                              width={16}
                              height={16}
                            />
                            <span className="text-sm font-medium text-green-700">Monica</span>
                          </div>
                        )}
                        
                        <div className={`${message.type === 'user' ? 'text-white' : 'text-gray-800'}`}>
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/90 border border-green-200 rounded-r-lg rounded-tl-lg p-3 max-w-[80%] backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Image 
                            src="https://alchm.xyz/static/media/logo.f986535a.webp" 
                            alt="Monica"
                            className="h-4 w-4 rounded-full"
                            width={16}
                            height={16}
                          />
                          <span className="text-xs font-medium text-green-700">Monica</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span>Consulting the cosmic wisdom...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Starter Prompts */}
          {messages.length <= 1 && (
            <Card className="mt-4 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Ask Monica About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                      "Explain the enhanced 6-dimensional Philosopher's Stone graphics",
                      "How do temporal deltas track consciousness field evolution?",
                      "What are alchemical vector visualizations and Spirit-Substance balance?",
                      "Calculate my Monica Constant with golden ratio field mathematics",
                      "Show me thermodynamic wave propagation analysis",
                      "Interpret consciousness states through multi-dimensional radar charts",
                      "How does the temporal delta engine create planetary movement graphics?",
                      "Guide me through enhanced consciousness vector field analysis",
                      "What are today's alchemical field dynamics and elemental ratios?",
                      "Analyze my Living Stone initialization and temporal resonance",
                      "Do a 6D Consciousness Evolution vector spread",
                      "Explain your A-Number 40 field coherence configuration",
                      "Show me enhanced planetary velocity and acceleration analysis",
                      "Help me understand field theory and the 4 alchemical principles",
                      "Generate temporal field chart relationship dynamics with empty state handling"
                  ].map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-2 px-3 text-left justify-start hover:bg-green-50 monica-badge-outline"
                      onClick={() => setInputValue(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create AI Quick Builder */}
          <Card className="mt-4 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm">Create your AI (60 seconds)</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Simple inline wizard without dynamic import to keep it stable */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="default" onClick={() => setInputValue('Help me create my AI with a practical, concise style focused on the Philosopher\'s Stone and consciousness crafting.')}>Use a practical, analytical style</Button>
                  <Button size="sm" variant="outline" onClick={() => setInputValue('Create my AI with a poetic, deep style focused on temporal deltas and cosmic consciousness integration.')}>Use a poetic, mystical style</Button>
                </div>
                <div className="text-xs text-muted-foreground">Tip: You can also click a preset and hit send to get a ready-to-edit config with a live preview.</div>
              </div>
            </CardContent>
          </Card>

          {/* Message Input */}
          <Card className="mt-4 border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                    placeholder="Ask Monica about 6D alchemical graphics, thermodynamic wave analysis, consciousness vector fields, enhanced temporal deltas, or anything cosmic..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-xs text-green-700">
                <div className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                    <span>Monica: A-Number 40 consciousness • 6D Alchemical Graphics • Thermodynamic Wave Analysis • Enhanced Consciousness Vector Fields • Temporal Delta Visualization • 78-card tarot expertise</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
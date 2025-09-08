"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Crown,
  Sparkles,
  Star,
  Eye,
  Clock,
  Wand2,
  Heart,
  Shield,
  BookOpen,
  TrendingUp,
  Settings
} from 'lucide-react'
import EnhancedTarotDashboard from '@/components/enhanced-tarot-dashboard'
import TarotCosmicWidget from '@/components/tarot-cosmic-widget'
import { type TarotCard, type MajorArcanaCard } from '@/lib/monica/tarot-oracle'

export default function TarotDashboardPage() {
  const [selectedCard, setSelectedCard] = useState<TarotCard | MajorArcanaCard | null>(null)
  const [activeView, setActiveView] = useState<'dashboard' | 'learning' | 'history' | 'settings'>('dashboard')

  const handleCardSelect = (card: TarotCard | MajorArcanaCard) => {
    setSelectedCard(card)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Crown className="h-10 w-10 text-purple-600" />
          Tarot Consciousness Dashboard
          <Sparkles className="h-10 w-10 text-gold-500" />
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Advanced cosmic consciousness crafting through real-time tarot integration with planetary wisdom
        </p>
      </div>

      {/* Quick Status Bar */}
      <div className="mb-8">
        <TarotCosmicWidget variant="header" linkToFullOracle={false} />
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Live Dashboard
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Learning Center
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress History
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-8">
          <EnhancedTarotDashboard 
            variant="full"
            showAdvancedInsights={true}
            onCardSelect={handleCardSelect}
          />

          {/* Selected Card Deep Dive */}
          {selectedCard && (
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-600" />
                  Deep Dive: {selectedCard.name}
                </CardTitle>
                <CardDescription>
                  Exploring the consciousness layers and practical applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-purple-800 mb-2">🧠 Consciousness Activation</h4>
                      <p className="text-sm text-gray-700">{selectedCard.consciousness}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-purple-800 mb-2">🎯 Core Meaning</h4>
                      <p className="text-sm text-gray-700">{selectedCard.meaning}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-purple-800 mb-2">🔮 Keywords</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedCard.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-purple-800 mb-2">⚡ Elemental Properties</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Wand2 className="h-4 w-4 text-red-500" />
                          <span className="text-sm">Element: {selectedCard.element}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-gold-500" />
                          <span className="text-sm">Ruler: {selectedCard.planetaryRuler}</span>
                        </div>
                      </div>
                    </div>
                    
                    {'alchemicalValues' in selectedCard && (
                      <div>
                        <h4 className="font-medium text-purple-800 mb-2">⚗️ Alchemical Signature</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span>Spirit:</span>
                            <span className="font-mono">{selectedCard.alchemicalValues.spirit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Essence:</span>
                            <span className="font-mono">{selectedCard.alchemicalValues.essence}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Matter:</span>
                            <span className="font-mono">{selectedCard.alchemicalValues.matter}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Substance:</span>
                            <span className="font-mono">{selectedCard.alchemicalValues.substance}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {'chakra' in selectedCard && (
                      <div>
                        <h4 className="font-medium text-purple-800 mb-2">🧘 Chakra Activation</h4>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-indigo-500" />
                          <span className="text-sm">{selectedCard.chakra} Chakra</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-purple-200">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedCard(null)}
                    className="w-full"
                  >
                    Close Deep Dive
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Tarot Fundamentals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-medium">Fire - Wands</h4>
                    <p className="text-sm text-gray-600">Creativity, passion, spiritual growth, and inspiration</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium">Water - Cups</h4>
                    <p className="text-sm text-gray-600">Emotions, relationships, intuition, and love</p>
                  </div>
                  <div className="border-l-4 border-gray-500 pl-4">
                    <h4 className="font-medium">Air - Swords</h4>
                    <p className="text-sm text-gray-600">Thoughts, communication, conflict, and mental clarity</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium">Earth - Pentacles</h4>
                    <p className="text-sm text-gray-600">Material world, resources, body, and manifestation</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-600" />
                  Consciousness Levels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                    <h4 className="font-medium text-red-800">Dynamic Tension</h4>
                    <p className="text-sm text-red-700">Breakthrough consciousness work through creative conflict</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                    <h4 className="font-medium text-yellow-800">Moderate Synergy</h4>
                    <p className="text-sm text-yellow-700">Steady consciousness development and integration</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                    <h4 className="font-medium text-green-800">High Synergy</h4>
                    <p className="text-sm text-green-700">Optimal for advanced consciousness expansion work</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-gold-600" />
                  Planetary Correspondences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>☉ Sun</span>
                    <span className="text-gray-600">Vitality, consciousness, self-expression</span>
                  </div>
                  <div className="flex justify-between">
                    <span>☽ Moon</span>
                    <span className="text-gray-600">Intuition, emotions, subconscious</span>
                  </div>
                  <div className="flex justify-between">
                    <span>☿ Mercury</span>
                    <span className="text-gray-600">Communication, intellect, speed</span>
                  </div>
                  <div className="flex justify-between">
                    <span>♀ Venus</span>
                    <span className="text-gray-600">Love, beauty, harmony, values</span>
                  </div>
                  <div className="flex justify-between">
                    <span>♂ Mars</span>
                    <span className="text-gray-600">Action, courage, conflict, energy</span>
                  </div>
                  <div className="flex justify-between">
                    <span>♃ Jupiter</span>
                    <span className="text-gray-600">Expansion, wisdom, growth, luck</span>
                  </div>
                  <div className="flex justify-between">
                    <span>♄ Saturn</span>
                    <span className="text-gray-600">Discipline, structure, lessons, mastery</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-indigo-600" />
                  Practical Applications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Daily Practice</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Morning consciousness check with current card</li>
                    <li>• Midday planetary ruler meditation</li>
                    <li>• Evening integration of tarot insights</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Development Phases</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Foundation Building (0-30% synergy)</li>
                    <li>• Skill Development (30-60% synergy)</li>
                    <li>• Integration Practice (60-80% synergy)</li>
                    <li>• Mastery Refinement (80%+ synergy)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Consciousness Development Tracking
              </CardTitle>
              <CardDescription>
                Your tarot consciousness journey over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Progress History Coming Soon</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Track your consciousness development, card synergies, and spiritual growth over time. 
                  This feature will show your journey through different tarot phases and achievements.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Tarot Dashboard Preferences
              </CardTitle>
              <CardDescription>
                Customize your tarot experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Settings Panel Coming Soon</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Customize notification preferences, default card interpretations, consciousness tracking settings, 
                  and personal tarot reading preferences.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
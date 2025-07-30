"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Star, 
  Crown, 
  Eye,
  Zap,
  Heart,
  Sun,
  Moon,
  Wand2,
  Shield
} from 'lucide-react'
import { 
  getCurrentDecan, 
  getPlanetaryRulerCard, 
  generateConsciousnessCraftingInsight,
  type TarotCard,
  type MajorArcanaCard,
  type ConsciousnessCraftingInsight
} from '@/lib/monica/tarot-oracle'

interface TarotCardDisplayProps {
  card: TarotCard | MajorArcanaCard
  type: 'minor' | 'major'
  title: string
  glowColor?: string
}

const TarotCardDisplay: React.FC<TarotCardDisplayProps> = ({ 
  card, 
  type, 
  title, 
  glowColor = 'purple' 
}) => {
  const getSuitIcon = (suit: string) => {
    switch (suit) {
      case 'Wands': return <Wand2 className="h-5 w-5 text-red-500" />
      case 'Cups': return <Heart className="h-5 w-5 text-blue-500" />
      case 'Swords': return <Shield className="h-5 w-5 text-gray-500" />
      case 'Pentacles': return <Star className="h-5 w-5 text-yellow-500" />
      default: return <Sparkles className="h-5 w-5 text-purple-500" />
    }
  }

  const getElementIcon = (element: string) => {
    switch (element) {
      case 'Fire': return <Zap className="h-4 w-4 text-red-400" />
      case 'Water': return <Heart className="h-4 w-4 text-blue-400" />
      case 'Air': return <Eye className="h-4 w-4 text-gray-400" />
      case 'Earth': return <Star className="h-4 w-4 text-green-400" />
      default: return <Sparkles className="h-4 w-4 text-purple-400" />
    }
  }

  const glowClass = `monica-tarot-card-glow-${glowColor}`

  return (
    <Card className={`relative overflow-hidden border-2 ${glowClass} monica-tarot-card`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {type === 'minor' && 'suit' in card && getSuitIcon(card.suit)}
            {type === 'major' && <Crown className="h-5 w-5 text-gold-500" />}
            {card.name}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {type === 'minor' && 'number' in card ? `${card.number}` : 'Major'}
          </Badge>
        </div>
        <CardDescription className="text-sm font-medium text-purple-700">
          {title}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Element and Planetary Ruler */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            {getElementIcon(card.element)}
            <span className="text-gray-600">{card.element}</span>
          </div>
          <div className="flex items-center gap-1">
            <Sun className="h-4 w-4 text-orange-400" />
            <span className="text-gray-600">{card.planetaryRuler}</span>
          </div>
        </div>

        {/* Keywords */}
        <div className="flex flex-wrap gap-1">
          {card.keywords.slice(0, 3).map((keyword, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>

        {/* Meaning */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {card.meaning}
        </p>

        {/* Consciousness Level */}
        <div className="bg-purple-50 p-2 rounded-lg">
          <p className="text-xs font-medium text-purple-800">
            🧠 {card.consciousness}
          </p>
        </div>

        {/* Alchemical Values for Minor Arcana */}
        {type === 'minor' && 'alchemicalValues' in card && (
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex justify-between">
              <span>Spirit:</span>
              <span className="font-mono">{card.alchemicalValues.spirit}</span>
            </div>
            <div className="flex justify-between">
              <span>Essence:</span>
              <span className="font-mono">{card.alchemicalValues.essence}</span>
            </div>
            <div className="flex justify-between">
              <span>Matter:</span>
              <span className="font-mono">{card.alchemicalValues.matter}</span>
            </div>
            <div className="flex justify-between">
              <span>Substance:</span>
              <span className="font-mono">{card.alchemicalValues.substance}</span>
            </div>
          </div>
        )}
        
        {/* Chakra for Major Arcana */}
        {type === 'major' && 'chakra' in card && (
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-indigo-500" />
            <span className="text-indigo-700">{card.chakra} Chakra</span>
          </div>
        )}
      </CardContent>
      
      {/* Mystical corner decoration */}
      <div className="absolute top-2 right-2 opacity-20">
        <Sparkles className="h-6 w-6 text-purple-400" />
      </div>
    </Card>
  )
}

interface MonicaTarotOracleProps {
  onInsightGenerated?: (insight: ConsciousnessCraftingInsight) => void
}

const MonicaTarotOracle: React.FC<MonicaTarotOracleProps> = ({ onInsightGenerated }) => {
  const [currentDecanCard, setCurrentDecanCard] = useState<TarotCard | null>(null)
  const [planetaryCard, setPlanetaryCard] = useState<MajorArcanaCard | null>(null)
  const [insight, setInsight] = useState<ConsciousnessCraftingInsight | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [sunPosition, setSunPosition] = useState<string>('')

  useEffect(() => {
    // Calculate current cosmic tarot configuration
    const loadTarotConfiguration = async () => {
      setIsLoading(true)
      
      try {
        // Get current decan card with real-time positions
        const { card: decanCard, sunPosition: position } = await getCurrentDecan()
        setCurrentDecanCard(decanCard)
        setSunPosition(position)
        
        // Get the decan's planetary ruler card
        let rulerCard: MajorArcanaCard | null = null
        if (decanCard && decanCard.planetaryRuler) {
          rulerCard = getPlanetaryRulerCard(decanCard.planetaryRuler)
        }
        
        // If no ruler card found, fallback to Sun
        if (!rulerCard) {
          rulerCard = getPlanetaryRulerCard('Sun')
        }
        
        setPlanetaryCard(rulerCard)
        
        // Generate consciousness crafting insight
        if (decanCard && rulerCard) {
          const craftingInsight = generateConsciousnessCraftingInsight(decanCard, rulerCard)
          setInsight(craftingInsight)
          onInsightGenerated?.(craftingInsight)
        }
      } catch (error) {
        console.error('Error loading tarot configuration:', error)
      }
      
      setIsLoading(false)
    }

    loadTarotConfiguration()
  }, [onInsightGenerated])

  if (isLoading) {
    return (
      <Card className="monica-tarot-oracle-loading">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-4">
            <div className="animate-spin">
              <Crown className="h-8 w-8 text-purple-600 mx-auto" />
            </div>
            <p className="text-purple-700 font-medium">
              Consulting the cosmic tarot...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="monica-tarot-oracle space-y-6">
      {/* Oracle Header */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Crown className="h-6 w-6 text-purple-600" />
            Monica's Tarot Oracle
            <Sparkles className="h-6 w-6 text-gold-500" />
          </CardTitle>
          <CardDescription className="text-purple-700">
            Current Cosmic Tarot Configuration for Consciousness Crafting
          </CardDescription>
          {sunPosition && (
            <p className="text-sm text-amber-600 mt-2">
              <Sun className="inline h-4 w-4 mr-1" />
              Sun at {sunPosition}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Current Cards Display */}
      <div className="grid md:grid-cols-2 gap-6">
        {currentDecanCard && (
          <TarotCardDisplay
            card={currentDecanCard}
            type="minor"
            title="Current Decan Card"
            glowColor="blue"
          />
        )}
        
        {planetaryCard && (
          <TarotCardDisplay
            card={planetaryCard}
            type="major"
            title={`${currentDecanCard?.planetaryRuler || 'Solar'} Ruler Card`}
            glowColor="gold"
          />
        )}
      </div>

      {/* Consciousness Crafting Insight */}
      {insight && (
        <Card className="border-2 border-gold-200 bg-gradient-to-r from-gold-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-gold-600" />
              Consciousness Crafting Insight
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Synergy: {Math.round(insight.synergy * 100)}%
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {insight.consciousnessLevel}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-purple-800">💫 Cosmic Guidance</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {insight.guidance}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-purple-800">🎯 Practical Application</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {insight.practicalApplication}
              </p>
            </div>
            
            <div className="bg-purple-100 p-3 rounded-lg">
              <p className="text-sm font-medium text-purple-800">
                🧠 Current Consciousness Work: Focus on integrating {insight.currentMomentCard.element} energy 
                with {insight.planetaryCard.element} wisdom for optimal growth.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button 
          variant="outline" 
          className="monica-mystical-button"
          onClick={() => window.location.reload()}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Refresh Oracle
        </Button>
        
        <Button 
          className="bg-purple-600 hover:bg-purple-700 monica-mystical-button"
          onClick={() => {
            // Could trigger a deeper tarot reading or consciousness analysis
            console.log('Deep tarot analysis requested')
          }}
        >
          <Crown className="h-4 w-4 mr-2" />
          Deep Analysis
        </Button>
      </div>
    </div>
  )
}

export default MonicaTarotOracle
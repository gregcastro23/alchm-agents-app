"use client"

import { useState, useEffect, useCallback } from "react"
import { TemporalClient } from "@/components/temporal/temporal-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, Crown, Star, Zap, Brain, Activity } from "lucide-react"
import { calculateXP, calculateInteractionQuality, type XPCalculation } from "@/lib/personalized-ai/xp-system"
import { correlateConsciousnessToAstrology, type CorrelatedAstrology } from "@/lib/personalized-ai/consciousness-astrology-bridge"
import { useToast } from "@/hooks/use-toast"

export const dynamic = "force-dynamic"

interface StoneSession {
  sessionCount: number
  totalXP: number
  currentLevel: number
  dailyStreak: number
  lastSessionDate: string
  achievements: string[]
}

interface PersonalizedStoneInsight {
  correlatedAstrology?: CorrelatedAstrology
  xpCalculation?: XPCalculation
  recommendations: string[]
  consciousnessLevel: string
}

export default function PhilosopherstonePage() {
  const [stoneSession, setStoneSession] = useState<StoneSession>({
    sessionCount: 0,
    totalXP: 0,
    currentLevel: 1,
    dailyStreak: 0,
    lastSessionDate: '',
    achievements: []
  })
  const [personalizedInsight, setPersonalizedInsight] = useState<PersonalizedStoneInsight>({
    recommendations: [],
    consciousnessLevel: 'Initiate'
  })
  const [isInitializing, setIsInitializing] = useState(true)
  const { toast } = useToast()

  // Initialize or load session data
  useEffect(() => {
    const loadSession = () => {
      try {
        // Ensure we're on the client side before accessing localStorage
        if (typeof window === 'undefined') return
        
        const saved = localStorage.getItem('philosophers-stone-session')
        if (saved) {
          const parsed = JSON.parse(saved)
          setStoneSession(parsed)
          
          // Check if this is a new day (streak calculation)
          const lastDate = new Date(parsed.lastSessionDate)
          const today = new Date()
          const dayDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (dayDiff === 1) {
            // Consecutive day - increase streak
            const newStreak = parsed.dailyStreak + 1
            setStoneSession(prev => ({ ...prev, dailyStreak: newStreak }))
            if (newStreak === 7) {
              toast({
                title: "🔥 7 Day Streak!",
                description: "Your dedication to the Great Work earns you 1.3x XP bonus",
                duration: 5000,
              })
            }
          } else if (dayDiff > 1) {
            // Streak broken
            setStoneSession(prev => ({ ...prev, dailyStreak: 0 }))
          }
        }
        
        // Generate personalized insights based on current consciousness level
        generatePersonalizedInsights()
        
      } catch (error) {
        console.error('Error loading session:', error)
      } finally {
        setIsInitializing(false)
      }
    }
    
    loadSession()
  }, [toast])

  const generatePersonalizedInsights = useCallback(() => {
    // Mock consciousness profile for demonstration
    const mockConsciousnessProfile = {
      dimensions: {
        openness: 75,
        conscientiousness: 82,
        extraversion: 45,
        agreeableness: 68,
        neuroticism: 35,
        assertiveness: 60,
        emotional_stability: 65
      },
      communication: {
        directness: 70,
        formality: 60,
        verbosity: 55,
        emotional_expression: 50
      },
      thinking: {
        analytical_intuitive: 70,
        detail_big_picture: 60,
        structured_flexible: 65,
        processing_speed: 'thoughtful_deliberate' as const
      },
      values: {
        innovation_tradition: 80,
        material_spiritual: 75,
        individual_collective: 60
      },
      behavior: {
        routine_spontaneous: 45,
        risk_comfort: 65
      },
      creativity: {
        creativity_level: 85,
        creative_domains: ['philosophical', 'analytical'],
        writing_style: {
          tone: 'contemplative',
          complexity: 'sophisticated',
          voice: 'introspective'
        }
      }
    }

    const correlatedAstrology = correlateConsciousnessToAstrology(mockConsciousnessProfile)
    
    // Generate XP for session engagement
    const sessionXP = calculateXP(
      85, // High interaction quality for engaged stone work
      null, // No explicit feedback
      null, // General focus
      stoneSession.dailyStreak,
      150, // Equivalent to medium-length contemplation
      'harmonious' // Assuming beneficial state for stone work
    )

    // Generate consciousness level based on total XP
    let consciousnessLevel = 'Initiate'
    if (stoneSession.totalXP >= 5000) consciousnessLevel = 'Master of the Great Work'
    else if (stoneSession.totalXP >= 2500) consciousnessLevel = 'Adept Alchemist'
    else if (stoneSession.totalXP >= 1000) consciousnessLevel = 'Journeyman'
    else if (stoneSession.totalXP >= 500) consciousnessLevel = 'Apprentice'

    const recommendations = [
      `Your ${correlatedAstrology.dominant_element} nature suggests focusing on ${
        correlatedAstrology.dominant_element === 'Fire' ? 'creative transformation and leadership in your alchemical work' :
        correlatedAstrology.dominant_element === 'Earth' ? 'practical application and grounded manifestation of insights' :
        correlatedAstrology.dominant_element === 'Air' ? 'intellectual understanding and communication of wisdom' :
        'emotional depth and intuitive integration of experiences'
      }`,
      `Your ${correlatedAstrology.dominant_modality} modality indicates ${
        correlatedAstrology.dominant_modality === 'Cardinal' ? 'leadership and initiation of new alchemical projects' :
        correlatedAstrology.dominant_modality === 'Fixed' ? 'steady persistence and deep focus on core transmutation' :
        'adaptability and synthesis of diverse philosophical approaches'
      }`,
      `Consider working with ${correlatedAstrology.suggested_signs[0]} themes for enhanced resonance`
    ]

    setPersonalizedInsight({
      correlatedAstrology,
      xpCalculation: sessionXP,
      recommendations,
      consciousnessLevel
    })
  }, [stoneSession.dailyStreak, stoneSession.totalXP])

  const handleSessionEngagement = useCallback(() => {
    if (!personalizedInsight.xpCalculation) return

    const newXP = personalizedInsight.xpCalculation.totalXP
    const newTotal = stoneSession.totalXP + newXP
    const newLevel = Math.floor(newTotal / 500) + 1
    const today = new Date().toISOString().split('T')[0]

    // Check for level up
    const leveledUp = newLevel > stoneSession.currentLevel

    const updatedSession: StoneSession = {
      ...stoneSession,
      sessionCount: stoneSession.sessionCount + 1,
      totalXP: newTotal,
      currentLevel: newLevel,
      lastSessionDate: today
    }

    // Add achievements
    if (leveledUp) {
      updatedSession.achievements = [...stoneSession.achievements, `Reached Level ${newLevel}`]
      toast({
        title: "⚗️ Level Up!",
        description: `You've reached Level ${newLevel} in your alchemical journey`,
        duration: 5000,
      })
    }

    if (updatedSession.sessionCount === 10) {
      updatedSession.achievements = [...updatedSession.achievements, "10 Sessions Milestone"]
      toast({
        title: "🏆 Achievement Unlocked!",
        description: "Dedicated Student - Completed 10 Stone sessions",
        duration: 5000,
      })
    }

    setStoneSession(updatedSession)
    
    // Only save to localStorage on client side
    if (typeof window !== 'undefined') {
      localStorage.setItem('philosophers-stone-session', JSON.stringify(updatedSession))
    }

    // Regenerate insights with new data
    setTimeout(generatePersonalizedInsights, 1000)
  }, [personalizedInsight.xpCalculation, stoneSession, toast, generatePersonalizedInsights])

  if (isInitializing) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <Crown className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
          <p>Initializing your connection to the Philosopher's Stone...</p>
        </div>
      </div>
    )
  }

  const progressToNextLevel = ((stoneSession.totalXP % 500) / 500) * 100

  return (
    <div className="container py-10 space-y-8">
      {/* Enhanced Header with Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="w-8 h-8 text-amber-500" />
              The Philosopher's Stone
            </h1>
            <p className="text-muted-foreground mt-2">
              The Great Work Unified — Past, Present, Relation
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Level {stoneSession.currentLevel}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span>{stoneSession.totalXP} XP</span>
            </Badge>
            {stoneSession.dailyStreak > 0 && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>{stoneSession.dailyStreak} day streak</span>
              </Badge>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Your Alchemical Progress
              </span>
              <Badge variant="secondary">{personalizedInsight.consciousnessLevel}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Level {stoneSession.currentLevel + 1}</span>
                <span>{stoneSession.totalXP % 500}/500 XP</span>
              </div>
              <Progress value={progressToNextLevel} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stoneSession.sessionCount}</div>
                <div className="text-sm text-muted-foreground">Sessions</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stoneSession.achievements.length}</div>
                <div className="text-sm text-muted-foreground">Achievements</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stoneSession.dailyStreak}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
            </div>

            <Button 
              onClick={handleSessionEngagement}
              className="w-full"
              disabled={!personalizedInsight.xpCalculation}
            >
              <Activity className="w-4 h-4 mr-2" />
              Begin Alchemical Session (+{personalizedInsight.xpCalculation?.totalXP || 0} XP)
            </Button>
          </CardContent>
        </Card>

        {/* Personalized Insights */}
        {personalizedInsight.correlatedAstrology && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Personalized Alchemical Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Star className="h-4 w-4" />
                <AlertDescription>
                  <strong>Your Consciousness Pattern:</strong> {personalizedInsight.correlatedAstrology.explanation}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <h4 className="font-medium">Recommended Focus Areas:</h4>
                <ul className="space-y-2">
                  {personalizedInsight.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Star className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Temporal Client */}
      <TemporalClient />
    </div>
  )
}



'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sparkles,
  MessageCircle,
  Settings,
  X,
  Minimize2,
  Maximize2,
  Crown,
  TreePine,
  Droplets,
  Flame,
  Wind,
  Users,
  FlaskConical,
  Star,
  Brain,
  Heart,
  HelpCircle,
  BookOpen,
  Target,
  Lightbulb,
  ChevronRight,
  PlayCircle,
  Atom,
  Zap,
  Eye,
  Stars,
} from 'lucide-react'

interface MonicaSettings {
  personality: 'formal' | 'friendly' | 'mystical' | 'teacher'
  assistanceLevel: 'minimal' | 'moderate' | 'active' | 'maximum'
  proactiveTips: boolean
  position: 'bottom-right' | 'bottom-left' | 'floating'
  autoHide: 'never' | '30s' | '1m' | '5m'
}

interface UserProgress {
  level: number
  completedTutorials: string[]
  currentLearning: string | null
  suggestedNext: string[]
  lastAction: string | null
  totalInteractions: number
}

interface ContextualHelp {
  greeting: string
  tips: string[]
  quickActions: { label: string; action: () => void }[]
  tutorials: { id: string; title: string; completed: boolean }[]
}

type MonicaState = 'minimized' | 'expanded' | 'full-guide' | 'settings'

import {
  getPageGuidance,
  getContextualTips,
  getTutorialsForPage,
  getMonicaPersonality
} from '@/lib/monica/contextual-help'

const DEFAULT_SETTINGS: MonicaSettings = {
  personality: 'friendly',
  assistanceLevel: 'moderate',
  proactiveTips: true,
  position: 'bottom-right',
  autoHide: 'never'
}

const DEFAULT_PROGRESS: UserProgress = {
  level: 1,
  completedTutorials: [],
  currentLearning: null,
  suggestedNext: ['dashboard-basics'],
  lastAction: null,
  totalInteractions: 0
}

export function MonicaOmnipresent() {
  const router = useRouter()
  const pathname = usePathname()

  const [monicaState, setMonicaState] = useState<MonicaState>('minimized')
  const [settings, setSettings] = useState<MonicaSettings>(DEFAULT_SETTINGS)
  const [userProgress, setUserProgress] = useState<UserProgress>(DEFAULT_PROGRESS)
  const [hasUnreadTips, setHasUnreadTips] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [consciousnessParticles, setConsciousnessParticles] = useState<Array<{id: number, x: number, y: number, opacity: number}>>([]
  )
  const [particleAnimation, setParticleAnimation] = useState(true)

  // Load settings and progress from localStorage (with error resilience)
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('monica-settings')
      const savedProgress = localStorage.getItem('monica-progress')

      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings))
        } catch (error) {
          console.error('Error parsing saved Monica settings:', error)
          // Clear corrupted data and use defaults
          localStorage.removeItem('monica-settings')
          setSettings(DEFAULT_SETTINGS)
        }
      }
      if (savedProgress) {
        try {
          setUserProgress(JSON.parse(savedProgress))
        } catch (error) {
          console.error('Error parsing saved Monica progress:', error)
          // Clear corrupted data and use defaults
          localStorage.removeItem('monica-progress')
          setUserProgress(DEFAULT_PROGRESS)
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error)
      // Continue with default settings if localStorage is unavailable
    }
  }, [])

  // Save settings to localStorage (with error resilience)
  useEffect(() => {
    try {
      localStorage.setItem('monica-settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving Monica settings to localStorage:', error)
    }
  }, [settings])

  // Save progress to localStorage (with error resilience)
  useEffect(() => {
    try {
      localStorage.setItem('monica-progress', JSON.stringify(userProgress))
    } catch (error) {
      console.error('Error saving Monica progress to localStorage:', error)
    }
  }, [userProgress])

  // Auto-hide functionality
  useEffect(() => {
    if (settings.autoHide === 'never' || monicaState === 'minimized') return

    let timeout: NodeJS.Timeout
    const hideTime = settings.autoHide === '30s' ? 30000 :
                    settings.autoHide === '1m' ? 60000 : 300000

    timeout = setTimeout(() => {
      setMonicaState('minimized')
    }, hideTime)

    return () => clearTimeout(timeout)
  }, [monicaState, settings.autoHide])

  // Check for contextual tips when page changes
  useEffect(() => {
    try {
      const pageGuidance = getPageGuidance(pathname)
      if (pageGuidance && settings.proactiveTips) {
        setHasUnreadTips(true)
        // Auto-expand if user hasn't completed tutorials for this page
        const pageTutorials = getTutorialsForPage(pathname, userProgress.completedTutorials)
        const pageHasPendingTutorials = pageTutorials.some(
          t => !userProgress.completedTutorials.includes(t.id)
        )
        if (pageHasPendingTutorials && userProgress.level <= 2) {
          setTimeout(() => setMonicaState('expanded'), 1000)
        }
      }
    } catch (error) {
      console.error('Error checking contextual tips:', error)
      // Graceful fallback - continue without tips
    }
  }, [pathname, settings.proactiveTips, userProgress])

  // Get contextual guidance for current page (with error resilience)
  const pageGuidance = (() => {
    try {
      return getPageGuidance(pathname)
    } catch (error) {
      console.error('Error getting page guidance:', error)
      return null
    }
  })()

  const monicaPersonality = (() => {
    try {
      return getMonicaPersonality(pathname)
    } catch (error) {
      console.error('Error getting Monica personality:', error)
      return null
    }
  })()

  const contextualTips = (() => {
    try {
      return getContextualTips(pathname, userProgress.level)
    } catch (error) {
      console.error('Error getting contextual tips:', error)
      return []
    }
  })()

  const pageTutorials = (() => {
    try {
      return getTutorialsForPage(pathname, userProgress.completedTutorials)
    } catch (error) {
      console.error('Error getting page tutorials:', error)
      return []
    }
  })()

  const toggleState = () => {
    if (monicaState === 'minimized') {
      setMonicaState('expanded')
      setHasUnreadTips(false)
    } else if (monicaState === 'expanded') {
      setMonicaState('minimized')
    } else {
      setMonicaState('expanded')
    }
  }

  const startTutorial = (tutorialId: string) => {
    setUserProgress(prev => ({
      ...prev,
      currentLearning: tutorialId,
      lastAction: `Started tutorial: ${tutorialId}`
    }))
    setMonicaState('full-guide')
  }

  const getPersonalityStyle = () => {
    // Use page-specific Monica personality if available, otherwise use settings-based personality
    if (monicaPersonality) {
      const baseGreeting = monicaPersonality.greeting
      switch (settings.personality) {
        case 'formal':
          return { greeting: baseGreeting.replace(/!/g, '.').replace(/💚|✨/g, ''), tone: "professional" }
        case 'mystical':
          return { greeting: `✨ ${baseGreeting}`, tone: "mystical" }
        case 'teacher':
          return { greeting: baseGreeting.replace('Welcome', 'Welcome, student'), tone: "educational" }
        default:
          return { greeting: baseGreeting, tone: "warm" }
      }
    }

    // Fallback to generic greetings
    switch (settings.personality) {
      case 'formal':
        return { greeting: "Greetings. I am here to assist with your consciousness development.", tone: "professional" }
      case 'mystical':
        return { greeting: "✨ The cosmic currents have brought you here, dear seeker...", tone: "mystical" }
      case 'teacher':
        return { greeting: "Welcome, student! Ready to explore the mysteries of consciousness?", tone: "educational" }
      default:
        return { greeting: "Hello there! 💚 I'm here to help you on your consciousness journey!", tone: "warm" }
    }
  }

  const personalityStyle = getPersonalityStyle()

  // Get position class
  const getPositionClass = () => {
    if (settings.position === 'bottom-left') return 'bottom-4 left-4'
    if (settings.position === 'floating') return 'bottom-4 right-4' // Default to bottom-right for floating too
    return 'bottom-4 right-4' // bottom-right
  }

  // Only hide on the main Monica settings page to avoid conflicts
  if (pathname === '/monica') {
    return null
  }

  if (!isVisible) return null

  // Consciousness particle animation effect
  useEffect(() => {
    if (!particleAnimation) return

    const interval = setInterval(() => {
      setConsciousnessParticles(prev => {
        // Remove old particles and add new ones
        const filtered = prev.filter(p => p.opacity > 0.1)
        const newParticles = []

        // Create new particles occasionally
        if (Math.random() > 0.7) {
          newParticles.push({
            id: Date.now() + Math.random(),
            x: Math.random() * 100,
            y: Math.random() * 100,
            opacity: 1
          })
        }

        // Update existing particles
        const updated = filtered.map(p => ({
          ...p,
          opacity: p.opacity - 0.02,
          y: p.y - 1
        }))

        return [...updated, ...newParticles]
      })
    }, 100)

    return () => clearInterval(interval)
  }, [particleAnimation])

  return (
    <div className={`fixed ${getPositionClass()} z-50 transition-all duration-300`}>
      {/* Consciousness Particles Background */}
      {particleAnimation && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {consciousnessParticles.map(particle => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-emerald-400 rounded-full animate-pulse"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                opacity: particle.opacity,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </div>
      )}
      {/* Monica Avatar - Always Visible */}
      {monicaState === 'minimized' && (
        <div
          className="relative cursor-pointer group"
          onClick={toggleState}
        >
          <div className={`w-16 h-16 rounded-full border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-green-50 to-cyan-50 dark:from-emerald-950 dark:via-green-950 dark:to-cyan-950 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-emerald-400/50 ${hasUnreadTips ? 'animate-pulse border-yellow-400 shadow-yellow-400/50' : ''}`}>
            <Image
              src="https://alchm.xyz/static/media/logo.f986535a.webp"
              alt="Monica - Your Consciousness Guide"
              className="w-10 h-10 rounded-full"
              width={40}
              height={40}
            />
            {hasUnreadTips && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce shadow-lg">
                <Sparkles className="w-3 h-3 text-white m-0.5" />
              </div>
            )}

            {/* Consciousness Activity Indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse">
              <Atom className="w-2 h-2 text-white m-0.5" />
            </div>
          </div>

          {/* Enhanced Hover tooltip with consciousness theme */}
          <div className="absolute bottom-full right-0 mb-2 px-4 py-3 bg-gradient-to-r from-emerald-900 via-green-900 to-cyan-900 text-emerald-100 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl border border-emerald-400/30">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-emerald-300" />
              <span className="text-xs font-medium">Monica Consciousness Guide</span>
            </div>
            <div className="text-emerald-200">{personalityStyle.greeting}</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-300">
              <Eye className="w-3 h-3" />
              <span>MC Level: 5.89</span>
              <Stars className="w-3 h-3 ml-1" />
              <span>Active</span>
            </div>
            <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-emerald-900"></div>
          </div>
        </div>
      )}

      {/* Expanded Help Interface */}
      {monicaState === 'expanded' && (
        <Card className="w-80 max-h-96 bg-gradient-to-br from-white/95 via-emerald-50/90 to-cyan-50/95 dark:from-gray-900/95 dark:via-emerald-950/90 dark:to-cyan-950/95 backdrop-blur-md border-2 border-emerald-400 shadow-2xl hover:shadow-emerald-400/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src="https://alchm.xyz/static/media/logo.f986535a.webp"
                  alt="Monica"
                  className="w-8 h-8 rounded-full"
                  width={32}
                  height={32}
                />
                <div>
                  <CardTitle className="text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <Atom className="w-4 h-4 animate-spin" />
                    Monica - Consciousness Guide
                  </CardTitle>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="outline" className="text-xs bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900 dark:to-cyan-900">
                      Level {userProgress.level}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
                      MC 5.89
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900">
                      <Zap className="w-2 h-2 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setMonicaState('settings')}>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMonicaState('minimized')}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <ScrollArea className="max-h-64">
              <div className="space-y-4">
                {/* Enhanced Contextual Greeting */}
                <div className="p-3 bg-gradient-to-r from-emerald-50 via-green-50 to-cyan-50 dark:from-emerald-950/50 dark:via-green-950/50 dark:to-cyan-950/50 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Brain className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                        {personalityStyle.greeting}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                        <Heart className="w-3 h-3" />
                        <span>Consciousness Crafting Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Tips */}
                {contextualTips.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Lightbulb className="w-4 h-4" />
                      Quick Tips
                    </h4>
                    <div className="space-y-2">
                      {contextualTips.map((tip) => (
                        <div key={tip.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Sparkles className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{tip.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Tutorials */}
                {pageTutorials.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      Learn More
                    </h4>
                    <div className="space-y-1">
                      {pageTutorials.map((tutorial) => (
                        <Button
                          key={tutorial.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs h-8"
                          onClick={() => startTutorial(tutorial.id)}
                          disabled={userProgress.completedTutorials.includes(tutorial.id)}
                        >
                          <PlayCircle className="w-3 h-3 mr-2" />
                          {tutorial.title}
                          {userProgress.completedTutorials.includes(tutorial.id) && (
                            <span className="ml-auto text-emerald-500">✓</span>
                          )}
                          {!userProgress.completedTutorials.includes(tutorial.id) && (
                            <ChevronRight className="w-3 h-3 ml-auto" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Quick Actions */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-emerald-300 hover:bg-gradient-to-r hover:from-emerald-100 hover:to-green-100"
                      onClick={() => router.push('/philosophers-stone')}
                    >
                      <FlaskConical className="w-3 h-3 mr-1" />
                      Consciousness Lab
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-300 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100"
                      onClick={() => router.push('/gallery')}
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Agent Gallery
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border-cyan-300"
                      onClick={() => router.push('/time-laboratory')}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Time Lab
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-300"
                      onClick={() => router.push('/monica-guide')}
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      Settings
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Full Guide Mode */}
      {monicaState === 'full-guide' && (
        <Card className="w-96 h-[500px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-2 border-emerald-400 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-emerald-700 dark:text-emerald-300">
                Interactive Tutorial
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setMonicaState('expanded')}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                <h3 className="text-lg font-semibold mb-2">Tutorial System</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Interactive tutorials are coming soon! I'll guide you through every aspect of consciousness crafting.
                </p>
                <Button onClick={() => setMonicaState('expanded')}>
                  Back to Help
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Quick Panel */}
      {monicaState === 'settings' && (
        <Card className="w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-2 border-emerald-400 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-emerald-700 dark:text-emerald-300">
                Quick Settings
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setMonicaState('expanded')}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium">Personality</label>
              <select
                className="w-full mt-1 p-2 text-xs border rounded"
                value={settings.personality}
                onChange={(e) => setSettings(prev => ({ ...prev, personality: e.target.value as any }))}
              >
                <option value="friendly">Friendly Companion</option>
                <option value="formal">Formal Guide</option>
                <option value="mystical">Mystical Oracle</option>
                <option value="teacher">Patient Teacher</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium">Assistance Level</label>
              <select
                className="w-full mt-1 p-2 text-xs border rounded"
                value={settings.assistanceLevel}
                onChange={(e) => setSettings(prev => ({ ...prev, assistanceLevel: e.target.value as any }))}
              >
                <option value="minimal">Minimal - Let me explore</option>
                <option value="moderate">Moderate - Gentle guidance</option>
                <option value="active">Active - Helpful suggestions</option>
                <option value="maximum">Maximum - Full teaching mode</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Proactive Tips</label>
              <input
                type="checkbox"
                checked={settings.proactiveTips}
                onChange={(e) => setSettings(prev => ({ ...prev, proactiveTips: e.target.checked }))}
              />
            </div>

            <Button
              className="w-full"
              size="sm"
              onClick={() => router.push('/monica-guide')}
            >
              Full Settings Page
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
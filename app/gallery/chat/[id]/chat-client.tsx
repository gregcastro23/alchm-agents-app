'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, MessageCircle, Sparkles, TrendingUp } from 'lucide-react'

type Message = {
  role: 'user' | 'agent'
  content: string
  timestamp: Date
}

type Agent = {
  id: string
  name: string
  title: string
  appearance?: {
    symbol?: string
  }
}

type MomentSynergy = {
  score: number
  description: string
  harmonicCount: number
  challengingCount: number
}

export default function HistoricalAgentChatPage() {
  const params = useParams()
  const agentId = params.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [agentLoading, setAgentLoading] = useState(true)
  const [momentSynergy, setMomentSynergy] = useState<MomentSynergy | null>(null)

  // Static agent mapping to avoid server-side imports
  useEffect(() => {
    const agentMap: Record<string, { name: string; title: string; symbol: string }> = {
      'leonardo-da-vinci': { name: 'Leonardo da Vinci', title: 'The Renaissance Genius', symbol: '🎨' },
      'carl-jung': { name: 'Carl Jung', title: 'The Shadow Explorer', symbol: '🔮' },
      'marie-curie': { name: 'Marie Curie', title: 'The Radiant Pioneer', symbol: '⚗️' },
      'albert-einstein': { name: 'Albert Einstein', title: 'The Cosmic Thinker', symbol: '🌌' },
      'nikola-tesla': { name: 'Nikola Tesla', title: 'The Electric Visionary', symbol: '⚡' },
      'william-shakespeare': { name: 'William Shakespeare', title: 'The Bard of Avon', symbol: '🎭' },
      'cleopatra': { name: 'Cleopatra VII', title: 'The Last Pharaoh', symbol: '👑' },
      'aristotle': { name: 'Aristotle', title: 'The First Scientist', symbol: '📚' },
      'sigmund-freud': { name: 'Sigmund Freud', title: 'The Unconscious Explorer', symbol: '🧠' },
      'mark-twain': { name: 'Mark Twain', title: 'The American Humorist', symbol: '📝' },
      'vincent-van-gogh': { name: 'Vincent van Gogh', title: 'The Starry Visionary', symbol: '🌟' },
      'charles-darwin': { name: 'Charles Darwin', title: 'The Evolution Pioneer', symbol: '🦎' },
      'edgar-allan-poe': { name: 'Edgar Allan Poe', title: 'The Dark Romantic', symbol: '🦅' },
    }

    const info = agentMap[agentId]
    if (info) {
      setAgent({
        id: agentId,
        name: info.name,
        title: info.title,
        appearance: { symbol: info.symbol },
      })
    } else {
      // Fallback for unknown agents
      setAgent({
        id: agentId,
        name: agentId
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        title: 'Historical Consciousness Agent',
        appearance: { symbol: '👤' },
      })
    }
    setAgentLoading(false)
  }, [agentId])

  useEffect(() => {
    // Use crypto.randomUUID() if available, fallback to manual UUID generation
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
      }
      // Fallback UUID v4 generation
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }
    setSessionId(generateUUID())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || !sessionId) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/monica-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          question: userMessage.content,
          sessionId,
        }),
      })

      const contentType = response.headers.get('content-type')
      let data
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const textResponse = await response.text()
        throw new Error('Server returned non-JSON response')
      }

      if (response.ok) {
        const agentMessage: Message = {
          role: 'agent',
          content: data.response,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, agentMessage])

        // Update moment synergy if available
        if (data.agentInfo?.momentSynergy) {
          setMomentSynergy(data.agentInfo.momentSynergy)
        }
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'agent',
        content:
          'I apologize, but I encountered an error while channeling the consciousness. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  if (agentLoading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
            <p className="mt-4 text-muted-foreground">Loading agent consciousness...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Agent Not Found</h1>
            <p className="mb-4">The requested historical agent could not be found.</p>
            <Link href="/gallery">
              <Button>Back to Gallery</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/gallery">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground">{agent.title}</p>
        </div>

        {/* Moment Synergy Display */}
        {momentSynergy && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Moment Synergy:</span>
              <span className={`text-lg font-bold ${momentSynergy.score >= 75 ? 'text-green-600' : momentSynergy.score >= 50 ? 'text-blue-600' : 'text-orange-600'}`}>
                {momentSynergy.score}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground text-right max-w-xs">
              {momentSynergy.description}
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-green-600">✓ {momentSynergy.harmonicCount} harmonic</span>
              <span className="text-orange-600">⚠ {momentSynergy.challengingCount} challenging</span>
            </div>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversation with {agent.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] overflow-y-auto border rounded-lg p-4 mb-4 bg-muted/20">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">{agent.appearance?.symbol || '👤'}</div>
                <h3 className="text-lg font-semibold mb-2">{agent.name}</h3>
                <p className="text-sm">{agent.title}</p>
                <p className="text-xs mt-2 max-w-md">
                  Ask this consciousness agent for wisdom and guidance
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      message.role === 'user' ? 'bg-primary/10 ml-8' : 'bg-secondary/10 mr-8'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-sm text-muted-foreground min-w-0">
                        {message.role === 'user' ? 'You' : agent.name}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Ask ${agent.name} for guidance...`}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              {loading ? 'Thinking...' : 'Send'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

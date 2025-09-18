'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { DEMO_AGENTS } from '@/lib/demo-agents-data'

type Message = {
  role: 'user' | 'agent'
  content: string
  timestamp: Date
}

export default function HistoricalAgentChatPage() {
  const params = useParams()
  const agentId = params.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const agent = DEMO_AGENTS.find(a => a.id === agentId)

  useEffect(() => {
    setSessionId(crypto.randomUUID())
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
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'agent',
        content: 'I apologize, but I encountered an error while channeling the consciousness. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
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
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground">{agent.title}</p>
        </div>
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
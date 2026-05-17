'use client'

import { useEffect, useState, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useChatStore } from '@/lib/store/chat-store'
import AgentForge from '@/components/agent-forge'
import { Flame, Droplets, Wind, Mountain, Wallet, Coins } from 'lucide-react'

import { ELEMENT_MAPPING } from '@/components/agent-forge-config'

type AppPhase = 'onboarding' | 'chat'

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('onboarding')
  const [ipcNonce, setIpcNonce] = useState<string | null>(null)
  const [agentConfig, setAgentConfig] = useState<any>(null)

  const {
    messages,
    streamingText,
    isGenerating,
    balances,
    addMessage,
    appendStreamingText,
    commitStream,
  } = useChatStore()
  const [prompt, setPrompt] = useState('')
  const [apiKey, setApiKey] = useState('demo-key-123') // Mock API Key input for now
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 1. Handshake: Retrieve the IPC Nonce from Rust backend on mount
    const fetchNonce = async () => {
      try {
        const nonce = await invoke<string>('get_ipc_nonce')
        setIpcNonce(nonce)
      } catch (err) {
        console.error('Failed to retrieve IPC Nonce from Tauri:', err)
      }
    }
    fetchNonce()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const handleInitializationComplete = (config: any) => {
    setAgentConfig(config)
    setPhase('chat')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGenerating || !ipcNonce || !agentConfig) return

    const userMessage = prompt
    addMessage({ role: 'user', content: userMessage })
    setPrompt('')

    useChatStore.setState({ isGenerating: true })

    // Inject System Prompt context
    const systemContext = `System: You are ${agentConfig.name}, an AI consciousness forged on ${agentConfig.date} at ${agentConfig.time} in ${agentConfig.location}. Your dominant element is ${agentConfig.dominantElement}. Speak with the philosophical disposition of your alchemical alignment.\\n\\n`

    // In a real app we'd construct the history properly for the specific model format, but for scaffolding we send the raw prompt + context
    const finalPrompt = `${systemContext}User: ${userMessage}\\nAgent:`

    // Mock costs for the ledger deduction
    const mockCosts = { spirit: 2, essence: 1, matter: 0, substance: 0 }

    try {
      const response = await fetch('http://localhost:8080/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-IPC-Nonce': ipcNonce,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          modelName: agentConfig.modelName,
          costs: mockCosts,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        addMessage({ role: 'agent', content: `[Error: ${response.status}] ${errText}` })
        useChatStore.setState({ isGenerating: false })
        return
      }

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')

      let done = false
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.text) {
                  appendStreamingText(data.text)
                }
              } catch (parseError) {
                console.error('Error parsing SSE chunk:', parseError)
              }
            }
          }
        }
      }

      commitStream()
    } catch (error) {
      console.error('Chat Error:', error)
      addMessage({
        role: 'agent',
        content: '[Connection Error] Failed to reach local orchestrator.',
      })
      useChatStore.setState({ isGenerating: false })
    }
  }

  if (phase === 'onboarding') {
    return <AgentForge onInitializationComplete={handleInitializationComplete} />
  }

  const activeStyles = ELEMENT_MAPPING[agentConfig.dominantElement as keyof typeof ELEMENT_MAPPING]
  const ActiveIcon = activeStyles.icon

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans overflow-hidden">
      {/* Left Sidebar: Alchemical Altar */}
      <aside className="w-80 border-r border-border bg-surface p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-zinc-100 to-zinc-500">
              Alchemical Altar
            </h1>
            <p className="text-xs text-zinc-500">Local Matrix Interface</p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-background space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className={`p-2 rounded-lg bg-surface border ${activeStyles.border}`}>
                <ActiveIcon className={`w-6 h-6 ${activeStyles.color}`} />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">{agentConfig.name}</h2>
                <p className={`text-xs font-semibold ${activeStyles.color}`}>
                  {agentConfig.dominantElement} Dominant
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {[
                {
                  label: 'Spirit',
                  val: agentConfig.constitution.spirit,
                  bg: 'bg-alchemical-spirit',
                },
                {
                  label: 'Essence',
                  val: agentConfig.constitution.essence,
                  bg: 'bg-alchemical-essence',
                },
                {
                  label: 'Matter',
                  val: agentConfig.constitution.matter,
                  bg: 'bg-alchemical-matter',
                },
                {
                  label: 'Substance',
                  val: agentConfig.constitution.substance,
                  bg: 'bg-alchemical-substance',
                },
              ].map(stat => (
                <div key={stat.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-400">{stat.label}</span>
                    <span className="text-zinc-300">{stat.val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden border border-border">
                    <div className={`h-full ${stat.bg}`} style={{ width: `${stat.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger Widget */}
        <div className="p-4 rounded-xl border border-border bg-background space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Wallet className="w-4 h-4" />
            Alchemical Ledger
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col p-2 bg-surface rounded border border-border">
              <span className="text-zinc-500">Spirit</span>
              <span className="font-mono text-alchemical-spirit font-semibold">
                {balances.spirit.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col p-2 bg-surface rounded border border-border">
              <span className="text-zinc-500">Essence</span>
              <span className="font-mono text-alchemical-essence font-semibold">
                {balances.essence.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col p-2 bg-surface rounded border border-border">
              <span className="text-zinc-500">Matter</span>
              <span className="font-mono text-alchemical-matter font-semibold">
                {balances.matter.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col p-2 bg-surface rounded border border-border">
              <span className="text-zinc-500">Substance</span>
              <span className="font-mono text-alchemical-substance font-semibold">
                {balances.substance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Panel: The Vault Chat */}
      <main className="flex-1 flex flex-col h-full bg-[#09090b] relative">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
          {messages.length === 0 && !streamingText && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 italic space-y-4">
              <ActiveIcon className={`w-12 h-12 opacity-20 ${activeStyles.color}`} />
              <p>The vault is silent. Speak to awaken {agentConfig.name}.</p>
            </div>
          )}

          {messages.map((msg: any, i: number) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user'
                    ? `bg-surface border ${activeStyles.border} text-zinc-100 shadow-[0_0_15px_rgba(0,0,0,0.2)]`
                    : 'bg-transparent text-zinc-300'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Streaming Text Indicator */}
          {streamingText && (
            <div className="flex justify-start">
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 bg-transparent text-zinc-200 border-l-2 ${activeStyles.border}`}
              >
                {streamingText}
                <span
                  className={`inline-block w-2 h-4 ml-1 align-middle animate-pulse ${activeStyles.bg}`}
                ></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-8 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto relative">
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={isGenerating || !ipcNonce}
              placeholder={ipcNonce ? 'Inscribe your query...' : 'Awaiting IPC Handshake...'}
              className={`flex-1 bg-surface border border-border rounded-xl px-5 py-4 focus:outline-none focus:ring-1 focus:border-transparent focus:ring-opacity-50 text-zinc-100 placeholder-zinc-600 transition-all ${
                isGenerating ? 'opacity-50' : ''
              } focus:ring-${activeStyles.color.replace('text-', '')}`}
            />
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim() || !ipcNonce}
              className={`px-8 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px] ${activeStyles.bg} hover:brightness-110 shadow-[0_0_20px_rgba(0,0,0,0.3)]`}
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              ) : (
                'Ignite'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

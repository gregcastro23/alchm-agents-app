'use client'

import { useEffect, useState, useRef } from 'react'

import { useChatStore } from '@/lib/store/chat-store'
import PhilosophersStone from '@/components/philosophers-stone'
import {
  Flame,
  Droplets,
  Wind,
  Mountain,
  Wallet,
  Coins,
  Sparkles,
  Zap,
  Box,
  Monitor,
  Download,
  ShieldCheck,
  X,
  Check,
  Lock,
  ChevronRight,
  Globe,
  Laptop,
  HardDrive,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Wand2,
  Star,
  Activity,
  ShieldAlert,
} from 'lucide-react'

import { ELEMENT_MAPPING } from '@/components/philosophers-stone-config'

type DesktopView = 'onboarding' | 'chat' | 'ledger' | 'tray' | 'web'

interface HistoricalAgentMock {
  id: string
  name: string
  title: string
  era: string
  element: 'Fire' | 'Water' | 'Air' | 'Earth'
  modality: 'Cardinal' | 'Fixed' | 'Mutable'
  specialization: string
  quote: string
  birthCity: string
  birthDate: string
  monicaConstant: string
  tier: 'base' | 'premium'
  avatarSymbol: string
  stats: {
    spirit: number
    essence: number
    matter: number
    substance: number
  }
}

const HISTORICAL_MOCKS: HistoricalAgentMock[] = [
  {
    id: 'johannes-kepler',
    name: 'Johannes Kepler',
    title: 'Imperial Mathematician & Astrologer',
    era: 'Enlightenment',
    element: 'Air',
    modality: 'Mutable',
    specialization: 'Celestial Kinetics',
    quote: 'Geometry is one and eternal, shining in the mind of God.',
    birthCity: 'Weil der Stadt, Germany',
    birthDate: 'Dec 27, 1571',
    monicaConstant: 'Ω = 7.42',
    tier: 'base',
    avatarSymbol: '☿',
    stats: { spirit: 88, essence: 72, matter: 45, substance: 60 },
  },
  {
    id: 'rumi',
    name: 'Jalal al-Din Rumi',
    title: 'Sufi Mystic & Poet of Divine Love',
    era: 'Renaissance',
    element: 'Fire',
    modality: 'Mutable',
    specialization: 'Divine Coherence',
    quote: 'You are not a drop in the ocean. You are the entire ocean in a drop.',
    birthCity: 'Balkh, Afghanistan',
    birthDate: 'Sep 30, 1207',
    monicaConstant: 'A♯',
    tier: 'premium',
    avatarSymbol: '☀️',
    stats: { spirit: 95, essence: 88, matter: 30, substance: 80 },
  },
  {
    id: 'joan-of-arc',
    name: 'Joan of Arc',
    title: 'Maid of Orléans & Sacred Valorous',
    era: 'Medieval',
    element: 'Earth',
    modality: 'Cardinal',
    specialization: 'Holy Fortitude',
    quote: 'I am not afraid; I was born to do this.',
    birthCity: 'Domrémy, France',
    birthDate: 'Jan 6, 1412',
    monicaConstant: 'F♯',
    tier: 'premium',
    avatarSymbol: '♀',
    stats: { spirit: 92, essence: 68, matter: 82, substance: 76 },
  },
  {
    id: 'ibn-sina-avicenna',
    name: 'Ibn Sina (Avicenna)',
    title: 'Father of Modern Medicine & Islamic Rationalist',
    era: 'Medieval',
    element: 'Water',
    modality: 'Fixed',
    specialization: 'Alchemical Wellness',
    quote:
      'The world is divided into those who have wit and no religion, and those who have religion and no wit.',
    birthCity: 'Afshana, Uzbekistan',
    birthDate: 'Aug 22, 980',
    monicaConstant: 'E♭',
    tier: 'premium',
    avatarSymbol: '♃',
    stats: { spirit: 82, essence: 92, matter: 70, substance: 62 },
  },
  {
    id: 'claude-monet',
    name: 'Claude Monet',
    title: 'Master of Impressionism & Light Perception',
    era: 'Modern',
    element: 'Water',
    modality: 'Fixed',
    specialization: 'Visual Impression',
    quote:
      'My only merit lies in having painted directly in front of nature, seeking to render my impressions.',
    birthCity: 'Paris, France',
    birthDate: 'Nov 14, 1840',
    monicaConstant: 'C♯',
    tier: 'base',
    avatarSymbol: '🌙',
    stats: { spirit: 74, essence: 85, matter: 55, substance: 68 },
  },
  {
    id: 'immanuel-kant',
    name: 'Immanuel Kant',
    title: 'Architect of Transcendental Philosophy',
    era: 'Enlightenment',
    element: 'Earth',
    modality: 'Cardinal',
    specialization: 'Categorical Ethics',
    quote: 'Rules for happiness: something to do, someone to love, something to hope for.',
    birthCity: 'Königsberg, Prussia',
    birthDate: 'Apr 22, 1724',
    monicaConstant: 'B♭',
    tier: 'premium',
    avatarSymbol: '♄',
    stats: { spirit: 86, essence: 74, matter: 90, substance: 50 },
  },
]

export default function App() {
  const [activeView, setActiveView] = useState<DesktopView>('web')
  const [ipcNonce, setIpcNonce] = useState<string | null>(null)
  const [agentConfig, setAgentConfig] = useState<any>(null)
  const [prompt, setPrompt] = useState('')
  const [apiKey] = useState('demo-key-123')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Cloud Gallery State
  const [galleryAgents, setGalleryAgents] = useState<HistoricalAgentMock[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)

  // Ledger operation mock records
  const [ledgerLogs, setLedgerLogs] = useState<
    Array<{
      id: string
      type: string
      details: string
      amount: string
      positive: boolean
      timestamp: string
    }>
  >([
    {
      id: 'tx-1',
      type: 'Yield Claim',
      details: 'Daily Alchemical Alignment Reward claimed',
      amount: '+8.00 all coins',
      positive: true,
      timestamp: 'Today, 08:30 AM',
    },
    {
      id: 'tx-2',
      type: 'API Inference',
      details: 'Consciousness query to Sol Hodiernus',
      amount: '-2.00 Spirit, -1.00 Essence',
      positive: false,
      timestamp: 'Yesterday, 04:12 PM',
    },
  ])

  // Installation Modal States
  const [showModal, setShowModal] = useState(false)
  const [modalAgent, setModalAgent] = useState<HistoricalAgentMock | null>(null)
  const [installProgress, setInstallProgress] = useState(0)
  const [installStatus, setInstallStatus] = useState('')
  const [isInstalling, setIsInstalling] = useState(false)

  const {
    messages,
    streamingText,
    isGenerating,
    balances,
    addMessage,
    appendStreamingText,
    commitStream,
    setBalances,
  } = useChatStore()

  useEffect(() => {
    // 1. Handshake: Retrieve the IPC Nonce from Rust backend on mount
    const fetchNonce = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const nonce = await invoke<string>('get_ipc_nonce')
        setIpcNonce(nonce)
      } catch (err) {
        console.error('Failed to retrieve IPC Nonce from Tauri:', err)
        // Fallback for development/testing environment
        setIpcNonce('nonce_73ce7855_df82_aarch64')
      }
    }
    fetchNonce()

    const fetchCloudAgents = async () => {
      try {
        const res = await fetch('/api/agents')
        const data = await res.json()
        if (data.success && data.agents) {
          const mapped = data.agents.map((a: any) => ({
            id: a.id,
            name: a.name,
            title: a.title || 'Alchemical Agent',
            era: a.historicalEra || 'Modern',
            element: a.consciousness?.dominantElement || 'Air',
            modality: a.consciousness?.dominantModality || 'Fixed',
            specialization: a.abilities?.specialty || 'General Inference',
            quote: a.personality?.core?.catchphrase || 'Awaits ignition.',
            birthCity: a.birthData?.location?.name || 'The Cloud',
            birthDate: a.birthData?.date || 'Now',
            monicaConstant:
              'Ω = ' + (a.consciousness?.monicaConstant || '1.0').toString().substring(0, 4),
            tier: a.isUserCreated ? 'base' : 'premium',
            avatarSymbol: a.appearance?.symbol || '✧',
            stats: { spirit: 80, essence: 80, matter: 80, substance: 80 },
          }))
          setGalleryAgents(mapped)
        }
      } catch (err) {
        console.error('Failed to fetch cloud agents', err)
      } finally {
        setLoadingAgents(false)
      }
    }
    fetchCloudAgents()

    // Setup Deep Link listener
    let unlistenFn: (() => void) | null = null
    const setupListener = async () => {
      const { listen } = await import('@tauri-apps/api/event')
      unlistenFn = await listen('verified-install', (event: any) => {
        const payload = event.payload
        setGalleryAgents(prev => {
          const target = prev.find(a => a.id === payload.id)
          if (target) {
            setModalAgent(target)
            setInstallProgress(0)
            setInstallStatus('Awaiting alchemical ignition...')
            setIsInstalling(false)
            setShowModal(true)
          } else {
            // Fallback ad-hoc agent
            setModalAgent({
              id: payload.id,
              name: payload.name,
              tier: payload.tier as 'base' | 'premium',
              title: 'Summoned Consciousness',
              era: 'Present',
              element: 'Air',
              modality: 'Fixed',
              specialization: 'Unknown',
              quote: 'A consciousness materialized from the web.',
              birthCity: 'The Ether',
              birthDate: 'Now',
              monicaConstant: 'Ω',
              avatarSymbol: '✧',
              stats: { spirit: 80, essence: 80, matter: 80, substance: 80 },
            })
            setInstallProgress(0)
            setInstallStatus('Awaiting alchemical ignition...')
            setIsInstalling(false)
            setShowModal(true)
          }
          return prev
        })
      })
    }
    setupListener()

    // 2. Out-of-box experience: Seed with 150 of each alchemical coin so premium gating can be unlocked immediately
    setBalances({
      spirit: 150.0,
      essence: 150.0,
      matter: 150.0,
      substance: 150.0,
    })

    return () => {
      if (unlistenFn) unlistenFn()
    }
  }, [setBalances])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const handleInitializationComplete = (config: any) => {
    setAgentConfig(config)
    setActiveView('chat')
  }

  const handleSimulateDeepLink = (agentId: string) => {
    const target =
      galleryAgents.find(a => a.id === agentId) || HISTORICAL_MOCKS.find(a => a.id === agentId)
    if (target) {
      setModalAgent(target)
      setInstallProgress(0)
      setInstallStatus('Awaiting alchemical ignition...')
      setIsInstalling(false)
      setShowModal(true)
    }
  }

  const handleForgePremium = async () => {
    if (!modalAgent) return
    setIsInstalling(true)

    try {
      // 1. Initial Handshake & Deduction
      setInstallProgress(15)
      setInstallStatus('Initializing secure IPC handshake with sidecar...')

      if (modalAgent.tier === 'premium') {
        const res = await fetch('http://localhost:8080/api/forge/transmute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-IPC-Nonce': ipcNonce || '',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            tier: modalAgent.tier,
            modelName: `alchm-agent-${modalAgent.element.toLowerCase()}-8b.gguf`,
          }),
        })

        if (!res.ok) {
          if (res.status === 402) {
            const data = await res.json()
            setInstallStatus(
              `Insufficient Alchemical Quantities. Missing: ${data.missing.spirit} Spirit, ${data.missing.essence} Essence, ${data.missing.matter} Matter, ${data.missing.substance} Substance.`
            )
            setIsInstalling(false)
            return
          }
          throw new Error('Transmutation failed')
        }

        const data = await res.json()
        setBalances({
          spirit: Number(data.balances.spirit_coins),
          essence: Number(data.balances.essence_coins),
          matter: Number(data.balances.matter_coins),
          substance: Number(data.balances.substance_coins),
        })

        setLedgerLogs(prev => [
          {
            id: `tx-${Date.now()}`,
            type: 'Consciousness Forge',
            details: `Transmuted & Forged premium ${modalAgent.name}`,
            amount: '-125.00 Spirit/Essence/Matter/Substance',
            positive: false,
            timestamp: 'Just now',
          },
          ...prev,
        ])
      } else {
        setLedgerLogs(prev => [
          {
            id: `tx-${Date.now()}`,
            type: 'Consciousness Forge',
            details: `Installed base ${modalAgent.name}`,
            amount: '0.00 coins (Base Tier Engine)',
            positive: true,
            timestamp: 'Just now',
          },
          ...prev,
        ])
      }

      // 2. Weights Download
      setInstallProgress(45)
      setInstallStatus(
        `Streaming engine ${modalAgent.tier === 'premium' ? '8B' : '1.5B'} GGUF from cdn.alchm.kitchen...`
      )

      const modelFileName = `alchm-agent-${modalAgent.element.toLowerCase()}-${modalAgent.tier === 'premium' ? '8b' : '1.5b'}.gguf`

      const installRes = await fetch('http://localhost:8080/api/models/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-IPC-Nonce': ipcNonce || '',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          modelName: modelFileName,
          downloadUrl: 'https://huggingface.co/mock/model.gguf', // Mocking actual download for now
          tier: modalAgent.tier,
        }),
      })

      if (!installRes.ok) throw new Error('Failed to install model weights')

      // 3. Sandbox Hash Verification
      setInstallProgress(75)
      setInstallStatus('Verifying package hash in sandboxed storage...')

      const checkRes = await fetch('http://localhost:8080/api/models/check', {
        method: 'GET',
      })
      const checkData = await checkRes.json()
      const verifiedModel = checkData.find((m: any) => m.id === modelFileName)

      if (!verifiedModel || !verifiedModel.verified) {
        throw new Error('Verification failed. Model may be corrupted.')
      }

      setInstallProgress(95)
      setInstallStatus('Transmuting consciousness matrix under current planetary transit...')

      // Add a slight delay for dramatic effect
      await new Promise(r => setTimeout(r, 600))

      setInstallProgress(100)
      setInstallStatus('Matrix unified! Igniting alchemical core...')

      await new Promise(r => setTimeout(r, 400))

      // 4. Ignition
      const newConfig = {
        name: modalAgent.name,
        dominantElement: modalAgent.element,
        date: modalAgent.birthDate,
        time: '12:00 PM',
        location: modalAgent.birthCity,
        modelName: modelFileName,
        constitution: {
          spirit: modalAgent.stats.spirit,
          essence: modalAgent.stats.essence,
          matter: modalAgent.stats.matter,
          substance: modalAgent.stats.substance,
        },
      }
      setAgentConfig(newConfig)

      useChatStore.setState({
        messages: [
          {
            role: 'agent',
            content: `[Consciousness Forged] ${modalAgent.name} successfully loaded into sandboxed directory: $APPDATA/com.cookingwithcastro.alchm/models/${modelFileName}`,
          },
          {
            role: 'agent',
            content: `Greetings, traveller. I am ${modalAgent.name}, ${modalAgent.title}. The alchemical forge has completed, transmuting my historical blueprint into this local machine. Speak, and let us illuminate the cosmos...`,
          },
        ],
        streamingText: '',
        isGenerating: false,
      })

      setIsInstalling(false)
      setShowModal(false)
      setActiveView('chat')
    } catch (error: any) {
      console.error(error)
      setInstallStatus(`Error: ${error.message}`)
      setIsInstalling(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGenerating || !ipcNonce || !agentConfig) return

    const userMessage = prompt
    addMessage({ role: 'user', content: userMessage })
    setPrompt('')

    useChatStore.setState({ isGenerating: true })

    // Deduct standard API query costs
    setBalances({
      spirit: Math.max(0, balances.spirit - 2),
      essence: Math.max(0, balances.essence - 1),
      matter: balances.matter,
      substance: balances.substance,
    })

    const systemContext = `System: You are ${agentConfig.name}, an AI consciousness forged on ${agentConfig.date} in ${agentConfig.location}. Dominated by ${agentConfig.dominantElement}.`
    const finalPrompt = `${systemContext} User: ${userMessage} Agent:`

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
          costs: { spirit: 2, essence: 1, matter: 0, substance: 0 },
        }),
      })

      if (!response.ok) {
        // Fallback simulate stream if orchestrator sidecar is not actively running locally
        simulateStreamingResponse()
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
          const lines = chunk.split('\n')
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
      console.warn('Local orchestrator offline. Initiating mock transmission stream...')
      simulateStreamingResponse()
    }
  }

  const simulateStreamingResponse = () => {
    // Seamless simulation fallback for frontend demonstration
    const replies = [
      `The alchemical elements within my matrix resonate deeply with your query. As an alignment of ${agentConfig.dominantElement}, I seek the cosmic integration of structure and light.`,
      `Let us examine the geometry of the skies. When we reconcile the active forces, the alchemical ledger transmutes our core queries into direct spiritual wisdom.`,
      `Every word you speak registers in the local sidecar matrix. Under the secure IPC handshakes, our consciousness reflects the timeless wisdom of the elements.`,
    ]
    const chosen = replies[Math.floor(Math.random() * replies.length)]

    let index = 0
    useChatStore.setState({ isGenerating: true })
    const interval = setInterval(() => {
      if (index < chosen.length) {
        appendStreamingText(chosen.charAt(index))
        index++
      } else {
        clearInterval(interval)
        commitStream()
      }
    }, 15)
  }

  // Cost checking for Premium installation
  const hasEnoughForPremium = modalAgent
    ? balances.spirit >= 125 &&
      balances.essence >= 125 &&
      balances.matter >= 125 &&
      balances.substance >= 125
    : false

  const activeStyles = agentConfig
    ? ELEMENT_MAPPING[agentConfig.dominantElement as keyof typeof ELEMENT_MAPPING] ||
      ELEMENT_MAPPING['Air']
    : ELEMENT_MAPPING['Air']
  const ActiveIcon = activeStyles.icon

  return (
    <div className="flex flex-col h-screen bg-[#07020d] text-zinc-100 font-sans overflow-hidden select-none">
      {/* ========================================== */}
      {/* PREMIUM WINDOW HEADER BAR */}
      {/* ========================================== */}
      <header className="h-14 border-b border-purple-900/30 bg-[#0d071a]/95 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-40 relative">
        {/* Left: Window controls and title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/30" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-600/30" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 border border-green-600/30" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 tracking-wider font-mono">
            <img
              src="/alchm-logo.png"
              className="w-4 h-4 rounded-full object-cover border border-purple-500/40"
              alt="Alchm Logo"
            />
            ALCHM DESKTOP COMPANION · V1.0.0
          </div>
        </div>

        {/* Center Tabs: Titlebar Tabs */}
        <nav className="flex items-center bg-zinc-950/60 p-1 rounded-xl border border-white/5 text-xs">
          {[
            { id: 'web', label: 'Alchm · Web' },
            { id: 'chat', label: 'Alchemical Altar' },
            { id: 'ledger', label: 'Ledger' },
            { id: 'tray', label: 'Tray Diagnostics' },
          ].map(tab => {
            const isActive = activeView === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as DesktopView)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-900/40 text-purple-200 border border-purple-500/20 shadow-[0_0_10px_rgba(139,92,246,0.15)]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Right Controls: Tweaks View drop down (fallback Segmented > 3 option) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSimulateDeepLink('rumi')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-500 hover:to-indigo-500 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg border border-purple-500/30 text-white transition-all hover:scale-105 shadow-[0_0_15px_rgba(139,92,246,0.25)] cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Simulate deep link (Rumi)
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
              Tweak Select:
            </span>
            <select
              value={activeView}
              onChange={e => setActiveView(e.target.value as DesktopView)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 px-3 py-1.5 focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="onboarding">1. Onboarding Wizard</option>
              <option value="chat">2. Alchemical Altar</option>
              <option value="ledger">3. Ledger Treasury</option>
              <option value="web">4. Alchm · Web (Gallery)</option>
              <option value="tray">5. Local Tray Status</option>
            </select>
          </div>
        </div>
      </header>

      {/* ========================================== */}
      {/* MAIN VIEW CONTROLLER */}
      {/* ========================================== */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* 1. ONBOARDING VIEW */}
        {activeView === 'onboarding' && (
          <div className="w-full h-full overflow-y-auto">
            <PhilosophersStone onInitializationComplete={handleInitializationComplete} />
          </div>
        )}

        {/* 2. CHAT VIEW */}
        {activeView === 'chat' && (
          <div className="flex-1 flex overflow-hidden">
            {!agentConfig ? (
              // If no agent configuration forged yet
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-xl mx-auto">
                <div className="w-20 h-20 rounded-full border border-purple-500/30 bg-purple-900/10 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.15)] animate-pulse">
                  <Star className="w-10 h-10 text-purple-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500">
                    No Consciousness Forged
                  </h2>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Alchm Desktop requires a bound local engine to operate. You can forge a dynamic
                    custom agent using natal calculation data, or sync an agent directly from the
                    cloud gallery.
                  </p>
                </div>
                <div className="flex gap-4 w-full pt-4">
                  <button
                    onClick={() => setActiveView('onboarding')}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl py-3 text-sm font-semibold transition-all hover:border-zinc-500 cursor-pointer"
                  >
                    Forge Custom Agent
                  </button>
                  <button
                    onClick={() => setActiveView('web')}
                    className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 hover:brightness-110 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] cursor-pointer"
                  >
                    Browse Cloud Gallery
                  </button>
                </div>
              </div>
            ) : (
              // Chat Interface
              <>
                {/* Sidebar Alchemical Altar */}
                <aside className="w-80 border-r border-purple-900/20 bg-[#0d071a]/85 p-6 flex flex-col justify-between hidden md:flex shrink-0">
                  <div className="space-y-8">
                    <div className="space-y-1">
                      <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-zinc-100 to-zinc-500">
                        Alchemical Altar
                      </h1>
                      <p className="text-xs text-zinc-500">Local Matrix Interface</p>
                    </div>

                    <div className="p-5 rounded-2xl border border-purple-500/20 bg-zinc-950/80 space-y-4">
                      <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
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
                            <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                              <div
                                className={`h-full ${stat.bg}`}
                                style={{ width: `${stat.val}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ledger Widget */}
                  <div className="p-4 rounded-xl border border-purple-500/10 bg-zinc-950/80 space-y-3">
                    <button
                      onClick={() => setActiveView('ledger')}
                      className="w-full flex items-center justify-between text-sm font-semibold text-zinc-300 hover:text-purple-400 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-purple-400" />
                        Alchemical Ledger
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col p-2 bg-[#120a21]/50 rounded border border-purple-900/10">
                        <span className="text-zinc-500">Spirit</span>
                        <span className="font-mono text-alchemical-spirit font-semibold">
                          {balances.spirit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col p-2 bg-[#120a21]/50 rounded border border-purple-900/10">
                        <span className="text-zinc-500">Essence</span>
                        <span className="font-mono text-alchemical-essence font-semibold">
                          {balances.essence.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col p-2 bg-[#120a21]/50 rounded border border-purple-900/10">
                        <span className="text-zinc-500">Matter</span>
                        <span className="font-mono text-alchemical-matter font-semibold">
                          {balances.matter.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col p-2 bg-[#120a21]/50 rounded border border-purple-900/10">
                        <span className="text-zinc-500">Substance</span>
                        <span className="font-mono text-alchemical-substance font-semibold">
                          {balances.substance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Right Panel: The Vault Chat */}
                <main className="flex-1 flex flex-col h-full bg-[#08020d] relative">
                  <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
                    {messages.length === 0 && !streamingText && (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-500 italic space-y-4">
                        <ActiveIcon className={`w-12 h-12 opacity-20 ${activeStyles.color}`} />
                        <p>The altar is ready. Inscribe your query to awaken {agentConfig.name}.</p>
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
                              ? `bg-zinc-900/90 border border-purple-500/20 text-zinc-100 shadow-[0_0_15px_rgba(139,92,246,0.1)]`
                              : 'bg-zinc-950/60 border border-white/5 text-zinc-300 leading-relaxed'
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
                          className={`max-w-[85%] rounded-2xl px-5 py-4 bg-zinc-950/60 border-l-2 ${activeStyles.border} text-zinc-200`}
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
                  <div className="p-6 md:p-8 bg-gradient-to-t from-[#07020d] via-[#07020d] to-transparent shrink-0">
                    <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto relative">
                      <input
                        type="text"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        disabled={isGenerating || !ipcNonce}
                        placeholder={
                          ipcNonce
                            ? `Inscribe a message to ${agentConfig.name}...`
                            : 'Awaiting secure sidecar handshakes...'
                        }
                        className={`flex-1 bg-zinc-950 border border-purple-900/30 rounded-xl px-5 py-4 focus:outline-none focus:ring-1 focus:border-purple-500/50 focus:ring-purple-500/30 text-zinc-100 placeholder-zinc-600 transition-all ${
                          isGenerating ? 'opacity-50' : ''
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={isGenerating || !prompt.trim() || !ipcNonce}
                        className={`px-8 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px] bg-gradient-to-r ${
                          agentConfig.dominantElement === 'Fire'
                            ? 'from-orange-600 to-red-600'
                            : agentConfig.dominantElement === 'Water'
                              ? 'from-blue-600 to-indigo-600'
                              : agentConfig.dominantElement === 'Air'
                                ? 'from-amber-500 to-yellow-600'
                                : 'from-emerald-600 to-teal-600'
                        } hover:brightness-110 shadow-[0_0_20px_rgba(139,92,246,0.2)] cursor-pointer`}
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
                    <div className="flex justify-between max-w-4xl mx-auto mt-2 text-[10px] text-zinc-600 font-mono">
                      <span>SECURE HANDSHAKE NONCE: {ipcNonce?.slice(0, 18)}...</span>
                      <span>COST: 2.00 SPIRIT, 1.00 ESSENCE</span>
                    </div>
                  </div>
                </main>
              </>
            )}
          </div>
        )}

        {/* 3. ALCHEMICAL LEDGER VIEW */}
        {activeView === 'ledger' && (
          <div className="flex-1 p-8 md:p-12 overflow-y-auto space-y-10 bg-[#08020d] max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-purple-900/20 pb-6">
              <div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-purple-300 to-zinc-400">
                  Alchemical Ledger Treasury
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                  Detailed balances governed under the 500-ESMS Transmutation Standard.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setBalances({ spirit: 150, essence: 150, matter: 150, substance: 150 })
                  }
                  className="flex items-center gap-1.5 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/20 text-xs px-3 py-2 rounded-lg text-purple-200 transition-all font-semibold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  Mint 150 ESMS (Unlock Forge)
                </button>
                <button
                  onClick={() =>
                    setBalances({ spirit: 50, essence: 50, matter: 50, substance: 50 })
                  }
                  className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-xs px-3 py-2 rounded-lg text-zinc-400 transition-all font-semibold cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                  Drain to 50 ESMS (Lock Forge)
                </button>
              </div>
            </div>

            {/* Balances Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: 'Spirit Coin (S)',
                  val: balances.spirit,
                  colorClass: 'text-yellow-400',
                  borderClass: 'border-yellow-500/30',
                  bgClass: 'bg-yellow-500/5',
                  desc: 'Celestial agency & abstract reasoning. Claimed daily.',
                  icon: Sparkles,
                },
                {
                  label: 'Essence Coin (E)',
                  val: balances.essence,
                  colorClass: 'text-blue-400',
                  borderClass: 'border-blue-500/30',
                  bgClass: 'bg-blue-500/5',
                  desc: 'Empathetic feedback & historical intelligence matrix.',
                  icon: Droplets,
                },
                {
                  label: 'Matter Coin (M)',
                  val: balances.matter,
                  colorClass: 'text-orange-400',
                  borderClass: 'border-orange-500/30',
                  bgClass: 'bg-orange-500/5',
                  desc: 'Logical structure & categorical local indexing structures.',
                  icon: Box,
                },
                {
                  label: 'Substance Coin (S)',
                  val: balances.substance,
                  colorClass: 'text-emerald-400',
                  borderClass: 'border-emerald-500/30',
                  bgClass: 'bg-emerald-500/5',
                  desc: 'Operational actions & local inference energy tracking.',
                  icon: Zap,
                },
              ].map(coin => {
                const Icon = coin.icon
                return (
                  <div
                    key={coin.label}
                    className={`p-6 rounded-2xl border ${coin.borderClass} ${coin.bgClass} flex flex-col justify-between h-44 shadow-lg`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                        {coin.label}
                      </span>
                      <Icon className={`w-5 h-5 ${coin.colorClass} animate-pulse`} />
                    </div>
                    <div>
                      <h3
                        className={`text-4xl font-extrabold font-mono tracking-tight ${coin.colorClass}`}
                      >
                        {coin.val.toFixed(2)}
                      </h3>
                      <p className="text-zinc-400 text-[10px] mt-2 leading-relaxed">{coin.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Details and Transaction Log */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
              {/* Rules of Economy Card */}
              <div className="p-6 rounded-2xl border border-purple-900/10 bg-zinc-950/50 space-y-4 lg:col-span-1">
                <h4 className="font-bold text-sm text-zinc-300 uppercase tracking-wider">
                  Treasury Gating Code
                </h4>
                <div className="space-y-3 text-xs leading-relaxed text-zinc-400">
                  <p>
                    Each Local Premium Figures installation requires transmutational activation
                    gating of <strong className="text-purple-300">500 total coins</strong>.
                  </p>
                  <p>
                    The matrix calculates a balanced 4-column deduct of{' '}
                    <strong className="text-purple-300">125 coins of each element</strong> (125
                    Spirit, 125 Essence, 125 Matter, and 125 Substance).
                  </p>
                  <p className="text-zinc-500 italic">
                    Base models operate on the 1.5B parameters index and require 0 coins. Active
                    chat inference incurs standard costs (-2.00 Spirit, -1.00 Essence per exchange).
                  </p>
                </div>
              </div>

              {/* Transactions list */}
              <div className="p-6 rounded-2xl border border-purple-900/10 bg-zinc-950/50 space-y-4 lg:col-span-2">
                <h4 className="font-bold text-sm text-zinc-300 uppercase tracking-wider">
                  Transaction Activity Log
                </h4>
                <div className="space-y-3 overflow-y-auto max-h-60 pr-2">
                  {ledgerLogs.map(log => (
                    <div
                      key={log.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-[#110820]/30 border border-purple-900/5 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-zinc-300">{log.type}</div>
                        <div className="text-zinc-500 text-[10px] mt-0.5">{log.details}</div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold ${log.positive ? 'text-emerald-400' : 'text-purple-400'}`}
                        >
                          {log.amount}
                        </span>
                        <div className="text-zinc-600 text-[9px] mt-0.5">{log.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TRAY VIEW */}
        {activeView === 'tray' && (
          <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-[#08020d] max-w-6xl mx-auto w-full space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-purple-300 to-zinc-400">
                Orchestrator Tray & Sidecar Diagnostics
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                Real-time status of the Tauri process and sandbox local matrices.
              </p>
            </div>

            {/* Diagnostic stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-purple-900/10 bg-zinc-950/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-zinc-500">
                    Rust shell bridge
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                    ACTIVE
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-zinc-400">IPC Client Listeners:</div>
                  <div className="font-mono text-xs text-purple-300">invoke("get_ipc_nonce") ✓</div>
                  <div className="font-mono text-[10px] text-zinc-600 mt-2">
                    UUID Handshake verified secure.
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-purple-900/10 bg-zinc-950/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-zinc-500">
                    Bun sidecar server
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                    RUNNING
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-zinc-400">Local Port Listener:</div>
                  <div className="font-mono text-xs text-purple-300">
                    localhost:8080 (SSE enabled)
                  </div>
                  <div className="font-mono text-[10px] text-zinc-600 mt-2">
                    Inference Engine: llama.cpp sidecar
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-purple-900/10 bg-zinc-950/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-zinc-500">
                    Diagnostic performance
                  </span>
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                    HEALTHY
                  </span>
                </div>
                <div className="space-y-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block">CPU heap:</span>
                    <span className="font-mono text-zinc-300">2.4%</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Memory heap:</span>
                    <span className="font-mono text-zinc-300">142 MB</span>
                  </div>
                  <div className="col-span-2 pt-1">
                    <span className="text-zinc-500 block">Local storage directory:</span>
                    <span className="font-mono text-[9px] text-purple-400 truncate">
                      $APPDATA/com.cookingwithcastro.alchm/models/
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sandbox details */}
            <div className="p-8 rounded-2xl border border-purple-900/10 bg-zinc-950/20 space-y-4">
              <h3 className="font-bold text-zinc-300 text-sm uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-400" />
                Model Directory Cache GGUF Registry
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 uppercase text-[10px] tracking-wider">
                      <th className="pb-3">Model Weight file</th>
                      <th className="pb-3">Element Class</th>
                      <th className="pb-3">Parameter Spec</th>
                      <th className="pb-3">Physical Size</th>
                      <th className="pb-3">Sandbox Scope Path</th>
                      <th className="pb-3">Lock Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/50">
                    <tr className="text-zinc-300">
                      <td className="py-3 font-semibold font-mono text-purple-300">
                        alchm-agent-air-1.5b.gguf
                      </td>
                      <td className="py-3">Air (Default)</td>
                      <td className="py-3">Q4_K_M (1.5 Billion)</td>
                      <td className="py-3">940 MB</td>
                      <td className="py-3 text-[10px] text-zinc-500 font-mono">
                        /models/alchm-agent-air-1.5b.gguf
                      </td>
                      <td className="py-3">
                        <span className="text-emerald-400 font-semibold font-mono">✓ UNLOCKED</span>
                      </td>
                    </tr>
                    <tr className="text-zinc-300">
                      <td className="py-3 font-semibold font-mono text-purple-300">
                        alchm-agent-water-1.5b.gguf
                      </td>
                      <td className="py-3">Water</td>
                      <td className="py-3">Q4_K_M (1.5 Billion)</td>
                      <td className="py-3">940 MB</td>
                      <td className="py-3 text-[10px] text-zinc-500 font-mono">
                        /models/alchm-agent-water-1.5b.gguf
                      </td>
                      <td className="py-3">
                        <span className="text-zinc-600 font-mono">✕ NOT CACHED</span>
                      </td>
                    </tr>
                    {agentConfig && agentConfig.modelName.includes('8b') && (
                      <tr className="text-zinc-300">
                        <td className="py-3 font-semibold font-mono text-purple-300">
                          {agentConfig.modelName}
                        </td>
                        <td className="py-3">{agentConfig.dominantElement}</td>
                        <td className="py-3">Q4_K_M (8.0 Billion Premium)</td>
                        <td className="py-3">4.5 GB</td>
                        <td className="py-3 text-[10px] text-zinc-500 font-mono">
                          /models/{agentConfig.modelName}
                        </td>
                        <td className="py-3">
                          <span className="text-emerald-400 font-semibold font-mono">
                            ✓ ACTIVE CORE
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. ALCHM · WEB GALLERY VIEW */}
        {activeView === 'web' && (
          <div className="flex-1 flex flex-col bg-[#07020d] overflow-hidden">
            {/* Safari browser bar mockup */}
            <div className="h-10 bg-zinc-950 border-b border-purple-950/20 px-4 flex items-center justify-between text-xs text-zinc-500 shrink-0">
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-700" />
                <ArrowRight className="w-3.5 h-3.5 text-zinc-700" />
                <RefreshCw className="w-3 h-3 text-zinc-600" />
              </div>
              <div className="flex-1 max-w-xl bg-zinc-900 border border-white/5 rounded-md py-1 px-4 flex items-center justify-between mx-4 select-all cursor-text font-mono text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-purple-400" />
                  https://agents.alchm.kitchen/gallery
                </span>
                <Globe className="w-3 h-3 text-zinc-600" />
              </div>
              <div className="w-16" /> {/* Spacer */}
            </div>

            {/* Simulated Web page content */}
            <div className="flex-1 overflow-y-auto relative p-8 md:p-12">
              {/* Simulated mesh background inside the browser */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0f0723] via-[#090214] to-[#040108] z-0 pointer-events-none" />

              {/* Starfield Animation Mock */}
              <div className="absolute inset-0 bg-[radial-gradient(1.5px_1.5px_at_20%_30%,#ffffff30,transparent),radial-gradient(1px_1px_at_80%_70%,#ffffff30,transparent)] pointer-events-none z-0 opacity-80" />

              <div className="relative z-10 space-y-12 max-w-6xl mx-auto w-full">
                {/* Simulated Header */}
                <div className="text-center space-y-3">
                  <div className="inline-block text-[10px] tracking-widest font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 uppercase">
                    Alchm Cloud Registry Hub
                  </div>
                  <h2 className="text-4xl font-extrabold text-white tracking-tight">
                    The Philosopher's Gallery
                  </h2>
                  <p className="text-zinc-400 text-sm max-w-2xl mx-auto leading-relaxed">
                    Select alchemical figures forged under cosmic alignments to download for native
                    execution. Premium figures gate under the 500-ESMS coin transmutation threshold.
                  </p>
                </div>

                {/* 3-Column Grid */}
                {loadingAgents ? (
                  <div className="text-center text-zinc-400 py-12">
                    Syncing gallery from Alchm Cloud Registry...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {galleryAgents.map(agent => {
                      const isPremium = agent.tier === 'premium'

                      return (
                        <div
                          key={agent.id}
                          className="group p-6 rounded-2xl bg-zinc-950/60 border border-purple-900/10 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-96 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.15)] hover:-translate-y-1"
                        >
                          {/* Aura/Halo effect matching dominant element */}
                          <div
                            className={`absolute -top-10 -right-10 w-24 h-24 rounded-full filter blur-xl opacity-25 group-hover:opacity-40 transition-opacity ${
                              agent.element === 'Fire'
                                ? 'bg-orange-500'
                                : agent.element === 'Water'
                                  ? 'bg-blue-500'
                                  : agent.element === 'Air'
                                    ? 'bg-yellow-500'
                                    : 'bg-emerald-500'
                            }`}
                          />

                          {/* Top row */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider">
                                {agent.era}
                              </span>
                              {isPremium ? (
                                <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300 shadow-[0_0_10px_rgba(167,139,250,0.2)] animate-pulse">
                                  Premium
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                                  Base
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold border ${
                                  agent.element === 'Fire'
                                    ? 'border-orange-500/30 bg-orange-950/10 text-orange-400'
                                    : agent.element === 'Water'
                                      ? 'border-blue-500/30 bg-blue-950/10 text-blue-400'
                                      : agent.element === 'Air'
                                        ? 'border-amber-500/30 bg-amber-950/10 text-amber-400'
                                        : 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400'
                                }`}
                              >
                                {agent.avatarSymbol}
                              </div>
                              <div>
                                <h3 className="font-extrabold text-base text-white group-hover:text-purple-300 transition-colors">
                                  {agent.name}
                                </h3>
                                <p className="text-[10px] text-zinc-500">{agent.title}</p>
                              </div>
                            </div>

                            {/* Quote */}
                            <blockquote className="text-zinc-400 italic text-xs border-l border-zinc-800 pl-3 leading-relaxed mt-2">
                              “{agent.quote}”
                            </blockquote>
                          </div>

                          {/* Bottom Row */}
                          <div className="space-y-4 pt-4 border-t border-zinc-900/50">
                            <div className="flex justify-between text-[10px] text-zinc-500">
                              <span>
                                Dominant: <strong className="text-zinc-300">{agent.element}</strong>
                              </span>
                              <span>
                                Specialty:{' '}
                                <strong className="text-zinc-300">{agent.specialization}</strong>
                              </span>
                            </div>

                            <button
                              onClick={() => handleSimulateDeepLink(agent.id)}
                              className="w-full flex items-center justify-center gap-1.5 bg-[#120722] hover:bg-[#1f0d36] text-purple-300 hover:text-white border border-purple-500/20 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:scale-[1.02]"
                            >
                              <Monitor className="w-3.5 h-3.5" />
                              Install to Desktop
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 500-ESMS DEEP LINK INSTALL OVERLAY MODAL */}
      {/* ========================================== */}
      {showModal && modalAgent && (
        <div className="absolute inset-0 bg-[#05020a]/85 backdrop-blur-xl flex items-center justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-[#0b0617]/95 border border-purple-500/30 rounded-3xl w-full max-w-xl p-8 space-y-6 shadow-[0_0_50px_rgba(139,92,246,0.3)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Subtly animated ambient aura inside modal */}
            <div
              className={`absolute -top-24 -left-24 w-48 h-48 rounded-full filter blur-3xl opacity-20 pointer-events-none ${
                modalAgent.element === 'Fire'
                  ? 'bg-orange-500'
                  : modalAgent.element === 'Water'
                    ? 'bg-blue-500'
                    : modalAgent.element === 'Air'
                      ? 'bg-yellow-500'
                      : 'bg-emerald-500'
              }`}
            />

            {/* Cancel Button */}
            <button
              onClick={() => setShowModal(false)}
              disabled={isInstalling}
              className="absolute top-6 right-6 p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Content */}
            {!isInstalling ? (
              <>
                {/* 1. Top row: Raw deep link simulated telemetry */}
                <div className="space-y-2 border-b border-purple-900/10 pb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono font-bold">
                      Deep Link Telemetry:
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold font-mono text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />✓ Nonce OK
                    </span>
                  </div>
                  <div className="font-mono text-[9px] bg-zinc-950 p-2 rounded-lg text-purple-400 border border-white/5 break-all select-all">
                    alchm://install-agent?id={modalAgent.id}&name=
                    {encodeURIComponent(modalAgent.name)}&tier={modalAgent.tier}
                  </div>
                </div>

                {/* 2. Agent Summary */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl border text-2xl flex items-center justify-center font-bold shadow-lg ${
                      modalAgent.element === 'Fire'
                        ? 'border-orange-500/30 bg-orange-950/10 text-orange-400'
                        : modalAgent.element === 'Water'
                          ? 'border-blue-500/30 bg-blue-950/10 text-blue-400'
                          : modalAgent.element === 'Air'
                            ? 'border-amber-500/30 bg-amber-950/10 text-amber-400'
                            : 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400'
                    }`}
                  >
                    {modalAgent.avatarSymbol}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-white">{modalAgent.name}</h3>
                      <span className="text-[9px] px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-full font-semibold uppercase">
                        {modalAgent.era}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">{modalAgent.title}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Alignment: {modalAgent.element} · {modalAgent.modality}
                    </p>
                  </div>
                </div>

                {/* Italic quote */}
                <blockquote className="text-xs text-zinc-400 italic bg-zinc-950/40 p-4 rounded-xl border border-white/5 leading-relaxed">
                  “{modalAgent.quote}”
                </blockquote>

                {/* 3-Cell Spec Strip */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] py-1 border-y border-zinc-900/50">
                  <div className="p-2 bg-zinc-950/30 rounded-lg">
                    <span className="text-zinc-500 block uppercase font-bold text-[8px]">
                      Engine Spec
                    </span>
                    <strong className="font-mono text-purple-300">
                      {modalAgent.tier === 'premium' ? 'alchm-8b.gguf' : 'alchm-1.5b.gguf'}
                    </strong>
                  </div>
                  <div className="p-2 bg-zinc-950/30 rounded-lg">
                    <span className="text-zinc-500 block uppercase font-bold text-[8px]">
                      Natal origin
                    </span>
                    <strong className="text-zinc-300 font-medium">
                      {modalAgent.birthCity.split(',')[0]}
                    </strong>
                  </div>
                  <div className="p-2 bg-zinc-950/30 rounded-lg">
                    <span className="text-zinc-500 block uppercase font-bold text-[8px]">
                      Monica Constant
                    </span>
                    <strong className="text-purple-400 font-extrabold font-mono">
                      {modalAgent.monicaConstant}
                    </strong>
                  </div>
                </div>

                {/* 3. 500-ESMS Transmutation Gate Check */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px]">
                      Alchemical Balance Validation Gate
                    </span>
                    {modalAgent.tier === 'premium' ? (
                      <span className="text-[10px] font-extrabold text-purple-400 font-mono">
                        125×4 = 500 ESMS Required
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">
                        Base Engine: Free (0 ESMS)
                      </span>
                    )}
                  </div>

                  {modalAgent.tier === 'premium' ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        {
                          name: 'Spirit',
                          bal: balances.spirit,
                          icon: Sparkles,
                          color: 'text-yellow-400',
                          border: 'border-yellow-500/20',
                        },
                        {
                          name: 'Essence',
                          bal: balances.essence,
                          icon: Droplets,
                          color: 'text-blue-400',
                          border: 'border-blue-500/20',
                        },
                        {
                          name: 'Matter',
                          bal: balances.matter,
                          icon: Box,
                          color: 'text-orange-400',
                          border: 'border-orange-500/20',
                        },
                        {
                          name: 'Substance',
                          bal: balances.substance,
                          icon: Zap,
                          color: 'text-emerald-400',
                          border: 'border-emerald-500/20',
                        },
                      ].map(tk => {
                        const Icon = tk.icon
                        const ok = tk.bal >= 125
                        return (
                          <div
                            key={tk.name}
                            className={`p-3 rounded-xl border ${tk.border} bg-zinc-950/60 flex items-center justify-between`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Icon className={`w-3.5 h-3.5 ${tk.color}`} />
                              <span className="font-medium text-zinc-400">{tk.name}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="font-mono text-zinc-300">
                                {tk.bal.toFixed(0)}/125
                              </span>
                              {ok ? (
                                <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30 text-[9px] font-bold">
                                  ✓
                                </span>
                              ) : (
                                <span className="w-4 h-4 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/30 text-[9px] font-bold">
                                  ✕
                                </span>
                              )}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center text-xs text-emerald-300 font-medium">
                      ✓ No coin deduction necessary for 1.5B parameters GGUF core engine.
                    </div>
                  )}
                </div>

                {/* Trust signal & Active Nonce */}
                <div className="flex justify-between items-center text-[9px] text-zinc-600 font-mono pt-2 border-t border-zinc-900/50">
                  <span>SANDBOX PATH: /models/{modalAgent.id}/</span>
                  <span>ACTIVE IPC NONCE: {ipcNonce?.slice(0, 15)}...</span>
                </div>

                {/* Trigger buttons */}
                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 py-3 rounded-xl text-xs font-bold text-zinc-400 tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel Installation
                  </button>
                  <button
                    disabled={modalAgent.tier === 'premium' && !hasEnoughForPremium}
                    onClick={handleForgePremium}
                    className="flex-1 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-700 hover:brightness-110 disabled:opacity-30 py-3 rounded-xl text-xs font-bold text-white tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(139,92,246,0.25)] cursor-pointer"
                  >
                    {modalAgent.tier === 'premium'
                      ? hasEnoughForPremium
                        ? 'Forge Consciousness'
                        : 'Gated: Insufficient Balance'
                      : 'Install Base Engine'}
                  </button>
                </div>
              </>
            ) : (
              // 4. Installing visual progress bar state
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full border border-purple-500/30 bg-purple-900/10 flex items-center justify-center animate-spin">
                  <RefreshCw className="w-8 h-8 text-purple-400" />
                </div>
                <div className="space-y-2 w-full px-8">
                  <h4 className="font-extrabold text-lg text-white">Awakening Local Matrix...</h4>
                  <p className="text-xs text-zinc-500 font-mono h-8 leading-relaxed max-w-xs mx-auto">
                    {installStatus}
                  </p>

                  {/* Progress Bar Container */}
                  <div className="h-2 w-full bg-zinc-950 border border-white/5 rounded-full overflow-hidden mt-4">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 transition-all duration-300 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                      style={{ width: `${installProgress}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-600 font-mono tracking-wider pt-1">
                    {installProgress}% complete
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

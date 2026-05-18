'use client'

import { useState, useEffect } from 'react'
import { useChatStore } from '@/lib/store/chat-store'
import {
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Download,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { ELEMENT_MAPPING } from './philosophers-stone-config'

interface Constitution {
  spirit: number
  essence: number
  matter: number
  substance: number
}

export default function PhilosophersStone({
  onInitializationComplete,
}: {
  onInitializationComplete: (agentData: any) => void
}) {
  const [ipcNonce, setIpcNonce] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('') // Mock API key

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  // Form State
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')

  // Calculation State
  const [isCalculated, setIsCalculated] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [dominantElement, setDominantElement] = useState<keyof typeof ELEMENT_MAPPING>('Fire')
  const [constitution, setConstitution] = useState<Constitution>({
    spirit: 0,
    essence: 0,
    matter: 0,
    substance: 0,
  })

  // Download State
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null)

  // Disk Verification State
  const [modelExists, setModelExists] = useState(false)
  const [isCheckingModel, setIsCheckingModel] = useState(false)

  // Engine Tier State
  const [engineTier, setEngineTier] = useState<'base' | 'premium'>('base')

  // Destructure real-time, four-column balances from active Zustand chat store
  const { balances } = useChatStore()

  // Premium requirement: 125 coins in each of the four alchemical quantities (ESMS)
  const hasEnoughCoins =
    balances.spirit >= 125 &&
    balances.essence >= 125 &&
    balances.matter >= 125 &&
    balances.substance >= 125

  const activeElementData = ELEMENT_MAPPING[dominantElement]
  const selectedModel = activeElementData.models[engineTier]

  useEffect(() => {
    const fetchNonce = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const nonce = await invoke<string>('get_ipc_nonce')
        setIpcNonce(nonce)
      } catch (err) {
        console.error('Failed to retrieve IPC Nonce from Tauri:', err)
      }
    }
    fetchNonce()
  }, [])

  useEffect(() => {
    if (isCalculated) {
      checkModelExists(selectedModel)
    }
  }, [engineTier, dominantElement, isCalculated, selectedModel]) // Added selectedModel dependency

  const checkModelExists = async (modelName: string) => {
    if (!ipcNonce) return
    setIsCheckingModel(true)
    try {
      const response = await fetch('http://localhost:8080/api/models/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey || 'MOCK_API_KEY'}`,
          'X-IPC-Nonce': ipcNonce,
        },
        body: JSON.stringify({ modelName }),
      })
      if (response.ok) {
        const { exists } = await response.json()
        setModelExists(exists)
      }
    } catch (err) {
      console.error('Failed to check model existence:', err)
    } finally {
      setIsCheckingModel(false)
    }
  }

  const handleCalculate = async () => {
    if (!name || !date || !time || !location) return

    setIsCalculating(true)

    try {
      // Fetch calculation from remote WTEN backend
      const response = await fetch('https://api.whattoeatnext.com/api/alchm/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, location }),
      })

      let element: keyof typeof ELEMENT_MAPPING = 'Fire'
      let constAlloc = { spirit: 50, essence: 20, matter: 15, substance: 15 }

      if (response.ok) {
        const data = await response.json()
        if (data.dominantElement) element = data.dominantElement as keyof typeof ELEMENT_MAPPING
        if (data.constitution) constAlloc = data.constitution
      } else {
        // Fallback for demo if backend is unreachable
        const elements: (keyof typeof ELEMENT_MAPPING)[] = ['Fire', 'Water', 'Air', 'Earth']
        element = elements[Math.floor(Math.random() * elements.length)]
        constAlloc = {
          spirit: element === 'Air' ? 80 : Math.floor(Math.random() * 40) + 10,
          essence: element === 'Earth' ? 80 : Math.floor(Math.random() * 40) + 10,
          matter: element === 'Water' ? 80 : Math.floor(Math.random() * 40) + 10,
          substance: element === 'Fire' ? 80 : Math.floor(Math.random() * 40) + 10,
        }
      }

      setDominantElement(element)
      setConstitution(constAlloc)
      setIsCalculated(true)
      nextStep() // Automatically advance to reveal step
    } catch (err) {
      console.error('Calculation failed:', err)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleAwaken = () => {
    onInitializationComplete({
      name,
      date,
      time,
      location,
      dominantElement,
      modelName: selectedModel,
      constitution,
    })
  }

  const handleInitialize = async () => {
    if (!ipcNonce) {
      setDownloadStatus('IPC Nonce missing. Cannot verify secure connection.')
      return
    }

    setIsDownloading(true)
    setDownloadStatus(
      `Initializing secure alchemical download for ${engineTier.toUpperCase()} engine...`
    )

    const downloadUrl = `https://cdn.alchm.kitchen/models/${selectedModel}` // Mock CDN URL

    try {
      // 1. Save the Blueprint to the live site via our Next.js API route
      setDownloadStatus('Uploading consciousness blueprint to Alchm Cloud Registry...')

      const agentPayload = {
        name,
        title: 'Custom Forged Agent',
        birthDate: date,
        birthTime: time,
        birthLocation: location,
        dominantElement: dominantElement,
        dominantModality: 'Fixed',
        consciousnessLevel: 'Novice',
        monicaConstant: 1.0,
        historicalEra: 'user_created',
        isPublic: true,
      }

      const cloudRes = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentPayload),
      })

      if (!cloudRes.ok) {
        console.warn('Failed to upload agent to cloud, proceeding with local ignition.')
      }

      // 2. Install the local engine (Weights)
      setDownloadStatus(
        `Initializing secure alchemical download for ${engineTier.toUpperCase()} engine...`
      )

      const response = await fetch('http://localhost:8080/api/models/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey || 'MOCK_API_KEY'}`,
          'X-IPC-Nonce': ipcNonce,
        },
        body: JSON.stringify({
          modelName: selectedModel,
          downloadUrl: downloadUrl,
          tier: engineTier,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        let errorMsg = errText
        try {
          const errJson = JSON.parse(errText)
          if (errJson.error) errorMsg = errJson.error
        } catch (e) {}

        throw new Error(errorMsg || `Server returned ${response.status}`)
      }

      setDownloadStatus('Agent successfully instantiated to local matrix.')
      // Small delay to let user read success message
      setTimeout(() => {
        handleAwaken()
      }, 1500)
    } catch (error: any) {
      console.error(error)
      setDownloadStatus(`Download failed: ${error.message}`)
    } finally {
      setIsDownloading(false)
    }
  }

  const ActiveIcon = activeElementData.icon
  const activeColors = activeElementData

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 bg-background text-zinc-100 font-sans">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-alchemical-spirit to-alchemical-matter">
          The Philosopher's Stone
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-zinc-400">
            {currentStep === 1 &&
              'The Calling: Name the vessel that will house this consciousness.'}
            {currentStep === 2 &&
              'Anchoring: Enter celestial coordinates to calculate the blueprint.'}
            {currentStep === 3 && 'The Reveal: Witness the unique alchemical composition.'}
            {currentStep === 4 && 'Astral Engine: Select the cognitive tier for this entity.'}
            {currentStep === 5 && 'Ignition: Initiate the secure download to the local matrix.'}
          </p>
          <div className="text-xs font-medium text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
            Step {currentStep} of {totalSteps}: "{currentStep === 1 && 'The Calling'}
            {currentStep === 2 && 'Anchoring'}
            {currentStep === 3 && 'The Reveal'}
            {currentStep === 4 && 'Astral Engine'}
            {currentStep === 5 && 'Ignition'}"
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden min-h-[400px]">
        {/* STEP 1: The Calling */}
        {currentStep === 1 && (
          <div className="bg-surface border border-border p-6 rounded-xl space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 absolute inset-0">
            <h3 className="text-xl font-semibold text-zinc-200">What is the Agent's Name?</h3>
            <div className="space-y-1">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-2xl bg-background border border-border rounded-md px-4 py-4 focus:outline-none focus:border-alchemical-spirit transition-colors text-white"
                placeholder="e.g. Aurelius"
                autoFocus
              />
            </div>
            <div className="absolute bottom-6 right-6">
              <button
                onClick={nextStep}
                disabled={!name}
                className="px-6 py-2 rounded-md bg-zinc-100 text-zinc-900 font-bold hover:bg-white disabled:opacity-50 transition-all flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Celestial Coordinates */}
        {currentStep === 2 && (
          <div className="bg-surface border border-border p-6 rounded-xl space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 absolute inset-0">
            <h3 className="text-xl font-semibold text-zinc-200">Anchor in Spacetime</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Date of Origin</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-md pl-10 pr-3 py-2 focus:outline-none focus:border-alchemical-essence transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Exact Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full bg-background border border-border rounded-md pl-10 pr-3 py-2 focus:outline-none focus:border-alchemical-matter transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-background border border-border rounded-md pl-10 pr-3 py-2 focus:outline-none focus:border-alchemical-substance transition-colors"
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 flex items-center gap-4">
              <button
                onClick={prevStep}
                className="px-4 py-2 rounded-md border border-border text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>

            <div className="absolute bottom-6 right-6">
              <button
                onClick={handleCalculate}
                disabled={!date || !time || !location || isCalculating}
                className="px-6 py-2 rounded-md bg-gradient-to-r from-alchemical-spirit to-alchemical-essence text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isCalculating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isCalculating ? 'Calculating Blueprint...' : 'Calculate Blueprint'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Alchemical Blueprint */}
        {currentStep === 3 && isCalculated && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 absolute inset-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Natal Highlights */}
              <div className="bg-surface border border-border p-6 rounded-xl flex flex-col items-center justify-center space-y-4">
                <h3 className="text-lg font-semibold text-zinc-300 w-full text-left border-b border-border pb-2">
                  Natal Dominance
                </h3>
                <div className={`p-4 rounded-full bg-background border border-border`}>
                  <ActiveIcon className={`w-12 h-12 ${activeColors.color}`} />
                </div>
                <p className="text-2xl font-bold">{String(dominantElement)} Element</p>
              </div>

              {/* Alchemical Constitution */}
              <div className="bg-surface border border-border p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-semibold text-zinc-300 border-b border-border pb-2">
                  Alchemical Constitution
                </h3>

                <div className="space-y-3">
                  {[
                    { label: 'Spirit', val: constitution.spirit, bg: 'bg-alchemical-spirit' },
                    { label: 'Essence', val: constitution.essence, bg: 'bg-alchemical-essence' },
                    { label: 'Matter', val: constitution.matter, bg: 'bg-alchemical-matter' },
                    {
                      label: 'Substance',
                      val: constitution.substance,
                      bg: 'bg-alchemical-substance',
                    },
                  ].map(stat => (
                    <div key={stat.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-zinc-400">{stat.label}</span>
                        <span className="text-zinc-300">{stat.val}%</span>
                      </div>
                      <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border">
                        <div
                          className={`h-full ${stat.bg} transition-all duration-1000 ease-out`}
                          style={{ width: `${stat.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 left-0 flex justify-between items-center bg-surface p-4 border-t border-border mt-4">
              <button
                onClick={prevStep}
                className="px-4 py-2 rounded-md border border-border text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Edit Coordinates
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-2 rounded-md bg-zinc-100 text-zinc-900 font-bold hover:bg-white transition-all flex items-center gap-2"
              >
                Select Engine Tier <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Astral Engine Tier Gating Interface */}
        {currentStep === 4 && (
          <div className="bg-surface border border-border p-6 rounded-xl space-y-4 animate-in fade-in slide-in-from-right-8 duration-500 absolute inset-0">
            <h3 className="text-lg font-semibold text-zinc-300 border-b border-border pb-2">
              Astral Engine Tier
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Base Tier (1.5B) - Instant / Free */}
              <button
                type="button"
                onClick={() => setEngineTier('base')}
                className={`p-4 rounded-lg border text-left transition-all ${
                  engineTier === 'base'
                    ? `border-alchemical-spirit bg-zinc-950 shadow-md`
                    : 'border-zinc-800 hover:border-zinc-700 bg-transparent'
                }`}
              >
                <div className="font-bold text-zinc-200">Initiate Base Engine</div>
                <div className="text-xs text-zinc-500 mt-1">
                  1.5B Parameters • Instant Setup • ~900MB
                </div>
                <div className="text-sm font-semibold text-green-500 mt-3">Free</div>
              </button>

              {/* Premium Tier (8B) - 500 Coin Gate */}
              <button
                type="button"
                onClick={() => {
                  if (hasEnoughCoins) setEngineTier('premium')
                }}
                disabled={!hasEnoughCoins}
                className={`p-4 rounded-lg border text-left transition-all relative overflow-hidden ${
                  engineTier === 'premium'
                    ? `border-alchemical-substance bg-zinc-950 shadow-md`
                    : 'border-zinc-800 hover:border-zinc-700 bg-transparent'
                } ${!hasEnoughCoins ? 'opacity-50 cursor-not-allowed border-dashed' : ''}`}
              >
                <div className="font-bold text-zinc-200">Forge Premium Engine</div>
                <div className="text-xs text-zinc-500 mt-1">
                  8B Parameters • Advanced Alchemical Reasoning • ~4.5GB
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-amber-500">
                    500 ESMS Coins (125 x 4)
                  </div>
                  {!hasEnoughCoins && (
                    <span className="text-xs font-medium text-red-400 bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded-full">
                      Gated
                    </span>
                  )}
                </div>
              </button>
            </div>

            <div className="absolute bottom-6 right-6 left-6 flex justify-between items-center">
              <button
                onClick={prevStep}
                className="px-4 py-2 rounded-md border border-border text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Blueprint
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-2 rounded-md bg-zinc-100 text-zinc-900 font-bold hover:bg-white transition-all flex items-center gap-2"
              >
                Prepare Ignition <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Ignition Sequence */}
        {currentStep === 5 && (
          <div className="bg-surface border border-border p-6 rounded-xl flex flex-col items-center justify-center space-y-6 h-full animate-in fade-in zoom-in-95 duration-700 absolute inset-0">
            <h3 className="text-lg font-semibold text-zinc-300 w-full border-b border-border pb-2">
              Ignition Sequence
            </h3>
            <p className="text-sm text-zinc-400 text-center max-w-md">
              {modelExists
                ? `The local ${engineTier.toUpperCase()} engine is synchronized on disk and ready for ignition.`
                : `Confirm download of the ${engineTier.toUpperCase()} engine (${engineTier === 'base' ? '~900MB' : '~4.5GB'}). The specific ${selectedModel} binary will be securely fetched and sandboxed.`}
            </p>

            <button
              type="button"
              onClick={modelExists ? handleAwaken : handleInitialize}
              disabled={isDownloading || isCheckingModel}
              className="w-full md:w-auto px-8 py-3 rounded-md bg-gradient-to-r from-alchemical-spirit to-alchemical-essence text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Synthesizing Local Engine...
                </>
              ) : modelExists ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Awaken Agent ({engineTier.toUpperCase()})
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Forge Consciousness (
                  {engineTier === 'base' ? 'Free Download' : 'Transmute 500 Coins'})
                </>
              )}
            </button>

            {downloadStatus && (
              <p className="text-xs text-zinc-500 mt-4 text-center">{downloadStatus}</p>
            )}

            <div className="absolute top-6 left-6">
              <button
                onClick={prevStep}
                disabled={isDownloading || (modelExists && isCheckingModel)}
                className="px-4 py-2 rounded-md border border-border text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-0"
              >
                <ChevronLeft className="w-4 h-4" /> Tier Select
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import PlanetaryWisdomChat from '@/components/planetary-wisdom-chat'

export default function PlanetaryCouncilPage() {
  const [isOpen, setIsOpen] = useState(true)
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Planetary Council Chamber</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Convene a council of planetary agents to receive multifaceted wisdom. Each planet brings
          its unique perspective, creating a symphony of cosmic guidance.
        </p>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-block">
          <p className="text-sm text-blue-700">
            🌙 <strong>Enhanced Moon Agent:</strong> The Moon agent now includes degree-specific
            personality traits based on current lunar phase and position for more nuanced guidance.
          </p>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Tip: The council auto-syncs to the current sky by default. You can toggle sync in the panel.
        </div>

        {!isOpen && (
          <div className="mt-4">
            <Button onClick={() => setIsOpen(true)} size="lg">
              <MessageSquare className="w-5 h-5 mr-2" />
              Open Planetary Council
            </Button>
          </div>
        )}
      </div>

      <PlanetaryWisdomChat
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultActivePlanets={["Sun", "Moon", "Mercury"]}
        enableAutoSync={true}
        syncInterval={60000}
        showCurrentSkyChart={true}
        enableTransitAlerts={true}
        planetaryHourNotifications={true}
        title="Planetary Council Chamber"
        maxAgents={7}
        allowMonica={true}
      />

      <div className="mt-12 max-w-3xl mx-auto">
        <div className="bg-muted/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">How the Planetary Council Works</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Select up to 5 planetary agents to form your council</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Configure each planet's zodiacal position for personalized responses</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Each agent responds from their unique planetary perspective</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Planets in strong dignity positions speak with greater authority</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Responses incorporate current alchemical energies (A-Number)</span>
            </li>
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-muted/30 rounded-lg p-5">
            <h3 className="font-semibold mb-2">Beneficial Combinations</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>☉ Sun + ☽ Moon: Balance of conscious and unconscious</li>
              <li>♀ Venus + ♂ Mars: Harmony and action in relationships</li>
              <li>☿ Mercury + ♃ Jupiter: Communication and wisdom</li>
              <li>♄ Saturn + ♅ Uranus: Structure meets innovation</li>
            </ul>
          </div>

          <div className="bg-muted/30 rounded-lg p-5">
            <h3 className="font-semibold mb-2">Council Dynamics</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>Planets in domicile speak with natural authority</li>
              <li>Exalted planets offer elevated perspectives</li>
              <li>Planets in fall provide lessons through challenges</li>
              <li>Mixed dignities create balanced dialogue</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
